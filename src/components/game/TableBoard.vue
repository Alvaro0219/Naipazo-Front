<template>
  <div class="tr-board">
    <!-- Rival -->
    <section class="tr-board__player">
      <div class="tr-board__who">
        <q-icon name="person" size="18px" />
        <strong>{{ opponentName }}</strong>
        <span v-if="hand && hand.manoId !== view.me.id" class="tr-badge">Mano</span>
        <span v-if="hand?.turnPlayerId === opponent.id" class="tr-badge tr-badge--turn">Juega</span>
      </div>
      <div class="tr-board__backs">
        <PlayingCard v-for="n in opponent.cardsInHand" :key="n" size="sm" />
      </div>
    </section>

    <!-- Paño -->
    <section class="tr-board__felt">
      <PlayedCards v-if="hand" :bazas="hand.bazas" :my-id="view.me.id" :my-team="view.me.team" />
      <transition name="tr-pop">
        <div v-if="announcement" :key="announcement.key" class="tr-board__announce" :class="{ 'tr-board__announce--mine': announcement.mine }">
          {{ announcement.text }}
        </div>
      </transition>
      <div class="tr-board__status" role="status" aria-live="polite">{{ statusText }}</div>
      <div v-if="trucoLabel" class="tr-board__chips">
        <span class="tr-chip">{{ trucoLabel }}</span>
      </div>
    </section>

    <!-- Yo -->
    <section class="tr-board__me">
      <div class="tr-board__who tr-board__who--me">
        <strong>Vos</strong>
        <span v-if="hand?.manoId === view.me.id" class="tr-badge">Mano</span>
      </div>
      <PlayerHand :cards="hand?.myCards || []" :can-play="canPlay" @play="$emit('play', $event)" />
      <ActionBar :available="buttonActions" :disabled="sending" @action="$emit('action', $event)" />
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { CALL_LABELS } from '../../utils/cards.js';
import ActionBar from './ActionBar.vue';
import PlayedCards from './PlayedCards.vue';
import PlayerHand from './PlayerHand.vue';
import PlayingCard from './PlayingCard.vue';

const props = defineProps({
  view: { type: Object, required: true },
  opponentName: { type: String, required: true },
  announcement: { type: Object, default: null },
  sending: Boolean
});
defineEmits(['play', 'action']);

const hand = computed(() => props.view.hand);
const opponent = computed(() => props.view.players.find((p) => p.id !== props.view.me.id));
const canPlay = computed(() => !props.sending && props.view.availableActions.includes('PLAY_CARD'));
const buttonActions = computed(() => props.view.availableActions.filter((t) => t !== 'PLAY_CARD'));

const trucoLabel = computed(() => {
  const level = hand.value?.truco?.level;
  return level > 1 ? `Se juega por ${level}` : '';
});

const statusText = computed(() => {
  const { view } = props;
  if (!hand.value) return 'Repartiendo…';
  if (view.phase === 'hand_over') {
    const r = hand.value.result;
    if (!r) return 'Repartiendo…';
    return r.winnerTeam === view.me.team ? `Ganaste la mano (+${r.points})` : `${props.opponentName} gana la mano (+${r.points})`;
  }
  const pending = hand.value.pending;
  if (pending) {
    const call = CALL_LABELS[pending.call] || pending.call;
    return pending.callerId === view.me.id
      ? `Cantaste ${call}. Esperando respuesta…`
      : `${props.opponentName} cantó ${call}. ¿Querés?`;
  }
  return hand.value.turnPlayerId === view.me.id ? 'Es tu turno' : `Juega ${props.opponentName}`;
});
</script>

<style scoped>
.tr-board {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #fff;
}

.tr-board__player,
.tr-board__me {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.tr-board__who {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  font-size: 0.95rem;
}

.tr-board__backs {
  display: flex;
  gap: 6px;
  min-height: 64px;
}

.tr-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr-badge--turn { background: #fde047; color: #422006; }

.tr-board__felt {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 8px;
  border-radius: 18px;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.1), transparent 65%),
    #15803d;
  box-shadow: inset 0 0 0 5px #14532d, inset 0 0 0 6px rgba(202, 138, 4, 0.5);
}

.tr-board__status {
  font-weight: 700;
  text-align: center;
  min-height: 1.4em;
}

.tr-board__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.tr-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.75rem;
  font-weight: 600;
}

.tr-board__announce {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 22px;
  border-radius: 14px;
  background: #fde047;
  color: #422006;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  z-index: 2;
}

.tr-board__announce--mine { background: #fff; color: #14532d; }

.tr-pop-enter-active { transition: transform 0.18s ease-out, opacity 0.18s ease-out; }
.tr-pop-leave-active { transition: opacity 0.3s ease; }
.tr-pop-enter-from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
.tr-pop-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .tr-pop-enter-active, .tr-pop-leave-active { transition: none; }
}
</style>
