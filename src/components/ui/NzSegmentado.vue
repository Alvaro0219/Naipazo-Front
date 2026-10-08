<template>
  <div
    class="nz-seg"
    :class="{ 'nz-seg--bloque': bloque }"
    role="radiogroup"
    :aria-label="ariaLabel || undefined"
    @keydown="onKey"
  >
    <button
      v-for="(op, i) in opciones"
      :key="String(op.value)"
      ref="botones"
      type="button"
      role="radio"
      class="nz-seg__op"
      :class="{ 'nz-seg__op--activa': op.value === modelValue }"
      :aria-checked="op.value === modelValue"
      :tabindex="op.value === modelValue || (!hayActiva && i === 0) ? 0 : -1"
      :disabled="op.disable || disable"
      @click="elegir(op)"
    >
      <Icono v-if="op.icono" :nombre="op.icono" :size="16" />
      <span>{{ op.label }}</span>
    </button>
  </div>
</template>

<script setup>
// Selector segmentado (ESTILOS_NAIPAZO.md, 5.2): contenedor noche-0; la opción activa con fondo noche-3, borde
// celeste y texto blanco. Es un grupo de radios accesible: con las flechas se cambia de opción.
import { computed, nextTick, ref } from 'vue';
import Icono from './Icono.vue';

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  opciones: { type: Array, required: true }, // [{ label, value, icono?, disable? }]
  ariaLabel: { type: String, default: '' },
  bloque: Boolean,
  disable: Boolean
});
const emit = defineEmits(['update:modelValue']);
const botones = ref([]);
const hayActiva = computed(() => props.opciones.some((o) => o.value === props.modelValue));

function elegir(op) {
  if (op.disable || props.disable) return;
  emit('update:modelValue', op.value);
}

function onKey(e) {
  const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!delta) return;
  e.preventDefault();
  const habilitadas = props.opciones.filter((o) => !o.disable);
  const actual = habilitadas.findIndex((o) => o.value === props.modelValue);
  const siguiente = habilitadas[(actual + delta + habilitadas.length) % habilitadas.length];
  if (!siguiente) return;
  emit('update:modelValue', siguiente.value);
  nextTick(() => botones.value[props.opciones.indexOf(siguiente)]?.focus());
}
</script>

<style scoped>
.nz-seg {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  background: var(--noche-0);
  border: 1px solid var(--linea-control);
  border-radius: var(--radio-boton);
}

.nz-seg--bloque { display: flex; width: 100%; }
.nz-seg--bloque .nz-seg__op { flex: 1; }

.nz-seg__op {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--texto-suave);
  font: 600 14px/1.2 var(--fuente-texto);
  cursor: pointer;
  transition: color 100ms ease, background-color 100ms ease;
}

.nz-seg__op:hover:not(:disabled) { color: var(--texto); }

.nz-seg__op--activa {
  background: var(--noche-3);
  border-color: var(--celeste);
  color: var(--texto);
}

.nz-seg__op:disabled { opacity: 0.4; cursor: default; }
</style>
