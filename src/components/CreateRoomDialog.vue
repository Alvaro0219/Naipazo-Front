<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="tr-create">
      <q-card-section>
        <h2 class="tr-create__title">Crear sala</h2>
      </q-card-section>

      <q-form ref="formRef" @submit.prevent="submit">
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
              :options="[{ label: 'Gratis', value: 'free' }, { label: 'Con fichas', value: 'bet' }]"
            />
          </div>

          <div v-if="mode === 'bet'">
            <q-input
              v-model.number="bet"
              type="number"
              inputmode="numeric"
              outlined
              label="Fichas por jugador"
              :min="config.minBet"
              :max="maxAllowed"
              :rules="betRules"
              :hint="`Tenés ${formatChips(wallet.balance ?? 0)} fichas. El ganador se lleva ${formatChips(pot)}.`"
            />
            <div class="tr-create__presets">
              <q-btn
                v-for="amount in presets"
                :key="amount"
                outline
                dense
                no-caps
                color="primary"
                :label="formatChips(amount)"
                @click="bet = amount"
              />
            </div>
          </div>

          <ChipsNotice compact />
          <div class="tr-create__hint">Por ahora todas las mesas se juegan sin flor.</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn type="submit" color="primary" unelevated no-caps label="Crear sala" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import ChipsNotice from './ChipsNotice.vue';
import { useGameConfig } from '../composables/useGameConfig.js';
import { createRoom } from '../services/api.js';
import { useWalletStore } from '../stores/wallet.js';
import { formatChips } from '../utils/format.js';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'created']);

const $q = useQuasar();
const wallet = useWalletStore();
const { config } = useGameConfig();

const formRef = ref(null);
const targetPoints = ref(15);
const mode = ref('free');
const bet = ref(100);
const loading = ref(false);
let uuid = crypto.randomUUID();

const maxAllowed = computed(() => Math.min(config.value.maxBet, wallet.balance ?? 0));
const pot = computed(() => {
  const total = (Number(bet.value) || 0) * 2;
  return total - Math.floor(total * (config.value.houseRate || 0));
});
const presets = computed(() => [50, 100, 250, 500].filter((n) => n >= config.value.minBet && n <= maxAllowed.value));

const betRules = [
  (v) => Number.isInteger(v) || 'Ingresá un número entero de fichas',
  (v) => v >= config.value.minBet || `La apuesta mínima es de ${formatChips(config.value.minBet)} fichas`,
  (v) => v <= config.value.maxBet || `La apuesta máxima es de ${formatChips(config.value.maxBet)} fichas`,
  (v) => v <= (wallet.balance ?? 0) || 'No tenés fichas suficientes'
];

// Un uuid por intento de creación: reintentar el mismo envío no crea una sala duplicada
watch(() => props.modelValue, (open) => { if (open) uuid = crypto.randomUUID(); });

async function submit() {
  if (mode.value === 'bet' && !(await formRef.value.validate())) return;
  loading.value = true;
  try {
    const room = await createRoom({
      uuid,
      targetPoints: targetPoints.value,
      bet: mode.value === 'bet' ? bet.value : 0
    });
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

.tr-create__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tr-create__hint {
  color: #64748b;
  font-size: 0.8rem;
}
</style>
