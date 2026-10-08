<template>
  <NzSkeleton v-if="loading" :filas="skeletonRows" :alto="skeletonHeight" :texto="label" />
  <NzVacio v-else-if="empty" :icono="emptyIcon" :texto="emptyLabel">
    <slot name="empty-action" />
  </NzVacio>
  <slot v-else />
</template>

<script setup>
// Carga con skeletons y vacío con ícono de trazo (ESTILOS_NAIPAZO.md, 5.2)
defineProps({
  loading: Boolean,
  empty: Boolean,
  label: { type: String, default: 'Cargando…' },
  emptyLabel: { type: String, default: 'No hay datos para mostrar.' },
  emptyIcon: { type: String, default: 'naipe' }, // nombre de components/ui/Icono.vue
  skeletonRows: { type: Number, default: 3 },
  skeletonHeight: { type: Number, default: 64 }
});
</script>
