<template>
  <div class="tr-page-shell">
    <EmailVerifyBanner />

    <header class="tr-lobby-header">
      <div class="tr-page-header">
        <h1>Partidas</h1>
        <p>Sumate a una mesa o a un torneo, o creá tu propia partida.</p>
      </div>
      <div class="tr-lobby-actions">
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Crear partida"
          :disable="busy"
          @click="showCreate = true"
        />
        <q-btn
          outline
          color="primary"
          no-caps
          icon="lock"
          label="Sala privada"
          :disable="busy"
          @click="showPrivate = true"
        />
      </div>
    </header>

    <q-banner v-if="myRoom" rounded class="tr-my-room">
      <template #avatar><q-icon name="style" color="primary" /></template>
      {{ myRoom.status === 'waiting' ? 'Tenés una mesa esperando rival.' : 'Tenés una partida en curso.' }}
      <template #action>
        <q-btn color="primary" unelevated no-caps label="Volver a la mesa" :to="`/mesa/${myRoom.id}`" />
      </template>
    </q-banner>

    <q-banner v-if="myTournament" rounded class="tr-my-room">
      <template #avatar><q-icon name="military_tech" color="accent" /></template>
      {{ myTournament.status === 'waiting'
        ? `Estás inscripto en el torneo ${myTournament.code} (${myTournament.entrants.length} de ${myTournament.config.size}).`
        : `Estás jugando el torneo ${myTournament.code}.` }}
      <template #action>
        <q-btn color="primary" unelevated no-caps label="Ver torneo" :to="`/torneos/${myTournament.id}`" />
      </template>
    </q-banner>

    <div class="tr-lobby-filters">
      <div class="tr-lobby-filters__group">
        <q-btn-toggle
          v-model="kindFilter"
          no-caps
          unelevated
          rounded
          toggle-color="primary"
          color="white"
          text-color="dark"
          :options="[{ label: 'Todas', value: 'all' }, { label: 'Mesas', value: 'room' }, { label: 'Torneos', value: 'tournament' }]"
        />
        <q-btn-toggle
          v-model="modeFilter"
          no-caps
          unelevated
          rounded
          toggle-color="primary"
          color="white"
          text-color="dark"
          aria-label="Modo"
          :options="[{ label: 'Todos', value: 'all' }, { label: '1 vs 1', value: '1v1' }, { label: '2 vs 2', value: '2v2' }]"
        />
      </div>
      <span class="tr-lobby-live" :class="{ 'tr-lobby-live--on': status === 'connected' }">
        <span class="tr-lobby-live__dot" />{{ status === 'connected' ? 'En vivo' : 'Conectando…' }}
      </span>
    </div>

    <LoadingState
      :loading="rooms === null || tournaments === null"
      :empty="rooms !== null && tournaments !== null && items.length === 0"
      label="Buscando partidas…"
      :empty-label="emptyLabel"
      empty-icon="style"
    >
      <ul class="tr-game-list">
        <li v-for="item in items" :key="`${item.kind}-${item.data.id}`">
          <!-- Mesa: 1 vs 1 o 2 vs 2 -->
          <div v-if="item.kind === 'room'" class="tr-game tr-game--room">
            <span class="tr-game__kind"><q-icon :name="is2v2(item.data) ? 'groups' : 'style'" size="16px" />{{ is2v2(item.data) ? 'Mesa 2 vs 2' : 'Mesa' }}</span>
            <div class="tr-game__main">
              <strong>{{ item.data.seats[0]?.username }} <span class="tr-game__code">{{ item.data.code }}</span></strong>
              <span class="tr-game__meta">
                <template v-if="is2v2(item.data)"><strong class="tr-num">{{ item.data.seats.length }} de 4</strong> · </template>
                A {{ item.data.config.targetPoints }} · sin flor
                <span v-if="item.data.config.bet" class="tr-game__chips">{{ formatChips(item.data.config.bet) }} fichas</span>
                <template v-else>· gratis</template>
              </span>
              <span v-if="is2v2(item.data)" class="tr-game__meta">{{ teamsLabel(item.data) }}</span>
            </div>
            <q-btn
              v-if="item.data.seats.some((x) => x.userId === auth.user?.id)"
              outline
              color="primary"
              no-caps
              label="Tu mesa"
              :to="`/mesa/${item.data.id}`"
            />
            <q-btn
              v-else-if="is2v2(item.data) && item.data.seats.length >= 4"
              outline
              color="grey-7"
              no-caps
              label="Completa"
              disable
            />
            <q-btn
              v-else
              color="primary"
              unelevated
              no-caps
              :label="canAfford(item.data.config.bet) ? 'Unirme' : 'Sin fichas'"
              :disable="busy || !canAfford(item.data.config.bet)"
              :loading="joiningId === item.data.id"
              @click="handleJoinRoom(item.data)"
            />
          </div>

          <!-- Torneo: 4 u 8 jugadores, eliminación directa -->
          <div v-else class="tr-game tr-game--tournament">
            <span class="tr-game__kind tr-game__kind--tournament"><q-icon name="military_tech" size="16px" />Torneo</span>
            <router-link :to="`/torneos/${item.data.id}`" class="tr-game__main">
              <strong>{{ hostName(item.data) }} <span class="tr-game__code">{{ item.data.code }}</span></strong>
              <span class="tr-game__meta">
                {{ item.data.config.size }} jugadores · A {{ item.data.config.targetPoints }} ·
                <template v-if="item.data.config.buyIn">inscripción {{ formatChips(item.data.config.buyIn) }}</template>
                <template v-else>gratis</template>
              </span>
              <span class="tr-game__seats">
                <q-linear-progress
                  :value="item.data.entrants.length / item.data.config.size"
                  color="accent"
                  track-color="grey-3"
                  rounded
                  size="6px"
                  class="tr-game__bar"
                />
                <span class="tr-num">{{ item.data.entrants.length }} de {{ item.data.config.size }}</span>
                <span v-if="item.data.config.buyIn" class="tr-game__chips tr-num">
                  <q-icon name="emoji_events" size="14px" /> {{ formatChips(item.data.prize) }}
                </span>
              </span>
            </router-link>
            <q-btn
              v-if="isEntrant(item.data)"
              outline
              color="primary"
              no-caps
              label="Ver"
              :to="`/torneos/${item.data.id}`"
            />
            <q-btn
              v-else
              color="primary"
              unelevated
              no-caps
              :label="canAfford(item.data.config.buyIn) ? 'Inscribirme' : 'Sin fichas'"
              :disable="busy || !canAfford(item.data.config.buyIn)"
              :loading="joiningId === item.data.id"
              @click="handleJoinTournament(item.data)"
            />
          </div>
        </li>
      </ul>
    </LoadingState>

    <CreateGameDialog v-model="showCreate" @created="onCreated" />
    <PrivateRoomDialog v-model="showPrivate" @done="(room) => router.push(`/mesa/${room.id}`)" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import CreateGameDialog from '../../components/CreateGameDialog.vue';
