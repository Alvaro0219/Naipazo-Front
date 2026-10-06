<template>
  <div class="tr-b4">
    <!-- Compañero (arriba) -->
    <SeatTag class="tr-b4__top" :p="seatAt(2)" :info="info(seatAt(2))" partner>
      <transition name="tr-pop">
        <div v-if="lastSign" :key="lastSign.key" class="tr-b4__sign-bubble" role="status">
          {{ SIGN_LABELS[lastSign.sign] }}
        </div>
      </transition>
    </SeatTag>

    <!-- Rivales a los costados y la baza en curso en cruz -->
    <div class="tr-b4__middle">
      <SeatTag class="tr-b4__side" :p="seatAt(3)" :info="info(seatAt(3))" />

      <div class="tr-b4__felt">
        <div class="tr-b4__cross" aria-label="Baza en curso">
          <div v-for="pos in [2, 3, 1, 0]" :key="pos" class="tr-b4__slot" :class="`tr-b4__slot--${pos}`">
            <PlayingCard v-if="currentPlays[pos]" :card-id="currentPlays[pos]" size="sm" />
          </div>
        </div>
        <transition name="tr-pop">
          <div v-if="announcement" :key="announcement.key" class="tr-b4__announce" :class="{ 'tr-b4__announce--mine': announcement.mine }">
            {{ announcement.text }}
          </div>
        </transition>
      </div>

      <SeatTag class="tr-b4__side" :p="seatAt(1)" :info="info(seatAt(1))" />
    </div>

    <!-- Bazas anteriores, estado y reloj -->
    <div class="tr-b4__bazas" aria-label="Bazas">
      <span v-for="(b, i) in bazaResults" :key="i" class="tr-b4__baza" :class="`tr-b4__baza--${b}`">
        {{ i + 1 }}ª {{ BAZA_LABELS[b] }}
      </span>
    </div>
    <div class="tr-b4__status" role="status" aria-live="polite">{{ statusText }}</div>
    <TurnTimer :clock="turnClock" />
    <div v-if="trucoLabel" class="tr-b4__chips"><span class="tr-chip">{{ trucoLabel }}</span></div>

    <!-- Yo -->
    <section class="tr-b4__me">
      <div class="tr-b4__who">
        <strong>Vos</strong>
        <span v-if="hand?.manoId === view.me.id" class="tr-badge">Mano</span>
        <span v-if="info(seatAt(0)).acting" class="tr-badge tr-badge--turn">{{ info(seatAt(0)).acting }}</span>
      </div>
      <PlayerHand :cards="hand?.myCards || []" :can-play="canPlay" @play="$emit('play', $event)" />
      <div class="tr-b4__actions">
        <ActionBar :available="buttonActions" :disabled="sending" @action="$emit('action', $event)" />
        <q-btn
          v-if="view.phase === 'playing'"
          outline
          color="white"
          no-caps
          icon="back_hand"
          label="Señas"
          class="tr-b4__signs-btn"
          @click="signsOpen = true"
        />
      </div>
      <div v-if="signs.length" class="tr-b4__received" aria-label="Señas de esta mano">
        <span class="tr-b4__received-title">Señas de {{ partnerName }}:</span>
        <span v-for="(s, i) in signs" :key="i" class="tr-chip">{{ SIGN_LABELS[s.sign] }}</span>
      </div>
    </section>

    <q-dialog v-model="signsOpen" position="bottom">
      <q-card class="tr-b4__signs">
        <q-card-section>
          <strong>Seña para {{ partnerName }}</strong>
          <p>Solo la ve tu compañero. No se verifica que sea cierta.</p>
        </q-card-section>
        <q-card-section class="tr-b4__signs-grid">
          <q-btn
            v-for="sign in SIGNS"
            :key="sign"
            no-caps
            unelevated
            color="primary"
            :label="SIGN_LABELS[sign]"
            @click="sendSign(sign)"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue';
import { CALL_LABELS } from '../../utils/cards.js';
import { SIGNS, SIGN_LABELS } from '../../utils/signs.js';
import ActionBar from './ActionBar.vue';
import PlayerHand from './PlayerHand.vue';
import PlayingCard from './PlayingCard.vue';
import TurnTimer from './TurnTimer.vue';

