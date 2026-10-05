<template>
  <div class="tr-auth-shell">
    <div class="tr-auth-card">
      <div class="tr-auth-brand">
        <img src="/favicon.svg" alt="" />
        <div>
          <strong>Nueva contraseña</strong>
          <span>Al cambiarla se cierran todas tus sesiones abiertas</span>
        </div>
      </div>

      <q-banner v-if="!token" rounded class="bg-red-1 text-red-10 q-mb-md" role="alert">
        El enlace está incompleto. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".
      </q-banner>

      <q-form v-else class="column q-gutter-y-sm" greedy @submit.prevent="handleSubmit">
        <q-input
          v-model="password"
          label="Contraseña nueva"
          outlined
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :rules="[rules.password]"
          lazy-rules
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
        <q-input
          v-model="confirm"
          label="Repetí la contraseña"
          outlined
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :rules="[(v) => v === password || 'Las contraseñas no coinciden']"
          lazy-rules
        />
        <q-btn type="submit" color="primary" size="lg" unelevated no-caps label="Cambiar contraseña" :loading="loading" class="full-width" />
      </q-form>

      <div class="tr-auth-footer">
        <router-link to="/recuperar">Pedir un enlace nuevo</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { resetPasswordApi } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { rules } from '../utils/validators.js';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const token = typeof route.query.token === 'string' ? route.query.token : '';
const password = ref('');
const confirm = ref('');
const showPassword = ref(false);
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await resetPasswordApi(token, password.value);
    // El servidor invalidó todas las sesiones: también la de este navegador, si había
    auth.clearSession();
    $q.notify({ type: 'positive', message: 'Listo, ya podés entrar con tu contraseña nueva.' });
    router.replace('/login');
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo cambiar la contraseña' });
  } finally {
    loading.value = false;
  }
}
</script>
