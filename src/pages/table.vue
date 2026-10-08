<template>
  <div class="tr-table">
    <header class="tr-table__header">
      <NzBoton variante="texto" solo-icono icono="volver" label="Volver al lobby" @click="goLobby" />
      <div class="tr-table__title">
        <strong>{{ tournamentInfo ? tournamentInfo.roundName : `Mesa ${game.room?.code || ''}` }}</strong>
        <span v-if="tournamentInfo">Torneo {{ tournamentInfo.code }} · {{ game.room?.config.targetPoints }} puntos</span>
        <span v-else-if="game.room">{{ game.room.config.isPrivate ? 'Sala privada · ' : '' }}{{ game.is2v2 ? '2 vs 2 · ' : '' }}{{ game.room.config.targetPoints }} puntos · {{ betLabel }}</span>
      </div>
      <NzBoton
        v-if="game.view && !game.finished"
        variante="texto"
        solo-icono
        icono="bandera"
        label="Abandonar la partida"
        @click="confirmAbandon"
      />
      <ScoreBoard
        v-if="game.view"
        :score="game.view.score"
        :sections="game.view.scoreSections"
        :my-team="game.view.me.team"
        :opponent-name="game.is2v2 ? 'Ellos' : opponentName"
        :my-label="game.is2v2 ? 'Nosotros' : 'Vos'"
        :target-points="game.view.config.targetPoints"
      />
    </header>

    <ConnectionBanner
      v-if="!game.finished"
      :socket-status="status"
      :opponent-grace-deadline="game.awayPlayer?.deadline ?? null"
      :opponent-name="game.awayPlayer ? game.nameOf(game.awayPlayer.id) : opponentName"
    />

    <main class="tr-table__main">
      <!-- Otra pestaña tomó la partida -->
      <div v-if="game.replaced" class="tr-table__center">
        <Icono nombre="pestana" :size="48" />
        <h2>Abriste esta mesa en otra pestaña</h2>
        <p>Para seguir jugando acá, volvé a tomar la mesa.</p>
        <NzBoton variante="principal" label="Jugar en esta pestaña" @click="retake" />
      </div>

      <!-- Sala en espera 2 vs 2: asientos por pareja (los libres se tocan para cambiarse) -->
      <div v-else-if="game.room?.status === 'waiting' && game.is2v2" class="tr-table__center">
        <template v-if="game.room.seats.length < 4">
          <h2>Esperando jugadores · {{ game.room.seats.length }} de 4</h2>
          <p>Compañeros enfrentados: la pareja A juega contra la pareja B. Tocá un lugar libre para cambiarte.</p>
        </template>
        <template v-else>
          <h2>¡Mesa completa! Confirmen para empezar · {{ readyCount }} de 4</h2>
          <p>La partida arranca cuando los cuatro tocan "Estoy listo". Recién ahí se descuentan las fichas.</p>
        </template>
        <div class="tr-wait4">
          <div v-for="team in [0, 1]" :key="team" class="tr-wait4__team">
            <span class="tr-wait4__team-name">Pareja {{ team === 0 ? 'A' : 'B' }}</span>
            <button
              v-for="seatNo in [team, team + 2]"
              :key="seatNo"
              type="button"
              class="tr-wait4__seat"
              :class="{ 'tr-wait4__seat--me': seatUser(seatNo)?.userId === auth.user?.id, 'tr-wait4__seat--free': !seatUser(seatNo) }"
              :disabled="Boolean(seatUser(seatNo)) || movingSeat"
              @click="moveTo(seatNo)"
            >
              {{ seatUser(seatNo) ? (seatUser(seatNo).userId === auth.user?.id ? 'Vos' : seatUser(seatNo).username) : 'Libre' }}
              <Icono v-if="seatUser(seatNo) && isReady(seatUser(seatNo).userId)" nombre="ok" :size="16" label="Listo" class="tr-wait4__listo" />
            </button>
          </div>
        </div>
        <div class="tr-table__code tr-num">{{ game.room.code }}</div>
        <NzBoton
          v-if="game.room.config.isPrivate"
          variante="secundario"
          :icono="copied ? 'tilde' : 'copiar'"
          :label="copied ? 'Código copiado' : 'Copiar código'"
          @click="copyCode"
        />
        <NzBoton
          v-if="game.room.seats.length === 4"
          variante="principal"
          :icono="isReady(auth.user?.id) ? 'tilde' : 'listo'"
          :label="isReady(auth.user?.id) ? 'Listo · esperando a los demás' : 'Estoy listo'"
          :disable="isReady(auth.user?.id)"
          :loading="confirming"
          @click="handleReady"
        />
        <NzBoton variante="secundario" tono="rojo" label="Salir de la mesa" :loading="cancelling" @click="handleLeave" />
      </div>

      <!-- Sala en espera -->
      <div v-else-if="game.room?.status === 'waiting'" class="tr-table__center">
        <div class="nz-anillo" aria-hidden="true" />
        <h2>Esperando un rival…</h2>
        <p v-if="game.room.config.isPrivate">Sala privada: pasale este código a quien quieras que juegue.</p>
        <p v-else>Tu mesa ya aparece en el lobby con este código:</p>
        <div class="tr-table__code tr-num">{{ game.room.code }}</div>
        <NzBoton
          v-if="game.room.config.isPrivate"
          variante="secundario"
          :icono="copied ? 'tilde' : 'copiar'"
          :label="copied ? 'Código copiado' : 'Copiar código'"
          @click="copyCode"
        />
        <NzBoton variante="secundario" tono="rojo" label="Cancelar mesa" :loading="cancelling" @click="handleCancel" />
      </div>

      <div v-else-if="game.room?.status === 'cancelled'" class="tr-table__center">
        <Icono nombre="bloqueado" :size="48" />
        <h2>{{ game.room.cancelReason === 'expired' ? 'La mesa venció' : 'La mesa se canceló' }}</h2>
        <p v-if="game.room.cancelReason === 'expired'">Pasó mucho tiempo sin que se sumara un rival. Podés crear otra cuando quieras.</p>
        <NzBoton variante="principal" label="Volver al lobby" @click="goLobby" />
      </div>

      <TableBoard2v2
        v-else-if="game.view && game.is2v2"
        :view="game.view"
        :turn-clock="game.finished ? null : game.turnClock"
        :announcement="game.announcement"
        :sending="game.sending"
        :name-of="game.nameOf"
        :signs="game.signs"
        :last-sign="game.lastSign"
        :disconnected-ids="Object.keys(game.view.disconnected || {})"
        @play="(cardId) => game.sendAction('PLAY_CARD', { cardId })"
        @action="handleAction"
        @sign="game.sendSign"
      />

      <TableBoard
        v-else-if="game.view"
        :view="game.view"
        :turn-clock="game.finished ? null : game.turnClock"
        :opponent-name="opponentName"
        :announcement="game.announcement"
        :sending="game.sending"
        @play="(cardId) => game.sendAction('PLAY_CARD', { cardId })"
        @action="handleAction"
      />

      <div v-else class="tr-table__center">
        <div class="nz-anillo" aria-hidden="true" />
        <p>Entrando a la mesa…</p>
      </div>
    </main>

    <!-- Partida suspendida por una verificación de integridad: se devolvieron las apuestas -->
    <q-dialog :model-value="Boolean(game.frozen)" persistent>
      <q-card class="tr-result">
        <q-card-section class="tr-result__body">
          <Icono nombre="pausa" :size="56" class="tr-result__icono" />
          <h2>Partida suspendida</h2>
          <p class="tr-result__reason" role="alert">{{ game.frozen?.message }}</p>
        </q-card-section>
        <q-card-actions align="center">
          <NzBoton variante="principal" label="Volver al lobby" @click="leaveAfterMatch" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog :model-value="Boolean(game.finished)" persistent>
      <q-card class="tr-result">
        <q-card-section class="tr-result__body">
          <SolDeMayo v-if="iWon" :size="72" color="oro" />
          <Icono v-else nombre="bandera" :size="48" class="tr-result__icono" />
          <h2>{{ resultTitle }}</h2>
          <p v-if="reasonText" class="tr-result__reason">{{ reasonText }}</p>
          <p v-if="myResult === 'loss' && game.finished?.endReason === 'abandon'" class="tr-result__reason">Abandonó tu compañero: pierden los dos.</p>
          <p v-if="game.finished" class="tr-num">
            {{ game.is2v2 ? 'Nosotros' : 'Vos' }} {{ myScore }} – {{ theirScore }} {{ game.is2v2 ? 'Ellos' : opponentName }}
          </p>
          <div v-if="myChips" class="tr-result__chips tr-num" :class="myChips.net >= 0 ? 'tr-result__chips--won' : 'tr-result__chips--lost'">
            {{ myChips.net >= 0 ? `+${formatChips(myChips.net)}` : `−${formatChips(-myChips.net)}` }} fichas
          </div>
        </q-card-section>
        <!-- Torneo: el resultado se sigue en el cuadro -->
        <q-card-section v-if="game.finished?.tournamentId" class="tr-result__next">
          {{ tournamentResultText }}
        </q-card-section>

        <!-- Revancha (solo partidas normales) -->
        <q-card-section v-else-if="game.finished?.rematchAllowed" class="tr-result__rematch">
          <p v-if="rematchText" class="tr-result__rematch-text" role="status">{{ rematchText }}</p>
          <div class="tr-result__rematch-actions">
            <NzBoton
              v-if="!rematchClosed"
              variante="principal"
              icono="revancha"
              :label="rematchRequestedByRival ? 'Aceptar revancha' : 'Revancha'"
              :loading="game.rematch?.state === 'waiting'"
              @click="game.requestRematch()"
            />
            <NzBoton v-if="rematchRequestedByRival" variante="texto" label="No, gracias" @click="game.declineRematch()" />
          </div>
        </q-card-section>

        <q-card-actions align="center">
          <NzBoton
            v-if="game.finished?.tournamentId"
            variante="principal"
            label="Ver el torneo"
            :to="`/torneos/${game.finished.tournamentId}`"
          />
          <NzBoton
            :variante="game.finished?.tournamentId ? 'texto' : 'secundario'"
            label="Volver al lobby"
            @click="leaveAfterMatch"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import ConnectionBanner from '../components/game/ConnectionBanner.vue';
