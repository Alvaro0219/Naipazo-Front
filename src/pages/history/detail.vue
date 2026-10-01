<template>
  <div class="tr-page-shell">
    <q-btn flat no-caps color="primary" icon="arrow_back" label="Historial" class="self-start" to="/historial" />

    <LoadingState :loading="loading" :empty="!loading && !match" empty-label="No encontramos esa partida." empty-icon="search_off">
      <template v-if="match">
        <section class="tr-section-card tr-detail-head">
          <span class="tr-detail-head__result" :class="`tr-detail-head__result--${match.result}`">
            {{ RESULT_LABELS[match.result] }}
          </span>
          <h1>vs {{ match.opponent?.username }}</h1>
          <p class="tr-num tr-detail-head__score">{{ match.myScore }} – {{ match.opponentScore }}</p>
          <p class="tr-detail-head__meta">
            A {{ match.config.targetPoints }} puntos ·
            {{ match.config.bet ? `${formatChips(match.config.bet)} fichas` : 'gratis' }} ·
            {{ formatDateTime(match.endedAt) }}
          </p>
          <p v-if="resultDetail(match)" class="tr-detail-head__meta">{{ resultDetail(match) }}</p>
          <p v-if="match.config.bet" class="tr-num tr-detail-head__chips" :class="match.chipsNet >= 0 ? 'text-positive' : 'text-negative'">
            {{ formatSignedChips(match.chipsNet) }} fichas
          </p>
        </section>

        <section class="tr-section-card">
          <h2>Mano por mano</h2>
          <p v-if="!match.hands.length" class="tr-detail-empty">No hay manos registradas.</p>
          <q-list separator>
            <q-expansion-item
              v-for="hand in match.hands"
              :key="hand.handNumber"
              dense-toggle
              :label="handTitle(hand)"
              :caption="handCaption(hand)"
              header-class="tr-hand-header"
            >
              <div class="tr-hand-body">
                <div class="tr-hand-body__row">
                  <span class="tr-hand-body__label">Tus cartas</span>
                  <div class="tr-hand-body__cards">
                    <PlayingCard v-for="card in hand.myCards" :key="card" :card-id="card" size="sm" />
                  </div>
                </div>
                <div v-if="opponentPlays(hand).length" class="tr-hand-body__row">
                  <span class="tr-hand-body__label">Jugó {{ match.opponent?.username }}</span>
                  <div class="tr-hand-body__cards">
                    <PlayingCard v-for="card in opponentPlays(hand)" :key="card" :card-id="card" size="sm" />
                  </div>
                </div>
                <ol v-if="handEvents(hand).length" class="tr-hand-body__events">
                  <li v-for="(text, i) in handEvents(hand)" :key="i">{{ text }}</li>
                </ol>
              </div>
            </q-expansion-item>
          </q-list>
        </section>
      </template>
    </LoadingState>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import LoadingState from '../../components/LoadingState.vue';
import PlayingCard from '../../components/game/PlayingCard.vue';
import { fetchMatch } from '../../services/api.js';
import { formatChips, formatDateTime, formatSignedChips } from '../../utils/format.js';
import { describeEvent } from '../../utils/gameText.js';
import { RESULT_LABELS, resultDetail } from '../../utils/matchText.js';

const HAND_REASONS = {
  bazas: 'por bazas',
  truco_rejected: 'truco no querido',
  deck: 'se fue al mazo',
  timeout: 'por tiempo'
};

const $q = useQuasar();
const route = useRoute();
const match = ref(null);
const loading = ref(true);

const myId = () => match.value.players.find((p) => p.team === match.value.myTeam)?.id;

function nameOf(playerId) {
  if (playerId === myId()) return 'Vos';
  return match.value.players.find((p) => p.id === playerId)?.username || 'Rival';
}

function teamName(team) {
  return team === match.value.myTeam ? 'Vos' : match.value.opponent?.username || 'Rival';
}

function handTitle(hand) {
  const r = hand.result;
  if (!r) return `Mano ${hand.handNumber} · terminó la partida`;
  const who = r.winnerTeam === match.value.myTeam ? 'Ganaste' : `Ganó ${match.value.opponent?.username}`;
  return `Mano ${hand.handNumber} · ${who} +${r.points}`;
}

function handCaption(hand) {
  const mano = `Mano: ${nameOf(hand.manoId)}`;
  const reason = hand.result ? ` · ${HAND_REASONS[hand.result.reason] || ''}` : '';
  const score = hand.scoreAfter ? ` · ${hand.scoreAfter[match.value.myTeam]} a ${hand.scoreAfter[1 - match.value.myTeam]}` : '';
  return `${mano}${reason}${score}`;
}

function opponentPlays(hand) {
  return hand.plays.filter((p) => p.playerId !== myId()).map((p) => p.cardId);
}

function handEvents(hand) {
  return hand.events
    .filter((e) => e.type !== 'HAND_STARTED')
    .map((e) => describeEvent(e, { nameOf, teamName }))
    .filter(Boolean);
}

onMounted(async () => {
  try {
    match.value = await fetchMatch(route.params.id);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo cargar la partida' });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tr-detail-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.tr-detail-head h1 {
  margin: 4px 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.2;
}

.tr-detail-head p { margin: 0; }

.tr-detail-head__result {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr-detail-head__result--won { background: #dcfce7; color: #166534; }
.tr-detail-head__result--lost { background: #fee2e2; color: #991b1b; }
.tr-detail-head__result--cancelled { background: #f1f5f9; color: #475569; }

.tr-detail-head__score { font-size: 1.8rem; font-weight: 800; }
.tr-detail-head__meta { color: #64748b; font-size: 0.85rem; }
.tr-detail-head__chips { font-weight: 800; }

.tr-detail-empty { color: #64748b; margin: 0; }

:deep(.tr-hand-header) { padding-left: 0; padding-right: 0; }

.tr-hand-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 14px;
}

.tr-hand-body__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tr-hand-body__label {
  width: 110px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.tr-hand-body__cards {
  display: flex;
  gap: 6px;
}

.tr-hand-body__events {
  margin: 0;
  padding-left: 20px;
  color: #334155;
  font-size: 0.85rem;
  line-height: 1.55;
}
</style>
