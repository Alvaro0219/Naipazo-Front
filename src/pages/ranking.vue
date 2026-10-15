<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Ranking de {{ monthName }}</h1>
      <p>Fichas ganadas este mes en mesas y torneos. Las salas privadas no cuentan.</p>
    </header>

    <LoadingState
      :loading="firstLoad"
      :empty="!firstLoad && total === 0"
      empty-label="Todavía nadie jugó este mes. ¡Estrenalo vos!"
      empty-icon="medalla"
      :skeleton-rows="5"
      :skeleton-height="52"
    >
      <ol class="tr-ranking" :aria-busy="loading">
        <li
          v-for="row in rows"
          :key="row.userId"
          class="tr-ranking__fila"
          :class="{ 'tr-ranking__fila--vos': row.userId === auth.user?.id, 'tr-ranking__fila--primero': row.rank === 1 }"
        >
          <span class="tr-ranking__puesto tr-num">{{ row.rank }}</span>
          <Avatar :nombre="row.username" :size="32" />
          <span class="tr-ranking__nombre">
            <strong>{{ row.username }}</strong>
            <small v-if="row.userId === auth.user?.id">(vos)</small>
          </span>
          <span class="tr-ranking__fichas tr-num" :class="row.chips < 0 ? 'nz-monto--suave' : 'nz-monto--texto'">
            {{ formatSignedChips(row.chips) }}
            <span class="nz-sr">fichas</span>
          </span>
        </li>
      </ol>

      <nav v-if="totalPages > 1" class="tr-ranking__paginas" aria-label="Páginas del ranking">
        <NzBoton variante="texto" icono="volver" label="Anterior" :disable="page <= 1 || loading" @click="load(page - 1)" />
        <span class="tr-num">Página {{ page }} de {{ totalPages }}</span>
        <NzBoton variante="texto" icono-derecha="avanzar" label="Siguiente" :disable="page >= totalPages || loading" @click="load(page + 1)" />
      </nav>
    </LoadingState>
  </div>
</template>

<script setup>
// Ranking (ESTILOS_NAIPAZO.md, 10.7, con la decisión del dueño): mes calendario, por fichas ganadas, sin filtros.
// Puesto 1 con número y borde dorados; tu fila con borde celeste y "(vos)"; las demás con separadores.
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import LoadingState from '../components/LoadingState.vue';
import { fetchMonthlyRanking } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { formatSignedChips } from '../utils/format.js';

const LIMIT = 20;
const $q = useQuasar();
const auth = useAuthStore();

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const monthStart = ref(null);
const loading = ref(false);
const firstLoad = ref(true);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)));
// Nombre del mes en hora de Argentina (el servidor manda el comienzo del mes)
const monthName = computed(() => new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })
  .format(monthStart.value ? new Date(monthStart.value) : new Date()));

async function load(next = 1) {
  loading.value = true;
  try {
    const data = await fetchMonthlyRanking({ page: next, limit: LIMIT });
    rows.value = data.items;
    total.value = data.pagination.total;
    page.value = next;
    monthStart.value = data.month?.start ?? null;
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo cargar el ranking' });
  } finally {
    loading.value = false;
    firstLoad.value = false;
  }
}

onMounted(() => load(1));
</script>

<style scoped>
.tr-ranking {
  list-style: none;
  margin: 0;
  padding: 4px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radio-panel);
  background: var(--noche-2);
  border: 1px solid var(--linea);
}

.tr-ranking__fila {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  border: 1.5px solid transparent;
  border-radius: var(--radio-boton);
}

/* Separadores finos entre filas (no alrededor de la tuya ni de la siguiente) */
.tr-ranking__fila + .tr-ranking__fila:not(.tr-ranking__fila--vos) { box-shadow: inset 0 1px 0 var(--linea); }
.tr-ranking__fila--vos + .tr-ranking__fila { box-shadow: none; }

/* Tu fila: borde celeste completo */
.tr-ranking__fila--vos {
  border-color: var(--celeste);
  background: var(--noche-3);
}

.tr-ranking__puesto {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--texto-suave);
  font-family: var(--fuente-titulo);
  font-weight: 700;
}

/* Puesto 1: número y borde dorados */
.tr-ranking__fila--primero .tr-ranking__puesto {
  border: 1.5px solid var(--oro);
  color: var(--oro);
}

.tr-ranking__nombre {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.tr-ranking__nombre strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-ranking__nombre small {
  flex-shrink: 0;
  color: var(--celeste);
  font-size: 13px;
  font-weight: 600;
}

.tr-ranking__fichas {
  flex-shrink: 0;
  font-family: var(--fuente-titulo);
  font-size: 16px;
  font-weight: 700;
}

.tr-ranking__paginas {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--texto-suave);
  font-size: 14px;
}
</style>
