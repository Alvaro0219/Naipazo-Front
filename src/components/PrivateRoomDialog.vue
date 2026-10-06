<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="tr-private">
      <q-card-section>
        <h2 class="tr-private__title">Sala privada</h2>
        <p class="tr-private__lead">No aparece en el lobby: solo entra quien tenga el código.</p>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn-toggle
          v-model="tab"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="dark"
          :options="[{ label: 'Crear', value: 'create' }, { label: 'Unirme', value: 'join' }]"
        />
      </q-card-section>

      <!-- Crear: puntos y monto escrito directamente -->
      <q-form v-if="tab === 'create'" ref="createForm" @submit.prevent="create">
        <q-card-section class="column q-gutter-y-md">
          <div>
            <div class="tr-private__label">Puntos</div>
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
            <div class="tr-private__label">Modo</div>
            <q-btn-toggle
              v-model="mode"
              spread
              no-caps
              unelevated
              toggle-color="primary"
              color="grey-2"
              text-color="dark"
              :options="[{ label: '1 vs 1', value: '1v1' }, { label: '2 vs 2 (parejas)', value: '2v2' }]"
            />
          </div>

          <q-input
            v-model.number="bet"
            type="number"
            inputmode="numeric"
            outlined
            label="Fichas por jugador"
            :min="0"
            :max="maxAllowed"
            :rules="betRules"
            :hint="betHint"
          />

          <ChipsNotice compact />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn type="submit" color="primary" unelevated no-caps label="Crear sala" :loading="loading" />
        </q-card-actions>
      </q-form>

      <!-- Unirme: se escribe el código y se confirma antes de bloquear fichas -->
      <q-form v-else @submit.prevent="lookup">
        <q-card-section class="column q-gutter-y-md">
          <q-input
            v-model="code"
            outlined
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
              {{ found.config.mode === '2v2' ? '2 vs 2' : '1 vs 1' }} · A {{ found.config.targetPoints }} · sin flor ·
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
              <q-btn
                v-for="seatNo in [team, team + 2]"
                :key="seatNo"
                no-caps
                unelevated
                size="sm"
                :disable="Boolean(occupant(seatNo))"
                :color="chosenSeat === seatNo ? 'primary' : 'grey-2'"
                :text-color="chosenSeat === seatNo ? 'white' : 'dark'"
                :label="occupant(seatNo) || 'Libre'"
                @click="chosenSeat = seatNo"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            v-if="!found"
            type="submit"
            color="primary"
            unelevated
            no-caps
            label="Buscar sala"
            :loading="loading"
          />
          <q-btn
            v-else
            color="primary"
            unelevated
            no-caps
            label="Unirme"
            :disable="!canAffordFound"
            :loading="loading"
            @click="join"
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
.tr-private { width: min(92vw, 420px); }

.tr-private__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.3;
}

.tr-private__lead {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.tr-private__label {
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.tr-private :deep(.tr-private__code-input) {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.tr-private__found {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #14532d;
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
  font-size: 0.85rem;
  font-weight: 600;
}

.tr-private__found-note {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #166534;
}
</style>
