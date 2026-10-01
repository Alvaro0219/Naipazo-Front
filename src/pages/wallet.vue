<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Billetera</h1>
      <p>Tu saldo de fichas y todos sus movimientos.</p>
    </header>

    <div class="tr-wallet-top">
      <section class="tr-balance-card">
        <span class="tr-balance-card__label">Saldo disponible</span>
        <span class="tr-balance-card__value tr-num">
          {{ wallet.balance === null ? '—' : formatChips(wallet.balance) }}
        </span>
        <span class="tr-balance-card__unit">fichas virtuales</span>
      </section>

      <section class="tr-section-card tr-grant-card">
        <q-icon name="redeem" size="28px" color="accent" />
        <div>
          <h2>Crédito diario</h2>
          <p v-if="remainingMs !== null">
            Tus próximas <strong>{{ formatChips(wallet.dailyGrantAmount) }}</strong> fichas llegan en
            <strong class="tr-num">{{ formatDuration(remainingMs) }}</strong>.
          </p>
          <p v-else>Cada día que entrás recibís fichas gratis.</p>
          <small>Se acreditan la primera vez que entrás en el día (hora de Argentina). No se acumulan.</small>
        </div>
      </section>
    </div>

    <ChipsNotice />

    <section class="tr-section-card">
      <h2>Movimientos</h2>
      <LoadingState
        :loading="firstLoad"
        :empty="!firstLoad && pagination.rowsNumber === 0"
        empty-label="Todavía no tenés movimientos."
        empty-icon="receipt_long"
      >
        <q-table
          v-model:pagination="pagination"
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :grid="$q.screen.lt.sm"
          :rows-per-page-options="[10, 20, 50]"
          flat
          @request="onRequest"
        >
          <template #body-cell-amount="props">
            <q-td :props="props" class="tr-num" :class="amountClass(props.value)">
              {{ formatSignedChips(props.value) }}
            </q-td>
          </template>

          <template #item="props">
            <div class="col-12">
              <div class="tr-ledger-item">
                <div>
                  <div class="tr-ledger-item__type">{{ LEDGER_TYPE_LABELS[props.row.type] || props.row.type }}</div>
                  <div class="tr-ledger-item__date">{{ formatDateTime(props.row.createdAt) }}</div>
                </div>
                <div class="text-right">
                  <div class="tr-num tr-ledger-item__amount" :class="amountClass(props.row.amount)">
                    {{ formatSignedChips(props.row.amount) }}
                  </div>
                  <div class="tr-num tr-ledger-item__after">Saldo {{ formatChips(props.row.balanceAfter) }}</div>
                </div>
              </div>
            </div>
          </template>
        </q-table>
      </LoadingState>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import ChipsNotice from '../components/ChipsNotice.vue';
import LoadingState from '../components/LoadingState.vue';
import { useCountdown } from '../composables/useCountdown.js';
import { fetchLedger } from '../services/api.js';
import { useWalletStore } from '../stores/wallet.js';
import {
  LEDGER_TYPE_LABELS, formatChips, formatDateTime, formatDuration, formatSignedChips
} from '../utils/format.js';

const $q = useQuasar();
const wallet = useWalletStore();

const rows = ref([]);
const loading = ref(false);
const firstLoad = ref(true);
const pagination = ref({ page: 1, rowsPerPage: 20, rowsNumber: 0 });

const columns = [
  { name: 'createdAt', label: 'Fecha', field: 'createdAt', align: 'left', format: formatDateTime },
  { name: 'type', label: 'Concepto', field: 'type', align: 'left', format: (v) => LEDGER_TYPE_LABELS[v] || v },
  { name: 'amount', label: 'Monto', field: 'amount', align: 'right' },
  { name: 'balanceAfter', label: 'Saldo', field: 'balanceAfter', align: 'right', format: formatChips, classes: 'tr-num' }
];

function amountClass(value) {
  return value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : '';
}

async function onRequest({ pagination: next }) {
  loading.value = true;
  try {
    const { items, pagination: meta } = await fetchLedger({ page: next.page, limit: next.rowsPerPage });
    rows.value = items;
    pagination.value = { ...next, rowsNumber: meta.total };
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo cargar el historial' });
  } finally {
    loading.value = false;
    firstLoad.value = false;
  }
}

function reloadLedger() {
  return onRequest({ pagination: { ...pagination.value, page: 1 } });
}

// Al llegar a la medianoche se pide la billetera: el backend acredita el nuevo crédito
const { remainingMs } = useCountdown(computed(() => wallet.nextGrantAt), {
  onExpire: async () => {
    try {
      await wallet.fetch();
      await reloadLedger();
    } catch {
      // se reintenta en la próxima visita
    }
  }
});

onMounted(reloadLedger);
</script>

<style scoped>
.tr-wallet-top {
  display: grid;
  gap: 16px;
}

.tr-balance-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 20px;
  border-radius: 16px;
  color: #fff;
  background:
    radial-gradient(circle at 100% 0%, rgba(253, 224, 71, 0.25), transparent 50%),
    #14532d;
}

.tr-balance-card__label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
}

.tr-balance-card__value {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  color: #fef9c3;
}

.tr-balance-card__unit {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
}

.tr-grant-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.tr-grant-card h2 { margin: 3px 0 4px; }

.tr-grant-card p {
  margin: 0 0 4px;
  color: #334155;
}

.tr-grant-card small { color: #64748b; }

.tr-ledger-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid #e2e8f0;
}

.tr-ledger-item__type { font-weight: 600; }

.tr-ledger-item__date,
.tr-ledger-item__after {
  font-size: 0.8rem;
  color: #64748b;
}

.tr-ledger-item__amount { font-weight: 700; }

@media (min-width: 768px) {
  .tr-wallet-top { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); }
}
</style>
