<template>
  <div class="tr-actions">
    <NzBoton
      v-for="action in visible"
      :key="action.type"
      :label="ACTION_LABELS[action.type]"
      :variante="action.variante"
      :tono="action.tono"
      :icono="action.icono"
      :tamano="action.tamano"
      :disable="disabled"
      class="tr-actions__btn"
      @click="$emit('action', action.type)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ACTION_LABELS } from '../../utils/cards.js';

// Orden y estilo de cada botón (ESTILOS_NAIPAZO.md, 6.6). Qué botones aparecen lo decide el servidor (availableActions).
// "Quiero" siempre verde con tilde y "No quiero" siempre rojo con cruz; los cantos, luminosos celestes; el mazo, texto.
const STYLES = [
  { type: 'ACCEPT', variante: 'luminoso', tono: 'verde', icono: 'tilde', tamano: 'xl' },
  { type: 'REJECT', variante: 'luminoso', tono: 'rojo', icono: 'cerrar', tamano: 'xl' },
  { type: 'CALL_TRUCO', variante: 'luminoso', tono: 'celeste', tamano: 'lg' },
  { type: 'CALL_RETRUCO', variante: 'luminoso', tono: 'celeste', tamano: 'lg' },
  { type: 'CALL_VALE_CUATRO', variante: 'luminoso', tono: 'celeste', tamano: 'lg' },
  { type: 'CALL_ENVIDO', variante: 'luminoso', tono: 'celeste', tamano: 'lg' },
  { type: 'CALL_REAL_ENVIDO', variante: 'luminoso', tono: 'celeste', tamano: 'lg' },
  { type: 'CALL_FALTA_ENVIDO', variante: 'luminoso', tono: 'celeste', tamano: 'lg' },
  { type: 'GO_TO_DECK', variante: 'texto', tono: 'celeste', tamano: 'md' }
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
  min-height: 48px;
}
</style>
