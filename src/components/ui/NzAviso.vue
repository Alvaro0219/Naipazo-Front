<template>
  <div class="nz-aviso" :class="`nz-aviso--${tono}`" :role="tono === 'rojo' ? 'alert' : 'status'">
    <Icono :nombre="icono || ICONO_POR_TONO[tono]" :size="20" class="nz-aviso__icono" />
    <div class="nz-aviso__texto"><slot /></div>
    <div v-if="$slots.accion" class="nz-aviso__accion"><slot name="accion" /></div>
  </div>
</template>

<script setup>
// Aviso dentro de la página (ESTILOS_NAIPAZO.md, 5.2 y 10.9): panel noche-3 con borde fino del color de su
// significado (celeste informa, verde confirma, rojo error, ámbar atención) y su ícono: nunca solo color.
import Icono from './Icono.vue';

defineProps({
  tono: { type: String, default: 'celeste' }, // celeste | verde | rojo | ambar
  icono: { type: String, default: '' }
});

const ICONO_POR_TONO = { celeste: 'info', verde: 'ok', rojo: 'alerta', ambar: 'reloj' };
</script>

<style scoped>
.nz-aviso {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--noche-3);
  border: 1px solid var(--nz-aviso-color);
  border-radius: var(--radio-boton);
  color: var(--texto);
  font-size: 14px;
  line-height: 1.45;
}

.nz-aviso--celeste { --nz-aviso-color: var(--celeste); }
.nz-aviso--verde { --nz-aviso-color: var(--verde); }
.nz-aviso--rojo { --nz-aviso-color: var(--rojo); }
.nz-aviso--ambar { --nz-aviso-color: var(--ambar); }

.nz-aviso__icono { color: var(--nz-aviso-color); margin-top: 1px; }
.nz-aviso__texto { flex: 1 1 180px; min-width: 0; }
/* Si no entra al costado, la acción baja a su propia línea, alineada a la derecha */
.nz-aviso__accion { flex-shrink: 0; align-self: center; margin-left: auto; }
</style>
