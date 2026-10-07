// EXACTITUD_DEL_JUEGO.md, sección 8: la mesa muestra exactamente lo que manda el servidor.
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ACTION_LABELS, cardLabel, parseCardId } from '../../../utils/cards.js';
import ActionBar from '../ActionBar.vue';
import PlayingCard from '../PlayingCard.vue';
import ScoreBoard from '../ScoreBoard.vue';

// Mazo español de 40 (sin 8 ni 9), con los mismos ids que el servidor: "{número}-{palo}"
const SUITS = ['espada', 'basto', 'oro', 'copa'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const DECK = SUITS.flatMap((suit) => NUMBERS.map((n) => `${n}-${suit}`));

// Acciones que el motor puede mandar en availableActions (game/truco/engine.js del back)
const ENGINE_ACTIONS = [
  'PLAY_CARD', 'CALL_TRUCO', 'CALL_RETRUCO', 'CALL_VALE_CUATRO', 'CALL_ENVIDO', 'CALL_REAL_ENVIDO',
  'CALL_FALTA_ENVIDO', 'ACCEPT', 'REJECT', 'GO_TO_DECK'
];

const QBtn = {
  props: ['label', 'disable'],
  emits: ['click'],
  template: '<button :disabled="disable" @click="$emit(\'click\')">{{ label }}</button>'
};

describe('F-01 / F-07: las 40 cartas', () => {
  it('son 40 ids distintos', () => {
    expect(new Set(DECK).size).toBe(40);
  });

  it.each(DECK)('%s se dibuja con su número y su palo, y se nombra bien', (cardId) => {
    const [number, suit] = cardId.split('-');
    expect(parseCardId(cardId)).toEqual({ number: Number(number), suit });
    expect(cardLabel(cardId)).toBe(`${number} de ${suit}`);

    const w = mount(PlayingCard, { props: { cardId } });
    const nums = w.findAll('.tr-card__num');
    expect(nums.map((n) => n.text())).toEqual([number, number]);
    for (const n of nums) expect(n.classes()).toContain(`tr-suit--${suit}`);
    expect(w.find('svg.tr-card__suit').classes()).toContain(`tr-suit--${suit}`);
    expect(w.attributes('aria-label')).toBe(`${number} de ${suit}`);
  });

  it('boca abajo no muestra número ni palo', () => {
    const w = mount(PlayingCard, { props: { cardId: null } });
    expect(w.find('.tr-card__num').exists()).toBe(false);
    expect(w.attributes('aria-label')).toBe('Carta boca abajo');
  });
});

describe('F-02: la carta que se toca es la que se envía', () => {
  it.each(DECK)('tocar %s emite ese mismo id', async (cardId) => {
    const w = mount(PlayingCard, { props: { cardId, clickable: true } });
    await w.trigger('click');
    expect(w.emitted('select')).toEqual([[cardId]]);
  });

  it('una carta que no se puede jugar no emite nada', async () => {
    const w = mount(PlayingCard, { props: { cardId: '1-espada' } });
    await w.trigger('click');
    expect(w.emitted('select')).toBeUndefined();
  });
});

describe('F-03: la barra de cantos sale solo de availableActions', () => {
  const mountBar = (props) => mount(ActionBar, { props, global: { stubs: { 'q-btn': QBtn } } });

  it('cada acción del motor (salvo jugar carta) tiene su texto', () => {
    for (const type of ENGINE_ACTIONS.filter((t) => t !== 'PLAY_CARD')) expect(ACTION_LABELS[type]).toBeTruthy();
  });

  it('muestra exactamente las acciones disponibles, ni una más', () => {
    const subsets = [[], ['ACCEPT', 'REJECT'], ['CALL_TRUCO', 'CALL_ENVIDO', 'GO_TO_DECK'], ['CALL_RETRUCO', 'ACCEPT', 'REJECT', 'CALL_ENVIDO']];
    for (const available of subsets) {
      const labels = mountBar({ available }).findAll('button').map((b) => b.text());
      expect(labels.sort()).toEqual(available.map((t) => ACTION_LABELS[t]).sort());
    }
    // Lo que no es un botón (jugar carta) o no existe no aparece
    expect(mountBar({ available: ['PLAY_CARD', 'INVENTADA'] }).findAll('button')).toHaveLength(0);
  });

  it('emite el tipo tocado y se desactiva mientras se envía', async () => {
    const w = mountBar({ available: ['ACCEPT', 'REJECT'] });
    await w.findAll('button')[1].trigger('click');
    expect(w.emitted('action')).toEqual([['REJECT']]);
    const sending = mountBar({ available: ['ACCEPT'], disabled: true });
    expect(sending.find('button').attributes('disabled')).toBeDefined();
  });
});

describe('F-05: el tantero muestra lo que manda el servidor', () => {
  it('puntos y malas/buenas tal cual, sin recalcular', () => {
    // El servidor decide la frontera: aunque el número "parezca" de malas, se muestra la sección que llega
    const rowsOf = (w) => w.findAll('.tr-score__row').map((r) => [
      r.find('.tr-score__name').text(), r.find('.tr-score__points').text(), r.find('.tr-score__section').exists() ? r.find('.tr-score__section').text() : null
    ]);
    const w = mount(ScoreBoard, { props: { score: [3, 16], sections: ['malas', 'buenas'], targetPoints: 30, myTeam: 1, opponentName: 'Rival' } });
    expect(rowsOf(w)).toEqual([['Vos', '16', 'buenas'], ['Rival', '3', 'malas']]);
    expect(w.find('.tr-score__target').text()).toBe('a 30');
    // A 15 el servidor no manda secciones: no se inventan
    const short = mount(ScoreBoard, { props: { score: [7, 2], sections: [null, null], targetPoints: 15, myTeam: 0 } });
    expect(rowsOf(short)).toEqual([['Vos', '7', null], ['Rival', '2', null]]);
  });
});
