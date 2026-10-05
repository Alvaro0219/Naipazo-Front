<template>
  <div class="tr-shell">
    <aside class="tr-sidebar">
      <router-link to="/" class="tr-brand">
        <img src="/favicon.svg" alt="" />
        <span>Naipazo</span>
      </router-link>

      <BalanceChip dark class="tr-sidebar__balance" />

      <nav class="tr-nav">
        <router-link
          v-for="item in sidebarItems"
          :key="item.path"
          :to="item.path"
          class="tr-nav-link"
          :class="{ active: isActive(item.path) }"
        >
          <q-icon :name="item.icon" size="20px" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="tr-sidebar__user">
        <div class="tr-sidebar__username">
          <q-icon name="person" size="18px" />
          <span>{{ auth.user?.username }}</span>
        </div>
        <q-btn flat dense no-caps icon="logout" label="Salir" color="white" @click="handleLogout" />
      </div>
    </aside>

    <div class="tr-main">
      <header class="tr-mobile-header">
        <router-link to="/" class="tr-brand tr-brand--mobile">
          <img src="/favicon.svg" alt="" />
          <span>Naipazo</span>
        </router-link>
        <div class="tr-mobile-header__right">
          <BalanceChip dark />
        </div>
      </header>

      <main class="tr-content">
        <router-view />
      </main>

      <nav v-if="$q.screen.lt.md" class="tr-mobile-tabs">
        <router-link
          v-for="item in mobileItems"
          :key="item.path"
          :to="item.path"
          class="tr-mobile-tab"
          :class="{ active: isActive(item.path) }"
        >
          <q-icon :name="item.icon" size="22px" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import BalanceChip from '../components/BalanceChip.vue';
import { useSocket } from '../composables/useSocket.js';
import { useAuthStore } from '../stores/auth.js';
import { useWalletStore } from '../stores/wallet.js';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const wallet = useWalletStore();

const navItems = [
  { path: '/', label: 'Partidas', icon: 'style' },
  { path: '/historial', label: 'Historial', icon: 'history' },
  { path: '/ranking', label: 'Ranking', icon: 'emoji_events' },
  { path: '/billetera', label: 'Billetera', icon: 'account_balance_wallet' },
  { path: '/perfil', label: 'Perfil', icon: 'person' }
];

// El panel de admin solo va en la barra lateral (en el celular se entra desde Perfil).
const sidebarItems = computed(() => (auth.isAdmin
  ? [...navItems, { path: '/admin', label: 'Admin', icon: 'admin_panel_settings' }]
  : navItems));
const mobileItems = navItems;

function isActive(path) {
  // Partidas también queda marcada en el detalle de un torneo (se entra desde ahí)
  if (path === '/') return route.path === '/' || route.path.startsWith('/torneos');
  return route.path.startsWith(path);
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

// Autorecuperación: si el saldo queda vacío o la pestaña vuelve a estar a la vista, se relee
watch(() => wallet.balance, (value, previous) => {
  if (value !== null || !auth.isAuthenticated) return;
  // No debería pasar con la sesión abierta: se registra para diagnosticar y se relee
  if (previous !== null && previous !== undefined) console.warn('[wallet] el saldo quedó vacío', { previous, lastSource: wallet.lastSource });
  wallet.refresh();
});
// El email se verifica en otra pestaña o dispositivo: al volver se relee el usuario si seguía sin verificar
function refreshUnverifiedUser() {
  if (auth.user?.emailVerified === false) auth.refreshUser().catch(() => {});
}
function onVisible() {
  if (document.visibilityState !== 'visible') return;
  wallet.refresh();
  refreshUnverifiedUser();
}
document.addEventListener('visibilitychange', onVisible);
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible));

onMounted(async () => {
  // Un solo socket para toda la app: así llegan los avisos (saldo, partidas de torneo) en cualquier pantalla
  useSocket().connect();
  // Trae el saldo y dispara el crédito diario si corresponde
  try {
    await wallet.fetch();
  } catch (e) {
    if (e.status !== 401) $q.notify({ type: 'negative', message: e.message });
  }
  refreshUnverifiedUser();
});
</script>

<style scoped>
.tr-shell {
  display: flex;
  min-height: 100%;
}

.tr-sidebar {
  display: none;
}

.tr-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tr-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
}

.tr-brand img { width: 34px; height: 34px; }
.tr-brand--mobile img { width: 30px; height: 30px; }

.tr-mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: #14532d;
}

.tr-mobile-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tr-content {
  flex: 1;
  padding-bottom: 72px; /* espacio para las tabs inferiores */
}

.tr-mobile-tabs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  padding-bottom: env(safe-area-inset-bottom);
}

.tr-mobile-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 10px;
  min-height: 56px;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: none;
  min-width: 0;
}

.tr-mobile-tab.active { color: #166534; }

@media (min-width: 1024px) {
  .tr-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 14px;
    background: #14532d;
    color: #fff;
  }

  .tr-sidebar__balance { align-self: flex-start; }

  .tr-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tr-nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
    text-decoration: none;
  }

  .tr-nav-link:hover { background: rgba(255, 255, 255, 0.08); }

  .tr-nav-link.active {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  .tr-sidebar__user {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  .tr-sidebar__username {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-weight: 600;
  }

  .tr-sidebar__username span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tr-mobile-header { display: none; }
  .tr-content { padding-bottom: 0; }
}
</style>
