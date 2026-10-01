<template>
  <div class="tr-page-shell">
    <header class="tr-lobby-header">
      <div class="tr-page-header">
        <h1>Mesas</h1>
        <p>Sumate a una mesa abierta o armá la tuya.</p>
      </div>
      <q-btn color="primary" unelevated no-caps icon="add" label="Crear sala" :disable="Boolean(myRoom)" @click="showCreate = true" />
    </header>

    <q-banner v-if="myRoom" rounded class="tr-my-room">
      <template #avatar><q-icon name="style" color="primary" /></template>
      {{ myRoom.status === 'waiting' ? 'Tenés una mesa esperando rival.' : 'Tenés una partida en curso.' }}
      <template #action>
        <q-btn color="primary" unelevated no-caps label="Volver a la mesa" :to="`/mesa/${myRoom.id}`" />
      </template>
    </q-banner>

    <div class="tr-lobby-filters">
      <q-btn-toggle
        v-model="pointsFilter"
        no-caps
        unelevated
        rounded
        toggle-color="primary"
        color="white"
        text-color="dark"
        :options="[{ label: 'Todas', value: 0 }, { label: 'A 15', value: 15 }, { label: 'A 30', value: 30 }]"
      />
      <span class="tr-lobby-live" :class="{ 'tr-lobby-live--on': status === 'connected' }">
        <span class="tr-lobby-live__dot" />{{ status === 'connected' ? 'En vivo' : 'Conectando…' }}
      </span>
    </div>

    <LoadingState
      :loading="rooms === null"
      :empty="rooms !== null && filtered.length === 0"
      label="Buscando mesas…"
      empty-label="No hay mesas abiertas. ¡Creá una y esperá rival!"
      empty-icon="style"
    >
      <ul class="tr-room-list">
        <li v-for="room in filtered" :key="room.id" class="tr-room">
          <div class="tr-room__main">
            <strong>{{ room.seats[0]?.username }} <span class="tr-room__code">{{ room.code }}</span></strong>
            <span class="tr-room__meta">
              A {{ room.config.targetPoints }} · sin flor · {{ room.config.bet ? `${formatChips(room.config.bet)} fichas` : 'gratis' }}
            </span>
          </div>
          <q-btn
            v-if="room.hostId === auth.user?.id"
            outline
            color="primary"
            no-caps
            label="Tu sala"
            :to="`/mesa/${room.id}`"
          />
          <q-btn
            v-else
            color="primary"
            unelevated
            no-caps
            label="Unirme"
            :disable="Boolean(myRoom)"
            :loading="joiningId === room.id"
            @click="handleJoin(room)"
          />
        </li>
      </ul>
    </LoadingState>

    <CreateRoomDialog v-model="showCreate" @created="(room) => router.push(`/mesa/${room.id}`)" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import CreateRoomDialog from '../../components/CreateRoomDialog.vue';
import LoadingState from '../../components/LoadingState.vue';
import { useSocket } from '../../composables/useSocket.js';
import { fetchMyRoom, joinRoom } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { formatChips } from '../../utils/format.js';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const { socket, status, connect } = useSocket();

const rooms = ref(null);
const myRoom = ref(null);
const pointsFilter = ref(0);
const showCreate = ref(false);
const joiningId = ref(null);

const filtered = computed(() => (rooms.value || [])
  .filter((r) => !pointsFilter.value || r.config.targetPoints === pointsFilter.value));

function onRooms(list) {
  rooms.value = list;
}

function subscribe() {
  socket.emit('lobby:subscribe');
}

async function loadMyRoom() {
  try {
    myRoom.value = await fetchMyRoom();
  } catch {
    myRoom.value = null;
  }
}

async function handleJoin(room) {
  joiningId.value = room.id;
  try {
    const joined = await joinRoom(room.id);
    router.push(`/mesa/${joined.id}`);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo entrar a la mesa' });
    loadMyRoom();
  } finally {
    joiningId.value = null;
  }
}

onMounted(() => {
  socket.on('lobby:rooms', onRooms);
  socket.on('connect', subscribe); // también al reconectar
  connect();
  if (socket.connected) subscribe();
  loadMyRoom();
});

onBeforeUnmount(() => {
  socket.emit('lobby:unsubscribe');
  socket.off('lobby:rooms', onRooms);
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

.tr-room-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.tr-room {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.tr-room__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tr-room__main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-room__code {
  margin-left: 6px;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.tr-room__meta {
  color: #64748b;
  font-size: 0.85rem;
}
</style>
