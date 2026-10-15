<template>
  <AuthMarco titulo="Creá tu cuenta" subtitulo="Recibís 1.000 fichas virtuales gratis por día.">
    <q-form ref="formRef" class="column q-gutter-y-md" greedy @submit.prevent="handleSubmit">
      <NzCampo
        v-model="form.username"
        label="Nombre de usuario"
        maxlength="20"
        autocomplete="username"
        autocapitalize="off"
        hint="3 a 20 caracteres: letras, números, “_” y “.”. No se puede cambiar después."
        :rules="[rules.username]"
        :error="!!fieldErrors.username"
        :error-message="fieldErrors.username"
        :loading="checking.username"
      >
        <template v-if="available.username" #append>
          <Icono nombre="ok" label="Disponible" class="tr-disponible" />
        </template>
      </NzCampo>

      <NzCampo
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        autocapitalize="off"
        :rules="[rules.email]"
        :error="!!fieldErrors.email"
        :error-message="fieldErrors.email"
        :loading="checking.email"
      >
        <template v-if="available.email" #append>
          <Icono nombre="ok" label="Disponible" class="tr-disponible" />
        </template>
      </NzCampo>

      <NzCampo
        v-model="form.password"
        label="Contraseña"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        hint="Mínimo 8 caracteres"
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
        v-model="form.confirm"
        label="Repetí la contraseña"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        :rules="[(v) => v === form.password || 'Las contraseñas no coinciden']"
        lazy-rules
      />

      <ChipsNotice class="q-my-sm" />

      <q-checkbox v-model="form.acceptTerms" dense class="tr-check" aria-label="Acepto los términos y condiciones y la política de privacidad">
        Acepto los <router-link to="/terminos" target="_blank">términos y condiciones</router-link>
        y la <router-link to="/privacidad" target="_blank">política de privacidad</router-link>
      </q-checkbox>
      <q-checkbox v-model="form.confirmAdult" dense class="tr-check" label="Declaro que soy mayor de 18 años" />
      <div v-if="checkboxError" class="tr-check-error" role="alert">{{ checkboxError }}</div>

      <NzBoton type="submit" variante="principal" tamano="lg" bloque label="Crear cuenta" :loading="loading" class="q-mt-md" />
    </q-form>

    <div class="tr-auth-footer">
      ¿Ya tenés cuenta? <router-link to="/login">Iniciá sesión</router-link>
    </div>
  </AuthMarco>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { debounce, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AuthMarco from '../components/AuthMarco.vue';
import ChipsNotice from '../components/ChipsNotice.vue';
import { checkAvailability } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { rules } from '../utils/validators.js';

const UNAVAILABLE_MESSAGES = {
  username: {
    TAKEN: 'Ese nombre de usuario ya está en uso',
    RESERVED: 'Ese nombre de usuario está reservado',
    INVALID: 'Nombre de usuario inválido'
  },
  email: {
    TAKEN: 'Ese email ya está registrado',
    INVALID: 'Ingresá un email válido'
  }
};

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const formRef = ref(null);
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirm: '',
  acceptTerms: false,
  confirmAdult: false
});
const loading = ref(false);
const showPassword = ref(false);
const checkboxError = ref('');

// Errores que vienen del servidor (disponibilidad en vivo o 409 al enviar)
const fieldErrors = reactive({ username: '', email: '' });
const checking = reactive({ username: false, email: false });
const available = reactive({ username: false, email: false });

function createChecker(field, isLocallyValid) {
  let lastValue = '';
  const run = debounce(async (value) => {
    lastValue = value;
    checking[field] = true;
    try {
      const result = await checkAvailability({ [field]: value });
      if (lastValue !== value) return; // llegó tarde: el usuario siguió escribiendo
      const info = result[field];
      available[field] = info.available;
      fieldErrors[field] = info.available ? '' : (UNAVAILABLE_MESSAGES[field][info.reason] || 'No disponible');
    } catch {
      // Si falla el chequeo en vivo no bloqueamos: el backend valida igual al enviar
    } finally {
      if (lastValue === value) checking[field] = false;
    }
  }, 450);

  return (value) => {
    fieldErrors[field] = '';
    available[field] = false;
    const trimmed = String(value || '').trim();
    if (isLocallyValid(trimmed) !== true) {
      lastValue = '';
      checking[field] = false;
      return;
    }
    run(trimmed);
  };
}

watch(() => form.username, createChecker('username', rules.username));
watch(() => form.email, createChecker('email', rules.email));
watch(() => [form.acceptTerms, form.confirmAdult], () => { checkboxError.value = ''; });

async function handleSubmit() {
  if (!form.acceptTerms || !form.confirmAdult) {
    checkboxError.value = 'Para crear la cuenta tenés que aceptar los términos y declarar que sos mayor de 18 años.';
    return;
  }
  if (fieldErrors.username || fieldErrors.email) return;

  loading.value = true;
  try {
    await auth.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      acceptTerms: form.acceptTerms,
      confirmAdult: form.confirmAdult
    });
    router.replace('/');
  } catch (e) {
    if (e.code === 'USERNAME_TAKEN') fieldErrors.username = e.message;
    else if (e.code === 'EMAIL_TAKEN') fieldErrors.email = e.message;
    else $q.notify({ type: 'negative', message: e.message || 'No se pudo crear la cuenta' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tr-check { font-size: 14px; }
.tr-disponible { color: var(--verde); }
.tr-check + .tr-check { margin-top: 6px; }

.tr-check-error {
  margin-top: 6px;
  color: var(--rojo);
  font-size: 13px;
}
</style>
