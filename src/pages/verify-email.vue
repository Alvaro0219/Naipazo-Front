<template>
  <AuthMarco titulo="Verificar email">
    <LoadingState v-if="state === 'loading'" loading label="Verificando tu email…" :skeleton-rows="1" />

    <NzAviso v-else-if="state === 'ok'" tono="verde" icono="verificado">
      ¡Listo! Tu email quedó verificado. Desde ahora recibís tus fichas diarias.
    </NzAviso>

    <NzAviso v-else tono="rojo">
      {{ errorMessage }}
    </NzAviso>

    <div class="tr-auth-footer">
      <router-link :to="auth.isAuthenticated ? '/' : '/login'">
        {{ auth.isAuthenticated ? 'Ir a las partidas' : 'Entrar' }}
      </router-link>
    </div>
  </AuthMarco>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AuthMarco from '../components/AuthMarco.vue';
import LoadingState from '../components/LoadingState.vue';
import { verifyEmailApi } from '../services/api.js';
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
    // Si hay sesión en este navegador, se actualiza el usuario y se cobra el crédito del día
    if (auth.isAuthenticated) {
      await auth.refreshUser().catch(() => {});
      useWalletStore().refresh();
    }
    state.value = 'ok';
  } catch (e) {
    state.value = 'error';
    errorMessage.value = e.message || 'No se pudo verificar el email';
  }
});
</script>