import EmailVerifyBanner from '../../components/EmailVerifyBanner.vue';
import LoadingState from '../../components/LoadingState.vue';
import PrivateRoomDialog from '../../components/PrivateRoomDialog.vue';
import { useSocket } from '../../composables/useSocket.js';
import { fetchMyRoom, fetchMyTournament, joinRoom, joinTournament } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { useWalletStore } from '../../stores/wallet.js';
import { formatChips } from '../../utils/format.js';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const wallet = useWalletStore();
const { socket, status, connect } = useSocket();

const rooms = ref(null);
const tournaments = ref(null);
const myRoom = ref(null);
const myTournament = ref(null);
const kindFilter = ref('all');
const modeFilter = ref('all'); // los torneos son 1 vs 1
const showCreate = ref(false);
const showPrivate = ref(false);
const joiningId = ref(null);

// Una sola cosa a la vez: con una mesa o un torneo activo no se puede crear ni sumarse a otra partida
const busy = computed(() => Boolean(myRoom.value || myTournament.value));

/** Mesas y torneos abiertos en una sola lista, la más nueva primero. */
const items = computed(() => [
  ...(rooms.value || []).map((data) => ({ kind: 'room', data })),
  ...(tournaments.value || []).map((data) => ({ kind: 'tournament', data }))
]
  .filter((i) => kindFilter.value === 'all' || i.kind === kindFilter.value)
  .filter((i) => modeFilter.value === 'all' || modeOf(i) === modeFilter.value)
  .sort((a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt)));

const emptyLabel = computed(() => {
  if (kindFilter.value === 'room') return 'No hay mesas abiertas. ¡Creá una y esperá rival!';
  if (kindFilter.value === 'tournament') return 'No hay torneos con inscripción abierta. ¡Creá uno!';
  return 'No hay partidas abiertas. ¡Creá una mesa o un torneo!';
});

function is2v2(room) {
  return room.config.mode === '2v2';
}

function modeOf(item) {
  return item.kind === 'room' && is2v2(item.data) ? '2v2' : '1v1';
}

