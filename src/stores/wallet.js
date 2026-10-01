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
    loading: false
  }),
  actions: {
    /** Incorpora saldo + estado del crédito diario y avisa si se acaban de acreditar fichas. */
    ingest({ balance, dailyGrant } = {}) {
      if (typeof balance === 'number') this.balance = balance;
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
    async fetch() {
      this.loading = true;
      try {
        this.ingest(await fetchWallet());
      } finally {
        this.loading = false;
      }
    }
  }
});
