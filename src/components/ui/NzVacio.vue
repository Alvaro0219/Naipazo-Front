<template>
  <div class="nz-vacio">
    <Icono :nombre="icono" :size="40" />
    <p>{{ texto }}</p>
    <slot />
  </div>
</template>

<script setup>
// Estado vacío (ESTILOS_NAIPAZO.md, 5.2): ícono de trazo, una línea que invite a actuar y su acción si existe.
import Icono from './Icono.vue';

defineProps({
  icono: { type: String, default: 'naipe' },
  texto: { type: String, required: true }
});
</script>

<style scoped>
.nz-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
  color: var(--texto-suave);
}

.nz-vacio p {
  margin: 0;
  max-width: 32ch;
  font-size: 15px;
}
</style>
