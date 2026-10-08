<template>
  <div class="tr-played" aria-label="Cartas jugadas">
    <div v-for="(slot, i) in slots" :key="i" class="tr-played__baza" :class="{ 'tr-played__baza--current': slot.current }">
      <div class="tr-played__cell">
        <PlayingCard v-if="slot.theirs" :card-id="slot.theirs" size="sm" :dim="slot.result === 'mine'" />
        <span v-else class="tr-played__empty" />
      </div>
      <span class="tr-played__result" :class="`tr-played__result--${slot.result || 'none'}`">
        {{ RESULT_LABELS[slot.result] || `${i + 1}ª` }}
      </span>
      <div class="tr-played__cell">
        <PlayingCard v-if="slot.mine" :card-id="slot.mine" size="sm" :dim="slot.result === 'theirs'" />
        <span v-else class="tr-played__empty" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PlayingCard from './PlayingCard.vue';

const RESULT_LABELS = { mine: 'Tuya', theirs: 'Suya', parda: 'Parda' };

const props = defineProps({
  bazas: { type: Array, required: true },
  myId: { type: String, required: true },
  myTeam: { type: Number, required: true }
});

const slots = computed(() => [0, 1, 2].map((i) => {
  const baza = props.bazas[i];
  if (!baza) return { current: false };
  let result = null;
  if (baza.finished) result = baza.winnerTeam === null ? 'parda' : (baza.winnerTeam === props.myTeam ? 'mine' : 'theirs');
  return {
    current: !baza.finished,
    mine: baza.plays.find((p) => p.playerId === props.myId)?.cardId,
    theirs: baza.plays.find((p) => p.playerId !== props.myId)?.cardId,
    result
  };
}));
</script>

<style scoped>
.tr-played {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.tr-played__baza {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
}

.tr-played__baza--current { background: rgba(143, 167, 207, 0.06); }

.tr-played__cell {
  width: 50px;
  height: 77px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tr-played__empty {
  width: 50px;
  height: 77px;
  border-radius: 9px;
  border: 1px dashed rgba(234, 243, 255, 0.15);
}

.tr-played__result {
  font-size: 12px;
  font-weight: 600;
  color: var(--texto-suave);
  min-height: 1em;
}

/* Baza ganada en oro; perdida neutra; parda en blanco (6.4) */
.tr-played__result--mine { color: var(--oro); }
.tr-played__result--theirs { color: var(--texto-suave); }
.tr-played__result--parda { color: var(--texto); }
</style>
