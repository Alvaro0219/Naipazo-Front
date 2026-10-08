<template>
  <div class="tr-chips-notice" :class="{ 'tr-chips-notice--compact': compact }" role="note">
    <Icono nombre="info" :size="18" class="tr-chips-notice__icon" />
    <span>
      Las fichas son <strong>virtuales</strong>, no tienen valor monetario y no son canjeables.
      <template v-if="!compact">No se compran: solo se obtienen con el crédito diario y ganando partidas.</template>
    </span>
  </div>
</template>

<script setup>
// Aviso obligatorio de fichas virtuales: panel con borde celeste fino (ESTILOS_NAIPAZO.md, 10.1)
defineProps({ compact: Boolean });
</script>

<style scoped>
.tr-chips-notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: var(--radio-boton);
  background: var(--noche-2);
  border: 1px solid rgba(94, 200, 255, 0.55);
  color: var(--texto);
  font-size: 14px;
  line-height: 1.45;
}

.tr-chips-notice--compact { font-size: 13px; padding: 10px 12px; }

.tr-chips-notice__icon {
  color: var(--celeste);
  margin-top: 1px;
}
</style>
