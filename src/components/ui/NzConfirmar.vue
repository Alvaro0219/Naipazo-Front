<template>
  <NzHoja ref="dialogRef" :titulo="titulo" @hide="onDialogHide">
    <p class="nz-confirmar__mensaje">{{ mensaje }}</p>
    <template #acciones>
      <template v-if="destructiva">
        <NzBoton variante="texto" tono="rojo" :label="aceptar" @click="onDialogOK" />
        <NzBoton variante="principal" :label="cancelar" @click="onDialogCancel" />
      </template>
      <template v-else>
        <NzBoton variante="texto" :label="cancelar" @click="onDialogCancel" />
        <NzBoton variante="principal" :label="aceptar" @click="onDialogOK" />
      </template>
    </template>
  </NzHoja>
</template>

<script setup>
// Confirmación en hoja inferior (ESTILOS_NAIPAZO.md, 5.2 y 6.9). Se abre con composables/useConfirmar.js.
// Si la acción es destructiva, la principal es "seguir" y la destructiva va como texto rojo.
import { useDialogPluginComponent } from 'quasar';
import NzBoton from './NzBoton.vue';
import NzHoja from './NzHoja.vue';

defineProps({
  titulo: { type: String, required: true },
  mensaje: { type: String, default: '' },
  aceptar: { type: String, required: true },
  cancelar: { type: String, default: 'Cancelar' },
  destructiva: Boolean
});
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
</script>

<style scoped>
.nz-confirmar__mensaje {
  margin: 0;
  color: var(--texto);
  font-size: 15px;
  line-height: 1.5;
}
</style>
