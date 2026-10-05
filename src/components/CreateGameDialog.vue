<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="tr-create">
      <q-card-section>
        <h2 class="tr-create__title">Crear partida</h2>
      </q-card-section>

      <q-form ref="formRef" @submit.prevent="submit">
        <q-card-section class="column q-gutter-y-md">
          <!-- Qué crear: una mesa 1 contra 1 o un torneo -->
          <div class="tr-kind" role="radiogroup" aria-label="Tipo de partida">
            <button
              v-for="option in KINDS"
              :key="option.value"
              type="button"
              role="radio"
              class="tr-kind__option"
              :class="{ 'tr-kind__option--active': kind === option.value }"
              :aria-checked="kind === option.value"
              @click="kind = option.value"
            >
              <q-icon :name="option.icon" size="26px" />
              <strong>{{ option.label }}</strong>
              <span>{{ option.hint }}</span>
            </button>
          </div>

          <div v-if="kind === 'tournament'">
            <div class="tr-create__label">Jugadores</div>
            <q-btn-toggle
              v-model="size"
              spread
              no-caps
              unelevated
              toggle-color="primary"
              color="grey-2"
              text-color="dark"
              :options="[{ label: '4 jugadores', value: 4 }, { label: '8 jugadores', value: 8 }]"
            />
          </div>

          <div>
            <div class="tr-create__label">{{ kind === 'tournament' ? 'Puntos de cada partida' : 'Puntos' }}</div>
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
            <q-select
              v-model="amount"
              :options="amountOptions"
              :label="kind === 'tournament' ? 'Inscripción' : 'Apuesta'"
              outlined
              emit-value
              map-options
              options-dense
              :hint="amountHint"
              :rules="[(v) => v <= (wallet.balance ?? 0) || 'No tenés fichas suficientes']"
            />
          </div>

          <div v-if="kind === 'tournament'" class="tr-create__prize">
            <q-icon name="emoji_events" size="22px" color="accent" />
            <span v-if="amount > 0">
              El campeón se lleva <strong class="tr-num">{{ formatChips(prize) }}</strong> fichas
              ({{ formatChips(amount) }} × {{ size }} jugadores).
            </span>
            <span v-else>Torneo gratis: el campeón suma la victoria en su perfil.</span>
          </div>

          <ChipsNotice compact />
          <div class="tr-create__hint">
            {{ kind === 'tournament'
              ? 'Cuando se completan los cupos se sortea el cuadro y empiezan las partidas. Sin flor.'
              : 'Por ahora todas las mesas se juegan sin flor.' }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            :label="kind === 'tournament' ? 'Crear torneo' : 'Crear mesa'"
            :loading="loading"
          />
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
import { createRoom, createTournament } from '../services/api.js';
import { useWalletStore } from '../stores/wallet.js';
import { formatChips } from '../utils/format.js';

const KINDS = [
  { value: 'room', label: 'Mesa', icon: 'style', hint: '1 contra 1' },
  { value: 'tournament', label: 'Torneo', icon: 'military_tech', hint: '4 u 8 jugadores' }
];

const props = defineProps({ modelValue: Boolean });
// created: { kind: 'room' | 'tournament', item }
const emit = defineEmits(['update:modelValue', 'created']);

const $q = useQuasar();
const wallet = useWalletStore();
const { config } = useGameConfig();

const formRef = ref(null);
const kind = ref('room');
const size = ref(4);
const targetPoints = ref(15);
const amount = ref(0); // 0 = gratis
const loading = ref(false);
let uuid = crypto.randomUUID();

const STEP = 500;

// Gratis y de 500 en 500 hasta el máximo; las que superan tu saldo aparecen deshabilitadas
const amountOptions = computed(() => {
  const list = [{ label: 'Gratis', value: 0 }];
  for (let value = STEP; value <= config.value.maxBet; value += STEP) {
    list.push({ label: `${formatChips(value)} fichas`, value, disable: value > (wallet.balance ?? 0) });
  }
  return list;
});

const pot = computed(() => amount.value * (kind.value === 'tournament' ? size.value : 2));
const prize = computed(() => pot.value - Math.floor(pot.value * (config.value.houseRate || 0)));

const amountHint = computed(() => {
  if (!amount.value) return kind.value === 'tournament' ? 'Torneo gratis: no se juegan fichas.' : 'Mesa gratis: no se juegan fichas.';
  return kind.value === 'tournament'
    ? `Tenés ${formatChips(wallet.balance ?? 0)} fichas. La inscripción se cobra al crear el torneo.`
    : `Tenés ${formatChips(wallet.balance ?? 0)} fichas. El ganador se lleva ${formatChips(prize.value)}.`;
});

// Un uuid por intento de creación: reintentar el mismo envío no crea una partida duplicada
watch(() => props.modelValue, (open) => {
  if (!open) return;
  uuid = crypto.randomUUID();
  // Si el saldo bajó, no se deja seleccionada una opción que ya no se puede pagar
  if (amount.value > (wallet.balance ?? 0)) amount.value = 0;
});
watch(kind, () => { uuid = crypto.randomUUID(); });

async function submit() {
  if (!(await formRef.value.validate())) return;
  const chips = amount.value;
  loading.value = true;
  try {
    const item = kind.value === 'tournament'
      ? await createTournament({ uuid, size: size.value, targetPoints: targetPoints.value, buyIn: chips })
      : await createRoom({ uuid, targetPoints: targetPoints.value, bet: chips });
    emit('update:modelValue', false);
    emit('created', { kind: kind.value, item });
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo crear la partida' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tr-create { width: min(92vw, 440px); }

.tr-create__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.3;
}

.tr-kind {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.tr-kind__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font: inherit;
  cursor: pointer;
}

.tr-kind__option strong { color: #0f172a; font-size: 1rem; }
.tr-kind__option span { font-size: 0.8rem; }

.tr-kind__option--active {
  border-color: #166534;
  background: #f0fdf4;
  color: #166534;
}

.tr-kind__option:focus-visible { outline: 3px solid #fde047; outline-offset: 2px; }

.tr-create__label {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.tr-create__prize {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #14532d;
  font-size: 0.9rem;
}

.tr-create__hint {
  color: #64748b;
  font-size: 0.8rem;
}
</style>