import ScoreBoard from '../components/game/ScoreBoard.vue';
import TableBoard from '../components/game/TableBoard.vue';
import TableBoard2v2 from '../components/game/TableBoard2v2.vue';
import { confirmar } from '../composables/useConfirmar.js';
import { useSocket } from '../composables/useSocket.js';
import { cancelRoom, changeSeat, confirmReady, fetchTournament, leaveRoom } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useGameStore } from '../stores/game.js';
import { formatChips } from '../utils/format.js';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const game = useGameStore();
const auth = useAuthStore();
const { status } = useSocket();
const cancelling = ref(false);

const opponentName = computed(() => {
  if (game.opponent) return game.nameOf(game.opponent.id);
  return game.room?.seats?.find((s) => s.userId !== game.myId)?.username || 'Rival';
});

// Copiar el código de una sala privada para pasárselo al rival
const copied = ref(false);
async function copyCode() {
  try {
    await navigator.clipboard.writeText(game.room.code);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    $q.notify({ message: `Código de la sala: ${game.room.code}` });
  }
}

const betLabel = computed(() => {
  const bet = game.room?.config?.bet;
  return bet ? `${formatChips(bet)} fichas` : 'gratis';
});

const iWon = computed(() => game.finished?.winnerTeam === game.myTeam);
const myResult = computed(() => game.finished?.results?.[game.myId] ?? null);
const resultTitle = computed(() => {
  if (game.is2v2) return iWon.value ? '¡Ganaron la partida!' : 'Ganaron ellos';
  return iWon.value ? '¡Ganaste la partida!' : `Ganó ${opponentName.value}`;
});
const myChips = computed(() => game.finished?.chips?.players?.find((p) => p.userId === game.myId) ?? null);
const reasonText = computed(() => {
  const f = game.finished;
  if (f?.endReason !== 'abandon') return '';
  if (game.is2v2) {
    const who = (f.abandoners?.length ? f.abandoners : [f.abandonedBy]).map((id) => (id === game.myId ? 'Vos' : game.nameOf(id)));
    return who.length > 1 ? `Abandonaron ${who.join(' y ')}.` : `${who[0] === 'Vos' ? 'Abandonaste' : `${who[0]} abandonó`} la partida.`;
  }
  return f.abandonedBy === game.myId ? 'Abandonaste la partida.' : `${opponentName.value} abandonó la partida.`;
});
const myScore = computed(() => game.finished?.score?.[game.myTeam] ?? 0);
const theirScore = computed(() => game.finished?.score?.[1 - game.myTeam] ?? 0);

