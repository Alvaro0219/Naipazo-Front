<template>
  <div class="tr-board">
    <!-- Rival -->
    <section class="tr-board__player">
      <div class="tr-board__who">
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
      <TurnTimer :clock="turnClock" />
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
import TurnTimer from './TurnTimer.vue';

const props = defineProps({
  view: { type: Object, required: true },
  turnClock: { type: Object, default: null },
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
  color: var(--texto);
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
  font-size: 15px;
}

.tr-board__backs {
  display: flex;
  gap: 6px;
  min-height: 77px;
}

.tr-badge {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--linea);
  color: var(--texto-suave);
  font-size: 12px;
  font-weight: 600;
}

.tr-badge--turn { border-color: var(--celeste); color: var(--celeste-vivo); }

.tr-board__felt {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 8px;
  /* Paño (6.4): noche-2 liso, borde celeste al 45 % con un resplandor muy suave */
  border-radius: var(--radio-mesa);
  background: var(--noche-2);
  border: 1.5px solid rgba(94, 200, 255, 0.45);
  box-shadow: var(--glow-celeste-3);
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
  border: 1px solid var(--linea);
  color: var(--texto-suave);
  font-size: 12px;
  font-weight: 600;
}

.tr-board__announce {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Cartel del canto (8.2): el detalle por tipo de canto va en N4 */
  padding: 10px 22px;
  color: var(--celeste-vivo);
  font-family: var(--fuente-titulo);
  font-size: clamp(36px, 11vw, 64px);
  font-weight: 800;
  white-space: nowrap;
  text-shadow: 0 0 18px rgba(94, 200, 255, 0.55);
  pointer-events: none;
  z-index: 2;
}

.tr-board__announce--mine { color: var(--texto); }

.tr-pop-enter-active { transition: transform 0.18s ease-out, opacity 0.18s ease-out; }
.tr-pop-leave-active { transition: opacity 0.3s ease; }
.tr-pop-enter-from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
.tr-pop-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .tr-pop-enter-active, .tr-pop-leave-active { transition: none; }
}
</style>
