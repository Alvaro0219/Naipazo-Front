<template>
  <svg
    class="nz-ficha"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
    focusable="false"
  >
    <circle cx="12" cy="12" r="11" fill="var(--celeste)" />
    <!-- Rayas del canto: 8 marcas blancas repartidas sobre el aro -->
    <circle cx="12" cy="12" r="9.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-dasharray="2.6 4.78" stroke-dashoffset="1.3" />
    <circle cx="12" cy="12" r="7" fill="var(--noche-2)" stroke="var(--celeste-vivo)" stroke-width="1" />
  </svg>
</template>

<script setup>
// Ficha (ESTILOS_NAIPAZO.md, 4.1): aro celeste, rayas blancas en el canto y centro azul noche. Nunca dorada.
defineProps({
  size: { type: Number, default: 18 },
  label: { type: String, default: '' }
});
</script>

<style scoped>
.nz-ficha { flex-shrink: 0; display: inline-block; vertical-align: middle; }
</style>