function goLobby() {
  router.push('/');
}

// Revancha
const rematchRequestedByRival = computed(() => game.rematch?.state === 'requested' && game.rematch.by !== game.myId);
const rematchClosed = computed(() => ['declined', 'expired', 'failed', 'started'].includes(game.rematch?.state));
const rematchText = computed(() => {
  const r = game.rematch;
  if (!r) return '';
  const accepted = r.accepted?.length ?? 0;
  if (game.is2v2 && (r.state === 'waiting' || r.state === 'requested')) {
    return r.state === 'waiting' ? `Aceptaron ${Math.max(accepted, 1)} de 4. Esperando a los demás…` : `Quieren la revancha (${accepted} de 4).`;
  }
  if (r.state === 'waiting') return `Esperando que ${opponentName.value} acepte…`;
  if (r.state === 'requested' && r.by !== game.myId) return `${opponentName.value} quiere la revancha.`;
  if (r.state === 'declined') return r.by === game.myId ? 'Rechazaste la revancha.' : `${game.nameOf(r.by)} no quiere la revancha.`;
  if (r.state === 'expired') return 'La revancha caducó.';
  if (r.state === 'failed') return r.message || 'No se pudo armar la revancha.';
  if (r.state === 'started') return '¡Revancha! Entrando a la mesa nueva…';
  return '';
});

