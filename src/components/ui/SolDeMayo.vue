<template>
  <svg
    class="nz-sol"
    :class="[`nz-sol--${color}`, { 'nz-sol--resplandor': conResplandor }]"
    :width="size"
    :height="size"
    :viewBox="`${-R} ${-R} ${2 * R} ${2 * R}`"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
    focusable="false"
  >
    <defs v-if="conResplandor">
      <filter :id="filtroId" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g :filter="conResplandor ? `url(#${filtroId})` : undefined">
      <circle r="34" class="nz-sol__vivo" :stroke-width="trazo(2)" />
      <circle v-if="!chico" r="19" class="nz-sol__suave" :stroke-width="trazo(1.5)" />
      <g v-for="i in 8" :key="`r${i}`" :transform="`rotate(${(i - 1) * 45})`">
        <line x1="40" y1="0" x2="70" y2="0" class="nz-sol__vivo" :stroke-width="trazo(2)" />
      </g>
      <template v-if="!chico">
        <g v-for="i in 8" :key="`o${i}`" :transform="`rotate(${(i - 1) * 45 + 22.5})`">
          <!-- Una onda completa de 3,5 de amplitud entre 40 y 64 -->
          <path d="M40 0 Q46 -7 52 0 T64 0" class="nz-sol__base" :stroke-width="trazo(1.6)" />
        </g>
      </template>
    </g>
  </svg>
</template>

<script setup>
// Sol de Mayo propio (ESTILOS_NAIPAZO.md, 4.1 y 11.2): disco, anillo interior y 16 rayos alternados
// (8 rectos y 8 ondulados), el primero recto y horizontal. Simétrico al girarlo 180°. Una sola geometría para
// el logo, el tantero, la victoria y el dorso. Medidas en unidades de la base de 240 px del dorso.
import { computed, useId } from 'vue';

const props = defineProps({
  size: { type: Number, default: 32 }, // ancho en px en pantalla
  color: { type: String, default: 'celeste' }, // celeste | oro | blanco
  // Versión chica (11.2): sin anillo interior y solo los rayos rectos. Por defecto, debajo de 60 px
  chico: { type: Boolean, default: undefined },
  resplandor: { type: Boolean, default: false },
  label: { type: String, default: '' }
});

const R = 74; // radio del dibujo (rayo más largo 70 + trazo)
const filtroId = `nz-sol-${useId()}`;
const chico = computed(() => props.chico ?? props.size < 60);
const conResplandor = computed(() => props.resplandor && !chico.value);
// Unidades del dibujo por px en pantalla
const unidadesPorPx = computed(() => (2 * R) / props.size);
// El trazo de diseño, pero nunca menos de 1 px real (así se lee como sol y no como una mancha)
const trazo = (diseno) => Math.max(diseno, unidadesPorPx.value);
</script>

<style scoped>
.nz-sol { flex-shrink: 0; display: inline-block; vertical-align: middle; overflow: visible; }

.nz-sol--celeste .nz-sol__vivo { stroke: var(--celeste-vivo); }
.nz-sol--celeste .nz-sol__base { stroke: var(--celeste); }
.nz-sol--celeste .nz-sol__suave { stroke: var(--celeste); stroke-opacity: 0.6; }

.nz-sol--oro .nz-sol__vivo,
.nz-sol--oro .nz-sol__base { stroke: var(--oro); }
.nz-sol--oro .nz-sol__suave { stroke: var(--oro); stroke-opacity: 0.6; }

.nz-sol--blanco .nz-sol__vivo,
.nz-sol--blanco .nz-sol__base { stroke: var(--texto); }
.nz-sol--blanco .nz-sol__suave { stroke: var(--texto); stroke-opacity: 0.6; }
</style>
