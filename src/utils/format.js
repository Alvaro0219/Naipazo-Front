const chipsFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

export function formatChips(value) {
  return chipsFormatter.format(Number(value) || 0);
}

export function formatSignedChips(value) {
  const n = Number(value) || 0;
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatChips(Math.abs(n))}`;
}

export function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : '';
}

/** Milisegundos → "HH:MM:SS" */
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const LEDGER_TYPE_LABELS = {
  DAILY_GRANT: 'Crédito diario',
  BET_LOCK: 'Apuesta en mesa',
  BET_PAYOUT: 'Premio de partida',
  BET_REFUND: 'Devolución de apuesta',
  ADMIN_ADJUST: 'Ajuste administrativo'
};
