<template>
  <NzHoja :model-value="modelValue" titulo="Sala privada" @update:model-value="$emit('update:modelValue', $event)">
    <div class="tr-private">
      <p class="tr-private__lead">No aparece en el lobby: solo entra quien tenga el código.</p>

      <NzSegmentado
        v-model="tab"
        bloque
        aria-label="Crear o unirme"
        class="q-mb-md"
        :opciones="[{ label: 'Crear', value: 'create' }, { label: 'Unirme', value: 'join' }]"
      />

      <!-- Crear: puntos y monto escrito directamente -->
      <q-form v-if="tab === 'create'" ref="createForm" @submit.prevent="create">
        <div class="column q-gutter-y-md">
          <div>
            <div class="tr-private__label">Puntos</div>
            <NzSegmentado v-model="targetPoints" bloque aria-label="Puntos" :opciones="[{ label: 'A 15', value: 15 }, { label: 'A 30', value: 30 }]" />
          </div>

          <div>
            <div class="tr-private__label">Modo</div>
            <NzSegmentado v-model="mode" bloque aria-label="Modo" :opciones="[{ label: '1 vs 1', value: '1v1' }, { label: '2 vs 2 (parejas)', value: '2v2' }]" />
          </div>

          <NzCampo
            v-model.number="bet"
            type="number"
            inputmode="numeric"
            label="Fichas por jugador"
            :min="0"
            :max="maxAllowed"
            :rules="betRules"
            :hint="betHint"
          />

          <ChipsNotice compact />
        </div>

        <div class="tr-private__acciones">
          <NzBoton variante="texto" label="Cancelar" @click="$emit('update:modelValue', false)" />
          <NzBoton type="submit" variante="principal" label="Crear sala" :loading="loading" />
        </div>
      </q-form>

      <!-- Unirme: se escribe el código y se confirma antes de bloquear fichas -->
      <q-form v-else @submit.prevent="lookup">
        <div class="column q-gutter-y-md">
          <NzCampo
            v-model="code"
            label="Código de la sala"
            maxlength="6"
            autocomplete="off"
            autocapitalize="characters"
            input-class="tr-private__code-input"
            :rules="[(v) => /^[A-HJ-NP-Z2-9]{6}$/.test(normalized) || 'Son 6 letras o números']"
            hint="Te lo pasa quien creó la sala"
            lazy-rules
            @update:model-value="code = String($event || '').toUpperCase().replace(/[^A-Z0-9]/g, '')"
          />

          <div v-if="found" class="tr-private__found" role="status">
            <strong>Sala de {{ found.seats[0]?.username }}</strong>
            <span>
              {{ found.config.mode === '2v2' ? '2 vs 2' : '1 vs 1' }} · A {{ found.config.targetPoints }} ·
              <template v-if="found.config.bet">{{ formatChips(found.config.bet) }} fichas por jugador</template>
              <template v-else>gratis</template>
            </span>
            <span v-if="found.config.bet" class="tr-private__found-note">
              Al entrar se descuentan {{ formatChips(found.config.bet) }} fichas de tu saldo.
              Si ganás te llevás {{ formatChips(found.config.bet * 2) }}.
            </span>
          </div>

          <!-- 2 vs 2: elegir asiento (compañeros enfrentados: 0 y 2 contra 1 y 3) -->
          <div v-if="found && found.config.mode === '2v2'" class="tr-private__seats">
            <div class="tr-private__label">Elegí tu lugar</div>
            <div v-for="team in [0, 1]" :key="team" class="tr-private__team">
              <span class="tr-private__team-name">Pareja {{ team === 0 ? 'A' : 'B' }}</span>
              <NzBoton
                v-for="seatNo in [team, team + 2]"
                :key="seatNo"
                tamano="sm"
                :variante="chosenSeat === seatNo ? 'luminoso' : 'secundario'"
                :disable="Boolean(occupant(seatNo))"
                :label="occupant(seatNo) || 'Libre'"
                :aria-pressed="chosenSeat === seatNo"
                @click="chosenSeat = seatNo"
              />
            </div>
          </div>
        </div>

        <div class="tr-private__acciones">
          <NzBoton variante="texto" label="Cancelar" @click="$emit('update:modelValue', false)" />
          <NzBoton
            v-if="!found"
            type="submit"
            variante="principal"
            label="Buscar sala"
            :loading="loading"
          />
          <NzBoton
            v-else
            variante="principal"
            label="Unirme"
            :disable="!canAffordFound"
            :loading="loading"
            @click="join"
          />
        </div>
      </q-form>
    </div>
  </NzHoja>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import ChipsNotice from './ChipsNotice.vue';
