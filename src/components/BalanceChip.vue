<template>
  <router-link
    to="/billetera"
    class="tr-balance-chip"
    :aria-label="wallet.balance === null ? 'Ver billetera' : `Saldo: ${formatChips(wallet.balance)} fichas. Ver billetera`"
  >
    <Ficha :size="20" />
    <span class="tr-num">{{ wallet.balance === null ? '—' : formatChips(wallet.balance) }}</span>
  </router-link>
</template>

<script setup>
// Saldo del encabezado (ESTILOS_NAIPAZO.md, 5.2): la ficha (nunca dorada) y el número en Bricolage
import { useWalletStore } from '../stores/wallet.js';
import { formatChips } from '../utils/format.js';

const wallet = useWalletStore();
</script>

<style scoped>
.tr-balance-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 14px 6px 10px;
  border-radius: 999px;
  background: var(--noche-2);
  border: 1px solid var(--linea);
  color: var(--texto);
  font-family: var(--fuente-titulo);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.tr-balance-chip:hover { border-color: rgba(143, 167, 207, 0.5); color: var(--texto); }
</style>
