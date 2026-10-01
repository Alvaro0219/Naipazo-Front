<template>
  <div class="tr-actions">
    <q-btn
      v-for="action in visible"
      :key="action.type"
      :label="ACTION_LABELS[action.type]"
      :color="action.color"
      :text-color="action.textColor"
      :outline="action.outline"
      :flat="action.flat"
      :disable="disabled"
      no-caps
      unelevated
      class="tr-actions__btn"
      @click="$emit('action', action.type)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ACTION_LABELS } from '../../utils/cards.js';

// Orden y estilo de cada botón. Qué botones aparecen lo decide el servidor (availableActions).
const STYLES = [
  { type: 'ACCEPT', color: 'positive' },
  { type: 'REJECT', color: 'negative' },
  { type: 'CALL_TRUCO', color: 'accent', textColor: 'dark' },
  { type: 'CALL_RETRUCO', color: 'accent', textColor: 'dark' },
  { type: 'CALL_VALE_CUATRO', color: 'accent', textColor: 'dark' },
  { type: 'CALL_ENVIDO', color: 'white', outline: true },
  { type: 'CALL_REAL_ENVIDO', color: 'white', outline: true },
  { type: 'CALL_FALTA_ENVIDO', color: 'white', outline: true },
  { type: 'GO_TO_DECK', color: 'white', flat: true }
];

const props = defineProps({
  available: { type: Array, required: true },
  disabled: Boolean
});
defineEmits(['action']);

const visible = computed(() => STYLES.filter((s) => props.available.includes(s.type)));
</script>

<style scoped>
.tr-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
}

.tr-actions__btn {
  min-height: 44px;
  font-weight: 700;
}
</style>
