<template>
  <div class="tr-page-shell">
    <EmailVerifyBanner />

    <header class="tr-lobby-header">
      <div class="tr-lobby-titulo">
        <div class="tr-page-header">
          <h1>Partidas</h1>
          <p>Sumate a una mesa o a un torneo, o creá tu propia partida.</p>
        </div>
        <span class="tr-lobby-live" :class="{ 'tr-lobby-live--on': status === 'connected' }">
          <span class="tr-lobby-live__dot" />{{ status === 'connected' ? 'En vivo' : 'Conectando…' }}
        </span>
      </div>
      <div class="tr-lobby-actions">
        <NzBoton variante="principal" icono="mas" label="Crear partida" :disable="busy" @click="showCreate = true" />
        <NzBoton variante="secundario" icono="candado" label="Sala privada" :disable="busy" @click="showPrivate = true" />
      </div>
    </header>

    <NzAviso v-if="myRoom" icono="naipe" class="tr-my-room">
      {{ myRoom.status === 'waiting' ? 'Tenés una mesa esperando rival.' : 'Tenés una partida en curso.' }}
      <template #accion>
        <NzBoton variante="luminoso" tamano="sm" label="Volver a la mesa" :to="`/mesa/${myRoom.id}`" />
      </template>
    </NzAviso>

    <NzAviso v-if="myTournament" icono="trofeo" class="tr-my-room">
      {{ myTournament.status === 'waiting'
        ? `Estás inscripto en el torneo ${myTournament.code} (${myTournament.entrants.length} de ${myTournament.config.size}).`
        : `Estás jugando el torneo ${myTournament.code}.` }}
      <template #accion>
        <NzBoton variante="luminoso" tamano="sm" label="Ver torneo" :to="`/torneos/${myTournament.id}`" />
      </template>
    </NzAviso>

    <!-- Filtros a todo el ancho: alineados con las tarjetas -->
    <div class="tr-lobby-filters">
      <NzSegmentado
        v-model="kindFilter"
        bloque
        aria-label="Tipo de partida"
        :opciones="[{ label: 'Todas', value: 'all' }, { label: 'Mesas', value: 'room' }, { label: 'Torneos', value: 'tournament' }]"
      />
      <NzSegmentado
        v-model="modeFilter"
        bloque
        aria-label="Modo"
        :opciones="[{ label: 'Todos', value: 'all' }, { label: '1 vs 1', value: '1v1' }, { label: '2 vs 2', value: '2v2' }]"
      />
    </div>

    <LoadingState
      :loading="rooms === null || tournaments === null"
      :empty="rooms !== null && tournaments !== null && items.length === 0"
      label="Buscando partidas…"
      :empty-label="emptyLabel"
      empty-icon="naipe"
    >
      <ul class="tr-game-list">
        <li v-for="item in items" :key="`${item.kind}-${item.data.id}`">
          <!-- Mesa: 1 vs 1 o 2 vs 2 -->
          <div
            v-if="item.kind === 'room'"
            class="tr-game"
            :class="{ 'tr-game--sin-fichas': !isMine(item.data) && !canAfford(item.data.config.bet) }"
          >
            <Avatar :nombre="item.data.seats[0]?.username || ''" :size="36" />
            <div class="tr-game__main">
              <div class="tr-game__titulo">
                <strong>{{ item.data.seats[0]?.username }}</strong>
              </div>
              <div class="tr-game__chips">
                <NzChip :label="`A ${item.data.config.targetPoints}`" />
                <template v-if="is2v2(item.data)">
                  <NzChip icono="pareja" label="2 vs 2" />
                  <NzChip class="tr-num" :label="`${item.data.seats.length} de 4`" />
                </template>
                <span v-if="item.data.config.bet" class="tr-game__monto tr-num">
                  <Ficha :size="16" /> {{ formatChips(item.data.config.bet) }}<span class="nz-sr"> fichas de apuesta</span>
                </span>
                <NzChip v-else label="Gratis" />
              </div>
            </div>
            <div class="tr-game__accion">
              <NzBoton v-if="isMine(item.data)" variante="secundario" tamano="sm" label="Tu mesa" :to="`/mesa/${item.data.id}`" />
              <NzBoton
                v-else-if="is2v2(item.data) && item.data.seats.length >= 4"
                variante="secundario"
                tamano="sm"
                label="Completa"
                disable
              />
              <span v-else-if="!canAfford(item.data.config.bet)" class="tr-game__motivo">
                Te faltan {{ formatChips(missing(item.data.config.bet)) }} fichas
              </span>
              <NzBoton
                v-else
                variante="luminoso"
                tamano="sm"
                label="Unirme"
                :disable="busy"
                :loading="joiningId === item.data.id"
                @click="handleJoinRoom(item.data)"
              />
            </div>
          </div>

          <!-- Torneo: 4 u 8 jugadores, eliminación directa -->
          <div
            v-else
            class="tr-game"
            :class="{ 'tr-game--sin-fichas': !isEntrant(item.data) && !canAfford(item.data.config.buyIn) }"
          >
            <span class="tr-game__trofeo" aria-hidden="true"><Icono nombre="trofeo" :size="18" /></span>
            <router-link :to="`/torneos/${item.data.id}`" class="tr-game__main">
              <div class="tr-game__titulo">
                <span class="tr-game__etiqueta">Torneo</span>
                <strong>{{ hostName(item.data) }}</strong>
              </div>
              <!-- Misma información que una mesa: puntos, cupos y el premio en dorado (la inscripción está en la confirmación) -->
              <div class="tr-game__chips">
                <NzChip :label="`A ${item.data.config.targetPoints}`" />
                <NzChip class="tr-num" :label="`${item.data.entrants.length} de ${item.data.config.size}`" />
                <span v-if="item.data.config.buyIn" class="tr-game__monto tr-num">
                  <Ficha :size="16" /> {{ formatChips(item.data.prize) }}<span class="nz-sr"> fichas de premio</span>
                </span>
                <NzChip v-else label="Gratis" />
              </div>
            </router-link>
            <div class="tr-game__accion">
              <NzBoton v-if="isEntrant(item.data)" variante="secundario" tamano="sm" label="Ver" :to="`/torneos/${item.data.id}`" />
              <span v-else-if="!canAfford(item.data.config.buyIn)" class="tr-game__motivo">
                Te faltan {{ formatChips(missing(item.data.config.buyIn)) }} fichas
              </span>
              <NzBoton
                v-else
                variante="luminoso"
                tamano="sm"
                label="Inscribirme"
                :disable="busy"
                :loading="joiningId === item.data.id"
                @click="handleJoinTournament(item.data)"
              />
            </div>
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
import { confirmar } from '../../composables/useConfirmar.js';
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
  if (kindFilter.value === 'room') return 'Todavía no hay mesas abiertas. Creá la primera.';
  if (kindFilter.value === 'tournament') return 'Todavía no hay torneos abiertos. Creá el primero.';
  return 'Todavía no hay partidas abiertas. Creá la primera.';
});

