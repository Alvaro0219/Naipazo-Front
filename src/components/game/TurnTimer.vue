<template>
  <div
    v-if="clock && remainingMs !== null"
    class="tr-timer"
    :class="{ 'tr-timer--mine': clock.mine, 'tr-timer--urgent': urgent }"
    role="timer"
    :aria-label="`${clock.mine ? 'Tu tiempo' : 'Tiempo del rival'}: ${seconds} segundos`"
  >
    <div class="tr-timer__bar"><span :style="{ width: `${percent}%` }" /></div>
    <span class="tr-timer__label tr-num">{{ seconds }} s</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCountdown } from '../../composables/useCountdown.js';

const props = defineProps({
  clock: { type: Object, default: null } // { deadline, totalMs, mine }
});

const { remainingMs } = useCountdown(computed(() => props.clock?.deadline ?? null), { intervalMs: 250 });

const seconds = computed(() => Math.ceil((remainingMs.value ?? 0) / 1000));
const percent = computed(() => (props.clock ? Math.max(0, Math.min(100, (remainingMs.value / props.clock.totalMs) * 100)) : 0));
const urgent = computed(() => seconds.value <= 10);
</script>

<style scoped>
.tr-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(100%, 260px);
}

.tr-timer__bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.tr-timer__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.55);
  transition: width 0.25s linear;
}

.tr-timer--mine .tr-timer__bar span { background: #fde047; }
.tr-timer--urgent .tr-timer__bar span { background: #f87171; }

.tr-timer__label {
  min-width: 34px;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: right;
  color: rgba(255, 255, 255, 0.85);
}

.tr-timer--urgent .tr-timer__label { color: #fecaca; }

@media (prefers-reduced-motion: reduce) {
  .tr-timer__bar span { transition: none; }
}
</style>
