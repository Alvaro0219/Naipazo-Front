<template>
  <q-dialog
    ref="dialogo"
    v-bind="$attrs"
    :model-value="modelValue"
    :maximized="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @hide="emit('hide')"
  >
    <div class="nz-hoja">
      <header v-if="titulo || $slots.encabezado" class="nz-hoja__encabezado">
        <slot name="encabezado">
          <h2 class="nz-hoja__titulo">{{ titulo }}</h2>
        </slot>
      </header>
      <div class="nz-hoja__cuerpo">
        <slot />
      </div>
      <footer v-if="$slots.acciones" class="nz-hoja__acciones">
        <slot name="acciones" />
      </footer>
    </div>
  </q-dialog>
</template>

<script setup>
// Diálogo de Naipazo: flota centrado en la pantalla (también en el celular, por decisión del dueño, en lugar de la
// hoja inferior de la guía 5.2), con el borde celeste iluminado alrededor y radio de 24 px.
import { ref } from 'vue';

defineOptions({ inheritAttrs: false });
defineProps({
  // Sin v-model (null) la abre y cierra quien la usa con show() / hide(): así la usa el plugin de diálogos
  modelValue: { type: Boolean, default: null },
  titulo: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'hide']);
const dialogo = ref(null);
defineExpose({ show: () => dialogo.value?.show(), hide: () => dialogo.value?.hide() });
</script>

<style scoped>
.nz-hoja {
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
  background: var(--noche-2);
  color: var(--texto);
  border: 1px solid var(--celeste);
  border-radius: var(--radio-hoja);
  box-shadow: var(--glow-celeste-2) !important;
  overflow: hidden;
}

.nz-hoja__encabezado { padding: 20px 20px 4px; }

.nz-hoja__titulo {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
}

.nz-hoja__cuerpo {
  padding: 12px 20px 20px;
  overflow-y: auto;
}

.nz-hoja__acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 20px;
}
</style>
