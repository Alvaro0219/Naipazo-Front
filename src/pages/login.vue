<template>
  <AuthMarco>
    <NzAviso v-if="reasonMessage" icono="reloj" class="q-mb-md">{{ reasonMessage }}</NzAviso>

    <q-form ref="formRef" class="column q-gutter-y-md" greedy @submit.prevent="handleSubmit">
      <NzCampo
        v-model="form.identifier"
        label="Email o nombre de usuario"
        autocomplete="username"
        autocapitalize="off"
        :rules="[rules.required('El email o nombre de usuario')]"
        lazy-rules
      />
      <NzCampo
        v-model="form.password"
        label="Contraseña"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        :rules="[rules.required('La contraseña')]"
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

      <NzBoton type="submit" variante="principal" tamano="lg" bloque label="Entrar" :loading="loading" />
    </q-form>

    <div class="tr-auth-forgot">
      <router-link to="/recuperar">¿Olvidaste tu contraseña?</router-link>
    </div>

    <div class="tr-auth-footer">
      ¿No tenés cuenta? <router-link to="/registro">Creá una gratis</router-link>
    </div>
  </AuthMarco>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import AuthMarco from '../components/AuthMarco.vue';
import { useAuthStore } from '../stores/auth.js';
import { rules } from '../utils/validators.js';

const REASONS = {
  'session-expired': 'Tu sesión expiró. Volvé a iniciar sesión.'
};

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const formRef = ref(null);
const form = reactive({ identifier: '', password: '' });
const loading = ref(false);
const showPassword = ref(false);

const storedReason = sessionStorage.getItem('auth_redirect_reason');
sessionStorage.removeItem('auth_redirect_reason');
const reasonMessage = ref(REASONS[storedReason] || '');

async function handleSubmit() {
  loading.value = true;
  try {
    await auth.login(form.identifier.trim(), form.password);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/';
    router.replace(redirect);
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo iniciar sesión' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tr-auth-forgot {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}
</style>