function is2v2(room) {
  return room.config.mode === '2v2';
}

function modeOf(item) {
  return item.kind === 'room' && is2v2(item.data) ? '2v2' : '1v1';
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

/** Cuántas fichas te faltan para poder entrar (para el motivo de una partida que no podés pagar). */
function missing(chips) {
  return Math.max(0, chips - (wallet.balance ?? 0));
}

function isMine(room) {
  return room.seats.some((x) => x.userId === auth.user?.id);
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
  confirmar({
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
  confirmar({
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
  flex-direction: column;
  gap: 12px;
}

.tr-lobby-titulo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tr-lobby-titulo .tr-lobby-live { flex-shrink: 0; margin-top: 8px; }

/* Los dos botones ocupan la fila completa, mitad y mitad: mismo ancho que las tarjetas */
.tr-lobby-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tr-lobby-actions > * { width: 100%; }

.tr-lobby-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tr-lobby-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--texto-suave);
  font-size: 13px;
  font-weight: 600;
}

.tr-lobby-live__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--linea);
}

/* "En vivo": punto celeste que late suave (10.2) */
.tr-lobby-live--on .tr-lobby-live__dot {
  background: var(--celeste-vivo);
  box-shadow: var(--glow-celeste-1);
  animation: tr-latido 2s ease-in-out infinite;
}

@keyframes tr-latido {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.tr-game-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  /* minmax(0, 1fr): sin esto una tarjeta con texto largo ensancha la grilla y la página se desborda */
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

/* Fila (10.2): panel noche-2 que no brilla; la luz está solo en "Unirme" */
.tr-game {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radio-panel);
  background: var(--noche-2);
  border: 1px solid var(--linea);
}

/* No te alcanzan las fichas: atenuada y con el motivo (el motivo conserva su contraste) */
.tr-game--sin-fichas > :not(.tr-game__accion) { opacity: 0.55; }

.tr-game__trofeo {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--noche-3);
  border: 1px solid var(--linea);
  color: var(--celeste);
}

.tr-game__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: inherit;
  text-decoration: none;
}

.tr-game__titulo {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.tr-game__titulo strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-game__etiqueta {
  flex-shrink: 0;
  color: var(--celeste);
  font-size: 12px;
  font-weight: 700;
}

.tr-game__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
}

/* Monto de la partida (apuesta de la mesa o premio del torneo): ficha y número en dorado, pedido del dueño */
.tr-game__monto {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--oro);
  font-family: var(--fuente-titulo);
  font-size: 14px;
  font-weight: 700;
}

.tr-game__accion {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.tr-game__motivo {
  max-width: 96px;
  color: var(--texto-suave);
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}
</style>
