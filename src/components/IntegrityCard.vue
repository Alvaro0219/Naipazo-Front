<template>
  <section class="tr-section-card tr-flows">
    <header class="tr-flows__header">
      <div>
        <h2>Integridad</h2>
        <p>
          Partidas congeladas por una verificación, auditorías que no coinciden y diferencias en la conciliación diaria
          de fichas. La meta es cero.
        </p>
      </div>
      <div class="tr-integrity__tools">
        <q-btn flat no-caps icon="balance" label="Conciliar ahora" :loading="reconciling" @click="runReconcile" />
        <q-btn flat round icon="refresh" aria-label="Actualizar" :loading="loading" @click="load" />
      </div>
    </header>

    <div v-if="summary" class="tr-integrity__counts tr-num">
      <span :class="{ 'tr-integrity__count--alert': summary.open.invariant }">{{ summary.open.invariant }} congeladas sin revisar</span>
      <span :class="{ 'tr-integrity__count--alert': summary.open.audit }">{{ summary.open.audit }} auditorías con diferencias</span>
      <span :class="{ 'tr-integrity__count--alert': summary.open.reconciliation }">{{ summary.open.reconciliation }} conciliaciones con diferencias</span>
    </div>

    <LoadingState :loading="loading && !summary" :empty="!loading && !open.length" empty-label="No hay incidentes abiertos." empty-icon="verified_user">
      <ul class="tr-flows__list">
        <li v-for="i in open" :key="i.id" class="tr-flows__item tr-flows__item--alert">
          <div class="tr-flows__pair">
            <q-badge color="negative" :label="TYPE_LABELS[i.type]" />
            <span>{{ i.summary }}</span>
          </div>
          <div class="tr-flows__meta tr-num">
            {{ formatDateTime(i.createdAt) }}<template v-if="i.matchId"> · partida {{ i.matchId }}</template>
            <q-btn flat dense no-caps size="sm" label="Marcar como revisado" :loading="resolving === i.id" @click="resolve(i)" />
          </div>
        </li>
      </ul>
    </LoadingState>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import LoadingState from './LoadingState.vue';
import { fetchIntegrity, reconcileChips, resolveIncident } from '../services/api.js';
import { formatDateTime } from '../utils/format.js';

const TYPE_LABELS = { invariant: 'Congelada', audit: 'Auditoría', reconciliation: 'Conciliación' };

const $q = useQuasar();
const summary = ref(null);
const loading = ref(false);
const reconciling = ref(false);
const resolving = ref(null);
const open = computed(() => summary.value?.recent.filter((i) => !i.resolved) ?? []);

async function load() {
  loading.value = true;
  try {
    summary.value = await fetchIntegrity();
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo cargar la integridad' });
  } finally {
    loading.value = false;
  }
}

async function runReconcile() {
  reconciling.value = true;
  try {
    const result = await reconcileChips();
    $q.notify(result.ok
      ? { type: 'positive', message: `Las fichas cuadran (${result.checkedUsers} cuentas, ${result.checkedMatches} partidas).` }
      : { type: 'negative', message: `La conciliación encontró ${result.problems.length} diferencia/s.` });
    await load();
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo conciliar' });
  } finally {
    reconciling.value = false;
  }
}

async function resolve(incident) {
  resolving.value = incident.id;
  try {
    await resolveIncident(incident.id);
    await load();
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo marcar el incidente' });
  } finally {
    resolving.value = null;
  }
}

onMounted(load);
</script>

<style scoped>
.tr-flows { margin-top: 16px; }

.tr-flows__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.tr-flows__header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.tr-flows__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.tr-integrity__tools {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tr-integrity__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 12px;
  color: #64748b;
  font-size: 0.9rem;
}

.tr-integrity__count--alert {
  color: #b91c1c;
  font-weight: 600;
}

.tr-flows__list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tr-flows__item {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.tr-flows__item--alert {
  border-color: #fecaca;
  background: #fef2f2;
}

.tr-flows__pair {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.tr-flows__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.85rem;
}
</style>
