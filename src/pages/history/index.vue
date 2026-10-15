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
      empty-icon="historial"
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
              <div class="tr-match__main">
                <div class="tr-match__titulo">
                  <span class="tr-match__result" :class="`tr-match__result--${row.result}`">
                    {{ RESULT_LABELS[row.result] }}
                  </span>
                  <strong>{{ opponentsLabel(row) }}</strong>
                </div>
                <span class="tr-match__meta">
                  <template v-if="row.tournamentId">Torneo · </template><template v-if="row.config.mode === '2v2'">2 vs 2 · </template><template v-if="row.config.isPrivate">Privada · </template>A {{ row.config.targetPoints }} · {{ formatDateTime(row.endedAt) }}
                  <template v-if="resultDetail(row)"> · {{ resultDetail(row) }}</template>
                </span>
              </div>
              <div class="tr-match__side">
                <span class="tr-match__score tr-num">{{ row.myScore }} – {{ row.opponentScore }}</span>
                <span
                  v-if="row.config.bet"
                  class="tr-match__chips tr-num"
                  :class="amountToneClass(row.chipsNet)"
                >
                  {{ formatSignedChips(row.chipsNet) }} fichas
                </span>
                <span v-else class="tr-match__chips">Gratis</span>
              </div>
              <Icono nombre="siguiente" class="tr-match__flecha" />
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
import { amountToneClass, formatDateTime, formatSignedChips } from '../../utils/format.js';
import { RESULT_LABELS, opponentsLabel, resultDetail } from '../../utils/matchText.js';

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
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: var(--radio-panel);
  background: var(--noche-2);
  border: 1px solid var(--linea);
  color: inherit;
  text-decoration: none;
}

.tr-match:hover { border-color: rgba(143, 167, 207, 0.5); color: inherit; }

.tr-match__flecha { color: var(--texto-suave); }

.tr-match__titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tr-match__result {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--linea);
  color: var(--texto-suave);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

/* Ganaste con chip de borde dorado; el resto, neutro (10.7) */
.tr-match__result--won { border-color: var(--oro); color: var(--oro); }

.tr-match__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tr-match__main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-match__meta {
  color: var(--texto-suave);
  font-size: 13px;
}

.tr-match__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.tr-match__score { font-family: var(--fuente-titulo); font-weight: 700; }

.tr-match__chips {
  color: var(--texto-suave);
  font-size: 13px;
  font-weight: 600;
}

/* En el celular toda la fila es el enlace: la flecha sobra */
@media (max-width: 480px) {
  .tr-match__flecha { display: none; }
}
</style>
