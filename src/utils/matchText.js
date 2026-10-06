// Textos del historial de partidas (resultado y motivo de cierre).

export const RESULT_LABELS = {
  won: 'Ganaste',
  lost: 'Perdiste',
  cancelled: 'Cancelada',
  'no-result': 'Sin resultado' // 2 vs 2: abandonó tu compañero
};

/** "vs Juan" en 1 vs 1; "con Ana vs Juan y Leo" en 2 vs 2 */
export function opponentsLabel(match) {
  if (match.config?.mode === '2v2') {
    const rivals = (match.rivals || []).map((r) => r.username).join(' y ');
    return `con ${match.partner?.username || '—'} vs ${rivals || '—'}`;
  }
  return `vs ${match.opponent?.username || '—'}`;
}

export function resultDetail(match) {
  if (match.result === 'cancelled') return 'Se canceló y se devolvieron las apuestas.';
  if (match.result === 'no-result') return 'Abandonó tu compañero: recuperaste tu apuesta.';
  if (match.endReason === 'abandon') {
    if (match.abandonedByMe) return 'Abandonaste la partida.';
    return match.config?.mode === '2v2' ? 'Abandonaron los rivales.' : `${match.opponent?.username || 'Tu rival'} abandonó la partida.`;
  }
  return '';
}
