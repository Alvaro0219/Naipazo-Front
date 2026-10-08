<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Ranking</h1>
      <p>Los que más ganan en la mesa. Las salas privadas no cuentan.</p>
    </header>

    <div class="tr-ranking-filters">
      <NzSegmentado
        v-model="filters.by"
        aria-label="Criterio"
        :opciones="[{ label: 'Partidas ganadas', value: 'won' }, { label: 'Fichas ganadas', value: 'chips' }]"
      />
      <NzSegmentado v-model="filters.mode" aria-label="Modo" :opciones="[{ label: '1 vs 1', value: '1v1' }, { label: '2 vs 2', value: '2v2' }]" />
      <NzSegmentado v-model="filters.period" aria-label="Período" :opciones="PERIODS" />
    </div>

    <LoadingState
      :loading="firstLoad"
      :empty="!firstLoad && pagination.rowsNumber === 0"
      empty-label="Todavía no hay nadie en este ranking."
      empty-icon="medalla"
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
// Tablas separadas por modo; las salas privadas no cuentan en ninguna
const filters = reactive({ by: 'won', period: 'all', mode: '1v1' });

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

.tr-ranking-table { padding: 4px 8px; }

:deep(.tr-ranking-me) td { font-weight: 700; }
:deep(.tr-ranking-me) td:first-child { box-shadow: inset 2px 0 0 var(--celeste); }

.tr-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 800;
  color: var(--texto-suave);
}

/* Puesto 1 en oro (10.7): número y borde dorados */
.tr-rank--1 { border: 1.5px solid var(--oro); color: var(--oro); }

.tr-ranking-note {
  margin: 0;
  color: var(--texto-suave);
  font-size: 13px;
}
</style>
