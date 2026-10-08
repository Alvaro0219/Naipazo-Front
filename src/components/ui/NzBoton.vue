<template>
  <q-btn
    v-bind="$attrs"
    class="nz-boton"
    :class="[`nz-boton--${variante}`, `nz-boton--${tono}`, `nz-boton--${tamano}`, { 'nz-boton--bloque': bloque, 'nz-boton--icono': soloIcono }]"
    flat
    no-caps
    :ripple="false"
    :round="soloIcono"
    :label="undefined"
    :aria-label="soloIcono ? ariaLabel || label : ariaLabel || undefined"
  >
    <span class="nz-boton__brillo" aria-hidden="true" />
    <span class="nz-boton__contenido">
      <Icono v-if="icono" :nombre="icono" :size="tamanoIcono" />
      <slot>{{ soloIcono ? '' : label }}</slot>
      <Icono v-if="iconoDerecha" :nombre="iconoDerecha" :size="tamanoIcono" />
    </span>
  </q-btn>
</template>

<script setup>
// Botón base (ESTILOS_NAIPAZO.md, 5.1). Envuelve a q-btn por su comportamiento (router, carga, submit) pero con
// aspecto propio. Variantes: principal (una por pantalla), luminoso (cantos, Quiero/No quiero, Unirme),
// secundario y texto.
import { computed } from 'vue';
import Icono from './Icono.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  variante: { type: String, default: 'secundario' }, // principal | luminoso | secundario | texto
  tono: { type: String, default: 'celeste' }, // celeste | verde | rojo (luminoso y texto)
  tamano: { type: String, default: 'md' }, // md (44 px) | lg (48 px, cantos) | xl (56 px, Quiero / No quiero) | sm (44 px con menos relleno)
  label: { type: String, default: '' },
  icono: { type: String, default: '' },
  iconoDerecha: { type: String, default: '' },
  soloIcono: Boolean, // botón redondo con un ícono: requiere label (se usa como aria-label)
  bloque: Boolean, // ancho completo
  ariaLabel: { type: String, default: '' }
});

const tamanoIcono = computed(() => (props.soloIcono ? 22 : props.tamano === 'sm' ? 16 : 20));
</script>

<style scoped>
.nz-boton {
  position: relative;
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--radio-boton);
  font-family: var(--fuente-texto);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--texto);
  transition: transform 100ms ease, opacity 100ms ease;
}

.nz-boton :deep(.q-focus-helper),
.nz-boton::before { display: none; }

.nz-boton :deep(.q-btn__content) { position: relative; z-index: 1; }

.nz-boton__contenido {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1.2;
}

/* Capa de brillo: al presionar sube un nivel animando solo su opacidad (12.1) */
.nz-boton__brillo {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms ease;
}

.nz-boton:active:not(.disabled) { transform: scale(0.97); }
.nz-boton:active:not(.disabled) .nz-boton__brillo { opacity: 1; }

/* Chico: menos relleno y letra, pero la zona táctil sigue siendo de 44 px (4) */
.nz-boton--sm { min-height: 44px; padding: 0 12px; font-size: 14px; }
.nz-boton--lg { min-height: 48px; }
.nz-boton--xl { min-height: 56px; font-size: 17px; }
.nz-boton--bloque { width: 100%; }
.nz-boton--icono { width: 44px; min-width: 44px; padding: 0; }

/* Principal: relleno celeste, texto noche-0 en Bricolage */
.nz-boton--principal {
  background: var(--celeste);
  color: var(--noche-0);
  font-family: var(--fuente-titulo);
  font-weight: 700;
  box-shadow: var(--glow-celeste-2) !important;
}
.nz-boton--principal .nz-boton__brillo { box-shadow: var(--glow-celeste-3); }

/* Luminoso: fondo del color al 14 %, borde 1,5 px, texto en el color vivo, resplandor nivel 2 */
.nz-boton--luminoso {
  font-family: var(--fuente-titulo);
  font-weight: 700;
  border: 1.5px solid var(--nz-color);
  background: color-mix(in srgb, var(--nz-color) 14%, transparent);
  color: var(--nz-color-vivo);
  box-shadow: var(--nz-glow) !important;
}
.nz-boton--luminoso .nz-boton__brillo { box-shadow: var(--nz-glow-mas); }
.nz-boton--luminoso.nz-boton--celeste { --nz-color: var(--celeste); --nz-color-vivo: var(--celeste-vivo); --nz-glow: var(--glow-celeste-2); --nz-glow-mas: var(--glow-celeste-3); }
.nz-boton--luminoso.nz-boton--verde { --nz-color: var(--verde); --nz-color-vivo: var(--verde); --nz-glow: var(--glow-verde-2); --nz-glow-mas: 0 0 28px rgba(61, 220, 132, 0.5); }
.nz-boton--luminoso.nz-boton--rojo { --nz-color: var(--rojo); --nz-color-vivo: var(--rojo); --nz-glow: var(--glow-rojo-2); --nz-glow-mas: 0 0 28px rgba(255, 90, 110, 0.5); }

/* Secundario: transparente con borde línea */
.nz-boton--secundario {
  background: transparent;
  border: 1px solid var(--linea-control);
  color: var(--texto);
}
.nz-boton--secundario:hover { border-color: var(--texto-suave); }
.nz-boton--secundario.nz-boton--rojo { color: var(--rojo); }

/* Texto: solo texto suave */
.nz-boton--texto {
  background: transparent;
  color: var(--texto-suave);
  padding: 0 10px;
}
.nz-boton--texto:hover { color: var(--texto); }
.nz-boton--texto.nz-boton--rojo { color: var(--rojo); }
.nz-boton--texto.nz-boton--celeste.nz-boton--activo { color: var(--celeste); }

/* Deshabilitado (evitarlo): 40 % y sin resplandor */
.nz-boton.disabled {
  opacity: 0.4 !important;
  box-shadow: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .nz-boton:active:not(.disabled) { transform: none; }
}
</style>
