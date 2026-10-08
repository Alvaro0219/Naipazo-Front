<template>
  <span class="nz-chip" :class="`nz-chip--${tono}`">
    <Icono v-if="icono" :nombre="icono" :size="14" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
// Chip (ESTILOS_NAIPAZO.md, 5.2): borde línea, texto suave, 12–13 px. Tonos para significados puntuales:
// oro solo para victorias y premios, celeste para lo propio o lo activo.
import Icono from './Icono.vue';

defineProps({
  label: { type: [String, Number], default: '' },
  icono: { type: String, default: '' },
  tono: { type: String, default: 'neutro' } // neutro | celeste | oro | verde | rojo | ambar
});
</script>

<style scoped>
.nz-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 2px 10px;
  border: 1px solid var(--linea);
  border-radius: 999px;
  color: var(--texto-suave);
  font: 600 13px/1.2 var(--fuente-texto);
  white-space: nowrap;
}

.nz-chip--celeste { border-color: var(--celeste); color: var(--celeste-vivo); }
.nz-chip--oro { border-color: var(--oro); color: var(--oro); }
.nz-chip--verde { border-color: var(--verde); color: var(--verde); }
.nz-chip--rojo { border-color: var(--rojo); color: var(--rojo); }
.nz-chip--ambar { border-color: var(--ambar); color: var(--ambar); }
</style>
