// Textos del historial de partidas (resultado y motivo de cierre).

export const RESULT_LABELS = {
  won: 'Ganaste',
  lost: 'Perdiste',
  cancelled: 'Cancelada'
};

export function resultDetail(match) {
  if (match.result === 'cancelled') return 'Se canceló y se devolvieron las apuestas.';
  if (match.endReason === 'abandon') {
    return match.abandonedByMe ? 'Abandonaste la partida.' : `${match.opponent?.username || 'Tu rival'} abandonó la partida.`;
  }
  return '';
}