// Aceptada por los dos: el servidor arma la mesa nueva y nos lleva a ella
watch(() => game.rematch, (r) => {
  if (r?.state === 'started' && r.roomId) router.replace(`/mesa/${r.roomId}`);
});

// Al irse, si había una revancha pedida, se rechaza (caduca para los dos)
function leaveAfterMatch() {
  if (game.rematch && !rematchClosed.value) game.declineRematch();
  goLobby();
}

// Partida de torneo: código y ronda para el encabezado
const tournamentInfo = ref(null);
const tournamentResultText = computed(() => {
  if (!iWon.value) return 'Quedaste afuera del torneo.';
  return tournamentInfo.value?.roundName === 'Final' ? '¡Sos el campeón del torneo!' : 'Avanzás en el torneo.';
});
watch(() => game.view?.tournament?.id, async (id) => {
  if (!id) { tournamentInfo.value = null; return; }
  try {
    const t = await fetchTournament(id);
    const match = t.bracket.find((m) => m.roomId === game.roomId);
    tournamentInfo.value = { code: t.code, roundName: match?.roundName || 'Torneo' };
  } catch {
    tournamentInfo.value = null;
  }
}, { immediate: true });

function retake() {
  game.enterRoom(route.params.roomId);
}

function handleAction(type) {
  if (type !== 'GO_TO_DECK') {
    game.sendAction(type);
    return;
  }
  confirmar({
    title: '¿Te vas al mazo?',
    message: game.is2v2
      ? 'El mazo es de la pareja: los rivales se llevan los puntos en juego de esta mano.'
      : 'Tu rival se lleva los puntos en juego de esta mano.',
    cancel: { label: 'Seguir jugando', flat: true, noCaps: true },
    ok: { label: 'Me voy al mazo', color: 'negative', unelevated: true, noCaps: true }
  }).onOk(() => game.sendAction('GO_TO_DECK'));
}

function confirmAbandon() {
  const bet = game.room?.config?.bet;
  confirmar({
    title: '¿Abandonar la partida?',
    message: game.is2v2
      ? (bet
        ? `Abandonar cuenta como derrota para los dos: tu pareja pierde y ambos pierden sus ${formatChips(bet)} fichas.`
        : 'Abandonar cuenta como derrota: tu pareja pierde la partida.')
      : (bet
        ? `Abandonar cuenta como derrota: ${opponentName.value} gana y perdés tus ${formatChips(bet)} fichas.`
        : `Abandonar cuenta como derrota: ${opponentName.value} gana la partida.`),
    cancel: { label: 'Seguir jugando', flat: true, noCaps: true },
    ok: { label: 'Abandonar', color: 'negative', unelevated: true, noCaps: true }
  }).onOk(() => game.abandon());
}

