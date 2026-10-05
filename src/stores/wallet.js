import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import { fetchWallet } from '../services/api.js';
import { formatChips } from '../utils/format.js';

// El saldo es transversal: lo muestran la barra superior, la billetera y (más adelante)
// el diálogo de crear sala. Por eso vive en un store y no en una página.
export const useWalletStore = defineStore('wallet', {
  state: () => ({
    balance: null,
    dailyGrantAmount: null,
    nextGrantAt: null,
    loading: false,
    lastSource: null // de dónde vino el último saldo (diagnóstico)
  }),
  actions: {
    /** Incorpora saldo + estado del crédito diario y avisa si se acaban de acreditar fichas. */
    ingest({ balance, dailyGrant } = {}, source = 'desconocido') {
      // Un aviso sin saldo numérico nunca pisa el último saldo conocido
      if (typeof balance === 'number') {
        this.balance = balance;
        this.lastSource = source;
      } else if (balance !== undefined) {
        console.warn('[wallet] se ignoró un saldo inválido', { balance, source });
      }
      if (dailyGrant) {
        this.dailyGrantAmount = dailyGrant.amount;
        this.nextGrantAt = dailyGrant.nextGrantAt;
        if (dailyGrant.granted) {
          Notify.create({
            type: 'positive',
            icon: 'redeem',
            message: `¡Recibiste tus ${formatChips(dailyGrant.amount)} fichas de hoy!`
          });
        }
      }
    },
    /** Relee el saldo sin molestar: si falla, queda el último valor conocido. */
    async refresh() {
      if (this.loading) return;
      try {
        await this.fetch();
      } catch {
        /* sin red o sesión vencida: el interceptor de api.js ya se ocupa */
      }
    },
    async fetch() {
      this.loading = true;
      try {
        this.ingest(await fetchWallet(), 'GET /wallet');
      } finally {
        this.loading = false;
      }
    }
  }
});
