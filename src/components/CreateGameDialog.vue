<template>
  <NzHoja :model-value="modelValue" titulo="Crear partida" @update:model-value="$emit('update:modelValue', $event)">
      <q-form ref="formRef" @submit.prevent="submit">
        <div class="column q-gutter-y-md">
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
              <Icono :nombre="option.icon" :size="26" />
              <strong>{{ option.label }}</strong>
              <span>{{ option.hint }}</span>
            </button>
          </div>

          <div v-if="kind === 'room'">
            <div class="tr-create__label">Modo</div>
            <NzSegmentado v-model="mode" bloque aria-label="Modo" :opciones="[{ label: '1 vs 1', value: '1v1' }, { label: '2 vs 2 (parejas)', value: '2v2' }]" />
          </div>

          <div v-if="kind === 'tournament'">
            <div class="tr-create__label">Jugadores</div>
            <NzSegmentado v-model="size" bloque aria-label="Jugadores" :opciones="[{ label: '4 jugadores', value: 4 }, { label: '8 jugadores', value: 8 }]" />
          </div>

          <div>
            <div class="tr-create__label">{{ kind === 'tournament' ? 'Puntos de cada partida' : 'Puntos' }}</div>
            <NzSegmentado v-model="targetPoints" bloque aria-label="Puntos" :opciones="[{ label: 'A 15', value: 15 }, { label: 'A 30', value: 30 }]" />
          </div>

          <div>
            <q-select
              v-model="amount"
              :options="amountOptions"
              :label="kind === 'tournament' ? 'Inscripción' : 'Apuesta'"
              outlined
              stack-label
              emit-value
              map-options
              options-dense
              :hint="amountHint"
              :rules="[(v) => v <= (wallet.balance ?? 0) || 'No tenés fichas suficientes']"
            />
          </div>

          <div v-if="kind === 'tournament'" class="tr-create__prize">
            <Icono nombre="trofeo" :size="22" class="tr-create__trofeo" />
            <span v-if="amount > 0">
              El campeón se lleva <strong class="tr-num">{{ formatChips(prize) }}</strong> fichas
              ({{ formatChips(amount) }} × {{ size }} jugadores).
            </span>
            <span v-else>Torneo gratis: el campeón suma la victoria en su perfil.</span>
          </div>

          <ChipsNotice compact />
          <div v-if="kind === 'tournament'" class="tr-create__hint">
            Cuando se completan los cupos se sortea el cuadro y empiezan las partidas.
          </div>
        </div>

        <div class="tr-create__acciones">
          <NzBoton variante="texto" label="Cancelar" @click="$emit('update:modelValue', false)" />
          <NzBoton
            type="submit"
            variante="principal"
            :label="kind === 'tournament' ? 'Crear torneo' : 'Crear mesa'"
            :loading="loading"
          />
        </div>
      </q-form>
  </NzHoja>
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
  { value: 'room', label: 'Mesa', icon: 'naipe', hint: '1 vs 1 o 2 vs 2' },
  { value: 'tournament', label: 'Torneo', icon: 'trofeo', hint: '4 u 8 jugadores' }
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
const mode = ref('1v1'); // solo mesas: los torneos son 1 vs 1
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
    : mode.value === '2v2'
      ? `Tenés ${formatChips(wallet.balance ?? 0)} fichas. Cada uno de la pareja ganadora se lleva ${formatChips(prize.value)}.`
      : `Tenés ${formatChips(wallet.balance ?? 0)} fichas. El ganador se lleva ${formatChips(prize.value)}.`;
});

// Un uuid por intento de creación: reintentar el mismo envío no crea una partida duplicada
watch(() => props.modelValue, (open) => {
  if (!open) return;
  uuid = crypto.randomUUID();
  // Si el saldo bajó, no se deja seleccionada una opción que ya no se puede pagar
  if (amount.value > (wallet.balance ?? 0)) amount.value = 0;
});
watch([kind, mode], () => { uuid = crypto.randomUUID(); });

async function submit() {
  if (!(await formRef.value.validate())) return;
  const chips = amount.value;
  loading.value = true;
  try {
    const item = kind.value === 'tournament'
      ? await createTournament({ uuid, size: size.value, targetPoints: targetPoints.value, buyIn: chips })
      : await createRoom({ uuid, targetPoints: targetPoints.value, bet: chips, mode: mode.value });
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
  border-radius: var(--radio-boton);
  border: 1.5px solid var(--linea-control);
  background: var(--noche-0);
  color: var(--texto-suave);
  font: inherit;
  cursor: pointer;
}

.tr-kind__option strong { color: var(--texto); font-family: var(--fuente-titulo); font-size: 16px; }
.tr-kind__option span { font-size: 13px; }

/* Tarjeta elegida: borde celeste y resplandor (10.3) */
.tr-kind__option--active {
  border-color: var(--celeste);
  background: var(--noche-3);
  color: var(--celeste);
  box-shadow: var(--glow-celeste-2);
}

.tr-create__label {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--texto-suave);
}

.tr-create__prize {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radio-boton);
  background: var(--noche-0);
  border: 1px solid var(--linea);
  color: var(--texto);
  font-size: 14px;
}

/* Premio del campeón en oro (10.3) */
.tr-create__prize strong,
.tr-create__trofeo { color: var(--oro); }

.tr-create__hint {
  color: var(--texto-suave);
  font-size: 13px;
}

.tr-create__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
