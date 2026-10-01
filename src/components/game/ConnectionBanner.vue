<template>
  <div v-if="message" class="tr-conn" :class="`tr-conn--${message.tone}`" role="status">
    <q-spinner v-if="message.spinner" size="16px" />
    <q-icon v-else :name="message.icon" size="18px" />
    <span>{{ message.text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCountdown } from '../../composables/useCountdown.js';

const props = defineProps({
  socketStatus: { type: String, required: true },
  opponentGraceDeadline: { type: Number, default: null },
  opponentName: { type: String, default: 'Tu rival' }
});

const { remainingMs } = useCountdown(computed(() => props.opponentGraceDeadline));

const message = computed(() => {
  if (props.socketStatus === 'disconnected' || props.socketStatus === 'connecting') {
    return { tone: 'warn', spinner: true, text: 'Se cortó la conexión. Reconectando… Si no volvés a tiempo, perdés la partida.' };
  }
  if (props.opponentGraceDeadline) {
    const seconds = Math.ceil((remainingMs.value ?? 0) / 1000);
    return { tone: 'info', spinner: true, text: `${props.opponentName} se desconectó. Esperando reconexión… ${seconds} s` };
  }
  return null;
});
</script>

<style scoped>
.tr-conn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.tr-conn--warn { background: #fef3c7; color: #78350f; }
.tr-conn--info { background: #e0f2fe; color: #075985; }
</style>
