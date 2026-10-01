import { CALL_LABELS } from './cards.js';

const scores = (name, points) => (name === 'Vos' ? `Sumás ${points}` : `${name} suma ${points}`);

const HAND_REASONS = {
  bazas: '',
  truco_rejected: ' (no quiso)',
  deck: ' (se fue al mazo)',
  timeout: ' (se le pasó el tiempo)'
};

/**
 * Texto para el log de la mesa a partir de un `game:event`.
 * `nameOf(playerId)` y `teamName(team)` resuelven nombres ("Vos" para el propio jugador).
 * Devuelve null para eventos que no van al log (por ejemplo, las cartas jugadas, que ya se ven en la mesa).
 */
export function describeEvent(event, { nameOf, teamName }) {
  switch (event.type) {
    case 'HAND_STARTED':
      return `Mano ${event.handNumber}. Es mano ${nameOf(event.manoId)}.`;
    case 'CALL':
      return `${nameOf(event.playerId)}: ¡${CALL_LABELS[event.call] || event.call}!`;
    case 'RESPONSE':
      return `${nameOf(event.playerId)}: ${event.response === 'QUIERO' ? 'Quiero' : 'No quiero'}`;
    case 'ENVIDO_RESULT': {
      if (!event.accepted) return `${scores(teamName(event.winnerTeam), event.points)} por el envido no querido.`;
      // Solo vienen los tantos cantados: si hay uno solo, el otro dijo "son buenas"
      const sung = Object.entries(event.tantos).map(([id, t]) => `${nameOf(id)}: ${t}`);
      const goodOnes = sung.length === 1 ? ' — son buenas' : '';
      return `Envido. ${sung.join(', ')}${goodOnes}. ${scores(teamName(event.winnerTeam), event.points)}.`;
    }
    case 'BAZA_WON':
      return event.winnerTeam === null ? 'Parda.' : `${nameOf(event.winnerPlayerId)} gana la baza.`;
    case 'WENT_TO_DECK':
      return `${nameOf(event.playerId)} se fue al mazo.`;
    case 'TURN_TIMEOUT':
      return `A ${nameOf(event.playerId)} se le pasó el tiempo.`;
    case 'HAND_WON': {
      const who = teamName(event.winnerTeam);
      return `${who === 'Vos' ? 'Ganás' : `${who} gana`} la mano: +${event.points}${HAND_REASONS[event.reason] || ''}.`;
    }
    case 'MATCH_FINISHED': {
      const who = teamName(event.winnerTeam);
      return who === 'Vos' ? 'Ganaste la partida.' : `${who} gana la partida.`;
    }
    default:
      return null;
  }
}

/** Texto grande y breve que aparece sobre la mesa (cantos y respuestas). */
export function announcementFor(event) {
  if (event.type === 'CALL') return `¡${CALL_LABELS[event.call] || event.call}!`;
  if (event.type === 'RESPONSE') return event.response === 'QUIERO' ? '¡Quiero!' : 'No quiero';
  if (event.type === 'WENT_TO_DECK') return 'Me voy al mazo';
  if (event.type === 'ENVIDO_RESULT' && event.accepted) {
    const values = Object.values(event.tantos); // en el orden en que se cantaron, empezando por el mano
    return values.length === 1 ? `${values[0]} · Son buenas` : values.join(' · ');
  }
  return null;
}
