<template>
  <div class="tr-chips-notice" :class="{ 'tr-chips-notice--compact': compact }" role="note">
    <q-icon name="info" size="18px" class="tr-chips-notice__icon" />
    <span>
      Las fichas son <strong>virtuales</strong>, no tienen valor monetario y no son canjeables.
      <template v-if="!compact">No se compran: solo se obtienen con el crédito diario y ganando partidas.</template>
    </span>
  </div>
</template>

<script setup>
defineProps({ compact: Boolean });
</script>

<style scoped>
.tr-chips-notice {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fefce8;
  border: 1px solid #fde68a;
  color: #713f12;
  font-size: 0.85rem;
  line-height: 1.4;
}

.tr-chips-notice--compact { font-size: 0.8rem; }

.tr-chips-notice__icon {
  color: #ca8a04;
  margin-top: 1px;
  flex-shrink: 0;
}
</style>
