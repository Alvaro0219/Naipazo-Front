<template>
  <div class="tr-page-shell tr-page-shell--wide">
    <q-btn flat no-caps color="primary" icon="arrow_back" label="Partidas" class="self-start" to="/" />

    <LoadingState :loading="loading" :empty="!loading && !tournament" empty-label="No encontramos ese torneo." empty-icon="search_off">
      <template v-if="tournament">
        <section class="tr-section-card tr-t-head">
          <div class="tr-t-head__title">
            <h1>Torneo {{ tournament.code }}</h1>
            <q-badge :color="STATUS[tournament.status].color" :label="STATUS[tournament.status].label" />
          </div>
          <p class="tr-t-head__meta">
            {{ tournament.config.size }} jugadores · partidas a {{ tournament.config.targetPoints }} · sin flor ·
            <template v-if="tournament.config.buyIn">inscripción {{ formatChips(tournament.config.buyIn) }} fichas</template>
            <template v-else>gratis</template>
          </p>
          <div v-if="tournament.config.buyIn" class="tr-t-head__prize">
            <q-icon name="emoji_events" size="22px" />
            <span>
              {{ tournament.status === 'finished' ? 'Premio' : 'El campeón se lleva' }}
              <strong class="tr-num">{{ formatChips(tournament.prize) }}</strong> fichas
            </span>
          </div>
        </section>

        <!-- Campeón -->
        <section v-if="tournament.status === 'finished'" class="tr-champion" role="status">
          <q-icon name="emoji_events" size="44px" />
          <div>
            <strong>{{ tournament.winnerId === auth.user?.id ? '¡Ganaste el torneo!' : `Campeón: ${tournament.winnerUsername}` }}</strong>
            <span v-if="tournament.prize">
              {{ tournament.winnerId === auth.user?.id ? 'Cobraste' : 'Cobró' }}
              <span class="tr-num">{{ formatChips(tournament.prize) }}</span> fichas.
            </span>
          </div>
        </section>

        <q-banner v-else-if="tournament.status === 'cancelled'" rounded class="tr-t-cancelled">
          <template #avatar><q-icon name="block" /></template>
          El torneo se canceló. Si pagaste la inscripción, ya volvió a tu saldo.
        </q-banner>

        <!-- Mi situación en un torneo en juego -->
        <q-banner v-if="myMatch" rounded class="tr-t-mine">
          <template #avatar><q-icon name="style" color="primary" /></template>
          {{ myMatch.status === 'playing'
            ? `Estás jugando la ${myMatch.roundName.toLowerCase()}.`
            : `Pasaste a la ${myMatch.roundName.toLowerCase()}. Esperá a que se defina tu rival.` }}
          <template v-if="myMatch.status === 'playing'" #action>
            <q-btn color="primary" unelevated no-caps label="Ir a la mesa" :to="`/mesa/${myMatch.roomId}`" />
          </template>
        </q-banner>
        <q-banner v-else-if="eliminated && tournament.status === 'playing'" rounded class="tr-t-cancelled">
          <template #avatar><q-icon name="sentiment_dissatisfied" /></template>
          Quedaste afuera de este torneo. Podés seguir el cuadro desde acá.
        </q-banner>

        <!-- Inscripción -->
        <section v-if="tournament.status === 'waiting'" class="tr-section-card">
          <h2>Inscriptos <span class="tr-num">{{ tournament.entrants.length }} de {{ tournament.config.size }}</span></h2>
          <ul class="tr-seats">
            <li v-for="n in tournament.config.size" :key="n" class="tr-seat" :class="{ 'tr-seat--empty': !tournament.entrants[n - 1] }">
              <q-icon :name="tournament.entrants[n - 1] ? 'person' : 'person_outline'" size="18px" />
              <span v-if="tournament.entrants[n - 1]">
                {{ tournament.entrants[n - 1].username }}
                <small v-if="tournament.entrants[n - 1].userId === tournament.hostId">(creó el torneo)</small>
                <small v-if="tournament.entrants[n - 1].userId === auth.user?.id">(vos)</small>
              </span>
              <span v-else>Lugar libre</span>
            </li>
          </ul>
          <p class="tr-t-note">
            Cuando se completen los cupos se sortea quién juega contra quién y empiezan las partidas solas.
          </p>
          <div class="tr-t-actions">
            <q-btn
              v-if="!isEntrant"
              color="primary"
              unelevated
              no-caps
              :label="canAfford ? 'Inscribirme' : 'No te alcanzan las fichas'"
              :disable="!canAfford"
              :loading="busy"
              @click="handleJoin"
            />
            <q-btn
              v-else-if="isHost"
              outline
              color="negative"
              no-caps
              label="Cancelar torneo"
              :loading="busy"
              @click="handleCancel"
            />
            <q-btn
              v-else
              outline
              color="primary"
              no-caps
              label="Salir del torneo"
              :loading="busy"
              @click="handleLeave"
            />
          </div>
          <ChipsNotice compact />
        </section>

        <!-- Cuadro -->
        <section v-if="rounds.length" class="tr-section-card">
          <h2>Cuadro</h2>
          <div class="tr-bracket">
            <div v-for="round in rounds" :key="round.round" class="tr-bracket__round">
              <h3>{{ round.name }}</h3>
              <div
                v-for="m in round.matches"
                :key="m.slot"
                class="tr-bracket__match"
                :class="{ 'tr-bracket__match--mine': isMine(m), 'tr-bracket__match--live': m.status === 'playing' }"
              >
                <div
                  v-for="(p, i) in m.players"
                  :key="i"
                  class="tr-bracket__player"
                  :class="{
                    'tr-bracket__player--winner': p && m.winnerId === p.userId,
                    'tr-bracket__player--loser': p && m.winnerId && m.winnerId !== p.userId
                  }"
                >
                  <q-icon v-if="p && m.winnerId === p.userId" name="emoji_events" size="16px" />
                  <span>{{ p ? p.username : 'A definir' }}</span>
                  <small v-if="p && p.userId === auth.user?.id">(vos)</small>
                </div>
                <div class="tr-bracket__status">
                  <span v-if="m.status === 'playing'" class="tr-bracket__live">En juego</span>
                  <span v-else-if="m.status === 'finished'">Terminada</span>
                  <span v-else-if="m.status === 'ready'">Por empezar</span>
                  <span v-else>Esperando rivales</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </LoadingState>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import ChipsNotice from '../../components/ChipsNotice.vue';
