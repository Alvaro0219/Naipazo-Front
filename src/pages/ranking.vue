<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Ranking</h1>
      <p>Los que más ganan en la mesa.</p>
    </header>

    <div class="tr-ranking-filters">
      <q-btn-toggle
        v-model="filters.by"
        no-caps
        unelevated
        rounded
        toggle-color="primary"
        color="white"
        text-color="dark"
        :options="[{ label: 'Partidas ganadas', value: 'won' }, { label: 'Fichas ganadas', value: 'chips' }]"
      />
      <q-select
        v-model="filters.period"
        dense
        outlined
        emit-value
        map-options
        options-dense
        class="tr-ranking-period"
        :options="PERIODS"
        aria-label="Período"
      />
    </div>

    <LoadingState
      :loading="firstLoad"
      :empty="!firstLoad && pagination.rowsNumber === 0"
      empty-label="Todavía no hay nadie en este ranking."
      empty-icon="emoji_events"
    >
      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="userId"
        :loading="loading"
        :rows-per-page-options="[20, 50]"
        flat
        class="tr-section-card tr-ranking-table"
        :table-row-class-fn="(row) => (row.userId === auth.user?.id ? 'tr-ranking-me' : '')"
        @request="onRequest"
      >
        <template #body-cell-rank="props">
          <q-td :props="props">
            <span class="tr-rank" :class="props.value <= 3 ? `tr-rank--${props.value}` : ''">{{ props.value }}</span>
          </q-td>
        </template>
      </q-table>
    </LoadingState>

    <p class="tr-ranking-note">
      {{ filters.by === 'chips'
        ? 'Fichas ganadas: ganancia neta en mesas con apuesta.'
        : 'A igual cantidad de partidas ganadas, va primero quien jugó menos.' }}
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import LoadingState from '../components/LoadingState.vue';
import { usePaginatedList } from '../composables/usePaginatedList.js';
import { fetchRanking } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { formatChips } from '../utils/format.js';

const PERIODS = [
  { label: 'Siempre', value: 'all' },
  { label: 'Últimos 30 días', value: 'month' },
  { label: 'Últimos 7 días', value: 'week' }
];

const $q = useQuasar();
const auth = useAuthStore();
const filters = reactive({ by: 'won', period: 'all' });

const { rows, loading, firstLoad, pagination, onRequest, reload } = usePaginatedList({
  fetchFn: fetchRanking,
  filters: computed(() => ({ ...filters })),
  label: 'el ranking'
});

const columns = computed(() => {
  const base = [
    { name: 'rank', label: '#', field: 'rank', align: 'left', style: 'width: 48px' },
    { name: 'username', label: 'Jugador', field: 'username', align: 'left' }
  ];
  if (filters.by === 'chips') {
    return [...base, { name: 'chips', label: 'Fichas', field: 'chips', align: 'right', format: formatChips, classes: 'tr-num' }];
  }
  const cols = [...base, { name: 'won', label: 'Ganadas', field: 'won', align: 'right', classes: 'tr-num' }];
  if (!$q.screen.lt.sm) cols.push({ name: 'played', label: 'Jugadas', field: 'played', align: 'right', classes: 'tr-num' });
  return cols;
});

onMounted(reload);
</script>

<style scoped>
.tr-ranking-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tr-ranking-period { min-width: 170px; background: #fff; }

.tr-ranking-table { padding: 4px 8px; }

:deep(.tr-ranking-me) { background: #f0fdf4; font-weight: 700; }

.tr-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 800;
  color: #475569;
}

.tr-rank--1 { background: #fde68a; color: #713f12; }
.tr-rank--2 { background: #e2e8f0; color: #334155; }
.tr-rank--3 { background: #fed7aa; color: #7c2d12; }

.tr-ranking-note {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
}
</style>
