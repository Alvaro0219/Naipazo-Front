import { CALL_LABELS } from './cards.js';

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
    case 'ENVIDO_RESULT':
      if (!event.accepted) return `${teamName(event.winnerTeam)} suma ${event.points} por el envido no querido.`;
      return `Envido: ${Object.entries(event.tantos).map(([id, t]) => `${nameOf(id)} ${t}`).join(' – ')}. `
        + `${teamName(event.winnerTeam)} suma ${event.points}.`;
    case 'BAZA_WON':
      return event.winnerTeam === null ? 'Parda.' : `${nameOf(event.winnerPlayerId)} gana la baza.`;
    case 'WENT_TO_DECK':
      return `${nameOf(event.playerId)} se fue al mazo.`;
    case 'TURN_TIMEOUT':
      return `A ${nameOf(event.playerId)} se le pasó el tiempo.`;
    case 'HAND_WON':
      return `${teamName(event.winnerTeam)} gana la mano: +${event.points}${HAND_REASONS[event.reason] || ''}.`;
    case 'MATCH_FINISHED':
      return `${teamName(event.winnerTeam)} gana la partida.`;
    default:
      return null;
  }
}

/** Texto grande y breve que aparece sobre la mesa (cantos y respuestas). */
export function announcementFor(event) {
  if (event.type === 'CALL') return `¡${CALL_LABELS[event.call] || event.call}!`;
  if (event.type === 'RESPONSE') return event.response === 'QUIERO' ? '¡Quiero!' : 'No quiero';
  if (event.type === 'WENT_TO_DECK') return 'Me voy al mazo';
  if (event.type === 'ENVIDO_RESULT' && event.accepted) return Object.values(event.tantos).join(' a ');
  return null;
}
