<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>{{ user?.username }}</h1>
      <p>{{ user?.email }} · jugando desde {{ memberSince }}</p>
    </header>

    <LoadingState :loading="loading" :empty="false">
      <section class="tr-stats" aria-label="Estadísticas">
        <div v-for="stat in stats" :key="stat.label" class="tr-stat">
          <span class="tr-stat__value tr-num">{{ stat.value }}</span>
          <span class="tr-stat__label">{{ stat.label }}</span>
        </div>
      </section>
    </LoadingState>

    <section class="tr-section-card">
      <h2>Cambiar contraseña</h2>
      <q-form ref="formRef" class="column q-gutter-y-sm tr-password-form" greedy @submit.prevent="handlePassword">
        <q-input
          v-model="form.current"
          label="Contraseña actual"
          outlined
          type="password"
          autocomplete="current-password"
          :rules="[rules.required('La contraseña actual')]"
          :error="!!currentError"
          :error-message="currentError"
          lazy-rules
          @update:model-value="currentError = ''"
        />
        <q-input
          v-model="form.next"
          label="Contraseña nueva"
          outlined
          type="password"
          autocomplete="new-password"
          hint="Mínimo 8 caracteres"
          :rules="[rules.password]"
          lazy-rules
        />
        <q-input
          v-model="form.confirm"
          label="Repetí la contraseña nueva"
          outlined
          type="password"
          autocomplete="new-password"
          :rules="[(v) => v === form.next || 'Las contraseñas no coinciden']"
          lazy-rules
        />
        <p class="tr-password-note">Al cambiarla se cierran tus sesiones en otros dispositivos.</p>
        <q-btn type="submit" color="primary" unelevated no-caps label="Guardar contraseña" :loading="saving" class="self-start" />
      </q-form>
    </section>

    <section class="tr-section-card tr-profile-links">
      <q-btn v-if="auth.isAdmin" flat no-caps color="primary" icon="admin_panel_settings" label="Panel de administración" to="/admin" />
      <q-btn flat no-caps color="negative" icon="logout" label="Cerrar sesión" @click="handleLogout" />
    </section>

    <p class="tr-profile-note">El nombre de usuario no se puede cambiar.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import LoadingState from '../components/LoadingState.vue';
import { changePassword, fetchMe } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { formatChips } from '../utils/format.js';
import { rules } from '../utils/validators.js';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const user = ref(auth.user);
const loading = ref(true);
const saving = ref(false);
const currentError = ref('');
const formRef = ref(null);
const form = reactive({ current: '', next: '', confirm: '' });

const memberSince = computed(() => (user.value?.createdAt
  ? new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(user.value.createdAt))
  : ''));

const stats = computed(() => {
  const s = user.value?.stats || {};
  const rate = s.played ? Math.round((s.won / s.played) * 100) : 0;
  return [
    { label: 'Jugadas', value: s.played ?? 0 },
    { label: 'Ganadas', value: s.won ?? 0 },
    { label: 'Perdidas', value: s.lost ?? 0 },
    { label: '% de victorias', value: `${rate}%` },
    { label: 'Abandonos', value: s.abandoned ?? 0 },
    { label: 'Fichas ganadas', value: formatChips(s.chipsWon ?? 0) }
  ];
});

async function handlePassword() {
  saving.value = true;
  try {
    const session = await changePassword(form.current, form.next);
    auth.applySession(session);
    Object.assign(form, { current: '', next: '', confirm: '' });
    formRef.value.resetValidation();
    $q.notify({ type: 'positive', message: 'Listo, cambiaste tu contraseña.' });
  } catch (e) {
    if (e.code === 'WRONG_PASSWORD') currentError.value = e.message;
    else $q.notify({ type: 'negative', message: e.message || 'No se pudo cambiar la contraseña' });
  } finally {
    saving.value = false;
  }
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

onMounted(async () => {
  try {
    user.value = await fetchMe();
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tr-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tr-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.tr-stat__value {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
}

.tr-stat__label {
  color: #64748b;
  font-size: 0.8rem;
}

.tr-password-form { max-width: 420px; }

.tr-password-note,
.tr-profile-note {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
}

.tr-profile-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 520px) {
  .tr-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