import LoadingState from '../../components/LoadingState.vue';
import { useSocket } from '../../composables/useSocket.js';
import { cancelTournament, fetchTournament, joinTournament, leaveTournament } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { useWalletStore } from '../../stores/wallet.js';
import { formatChips } from '../../utils/format.js';

const STATUS = {
  waiting: { label: 'Inscripción abierta', color: 'primary' },
  playing: { label: 'En juego', color: 'accent' },
  finished: { label: 'Terminado', color: 'grey-7' },
  cancelled: { label: 'Cancelado', color: 'negative' }
};

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const wallet = useWalletStore();
const { socket, connect } = useSocket();

const tournament = ref(null);
// El id al que estoy suscripto: al salir hacia otra ruta, route.params ya cambió
let subscribedId = null;
const loading = ref(true);
const busy = ref(false);

const myId = computed(() => auth.user?.id);
const isEntrant = computed(() => Boolean(tournament.value?.entrants.some((e) => e.userId === myId.value)));
const isHost = computed(() => tournament.value?.hostId === myId.value);
const eliminated = computed(() => Boolean(tournament.value?.entrants.find((e) => e.userId === myId.value)?.eliminated));
const canAfford = computed(() => !tournament.value?.config.buyIn || (wallet.balance ?? 0) >= tournament.value.config.buyIn);

const rounds = computed(() => {
  const byRound = new Map();
  for (const m of tournament.value?.bracket || []) {
    if (!byRound.has(m.round)) byRound.set(m.round, { round: m.round, name: m.roundName, matches: [] });
    byRound.get(m.round).matches.push(m);
  }
  return [...byRound.values()];
});

function isMine(m) {
  return m.players.some((p) => p?.userId === myId.value);
}

/** Mi llave actual en un torneo en juego (la que no terminó), si sigo adentro. */
const myMatch = computed(() => {
  if (tournament.value?.status !== 'playing' || eliminated.value) return null;
  return (tournament.value.bracket || []).find((m) => isMine(m) && m.status !== 'finished') || null;
});

function onUpdate(data) {
  if (data.id === subscribedId) tournament.value = data;
}

function subscribe() {
  if (!subscribedId) return;
  socket.emit('tournament:subscribe', { tournamentId: subscribedId });
}

function unsubscribe() {
  if (subscribedId) socket.emit('tournament:unsubscribe', { tournamentId: subscribedId });
}

async function load() {
  loading.value = true;
  try {
    tournament.value = await fetchTournament(route.params.id);
  } catch {
    tournament.value = null;
  } finally {
    loading.value = false;
  }
}

