<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="tr-create">
      <q-card-section>
        <h2 class="tr-create__title">Crear sala</h2>
      </q-card-section>

      <q-card-section class="column q-gutter-y-md">
        <div>
          <div class="tr-create__label">Puntos</div>
          <q-btn-toggle
            v-model="targetPoints"
            spread
            no-caps
            unelevated
            toggle-color="primary"
            color="grey-2"
            text-color="dark"
            :options="[{ label: 'A 15', value: 15 }, { label: 'A 30', value: 30 }]"
          />
        </div>

        <div>
          <div class="tr-create__label">Apuesta</div>
          <q-btn-toggle
            v-model="mode"
            spread
            no-caps
            unelevated
            toggle-color="primary"
            color="grey-2"
            text-color="dark"
            :options="[{ label: 'Gratis', value: 'free' }, { label: 'Con fichas', value: 'bet', disable: true }]"
          />
          <div class="tr-create__hint">Las mesas con apuesta de fichas llegan muy pronto.</div>
        </div>

        <div class="tr-create__hint">Por ahora todas las mesas se juegan sin flor.</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps label="Cancelar" v-close-popup />
        <q-btn color="primary" unelevated no-caps label="Crear sala" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { createRoom } from '../services/api.js';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'created']);

const $q = useQuasar();
const targetPoints = ref(15);
const mode = ref('free');
const loading = ref(false);
let uuid = crypto.randomUUID();

// Un uuid por intento de creación: reintentar el mismo envío no crea una sala duplicada
watch(() => props.modelValue, (open) => { if (open) uuid = crypto.randomUUID(); });

async function submit() {
  loading.value = true;
  try {
    const room = await createRoom({ uuid, targetPoints: targetPoints.value, bet: 0 });
    emit('update:modelValue', false);
    emit('created', room);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo crear la sala' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tr-create { width: min(92vw, 400px); }

.tr-create__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.3;
}

.tr-create__label {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.tr-create__hint {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
}
</style>