// 2 vs 2: asientos de la sala de espera
const movingSeat = ref(false);
const seatUser = (seatNo) => game.room?.seats?.find((x) => x.seat === seatNo) || null;
async function moveTo(seatNo) {
  movingSeat.value = true;
  try {
    await changeSeat(game.roomId, seatNo);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message });
  } finally {
    movingSeat.value = false;
  }
}

const readyCount = computed(() => game.room?.readyIds?.length ?? 0);
const isReady = (userId) => Boolean(game.room?.readyIds?.includes(userId));
const confirming = ref(false);
async function handleReady() {
  confirming.value = true;
  try {
    await confirmReady(game.roomId);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message });
  } finally {
    confirming.value = false;
  }
}

async function handleLeave() {
  cancelling.value = true;
  try {
    await leaveRoom(game.roomId);
    router.push('/');
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message });
  } finally {
    cancelling.value = false;
  }
}

async function handleCancel() {
  cancelling.value = true;
  try {
    await cancelRoom(game.roomId);
    router.push('/');
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message });
  } finally {
    cancelling.value = false;
  }
}

onMounted(() => game.enterRoom(route.params.roomId));
onBeforeUnmount(() => game.leaveTable());
watch(() => route.params.roomId, (id) => id && game.enterRoom(id));
</script>

<style scoped>
.tr-table {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--texto);
}

.tr-table__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: var(--noche-0);
  border-bottom: 1px solid var(--linea);
}

.tr-table__title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.tr-table__title span {
  font-size: 12px;
  color: var(--texto-suave);
}

.tr-table__main {
  flex: 1;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 14px 16px calc(20px + env(safe-area-inset-bottom));
}

.tr-table__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 8px;
  text-align: center;
}

.tr-table__center h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.tr-table__center p {
  margin: 0;
  color: var(--texto-suave);
}

/* Código de la sala en Bricolage 40 px con espaciado amplio (10.4) */
.tr-table__code {
  padding: 8px 18px;
  font-family: var(--fuente-titulo);
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.tr-wait4 {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 340px;
}

.tr-wait4__team {
  display: grid;
  grid-template-columns: 72px 1fr 1fr;
  align-items: center;
  gap: 6px;
}

.tr-wait4__team-name {
  font-weight: 700;
  font-size: 14px;
  text-align: left;
}

.tr-wait4__seat {
  min-height: 44px;
  padding: 6px 8px;
  border-radius: var(--radio-boton);
  border: 1px solid var(--linea-control);
  background: var(--noche-2);
  color: var(--texto);
  font: inherit;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-wait4__seat--free {
  border-style: dashed;
  color: var(--celeste);
  cursor: pointer;
}

.tr-wait4__seat--me { border-color: var(--celeste); background: var(--noche-3); }
.tr-wait4__seat:disabled { cursor: default; color: var(--texto); opacity: 1; }
.tr-wait4__listo { color: var(--verde); }

.tr-result { width: min(92vw, 360px); }

.tr-result__next {
  padding-top: 0;
  text-align: center;
  color: var(--texto-suave);
  font-weight: 600;
}

.tr-result__rematch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 0;
}

.tr-result__rematch-text {
  margin: 0;
  color: var(--texto-suave);
  font-size: 14px;
  text-align: center;
}

.tr-result__rematch-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.tr-result__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.tr-result__body h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}

.tr-result__body p {
  margin: 0;
  color: var(--texto-suave);
  font-size: 16px;
}

.tr-result__body .tr-result__reason {
  font-size: 14px;
  color: var(--texto-suave);
}

.tr-result__icono { color: var(--texto-suave); }

/* Premio en oro; perder es neutro (9.1 y 9.2). El conteo y los rayos van en N4 */
.tr-result__chips {
  margin-top: 6px;
  font-family: var(--fuente-titulo);
  font-weight: 700;
  font-size: 20px;
}

.tr-result__chips--won { color: var(--oro); }
.tr-result__chips--lost { color: var(--texto-suave); }
</style>
