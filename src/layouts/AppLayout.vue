<template>
  <div class="tr-shell">
    <aside class="tr-sidebar">
      <router-link to="/" class="tr-brand" aria-label="Naipazo, ir a Partidas">
        <SolDeMayo :size="32" />
        <span>Naipazo</span>
      </router-link>

      <BalanceChip class="tr-sidebar__balance" />

      <nav class="tr-nav" aria-label="Secciones">
        <router-link
          v-for="item in sidebarItems"
          :key="item.path"
          :to="item.path"
          class="tr-nav-link"
          :class="{ active: isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <Icono :nombre="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="tr-sidebar__user">
        <div class="tr-sidebar__username">
          <Avatar :nombre="auth.user?.username || ''" :size="32" />
          <span>{{ auth.user?.username }}</span>
        </div>
        <NzBoton variante="texto" icono="salir" label="Salir" tamano="sm" @click="handleLogout" />
      </div>
    </aside>

    <div class="tr-main">
      <header class="tr-mobile-header">
        <router-link to="/" class="tr-brand tr-brand--mobile" aria-label="Naipazo, ir a Partidas">
          <SolDeMayo :size="28" />
          <span>Naipazo</span>
        </router-link>
        <BalanceChip />
      </header>

      <main class="tr-content">
        <router-view />
      </main>

      <nav v-if="$q.screen.lt.md" class="tr-mobile-tabs" aria-label="Secciones">
        <router-link
          v-for="item in mobileItems"
          :key="item.path"
          :to="item.path"
          class="tr-mobile-tab"
          :class="{ active: isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <Icono :nombre="item.icon" :size="22" />
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
  { path: '/', label: 'Partidas', icon: 'naipes' },
  { path: '/historial', label: 'Historial', icon: 'historial' },
  { path: '/ranking', label: 'Ranking', icon: 'medalla' },
  { path: '/billetera', label: 'Billetera', icon: 'billetera' },
  { path: '/perfil', label: 'Perfil', icon: 'perfil' }
];

// El panel de admin solo va en la barra lateral (en el celular se entra desde Perfil).
const sidebarItems = computed(() => (auth.isAdmin
  ? [...navItems, { path: '/admin', label: 'Admin', icon: 'admin' }]
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

.tr-sidebar { display: none; }

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
  min-height: 44px;
  color: var(--texto);
  font-family: var(--fuente-titulo);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.tr-brand:hover { color: var(--texto); }

/* Encabezado (5.2): noche-0, el sol y Naipazo a la izquierda, el saldo con la ficha a la derecha */
.tr-mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px 8px 16px;
  padding-top: max(8px, env(safe-area-inset-top));
  background: var(--noche-0);
  border-bottom: 1px solid var(--linea);
}

.tr-content {
  flex: 1;
  /* Espacio para la navegación inferior (64 px + área segura) */
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

/* Navegación inferior (5.2): noche-0, línea arriba; el activo en celeste con un punto luminoso */
.tr-mobile-tabs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  background: var(--noche-0);
  border-top: 1px solid var(--linea);
  padding-bottom: env(safe-area-inset-bottom);
}

.tr-mobile-tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 64px;
  min-width: 0;
  color: var(--texto-suave);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.tr-mobile-tab.active { color: var(--celeste); }

.tr-mobile-tab.active::before {
  content: '';
  position: absolute;
  top: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--celeste-vivo);
  box-shadow: var(--glow-celeste-1);
}

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
    background: var(--noche-0);
    border-right: 1px solid var(--linea);
  }

  .tr-sidebar__balance { align-self: flex-start; }

  .tr-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tr-nav-link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: var(--radio-boton);
    color: var(--texto-suave);
    font-weight: 600;
    text-decoration: none;
  }

  .tr-nav-link:hover { color: var(--texto); background: rgba(143, 167, 207, 0.08); }

  .tr-nav-link.active { color: var(--celeste); background: var(--noche-2); }

  .tr-nav-link.active::before {
    content: '';
    position: absolute;
    left: 2px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--celeste-vivo);
    box-shadow: var(--glow-celeste-1);
  }

  .tr-sidebar__user {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid var(--linea);
  }

  .tr-sidebar__username {
    display: flex;
    align-items: center;
    gap: 8px;
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
