<template>
  <router-link to="/billetera" class="tr-balance-chip" :class="{ 'tr-balance-chip--dark': dark }" aria-label="Ver billetera">
    <span class="tr-balance-chip__coin" aria-hidden="true" />
    <span class="tr-num">{{ wallet.balance === null ? '—' : formatChips(wallet.balance) }}</span>
  </router-link>
</template>

<script setup>
import { useWalletStore } from '../stores/wallet.js';
import { formatChips } from '../utils/format.js';

defineProps({ dark: Boolean });

const wallet = useWalletStore();
</script>

<style scoped>
.tr-balance-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border-radius: 999px;
  background: #fefce8;
  border: 1px solid #fde68a;
  color: #713f12;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.tr-balance-chip--dark {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(253, 230, 138, 0.45);
  color: #fef9c3;
}

.tr-balance-chip__coin {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fde047, #ca8a04 70%);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
}
</style>
