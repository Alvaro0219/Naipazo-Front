<template>
  <div class="tr-table">
    <header class="tr-table__header">
      <q-btn flat round dense icon="arrow_back" color="white" aria-label="Volver al lobby" @click="goLobby" />
      <div class="tr-table__title">
        <strong>Mesa {{ game.room?.code || '' }}</strong>
        <span v-if="game.room">{{ game.room.config.targetPoints }} puntos · sin flor · {{ betLabel }}</span>
      </div>
      <q-btn
        v-if="game.view && !game.finished"
        flat
        round
        dense
        icon="flag"
        color="white"
        aria-label="Abandonar la partida"
        @click="confirmAbandon"
      />
      <ScoreBoard
        v-if="game.view"
        :score="game.view.score"
        :sections="game.view.scoreSections"
        :my-team="game.view.me.team"
        :opponent-name="opponentName"
        :target-points="game.view.config.targetPoints"
      />
    </header>

    <ConnectionBanner
      v-if="!game.finished"
      :socket-status="status"
      :opponent-grace-deadline="game.opponentGraceDeadline"
      :opponent-name="opponentName"
    />

    <main class="tr-table__main">
      <!-- Otra pestaña tomó la partida -->
      <div v-if="game.replaced" class="tr-table__center">
        <q-icon name="tab" size="48px" />
        <h2>Abriste esta mesa en otra pestaña</h2>
        <p>Para seguir jugando acá, volvé a tomar la mesa.</p>
        <q-btn color="accent" text-color="dark" unelevated no-caps label="Jugar en esta pestaña" @click="retake" />
      </div>

      <!-- Sala en espera -->
      <div v-else-if="game.room?.status === 'waiting'" class="tr-table__center">
        <q-spinner-dots size="48px" color="accent" />
        <h2>Esperando un rival…</h2>
        <p>Tu mesa ya aparece en el lobby con este código:</p>
        <div class="tr-table__code tr-num">{{ game.room.code }}</div>
        <q-btn outline color="white" no-caps label="Cancelar mesa" :loading="cancelling" @click="handleCancel" />
      </div>

      <div v-else-if="game.room?.status === 'cancelled'" class="tr-table__center">
        <q-icon name="block" size="48px" />
        <h2>La mesa se canceló</h2>
        <q-btn color="accent" text-color="dark" unelevated no-caps label="Volver al lobby" @click="goLobby" />
      </div>

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
        <q-spinner size="40px" color="accent" />
        <p>Entrando a la mesa…</p>
      </div>
    </main>

    <q-dialog :model-value="Boolean(game.finished)" persistent>
      <q-card class="tr-result">
        <q-card-section class="tr-result__body">
          <q-icon :name="iWon ? 'emoji_events' : 'sentiment_dissatisfied'" size="56px" :color="iWon ? 'accent' : 'grey-6'" />
          <h2>{{ iWon ? '¡Ganaste la partida!' : `Ganó ${opponentName}` }}</h2>
          <p v-if="reasonText" class="tr-result__reason">{{ reasonText }}</p>
          <p v-if="game.finished" class="tr-num">
            Vos {{ myScore }} – {{ theirScore }} {{ opponentName }}
          </p>
          <div v-if="myChips" class="tr-result__chips tr-num" :class="myChips.net >= 0 ? 'tr-result__chips--won' : 'tr-result__chips--lost'">
            {{ myChips.net >= 0 ? `+${formatChips(myChips.net)}` : `−${formatChips(-myChips.net)}` }} fichas
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn color="primary" unelevated no-caps label="Volver al lobby" @click="goLobby" />
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
import { useSocket } from '../composables/useSocket.js';
import { cancelRoom } from '../services/api.js';
import { useGameStore } from '../stores/game.js';
import { formatChips } from '../utils/format.js';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const game = useGameStore();
const { status } = useSocket();
const cancelling = ref(false);

const opponentName = computed(() => {
  if (game.opponent) return game.nameOf(game.opponent.id);
  return game.room?.seats?.find((s) => s.userId !== game.myId)?.username || 'Rival';
});

const betLabel = computed(() => {
  const bet = game.room?.config?.bet;
  return bet ? `${formatChips(bet)} fichas` : 'gratis';
});

const iWon = computed(() => game.finished?.winnerTeam === game.myTeam);
const myChips = computed(() => game.finished?.chips?.players?.find((p) => p.userId === game.myId) ?? null);
const reasonText = computed(() => {
  const f = game.finished;
  if (f?.endReason !== 'abandon') return '';
  return f.abandonedBy === game.myId ? 'Abandonaste la partida.' : `${opponentName.value} abandonó la partida.`;
});
const myScore = computed(() => game.finished?.score?.[game.myTeam] ?? 0);
const theirScore = computed(() => game.finished?.score?.[1 - game.myTeam] ?? 0);

function goLobby() {
  router.push('/');
}

function retake() {
  game.enterRoom(route.params.roomId);
}

function handleAction(type) {
  if (type !== 'GO_TO_DECK') {
    game.sendAction(type);
    return;
  }
  $q.dialog({
    title: '¿Te vas al mazo?',
    message: 'Tu rival se lleva los puntos en juego de esta mano.',
    cancel: { label: 'Seguir jugando', flat: true, noCaps: true },
    ok: { label: 'Me voy al mazo', color: 'negative', unelevated: true, noCaps: true }
  }).onOk(() => game.sendAction('GO_TO_DECK'));
}

function confirmAbandon() {
  const bet = game.room?.config?.bet;
  $q.dialog({
    title: '¿Abandonar la partida?',
    message: bet
      ? `Abandonar cuenta como derrota: ${opponentName.value} gana y perdés tus ${formatChips(bet)} fichas.`
      : `Abandonar cuenta como derrota: ${opponentName.value} gana la partida.`,
    cancel: { label: 'Seguir jugando', flat: true, noCaps: true },
    ok: { label: 'Abandonar', color: 'negative', unelevated: true, noCaps: true }
  }).onOk(() => game.abandon());
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
  background: #14532d;
  color: #fff;
}

.tr-table__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: #0f3d22;
}

.tr-table__title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.tr-table__title span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
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
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.3;
}

.tr-table__center p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.tr-table__code {
  padding: 8px 18px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.tr-result { width: min(92vw, 360px); }

.tr-result__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.tr-result__body h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.3;
}

.tr-result__body p {
  margin: 0;
  color: #475569;
  font-size: 1.05rem;
}

.tr-result__body .tr-result__reason {
  font-size: 0.9rem;
  color: #64748b;
}

.tr-result__chips {
  margin-top: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 1.1rem;
}

.tr-result__chips--won { background: #dcfce7; color: #166534; }
.tr-result__chips--lost { background: #fee2e2; color: #991b1b; }
</style>
