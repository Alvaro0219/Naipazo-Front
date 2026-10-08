<template>
  <div class="tr-page-shell tr-page-shell--wide">
    <NzBoton variante="texto" icono="volver" label="Partidas" class="self-start" to="/" />

    <LoadingState :loading="loading" :empty="!loading && !tournament" empty-label="No encontramos ese torneo." empty-icon="sinResultados">
      <template v-if="tournament">
        <section class="tr-section-card tr-t-head">
          <div class="tr-t-head__title">
            <h1>Torneo {{ tournament.code }}</h1>
            <NzChip :tono="STATUS[tournament.status].tono" :label="STATUS[tournament.status].label" />
          </div>
          <p class="tr-t-head__meta">
            {{ tournament.config.size }} jugadores · partidas a {{ tournament.config.targetPoints }} ·
            <template v-if="tournament.config.buyIn">inscripción {{ formatChips(tournament.config.buyIn) }} fichas</template>
            <template v-else>gratis</template>
          </p>
          <div v-if="tournament.config.buyIn" class="tr-t-head__prize">
            <Icono nombre="trofeo" :size="22" />
            <span>
              {{ tournament.status === 'finished' ? 'Premio' : 'El campeón se lleva' }}
              <strong class="tr-num">{{ formatChips(tournament.prize) }}</strong> fichas
            </span>
          </div>
        </section>

        <!-- Campeón -->
        <section v-if="tournament.status === 'finished'" class="tr-champion" role="status">
          <SolDeMayo :size="64" color="oro" />
          <div>
            <strong>{{ tournament.winnerId === auth.user?.id ? '¡Ganaste el torneo!' : `Campeón: ${tournament.winnerUsername}` }}</strong>
            <span v-if="tournament.prize">
              {{ tournament.winnerId === auth.user?.id ? 'Cobraste' : 'Cobró' }}
              <span class="tr-num">{{ formatChips(tournament.prize) }}</span> fichas.
            </span>
          </div>
        </section>

        <NzAviso v-else-if="tournament.status === 'cancelled'" tono="celeste" icono="bloqueado">
          <template v-if="tournament.cancelReason === 'expired'">El torneo venció porque no se completaron los cupos a tiempo.</template>
          <template v-else>El torneo se canceló.</template>
          Si pagaste la inscripción, ya volvió a tu saldo.
        </NzAviso>

        <!-- Mi situación en un torneo en juego -->
        <NzAviso v-if="myMatch" icono="naipe">
          {{ myMatch.status === 'playing'
            ? `Estás jugando la ${myMatch.roundName.toLowerCase()}.`
            : `Pasaste a la ${myMatch.roundName.toLowerCase()}. Esperá a que se defina tu rival.` }}
          <template v-if="myMatch.status === 'playing'" #accion>
            <NzBoton variante="luminoso" tamano="sm" label="Ir a la mesa" :to="`/mesa/${myMatch.roomId}`" />
          </template>
        </NzAviso>
        <!-- Eliminado: panel neutro, sin emoji (10.5) -->
        <NzPanel v-else-if="eliminated && tournament.status === 'playing'" class="tr-t-afuera" role="status">
          Quedaste afuera de este torneo. Podés seguir el cuadro desde acá.
        </NzPanel>

        <!-- Inscripción -->
        <section v-if="tournament.status === 'waiting'" class="tr-section-card">
          <h2>Inscriptos <span class="tr-num">{{ tournament.entrants.length }} de {{ tournament.config.size }}</span></h2>
          <ul class="tr-seats">
            <li v-for="n in tournament.config.size" :key="n" class="tr-seat" :class="{ 'tr-seat--empty': !tournament.entrants[n - 1] }">
              <Avatar v-if="tournament.entrants[n - 1]" :nombre="tournament.entrants[n - 1].username" :size="28" />
              <Icono v-else nombre="perfil" :size="18" />
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
            <NzBoton
              v-if="!isEntrant"
              variante="principal"
              :label="canAfford ? 'Inscribirme' : 'No te alcanzan las fichas'"
              :disable="!canAfford"
              :loading="busy"
              @click="handleJoin"
            />
            <NzBoton
              v-else-if="isHost"
              variante="secundario"
              tono="rojo"
              label="Cancelar torneo"
              :loading="busy"
              @click="handleCancel"
            />
            <NzBoton
              v-else
              variante="secundario"
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
                  <Icono v-if="p && m.winnerId === p.userId" nombre="trofeo" :size="16" />
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
import { confirmar } from '../../composables/useConfirmar.js';
import { useSocket } from '../../composables/useSocket.js';
import { cancelTournament, fetchTournament, joinTournament, leaveTournament } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { useWalletStore } from '../../stores/wallet.js';
import { formatChips } from '../../utils/format.js';