async function run(action, successMessage) {
  busy.value = true;
  try {
    tournament.value = await action(route.params.id);
    if (successMessage) $q.notify({ type: 'positive', message: successMessage });
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message });
  } finally {
    busy.value = false;
  }
}

function handleJoin() {
  const t = tournament.value;
  $q.dialog({
    title: `Inscribirte al torneo ${t.code}`,
    message: t.config.buyIn
      ? `Se descuentan ${formatChips(t.config.buyIn)} fichas de tu saldo ahora. Si salís antes de que se complete, te las devolvemos.`
      : 'Es gratis. Cuando se completen los cupos empieza tu primera partida.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Inscribirme', color: 'primary', unelevated: true, noCaps: true }
  }).onOk(() => run(joinTournament));
}

function handleLeave() {
  $q.dialog({
    title: '¿Salir del torneo?',
    message: tournament.value.config.buyIn ? 'Te devolvemos la inscripción.' : 'Liberás tu lugar para otro jugador.',
    cancel: { label: 'Seguir inscripto', flat: true, noCaps: true },
    ok: { label: 'Salir', color: 'primary', unelevated: true, noCaps: true }
  }).onOk(() => run(leaveTournament, 'Saliste del torneo.'));
}

function handleCancel() {
  $q.dialog({
    title: '¿Cancelar el torneo?',
    message: 'Se les devuelve la inscripción a todos los inscriptos.',
    cancel: { label: 'No, seguir', flat: true, noCaps: true },
    ok: { label: 'Cancelar torneo', color: 'negative', unelevated: true, noCaps: true }
  }).onOk(async () => {
    await run(cancelTournament, 'Cancelaste el torneo.');
    router.push('/');
  });
}

onMounted(() => {
  subscribedId = route.params.id;
  socket.on('tournament:update', onUpdate);
  socket.on('connect', subscribe); // también al reconectar
  connect();
  if (socket.connected) subscribe();
  load();
});

onBeforeUnmount(() => {
  unsubscribe();
  socket.off('tournament:update', onUpdate);
  socket.off('connect', subscribe);
});

// Otro torneo sin desmontar la página (por ejemplo, desde un enlace)
watch(() => route.params.id, (id) => {
  if (!id || id === subscribedId || route.name !== 'tournament-detail') return;
  unsubscribe();
  subscribedId = id;
  subscribe();
  load();
});
</script>

<style scoped>
.tr-page-shell--wide { max-width: 1080px; }

.tr-t-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tr-t-head__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.tr-t-head__title h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.2;
}

.tr-t-head__meta { margin: 0; color: #64748b; }

.tr-t-head__prize {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fefce8;
  border: 1px solid #fde68a;
  color: #713f12;
  font-weight: 600;
}

.tr-champion {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background:
    radial-gradient(circle at 15% 50%, rgba(253, 224, 71, 0.3), transparent 55%),
    #14532d;
  color: #fff;
}

.tr-champion .q-icon { color: #fde047; }

.tr-champion > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tr-champion strong { font-size: 1.15rem; }

.tr-t-cancelled { background: #f1f5f9; border: 1px solid #e2e8f0; }
.tr-t-mine { background: #ecfdf5; border: 1px solid #bbf7d0; }

.tr-seats {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.tr-seat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-weight: 600;
}

.tr-seat small { color: #64748b; font-weight: 500; }

.tr-seat--empty {
  border-style: dashed;
  color: #94a3b8;
  font-weight: 500;
}

.tr-t-note {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 0.85rem;
}

.tr-t-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

/* Cuadro: una columna por ronda; en el celular, una ronda debajo de la otra */
.tr-bracket {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(200px, 1fr);
  gap: 16px;
  overflow-x: auto;
}

.tr-bracket__round {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 12px;
}

.tr-bracket__round h3 {
  margin: 0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tr-bracket__match {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  overflow: hidden;
}

.tr-bracket__match--mine { border-color: #16a34a; }
.tr-bracket__match--live { box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15); }

.tr-bracket__player {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 600;
}

.tr-bracket__player + .tr-bracket__player { border-top: 1px solid #f1f5f9; }
.tr-bracket__player small { color: #64748b; font-weight: 500; }

.tr-bracket__player--winner {
  background: #fefce8;
  color: #713f12;
}

.tr-bracket__player--winner .q-icon { color: #ca8a04; }
.tr-bracket__player--loser { color: #94a3b8; text-decoration: line-through; }

.tr-bracket__status {
  padding: 4px 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
}

.tr-bracket__live { color: #16a34a; font-weight: 700; }

@media (max-width: 700px) {
  .tr-bracket { grid-auto-flow: row; grid-auto-columns: auto; overflow: visible; }
}
</style>