import { useGameConfig } from '../composables/useGameConfig.js';
import { createRoom, fetchRoomByCode, joinRoomByCode } from '../services/api.js';
import { useWalletStore } from '../stores/wallet.js';
import { formatChips } from '../utils/format.js';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'done']); // done: sala (creada o unida) a la que ir

const $q = useQuasar();
const wallet = useWalletStore();
const { config } = useGameConfig();

const tab = ref('create');
const loading = ref(false);
const createForm = ref(null);

// Crear
const targetPoints = ref(15);
const mode = ref('1v1');
const bet = ref(0);
let uuid = crypto.randomUUID();

// Las salas privadas tienen un tope propio (evita traspasar fichas entre cuentas)
const privateMax = computed(() => Math.min(config.value.maxBet, config.value.privateMaxBet ?? config.value.maxBet));
const maxAllowed = computed(() => Math.min(privateMax.value, wallet.balance ?? 0));
const betHint = computed(() => (bet.value > 0
  ? `Tenés ${formatChips(wallet.balance ?? 0)} fichas. El ganador se lleva ${formatChips((Number(bet.value) || 0) * 2)}.`
  : `Escribí 0 para jugar gratis. Máximo ${formatChips(privateMax.value)} fichas.`));
const betRules = [
  (v) => (v !== null && v !== '' && Number.isInteger(v)) || 'Escribí un número entero de fichas (0 para jugar gratis)',
  (v) => v === 0 || v >= config.value.minBet || `La apuesta mínima es de ${formatChips(config.value.minBet)} fichas`,
  (v) => v <= privateMax.value || `En salas privadas la apuesta máxima es de ${formatChips(privateMax.value)} fichas`,
  (v) => v <= (wallet.balance ?? 0) || 'No tenés fichas suficientes',
  (v) => mode.value !== '2v2' || v % 10 === 0 || 'En 2 vs 2 la apuesta tiene que ser múltiplo de 10'
];

// Unirme
const code = ref('');
const found = ref(null);
const chosenSeat = ref(null);
const occupant = (seatNo) => found.value?.seats.find((x) => x.seat === seatNo)?.username || null;
const normalized = computed(() => code.value.trim().toUpperCase());
const canAffordFound = computed(() => !found.value?.config.bet || (wallet.balance ?? 0) >= found.value.config.bet);

// Si cambia el código, la sala encontrada ya no corresponde
watch(code, () => { found.value = null; });
watch(found, (room) => {
  // Por defecto, el primer asiento libre
  chosenSeat.value = room?.config.mode === '2v2' ? [0, 1, 2, 3].find((n) => !occupant(n)) ?? null : null;
});
watch(tab, () => { found.value = null; });
watch(() => props.modelValue, (open) => {
  if (!open) return;
  uuid = crypto.randomUUID();
  found.value = null;
  code.value = '';
});

async function create() {
  if (!(await createForm.value.validate())) return;
  loading.value = true;
  try {
    const room = await createRoom({ uuid, targetPoints: targetPoints.value, bet: bet.value, isPrivate: true, mode: mode.value });
    emit('update:modelValue', false);
    emit('done', room);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo crear la sala' });
  } finally {
    loading.value = false;
  }
}

async function lookup() {
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalized.value)) return;
  loading.value = true;
  try {
    found.value = await fetchRoomByCode(normalized.value);
  } catch (e) {
    found.value = null;
    $q.notify({ type: 'negative', message: e.message || 'No encontramos esa sala' });
  } finally {
    loading.value = false;
  }
}

async function join() {
  loading.value = true;
  try {
    const room = await joinRoomByCode(normalized.value, chosenSeat.value);
    emit('update:modelValue', false);
    emit('done', room);
  } catch (e) {
    found.value = null;
    $q.notify({ type: 'negative', message: e.message || 'No se pudo entrar a la sala' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tr-private__lead {
  margin: 0 0 12px;
  color: var(--texto-suave);
  font-size: 14px;
}

.tr-private__label {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--texto-suave);
}

.tr-private :deep(.tr-private__code-input) {
  font-family: var(--fuente-titulo);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.tr-private__found {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--radio-boton);
  background: var(--noche-3);
  border: 1px solid var(--celeste);
  color: var(--texto);
}

.tr-private__seats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tr-private__team {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tr-private__team-name {
  min-width: 64px;
  font-size: 14px;
  font-weight: 600;
}

.tr-private__found-note {
  margin-top: 4px;
  font-size: 14px;
  color: var(--texto-suave);
}

.tr-private__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>
