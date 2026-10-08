<template>
  <q-input
    v-bind="$attrs"
    class="nz-campo"
    outlined
    stack-label
    hide-bottom-space
    no-error-icon
  >
    <template v-for="(_, nombre) in $slots" #[nombre]="datos">
      <slot :name="nombre" v-bind="datos || {}" />
    </template>
  </q-input>
</template>

<script setup>
// Campo de texto (ESTILOS_NAIPAZO.md, 5.2): fondo noche-0, borde línea, etiqueta siempre visible arriba,
// foco celeste y error en rojo con ícono (los colores salen de css/base.css). Pasa todo a q-input.
defineOptions({ inheritAttrs: false });
</script>

<style scoped>
.nz-campo :deep(.q-field__control) { min-height: 48px; }
.nz-campo :deep(.q-field__label) { font-size: 14px; }
</style>
