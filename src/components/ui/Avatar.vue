<template>
  <span class="nz-avatar" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <span class="nz-avatar__inicial" :style="{ fontSize: `${Math.round(size * 0.44)}px` }">{{ inicial }}</span>
    <span class="nz-avatar__palo" :style="{ width: `${palito}px`, height: `${palito}px` }">
      <Icono :nombre="palo" :size="Math.round(palito * 0.8)" />
    </span>
  </span>
</template>

<script>
// Avatar fuera de la mesa (ESTILOS_NAIPAZO.md, 4.1): inicial del usuario y un palo de la baraja elegido de forma
// determinista según el nombre (así se distinguen nombres parecidos). Sin caricaturas.
export const PALOS = ['espada', 'basto', 'oro', 'copa'];

/** Palo de un usuario: siempre el mismo para el mismo nombre (hash simple, sin distinguir mayúsculas). */
export function paloDe(nombre = '') {
  let h = 0;
  for (const ch of String(nombre).toLowerCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return PALOS[h % PALOS.length];
}
</script>

<script setup>
import { computed } from 'vue';
import Icono from './Icono.vue';

const props = defineProps({
  nombre: { type: String, default: '' },
  size: { type: Number, default: 40 }
});

const inicial = computed(() => (props.nombre.trim()[0] || '?').toUpperCase());
const palo = computed(() => paloDe(props.nombre));
const palito = computed(() => Math.max(16, Math.round(props.size * 0.42)));
</script>

<style scoped>
.nz-avatar {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--noche-3);
  border: 1px solid var(--linea);
  color: var(--texto);
}

.nz-avatar__inicial {
  font-family: var(--fuente-titulo);
  font-weight: 700;
  line-height: 1;
}

.nz-avatar__palo {
  position: absolute;
  right: -3px;
  bottom: -3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--noche-1);
  border: 1px solid var(--linea);
  color: var(--celeste);
}
</style>