const props = defineProps({
  view: { type: Object, required: true },
  turnClock: { type: Object, default: null },
  announcement: { type: Object, default: null },
  sending: Boolean,
  nameOf: { type: Function, required: true },
  signs: { type: Array, default: () => [] },
  lastSign: { type: Object, default: null },
  disconnectedIds: { type: Array, default: () => [] }
});
const emit = defineEmits(['play', 'action', 'sign']);

const BAZA_LABELS = { ours: 'Nuestra', theirs: 'De ellos', parda: 'Parda', pending: '—' };

const signsOpen = ref(false);
const hand = computed(() => props.view.hand);
const mySeat = computed(() => props.view.me.seat);

/** Jugador en la posición relativa a mí: 0 = yo (abajo), 1 = a mi derecha, 2 = compañero (arriba), 3 = a mi izquierda. */
function seatAt(pos) {
  return props.view.players.find((p) => p.seat === (mySeat.value + pos) % 4);
}
const relPos = (playerId) => {
  const p = props.view.players.find((x) => x.id === playerId);
  return (p.seat - mySeat.value + 4) % 4;
};

const partnerName = computed(() => props.nameOf(seatAt(2).id));

const currentPlays = computed(() => {
  const bazas = hand.value?.bazas || [];
  const last = bazas.at(-1);
  // Si la última baza ya terminó (fin de mano), se sigue mostrando hasta el próximo reparto
  const plays = last?.plays || [];
  return Object.fromEntries(plays.map((p) => [relPos(p.playerId), p.cardId]));
});

const bazaResults = computed(() => [0, 1, 2].map((i) => {
  const b = hand.value?.bazas?.[i];
  if (!b || !b.finished) return 'pending';
  if (b.winnerTeam === null) return 'parda';
  return b.winnerTeam === props.view.me.team ? 'ours' : 'theirs';
}));

const canPlay = computed(() => !props.sending && props.view.availableActions.includes('PLAY_CARD'));
const buttonActions = computed(() => props.view.availableActions.filter((t) => t !== 'PLAY_CARD'));
const trucoLabel = computed(() => {
  const level = hand.value?.truco?.level;
  return level > 1 ? `Se juega por ${level}` : '';
});

/** Datos de cada lugar: nombre, si es mano, si le toca (jugar o responder) y si está desconectado. */
function info(p) {
  const pending = hand.value?.pending;
  let acting = null;
  if (props.view.phase === 'playing') {
    if (pending && pending.responderId === p.id) acting = 'Responde';
    else if (!pending && hand.value?.turnPlayerId === p.id) acting = 'Juega';
  }
  return {
    name: props.nameOf(p.id),
    mano: hand.value?.manoId === p.id,
    acting,
    cards: p.cardsInHand,
    away: props.disconnectedIds.includes(p.id)
  };
}

const statusText = computed(() => {
  const { view } = props;
  if (!hand.value) return 'Repartiendo…';
  if (view.phase === 'hand_over') {
    const r = hand.value.result;
    if (!r) return 'Repartiendo…';
    return r.winnerTeam === view.me.team ? `Ganaron la mano (+${r.points})` : `Ellos ganan la mano (+${r.points})`;
  }
  const pending = hand.value.pending;
  if (pending) {
    const call = CALL_LABELS[pending.call] || pending.call;
    const caller = pending.callerId === view.me.id ? 'Cantaste' : `${props.nameOf(pending.callerId)} cantó`;
    if (pending.responderId === view.me.id) return `${caller} ${call}. Te toca responder.`;
    return `${caller} ${call}. Responde ${props.nameOf(pending.responderId)}.`;
  }
  return hand.value.turnPlayerId === view.me.id ? 'Es tu turno' : `Juega ${props.nameOf(hand.value.turnPlayerId)}`;
});

function sendSign(sign) {
  emit('sign', sign);
  signsOpen.value = false;
}

