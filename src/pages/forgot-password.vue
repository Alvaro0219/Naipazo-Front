<template>
  <div class="tr-auth-shell">
    <div class="tr-auth-card">
      <div class="tr-auth-brand">
        <img src="/favicon.svg" alt="" />
        <div>
          <strong>Recuperar contraseña</strong>
          <span>Te mandamos un enlace para elegir una nueva</span>
        </div>
      </div>

      <q-banner v-if="sent" rounded class="bg-green-1 text-green-10 q-mb-md" role="status">
        <template #avatar><q-icon name="mark_email_read" color="positive" /></template>
        Si el email está registrado, te enviamos un enlace para cambiar la contraseña. Vence en 1 hora.
        Revisá también la carpeta de spam.
      </q-banner>

      <q-form v-else class="column q-gutter-y-sm" greedy @submit.prevent="handleSubmit">
        <q-input
          v-model="email"
          type="email"
          label="Email de tu cuenta"
          outlined
          autocomplete="email"
          autocapitalize="off"
          :rules="[rules.required('El email'), rules.email]"
          lazy-rules
        />
        <q-btn type="submit" color="primary" size="lg" unelevated no-caps label="Enviar enlace" :loading="loading" class="full-width" />
      </q-form>

      <div class="tr-auth-footer">
        <router-link to="/login">Volver a entrar</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { forgotPasswordApi } from '../services/api.js';
import { rules } from '../utils/validators.js';

const $q = useQuasar();
const email = ref('');
const loading = ref(false);
const sent = ref(false);

async function handleSubmit() {
  loading.value = true;
  try {
    await forgotPasswordApi(email.value.trim());
    sent.value = true;
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo enviar el email' });
  } finally {
    loading.value = false;
  }
}
</script>
