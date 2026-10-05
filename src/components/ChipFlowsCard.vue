<template>
  <section class="tr-section-card tr-flows">
    <header class="tr-flows__header">
      <div>
        <h2>Flujos de fichas</h2>
        <p>
          Pares de cuentas con {{ minMatches }} o más partidas privadas con apuesta entre sí en los últimos 30 días.
          Solo informa: no bloquea nada.
        </p>
      </div>
      <q-btn flat round icon="refresh" aria-label="Actualizar" :loading="loading" @click="load" />
    </header>

    <LoadingState :loading="loading && !items.length" :empty="!loading && !items.length" empty-label="No hay pares sospechosos." empty-icon="verified_user">
      <ul class="tr-flows__list">
        <li v-for="f in items" :key="`${f.receiver.id}-${f.giver.id}`" class="tr-flows__item" :class="{ 'tr-flows__item--alert': f.oneDirection }">
          <div class="tr-flows__pair">
            <strong>{{ f.giver.username }}</strong>
            <q-icon name="arrow_forward" />
            <strong>{{ f.receiver.username }}</strong>
            <q-badge v-if="f.oneDirection" color="negative" label="Siempre en la misma dirección" />
          </div>
          <div class="tr-flows__meta tr-num">
            {{ f.matches }} partidas · {{ f.receiverWins }}–{{ f.giverWins }} · {{ formatChips(f.chips) }} fichas netas · última {{ formatDateTime(f.lastAt) }}
          </div>
        </li>
      </ul>
    </LoadingState>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import LoadingState from './LoadingState.vue';
import { fetchChipFlows } from '../services/api.js';
import { formatChips, formatDateTime } from '../utils/format.js';

const $q = useQuasar();
const minMatches = 3;
const items = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    items.value = await fetchChipFlows({ days: 30, minMatches });
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo cargar el reporte' });
  } finally {
    loading.value = false;
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
  margin-top: 4px;
  color: #64748b;
  font-size: 0.85rem;
}
</style>
