<template>
  <div class="tr-auth-shell">
    <div class="tr-auth-card">
      <div class="tr-auth-brand">
        <img src="/favicon.svg" alt="" />
        <div>
          <strong>Verificar email</strong>
          <span>Naipazo</span>
        </div>
      </div>

      <LoadingState v-if="state === 'loading'" message="Verificando tu email…" />

      <q-banner v-else-if="state === 'ok'" rounded class="bg-green-1 text-green-10" role="status">
        <template #avatar><q-icon name="verified" color="positive" /></template>
        ¡Listo! Tu email quedó verificado. Desde ahora recibís tus fichas diarias.
      </q-banner>

      <q-banner v-else rounded class="bg-red-1 text-red-10" role="alert">
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ errorMessage }}
      </q-banner>

      <div class="tr-auth-footer">
        <router-link :to="auth.isAuthenticated ? '/' : '/login'">
          {{ auth.isAuthenticated ? 'Ir a las partidas' : 'Entrar' }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import LoadingState from '../components/LoadingState.vue';
import { fetchMe, verifyEmailApi } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useWalletStore } from '../stores/wallet.js';

const route = useRoute();
const auth = useAuthStore();
const state = ref('loading');
const errorMessage = ref('');

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  if (!token) {
    state.value = 'error';
    errorMessage.value = 'El enlace está incompleto. Pedí uno nuevo desde el aviso de las partidas.';
    return;
  }
  try {
    await verifyEmailApi(token);
    state.value = 'ok';
    // Si hay sesión en este navegador, se actualiza el usuario y se cobra el crédito del día
    if (auth.isAuthenticated) {
      auth.user = await fetchMe();
      auth.saveSession();
      useWalletStore().refresh();
    }
  } catch (e) {
    state.value = 'error';
    errorMessage.value = e.message || 'No se pudo verificar el email';
  }
});
</script>
