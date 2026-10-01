<template>
  <div v-if="message" class="tr-conn" :class="`tr-conn--${message.tone}`" role="status">
    <q-spinner v-if="message.spinner" size="16px" />
    <q-icon v-else :name="message.icon" size="18px" />
    <span>{{ message.text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  socketStatus: { type: String, required: true },
  opponentAway: Boolean,
  opponentName: { type: String, default: 'Tu rival' }
});

const message = computed(() => {
  if (props.socketStatus === 'disconnected' || props.socketStatus === 'connecting') {
    return { tone: 'warn', spinner: true, text: 'Se cortó la conexión. Reconectando…' };
  }
  if (props.opponentAway) {
    return { tone: 'info', spinner: true, text: `${props.opponentName} se desconectó. Esperando que vuelva…` };
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
}

.tr-conn--warn { background: #fef3c7; color: #78350f; }
.tr-conn--info { background: #e0f2fe; color: #075985; }
</style>
