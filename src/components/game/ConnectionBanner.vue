<template>
  <div v-if="message" class="tr-conn" :class="`tr-conn--${message.tone}`" role="status">
    <span v-if="message.spinner" class="nz-anillo nz-anillo--chico" aria-hidden="true" />
    <Icono v-else :nombre="message.icon" :size="18" />
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
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  background: var(--noche-3);
  color: var(--texto);
  border-bottom: 1px solid var(--linea);
}

.tr-conn--warn { border-bottom-color: var(--ambar); }
.tr-conn--info { border-bottom-color: var(--celeste); }
</style>
