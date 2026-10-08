<template>
  <NzAviso v-if="visible" tono="celeste" icono="emailPendiente" class="tr-verify-banner">
    <strong>{{ config.requireEmailVerification ? 'Verificá tu email para recibir tus fichas diarias.' : 'Verificá tu email.' }}</strong>
    Te mandamos un enlace a {{ auth.user.email }}.
    <template #accion>
      <NzBoton
        variante="secundario"
        tamano="sm"
        :label="sent ? 'Email enviado' : 'Reenviar email'"
        :icono="sent ? 'tilde' : 'enviar'"
        :disable="sent"
        :loading="loading"
        @click="resend"
      />
    </template>
  </NzAviso>
</template>

<script setup>
// Banner de verificación (ESTILOS_NAIPAZO.md, 10.9): panel noche-3 con borde celeste fino
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useGameConfig } from '../composables/useGameConfig.js';
import { resendVerificationApi } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const $q = useQuasar();
const auth = useAuthStore();
const { config } = useGameConfig();
const loading = ref(false);
const sent = ref(false);

const visible = computed(() => auth.user && auth.user.emailVerified === false);

async function resend() {
  loading.value = true;
  try {
    const result = await resendVerificationApi();
    // Ya estaba verificado (por ejemplo, desde el celular): se actualiza y el aviso desaparece
    if (result?.alreadyVerified) await auth.refreshUser();
    else sent.value = true;
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo reenviar el email' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tr-verify-banner {
  margin-bottom: 12px;
}
</style>
