<template>
  <q-dialog
    ref="dialogo"
    v-bind="$attrs"
    :model-value="modelValue"
    :position="esCelular ? 'bottom' : 'standard'"
    :maximized="false"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @hide="emit('hide')"
  >
    <div class="nz-hoja" :class="{ 'nz-hoja--abajo': esCelular }">
      <div v-if="esCelular" class="nz-hoja__agarre" aria-hidden="true" />
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
// Hoja inferior (ESTILOS_NAIPAZO.md, 5.2): en el celular sale desde abajo con radio de 24 px arriba y un borde
// superior celeste fino; en tablet y escritorio es un diálogo centrado con el mismo aspecto.
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

defineOptions({ inheritAttrs: false });
defineProps({
  // Sin v-model (null) la abre y cierra quien la usa con show() / hide(): así la usa el plugin de diálogos
  modelValue: { type: Boolean, default: null },
  titulo: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'hide']);
const dialogo = ref(null);
defineExpose({ show: () => dialogo.value?.show(), hide: () => dialogo.value?.hide() });
const $q = useQuasar();
const esCelular = computed(() => $q.screen.lt.sm);
</script>

<style scoped>
.nz-hoja {
  width: min(520px, 100vw);
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  background: var(--noche-2);
  color: var(--texto);
  border: 1px solid var(--linea);
  border-top: 1px solid var(--celeste);
  border-radius: var(--radio-hoja);
  overflow: hidden;
}

.nz-hoja--abajo {
  width: 100vw;
  max-width: 100vw;
  border-radius: var(--radio-hoja) var(--radio-hoja) 0 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.nz-hoja__agarre {
  width: 40px;
  height: 4px;
  margin: 8px auto 0;
  border-radius: 999px;
  background: var(--linea);
}

.nz-hoja__encabezado { padding: 16px 20px 4px; }

.nz-hoja__titulo {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
}

.nz-hoja__cuerpo {
  padding: 12px 20px;
  overflow-y: auto;
}

.nz-hoja__acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 20px;
}

.nz-hoja--abajo .nz-hoja__acciones { flex-direction: column-reverse; }
.nz-hoja--abajo .nz-hoja__acciones > * { width: 100%; }
</style>
