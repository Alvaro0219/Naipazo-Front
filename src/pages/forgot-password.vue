<template>
  <div class="tr-auth-shell">
    <div class="tr-auth-card">
      <div class="tr-auth-brand">
        <SolDeMayo :size="40" />
        <div>
          <strong>Recuperar contraseña</strong>
          <span>Te mandamos un enlace para elegir una nueva</span>
        </div>
      </div>

      <NzAviso v-if="sent" tono="verde" icono="emailOk" class="q-mb-md">
        Si el email está registrado, te enviamos un enlace para cambiar la contraseña. Vence en 1 hora.
        Revisá también la carpeta de spam.
      </NzAviso>

      <q-form v-else class="column q-gutter-y-md" greedy @submit.prevent="handleSubmit">
        <NzCampo
          v-model="email"
          type="email"
          label="Email de tu cuenta"
          autocomplete="email"
          autocapitalize="off"
          :rules="[rules.required('El email'), rules.email]"
          lazy-rules
        />
        <NzBoton type="submit" variante="principal" tamano="lg" bloque label="Enviar enlace" :loading="loading" />
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
