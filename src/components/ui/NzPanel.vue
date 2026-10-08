<template>
  <component :is="tag" class="nz-panel" :class="{ 'nz-panel--luz': luz, 'nz-panel--elevado': elevado }">
    <slot />
  </component>
</template>

<script setup>
// Panel (ESTILOS_NAIPAZO.md, 5.2): fondo noche-2, borde fino, sin sombra. Solo brilla (luz) si es lo accionable
// más importante de la pantalla; "elevado" usa noche-3 (saldo, avisos).
defineProps({
  tag: { type: String, default: 'section' },
  luz: Boolean,
  elevado: Boolean
});
</script>

<style scoped>
.nz-panel {
  background: var(--noche-2);
  border: 1px solid var(--linea);
  border-radius: var(--radio-panel);
  padding: 16px;
  color: var(--texto);
}

.nz-panel--elevado { background: var(--noche-3); }

.nz-panel--luz {
  border-color: var(--celeste);
  box-shadow: var(--glow-celeste-2);
}
</style>