const STATUS = {
  waiting: { label: 'Inscripción abierta', tono: 'celeste' },
  playing: { label: 'En juego', tono: 'celeste' },
  finished: { label: 'Terminado', tono: 'neutro' },
  cancelled: { label: 'Cancelado', tono: 'neutro' }
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
  confirmar({
    title: `Inscribirte al torneo ${t.code}`,
    message: t.config.buyIn
      ? `Se descuentan ${formatChips(t.config.buyIn)} fichas de tu saldo ahora. Si salís antes de que se complete, te las devolvemos.`
      : 'Es gratis. Cuando se completen los cupos empieza tu primera partida.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Inscribirme', color: 'primary', unelevated: true, noCaps: true }
  }).onOk(() => run(joinTournament));
}

function handleLeave() {
  confirmar({
    title: '¿Salir del torneo?',
    message: tournament.value.config.buyIn ? 'Te devolvemos la inscripción.' : 'Liberás tu lugar para otro jugador.',
    cancel: { label: 'Seguir inscripto', flat: true, noCaps: true },
    ok: { label: 'Salir', color: 'primary', unelevated: true, noCaps: true }
  }).onOk(() => run(leaveTournament, 'Saliste del torneo.'));
}

function handleCancel() {
  confirmar({
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
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.tr-t-head__meta { margin: 0; color: var(--texto-suave); }

.tr-t-head__prize {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--oro);
  color: var(--oro);
  font-weight: 600;
}

.tr-champion {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: var(--radio-panel);
  border: 1px solid var(--oro);
  background: var(--noche-3);
  box-shadow: var(--glow-oro-2);
  color: var(--texto);
}

.tr-champion > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tr-champion strong { font-family: var(--fuente-titulo); font-size: 20px; color: var(--oro); }

.tr-t-afuera { color: var(--texto-suave); font-size: 14px; }

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
  padding: 8px 12px;
  border-radius: var(--radio-boton);
  background: var(--noche-0);
  border: 1px solid var(--linea);
  font-weight: 600;
}

.tr-seat small { color: var(--texto-suave); font-weight: 500; }

.tr-seat--empty {
  border-style: dashed;
  color: var(--texto-suave);
  font-weight: 500;
}

.tr-t-note {
  margin: 0 0 12px;
  color: var(--texto-suave);
  font-size: 14px;
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
  color: var(--texto-suave);
  font-family: var(--fuente-titulo);
  font-size: 14px;
  font-weight: 700;
}

.tr-bracket__match {
  display: flex;
  flex-direction: column;
  border-radius: var(--radio-boton);
  border: 1px solid var(--linea);
  background: var(--noche-0);
  overflow: hidden;
}

/* Tu partido con borde celeste (10.5) */
.tr-bracket__match--mine { border-color: var(--celeste); }

.tr-bracket__player {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 600;
}

.tr-bracket__player + .tr-bracket__player { border-top: 1px solid var(--linea); }
.tr-bracket__player small { color: var(--texto-suave); font-weight: 500; }

/* Ganador en oro con su trofeo; el eliminado en texto suave, sin tachar (10.5) */
.tr-bracket__player--winner { color: var(--oro); }
.tr-bracket__player--loser { color: var(--texto-suave); }

.tr-bracket__status {
  padding: 4px 10px;
  border-top: 1px solid var(--linea);
  color: var(--texto-suave);
  font-size: 12px;
}

.tr-bracket__live { color: var(--celeste); font-weight: 700; }

@media (max-width: 700px) {
  .tr-bracket { grid-auto-flow: row; grid-auto-columns: auto; overflow: visible; }
}
</style>