/** "Pareja A: Juan, Ana · Pareja B: Leo" (asientos 0 y 2 contra 1 y 3) */
function teamsLabel(room) {
  return [0, 1].map((team) => {
    const names = room.seats.filter((x) => x.team === team).map((x) => x.username);
    return `Pareja ${team === 0 ? 'A' : 'B'}: ${names.length ? names.join(', ') : 'libre'}`;
  }).join(' · ');
}

function hostName(t) {
  return t.entrants.find((e) => e.userId === t.hostId)?.username || '';
}

function isEntrant(t) {
  return t.entrants.some((e) => e.userId === auth.user?.id);
}

function canAfford(chips) {
  return !chips || (wallet.balance ?? 0) >= chips;
}

function onRooms(list) {
  rooms.value = list;
}

function onTournaments(list) {
  tournaments.value = list;
}

function subscribe() {
  socket.emit('lobby:subscribe');
}

async function loadMine() {
  try {
    myRoom.value = await fetchMyRoom();
  } catch {
    myRoom.value = null;
  }
  try {
    myTournament.value = await fetchMyTournament();
  } catch {
    myTournament.value = null;
  }
}

function onCreated({ kind, item }) {
  router.push(kind === 'tournament' ? `/torneos/${item.id}` : `/mesa/${item.id}`);
}

async function join(id, action, path) {
  joiningId.value = id;
  try {
    const joined = await action(id);
    router.push(path(joined));
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo entrar a la partida' });
    loadMine();
  } finally {
    joiningId.value = null;
  }
}

function handleJoinRoom(room) {
  const go = () => join(room.id, joinRoom, (r) => `/mesa/${r.id}`);
  if (!room.config.bet) {
    go();
    return;
  }
  $q.dialog({
    title: `Mesa por ${formatChips(room.config.bet)} fichas`,
    message: `Al empezar se descuentan ${formatChips(room.config.bet)} fichas de tu saldo. `
      + (is2v2(room)
        ? 'Si gana tu pareja, cada uno se lleva el doble; si pierden o alguno abandona, las pierden los dos.'
        : 'Si ganás te llevás el pozo; si perdés o abandonás, las perdés.'),
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Jugar', color: 'primary', unelevated: true, noCaps: true }
  }).onOk(go);
}

function handleJoinTournament(t) {
  $q.dialog({
    title: `Inscribirte al torneo ${t.code}`,
    message: t.config.buyIn
      ? `Se descuentan ${formatChips(t.config.buyIn)} fichas de tu saldo ahora. Si salís antes de que se complete, te las devolvemos. `
        + `El campeón se lleva ${formatChips(t.prize)}.`
      : 'Es gratis. Cuando se completen los cupos se sortea el cuadro y empieza tu primera partida.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Inscribirme', color: 'primary', unelevated: true, noCaps: true }
  }).onOk(() => join(t.id, joinTournament, (joined) => `/torneos/${joined.id}`));
}

onMounted(() => {
  socket.on('lobby:rooms', onRooms);
  socket.on('lobby:tournaments', onTournaments);
  socket.on('connect', subscribe); // también al reconectar
  connect();
  if (socket.connected) subscribe();
  loadMine();
});

onBeforeUnmount(() => {
  socket.emit('lobby:unsubscribe');
  socket.off('lobby:rooms', onRooms);
  socket.off('lobby:tournaments', onTournaments);
  socket.off('connect', subscribe);
});
</script>

<style scoped>
.tr-lobby-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.tr-lobby-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tr-my-room {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
}

.tr-lobby-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.tr-lobby-filters__group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tr-lobby-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.tr-lobby-live__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
}

.tr-lobby-live--on .tr-lobby-live__dot { background: #16a34a; }

.tr-game-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.tr-game {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 14px 18px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* Franja de color a la izquierda: verde las mesas, dorada los torneos */
.tr-game::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: #16a34a;
}

.tr-game--tournament {
  background: #fffdf3;
  border-color: #fde68a;
}

.tr-game--tournament::before { background: #ca8a04; }

.tr-game__kind {
  position: absolute;
  top: 8px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #166534;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tr-game__kind--tournament { color: #a16207; }

.tr-game__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: inherit;
  text-decoration: none;
}

.tr-game__main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-game__code {
  margin-left: 6px;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.tr-game__meta {
  color: #64748b;
  font-size: 0.85rem;
}

.tr-game__chips {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fefce8;
  border: 1px solid #fde68a;
  color: #713f12;
  font-weight: 700;
  font-size: 0.8rem;
}

.tr-game__seats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  white-space: nowrap;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}

.tr-game__bar { flex: 0 1 110px; min-width: 50px; }

/* El botón no tapa la etiqueta de tipo */
.tr-game > .q-btn { margin-top: 14px; }
</style>
