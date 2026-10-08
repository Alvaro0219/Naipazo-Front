<template>
  <div class="nz-skel" role="status" aria-live="polite">
    <span class="nz-sr">{{ texto }}</span>
    <div
      v-for="n in filas"
      :key="n"
      class="nz-skel__fila"
      :style="{ height: `${alto}px` }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
// Carga (ESTILOS_NAIPAZO.md, 5.2): bloques noche-2 con un brillo suave (opacidad), sin spinners genéricos.
defineProps({
  filas: { type: Number, default: 3 },
  alto: { type: Number, default: 64 },
  texto: { type: String, default: 'Cargando…' }
});
</script>

<style scoped>
.nz-skel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nz-skel__fila {
  border-radius: var(--radio-panel);
  background: var(--noche-2);
  border: 1px solid var(--linea);
  animation: nz-skel-brillo 1.4s ease-in-out infinite;
}

.nz-skel__fila:nth-child(3) { animation-delay: 0.15s; }
.nz-skel__fila:nth-child(4) { animation-delay: 0.3s; }

@keyframes nz-skel-brillo {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .nz-skel__fila { animation: none; opacity: 0.8; }
}
</style>
