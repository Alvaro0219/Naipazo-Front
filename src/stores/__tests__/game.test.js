// EXACTITUD_DEL_JUEGO.md, F-04 y F-08: el reloj usa el plazo del servidor y la mesa se arma solo con su estado.
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../game.js';

const view = (over = {}) => ({
  matchId: 'm1',
  roomId: 'r1',
  me: { id: 'a', team: 0 },
  players: [{ id: 'a', team: 0 }, { id: 'b', team: 1 }],
  turn: { playerIds: ['a'], remainingMs: 12000, totalMs: 30000 },
  availableActions: ['PLAY_CARD', 'CALL_TRUCO'],
  signs: [],
  ...over
});

describe('store de la mesa', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('F-04: el plazo es el tiempo restante que manda el servidor, no un reloj nuevo de turno completo', () => {
    const game = useGameStore();
    game.onState(view());
    expect(game.turnClock).toEqual({ deadline: Date.now() + 12000, totalMs: 30000, mine: true });

    // Un estado reenviado (reconexión) con menos tiempo no reinicia el reloj: manda lo que dice el servidor
    vi.advanceTimersByTime(5000);
    game.onState(view({ turn: { playerIds: ['a'], remainingMs: 7000, totalMs: 30000 } }));
    expect(game.turnClock.deadline).toBe(Date.now() + 7000);

    // Sin turno corriendo (pausa, entre manos) no hay reloj
    game.onState(view({ turn: null }));
    expect(game.turnClock).toBeNull();
  });

  it('F-08: cada estado reemplaza al anterior por completo (nada se arrastra de antes de reconectar)', () => {
    const game = useGameStore();
    game.onState(view({ availableActions: ['ACCEPT', 'REJECT'], signs: [{ from: 'c', sign: 'ancho', at: 1 }] }));
    game.onState(view({ availableActions: ['PLAY_CARD'], signs: [] }));
    expect(game.view.availableActions).toEqual(['PLAY_CARD']);
    expect(game.signs).toEqual([]);
    expect(game.canAct('ACCEPT')).toBe(false);
    expect(game.canAct('PLAY_CARD')).toBe(true);
  });

  it('F-03: la respuesta del servidor libera los botones', () => {
    const game = useGameStore();
    game.sending = true;
    game.onState(view());
    expect(game.sending).toBe(false);
  });
});
