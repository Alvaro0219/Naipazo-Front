<template>
  <div class="tr-apuesta" role="group" :aria-labelledby="idEtiqueta">
    <div :id="idEtiqueta" class="tr-apuesta__etiqueta">{{ etiqueta }}</div>

    <div class="tr-apuesta__rapidas">
      <button
        v-for="valor in rapidas"
        :key="valor"
        type="button"
        class="tr-apuesta__chip tr-num"
        :class="{ 'tr-apuesta__chip--activa': modelValue === valor }"
        :aria-pressed="modelValue === valor"
        :disabled="valor > maximo"
        @click="emit('update:modelValue', valor)"
      >
        {{ valor ? formatChips(valor) : 'Gratis' }}
      </button>
    </div>

    <div class="tr-apuesta__ajuste">
      <NzBoton
        variante="secundario"
        solo-icono
        icono="menos"
        :label="`Bajar ${formatChips(paso)} fichas`"
        :disable="modelValue <= 0"
        @click="mover(-paso)"
      />
      <output class="tr-apuesta__valor tr-num" aria-live="polite">
        <template v-if="modelValue">{{ formatChips(modelValue) }} <small>fichas</small></template>
        <template v-else>Gratis</template>
      </output>
      <NzBoton
        variante="secundario"
        solo-icono
        icono="mas"
        :label="`Subir ${formatChips(paso)} fichas`"
        :disable="modelValue + paso > maximo"
        @click="mover(paso)"
      />
    </div>

    <p class="tr-apuesta__saldo tr-num">Saldo disponible: {{ formatChips(saldo) }} fichas</p>
  </div>
</template>

<script setup>
// Apuesta o inscripción (ESTILOS_NAIPAZO.md, 10.3) [Cambio de UX]: chips rápidos y un control de − y + de a 500, siempre
// dentro del saldo y del máximo del servidor; el saldo disponible debajo.
import { computed, useId } from 'vue';
import { formatChips } from '../utils/format.js';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  etiqueta: { type: String, default: 'Apuesta' },
  saldo: { type: Number, default: 0 },
  maximoServidor: { type: Number, default: 10000 },
  paso: { type: Number, default: 500 }
});
const emit = defineEmits(['update:modelValue']);

const RAPIDAS = [0, 500, 1000, 2500, 5000];
const idEtiqueta = `tr-apuesta-${useId()}`;
// Lo máximo que se puede elegir: lo que permite el servidor y lo que tenés
const maximo = computed(() => Math.min(props.maximoServidor, props.saldo));
// Los chips que superan lo que permite el servidor no se muestran; los que superan tu saldo, deshabilitados
const rapidas = computed(() => RAPIDAS.filter((v) => v <= props.maximoServidor));

function mover(delta) {
  const valor = Math.min(maximo.value, Math.max(0, props.modelValue + delta));
  emit('update:modelValue', Math.floor(valor / props.paso) * props.paso);
}
</script>

<style scoped>
.tr-apuesta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tr-apuesta__etiqueta {
  font-weight: 600;
  font-size: 14px;
  color: var(--texto-suave);
}

.tr-apuesta__rapidas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tr-apuesta__chip {
  min-height: 44px;
  min-width: 64px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--linea-control);
  background: var(--noche-0);
  color: var(--texto);
  font: 600 14px/1 var(--fuente-texto);
  cursor: pointer;
}

.tr-apuesta__chip:hover:not(:disabled) { border-color: var(--texto-suave); }

.tr-apuesta__chip--activa {
  border-color: var(--celeste);
  background: var(--noche-3);
  color: var(--celeste-vivo);
  box-shadow: var(--glow-celeste-1);
}

.tr-apuesta__chip:disabled { opacity: 0.4; cursor: default; }

.tr-apuesta__ajuste {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px;
  border-radius: var(--radio-boton);
  background: var(--noche-0);
  border: 1px solid var(--linea);
}

.tr-apuesta__valor {
  flex: 1;
  text-align: center;
  font-family: var(--fuente-titulo);
  font-size: 24px;
  font-weight: 700;
}

.tr-apuesta__valor small {
  color: var(--texto-suave);
  font-family: var(--fuente-texto);
  font-size: 14px;
  font-weight: 600;
}

.tr-apuesta__saldo {
  margin: 0;
  color: var(--texto-suave);
  font-size: 13px;
}
</style>
