<template>
  <AuthMarco titulo="Nueva contraseña" subtitulo="Al cambiarla se cierran todas tus sesiones abiertas.">
    <NzAviso v-if="!token" tono="rojo" class="q-mb-md">
      El enlace está incompleto. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".
    </NzAviso>

    <q-form v-else class="column q-gutter-y-md" greedy @submit.prevent="handleSubmit">
      <NzCampo
        v-model="password"
        label="Contraseña nueva"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        :rules="[rules.password]"
        lazy-rules
      >
        <template #append>
          <button
            type="button"
            class="nz-campo-boton"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <Icono :nombre="showPassword ? 'ocultar' : 'ver'" />
          </button>
        </template>
      </NzCampo>
      <NzCampo
        v-model="confirm"
        label="Repetí la contraseña"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        :rules="[(v) => v === password || 'Las contraseñas no coinciden']"
        lazy-rules
      />
      <NzBoton type="submit" variante="principal" tamano="lg" bloque label="Cambiar contraseña" :loading="loading" />
    </q-form>

    <div class="tr-auth-footer">
      <router-link to="/recuperar">Pedir un enlace nuevo</router-link>
    </div>
  </AuthMarco>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import AuthMarco from '../components/AuthMarco.vue';
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