// Lugar de un jugador (nombre, etiqueta de compañero, mano, turno y cartas que le quedan)
const SeatTag = defineComponent({
  props: { p: Object, info: Object, partner: Boolean },
  setup(tagProps, { slots }) {
    return () => h('div', { class: ['tr-seat', { 'tr-seat--acting': tagProps.info.acting, 'tr-seat--away': tagProps.info.away }] }, [
      h('div', { class: 'tr-seat__name' }, [
        h('strong', tagProps.info.name),
        tagProps.partner ? h('span', { class: 'tr-seat__badge' }, 'Compañero') : null,
        tagProps.info.mano ? h('span', { class: 'tr-seat__badge' }, 'Mano') : null
      ]),
      h('div', { class: 'tr-seat__meta' }, [
        h('span', { class: 'tr-seat__cards' }, `${tagProps.info.cards} ${tagProps.info.cards === 1 ? 'carta' : 'cartas'}`),
        tagProps.info.acting ? h('span', { class: 'tr-seat__badge tr-seat__badge--turn' }, tagProps.info.acting) : null,
        tagProps.info.away ? h('span', { class: 'tr-seat__badge tr-seat__badge--away' }, 'Desconectado') : null
      ]),
      slots.default?.()
    ]);
  }
});
</script>

<style scoped>
.tr-b4 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.tr-b4__top { position: relative; }

.tr-b4__middle {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}

.tr-b4__felt {
  position: relative;
  padding: 10px;
  border-radius: 18px;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.1), transparent 65%),
    #15803d;
  box-shadow: inset 0 0 0 5px #14532d, inset 0 0 0 6px rgba(202, 138, 4, 0.5);
}

/* Cruz: compañero arriba, rivales a los costados, yo abajo */
.tr-b4__cross {
  display: grid;
  grid-template-columns: 44px 44px 44px;
  grid-template-rows: 64px 64px 64px;
  gap: 4px;
}

.tr-b4__slot { display: flex; align-items: center; justify-content: center; }
.tr-b4__slot--2 { grid-column: 2; grid-row: 1; }
.tr-b4__slot--3 { grid-column: 1; grid-row: 2; }
.tr-b4__slot--1 { grid-column: 3; grid-row: 2; }
.tr-b4__slot--0 { grid-column: 2; grid-row: 3; }

.tr-badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
}

.tr-badge--turn { background: #fde047; color: #422006; }

.tr-b4__bazas {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.tr-b4__baza {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

.tr-b4__baza--ours { color: #86efac; }
.tr-b4__baza--theirs { color: #fca5a5; }
.tr-b4__baza--parda { color: #fde68a; }

.tr-b4__status {
  font-weight: 700;
  text-align: center;
  min-height: 1.4em;
}

.tr-b4__chips { display: flex; gap: 6px; }

.tr-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.75rem;
  font-weight: 600;
}

.tr-b4__me {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.tr-b4__who {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tr-b4__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.tr-b4__received {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
}

.tr-b4__received-title { color: rgba(255, 255, 255, 0.75); }

.tr-b4__sign-bubble {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4px;
  padding: 6px 12px;
  border-radius: 12px;
  background: #fff;
  color: #14532d;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  z-index: 3;
}

.tr-b4__announce {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 16px;
  border-radius: 14px;
  background: #fde047;
  color: #422006;
  font-size: 1.3rem;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  z-index: 2;
}

.tr-b4__announce--mine { background: #fff; color: #14532d; }

.tr-b4__signs { width: 100%; max-width: 480px; }
.tr-b4__signs p { margin: 4px 0 0; color: #64748b; font-size: 0.85rem; }

.tr-b4__signs-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding-top: 0;
}

.tr-pop-enter-active { transition: transform 0.18s ease-out, opacity 0.18s ease-out; }
.tr-pop-leave-active { transition: opacity 0.3s ease; }
.tr-pop-enter-from { opacity: 0; }
.tr-pop-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .tr-pop-enter-active, .tr-pop-leave-active { transition: none; }
}
</style>

<style>
/* Lugares de la mesa 2 vs 2: los arma una render function, por eso van sin scope (prefijo propio) */
.tr-seat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  text-align: center;
}

.tr-seat--acting { border-color: #fde047; }
.tr-seat--away { opacity: 0.6; }

.tr-seat__name {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  max-width: 100%;
}

.tr-seat__name strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.tr-seat__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
}

.tr-seat__badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr-seat__badge--turn { background: #fde047; color: #422006; }
.tr-seat__badge--away { background: #fecaca; color: #7f1d1d; }
</style>
