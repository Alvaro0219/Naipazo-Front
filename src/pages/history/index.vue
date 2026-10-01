<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Historial</h1>
      <p>Tus partidas terminadas, la más reciente primero.</p>
    </header>

    <LoadingState
      :loading="firstLoad"
      :empty="!firstLoad && pagination.rowsNumber === 0"
      empty-label="Todavía no jugaste ninguna partida."
      empty-icon="history"
    >
      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50]"
        grid
        flat
        hide-header
        @request="onRequest"
      >
        <template #item="{ row }">
          <div class="col-12">
            <router-link :to="`/historial/${row.id}`" class="tr-match">
              <span class="tr-match__result" :class="`tr-match__result--${row.result}`">
                {{ RESULT_LABELS[row.result] }}
              </span>
              <div class="tr-match__main">
                <strong>vs {{ row.opponent?.username || '—' }}</strong>
                <span class="tr-match__meta">
                  A {{ row.config.targetPoints }} · {{ formatDateTime(row.endedAt) }}
                  <template v-if="resultDetail(row)"> · {{ resultDetail(row) }}</template>
                </span>
              </div>
              <div class="tr-match__side">
                <span class="tr-match__score tr-num">{{ row.myScore }} – {{ row.opponentScore }}</span>
                <span
                  v-if="row.config.bet"
                  class="tr-match__chips tr-num"
                  :class="row.chipsNet > 0 ? 'text-positive' : row.chipsNet < 0 ? 'text-negative' : ''"
                >
                  {{ formatSignedChips(row.chipsNet) }} fichas
                </span>
                <span v-else class="tr-match__chips">Gratis</span>
              </div>
              <q-icon name="chevron_right" size="20px" color="grey-5" />
            </router-link>
          </div>
        </template>
      </q-table>
    </LoadingState>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import LoadingState from '../../components/LoadingState.vue';
import { usePaginatedList } from '../../composables/usePaginatedList.js';
import { fetchMatches } from '../../services/api.js';
import { formatDateTime, formatSignedChips } from '../../utils/format.js';
import { RESULT_LABELS, resultDetail } from '../../utils/matchText.js';

const columns = [{ name: 'id', field: 'id', label: 'Partida' }];

const { rows, loading, firstLoad, pagination, onRequest, reload } = usePaginatedList({
  fetchFn: fetchMatches,
  label: 'el historial'
});

onMounted(reload);
</script>

<style scoped>
.tr-match {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: inherit;
  text-decoration: none;
}

.tr-match:hover { border-color: #cbd5e1; }

.tr-match__result {
  flex-shrink: 0;
  width: 84px;
  padding: 4px 0;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tr-match__result--won { background: #dcfce7; color: #166534; }
.tr-match__result--lost { background: #fee2e2; color: #991b1b; }
.tr-match__result--cancelled { background: #f1f5f9; color: #475569; }

.tr-match__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tr-match__main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-match__meta {
  color: #64748b;
  font-size: 0.8rem;
}

.tr-match__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.tr-match__score { font-weight: 800; }

.tr-match__chips {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 420px) {
  .tr-match__result { width: 70px; font-size: 0.68rem; }
}
</style>
