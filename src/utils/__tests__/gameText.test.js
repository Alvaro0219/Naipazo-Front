// EXACTITUD_DEL_JUEGO.md, F-06 y F-07: el cartel y los textos corresponden al canto o resultado real.
import { describe, expect, it } from 'vitest';
import { CALL_LABELS } from '../cards.js';
import { announcementFor, describeEvent } from '../gameText.js';

// Valores que manda el motor del back (game/truco/engine.js y envido.js)
const ENGINE_CALLS = ['TRUCO', 'RETRUCO', 'VALE_CUATRO', 'ENVIDO', 'REAL_ENVIDO', 'FALTA_ENVIDO'];
const HAND_REASONS = ['bazas', 'truco_rejected', 'deck', 'timeout'];
const names = { a: 'Vos', b: 'Juan' };
const ctx = { nameOf: (id) => names[id], teamName: (team) => (team === 0 ? 'Vos' : 'Juan') };

describe('cartel de cada canto', () => {
  it.each([
    ['TRUCO', '¡Truco!'],
    ['RETRUCO', '¡Quiero retruco!'],
    ['VALE_CUATRO', '¡Quiero vale cuatro!'],
    ['ENVIDO', '¡Envido!'],
    ['REAL_ENVIDO', '¡Real envido!'],
    ['FALTA_ENVIDO', '¡Falta envido!']
  ])('%s → %s', (call, text) => {
    expect(announcementFor({ type: 'CALL', playerId: 'b', call })).toBe(text);
  });

  it('todos los cantos del motor tienen texto propio (nunca se muestra el código crudo)', () => {
    for (const call of ENGINE_CALLS) {
      expect(CALL_LABELS[call]).toBeTruthy();
      expect(describeEvent({ type: 'CALL', playerId: 'b', call }, ctx)).not.toContain(call);
    }
  });

  it('respuestas, mazo y tantos', () => {
    expect(announcementFor({ type: 'RESPONSE', response: 'QUIERO' })).toBe('¡Quiero!');
    expect(announcementFor({ type: 'RESPONSE', response: 'NO_QUIERO' })).toBe('No quiero');
    expect(announcementFor({ type: 'WENT_TO_DECK', playerId: 'b' })).toBe('Me voy al mazo');
    expect(announcementFor({ type: 'ENVIDO_RESULT', accepted: true, tantos: { a: 27, b: 31 }, winnerTeam: 1, points: 2 })).toBe('27 · 31');
    expect(announcementFor({ type: 'ENVIDO_RESULT', accepted: true, tantos: { a: 33 }, winnerTeam: 0, points: 2 })).toBe('33 · Son buenas');
    expect(announcementFor({ type: 'ENVIDO_RESULT', accepted: false, winnerTeam: 0, points: 1 })).toBeNull();
    expect(announcementFor({ type: 'CARD_PLAYED', playerId: 'a', cardId: '1-espada' })).toBeNull();
  });
});

describe('textos de resultados', () => {
  it('cada motivo de fin de mano tiene su texto y los puntos son los del evento', () => {
    const expected = { bazas: '', truco_rejected: ' (no quiso)', deck: ' (se fue al mazo)', timeout: ' (se le pasó el tiempo)' };
    for (const reason of HAND_REASONS) {
      expect(describeEvent({ type: 'HAND_WON', winnerTeam: 0, points: 3, reason }, ctx)).toBe(`Ganás la mano: +3${expected[reason]}.`);
      expect(describeEvent({ type: 'HAND_WON', winnerTeam: 1, points: 1, reason }, ctx)).toBe(`Juan gana la mano: +1${expected[reason]}.`);
    }
  });

  it('envido, bazas, tiempo y final', () => {
    expect(describeEvent({ type: 'ENVIDO_RESULT', accepted: true, tantos: { a: 27, b: 31 }, winnerTeam: 1, points: 2 }, ctx))
      .toBe('Envido. Vos: 27, Juan: 31. Juan suma 2.');
    expect(describeEvent({ type: 'ENVIDO_RESULT', accepted: false, winnerTeam: 0, points: 1 }, ctx)).toBe('Sumás 1 por el envido no querido.');
    expect(describeEvent({ type: 'BAZA_WON', winnerTeam: null }, ctx)).toBe('Parda.');
    expect(describeEvent({ type: 'BAZA_WON', winnerTeam: 1, winnerPlayerId: 'b' }, ctx)).toBe('Juan gana la baza.');
    expect(describeEvent({ type: 'TURN_TIMEOUT', playerId: 'b' }, ctx)).toBe('A Juan se le pasó el tiempo.');
    expect(describeEvent({ type: 'MATCH_FINISHED', winnerTeam: 0 }, ctx)).toBe('Ganaste la partida.');
    expect(describeEvent({ type: 'MATCH_FINISHED', winnerTeam: 1 }, ctx)).toBe('Juan gana la partida.');
  });
});
