<template>
  <div class="tr-auth-shell">
    <div class="tr-auth-card">
      <div class="tr-auth-brand">
        <img src="/favicon.svg" alt="" />
        <div>
          <strong>Truco Online</strong>
          <span>Entrá y jugá con tus fichas del día</span>
        </div>
      </div>

      <q-banner v-if="reasonMessage" dense rounded class="bg-amber-1 text-brown-9 q-mb-md">
        <template #avatar><q-icon name="schedule" color="warning" /></template>
        {{ reasonMessage }}
      </q-banner>

      <q-form ref="formRef" class="column q-gutter-y-sm" greedy @submit.prevent="handleSubmit">
        <q-input
          v-model="form.identifier"
          label="Email o nombre de usuario"
          outlined
          autocomplete="username"
          autocapitalize="off"
          :rules="[rules.required('El email o nombre de usuario')]"
          lazy-rules
        />
        <q-input
          v-model="form.password"
          label="Contraseña"
          outlined
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          :rules="[rules.required('La contraseña')]"
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

        <q-btn
          type="submit"
          color="primary"
          size="lg"
          unelevated
          no-caps
          label="Entrar"
          :loading="loading"
          class="full-width"
        />
      </q-form>

      <div class="tr-auth-footer">
        ¿No tenés cuenta? <router-link to="/registro">Creá una gratis</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
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
