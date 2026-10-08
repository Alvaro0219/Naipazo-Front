<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>{{ user?.username }}</h1>
      <p>{{ user?.email }} · jugando desde {{ memberSince }}</p>
    </header>

    <LoadingState :loading="loading" :empty="false">
      <NzSegmentado v-model="statsMode" class="q-mb-sm" aria-label="Modo" :opciones="[{ label: '1 vs 1', value: '1v1' }, { label: '2 vs 2', value: '2v2' }]" />
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
        <NzCampo
          v-model="form.current"
          label="Contraseña actual"
          type="password"
          autocomplete="current-password"
          :rules="[rules.required('La contraseña actual')]"
          :error="!!currentError"
          :error-message="currentError"
          lazy-rules
          @update:model-value="currentError = ''"
        />
        <NzCampo
          v-model="form.next"
          label="Contraseña nueva"
          type="password"
          autocomplete="new-password"
          hint="Mínimo 8 caracteres"
          :rules="[rules.password]"
          lazy-rules
        />
        <NzCampo
          v-model="form.confirm"
          label="Repetí la contraseña nueva"
          type="password"
          autocomplete="new-password"
          :rules="[(v) => v === form.next || 'Las contraseñas no coinciden']"
          lazy-rules
        />
        <p class="tr-password-note">Al cambiarla se cierran tus sesiones en otros dispositivos.</p>
        <NzBoton type="submit" variante="principal" label="Guardar contraseña" :loading="saving" class="self-start" />
      </q-form>
    </section>

    <section class="tr-section-card tr-profile-links">
      <NzBoton v-if="auth.isAdmin" variante="secundario" icono="admin" label="Panel de administración" to="/admin" />
      <NzBoton variante="texto" tono="rojo" icono="salir" label="Cerrar sesión" @click="handleLogout" />
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

// Estadísticas por modo (las de torneos son de 1 vs 1). Las salas privadas no suman.
const statsMode = ref('1v1');
const stats = computed(() => {
  const s = (statsMode.value === '2v2' ? user.value?.statsTwoVsTwo : user.value?.stats) || {};
  const rate = s.played ? Math.round((s.won / s.played) * 100) : 0;
  return [
    { label: 'Jugadas', value: s.played ?? 0 },
    { label: 'Ganadas', value: s.won ?? 0 },
    { label: 'Perdidas', value: s.lost ?? 0 },
    { label: '% de victorias', value: `${rate}%` },
    { label: 'Abandonos', value: s.abandoned ?? 0 },
    { label: 'Fichas ganadas', value: formatChips(s.chipsWon ?? 0) },
    ...(statsMode.value === '1v1'
      ? [{ label: 'Torneos jugados', value: s.tournamentsPlayed ?? 0 }, { label: 'Torneos ganados', value: s.tournamentsWon ?? 0 }]
      : [])
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
  border-radius: var(--radio-panel);
  background: var(--noche-2);
  border: 1px solid var(--linea);
}

.tr-stat__value {
  font-family: var(--fuente-titulo);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.tr-stat__label {
  color: var(--texto-suave);
  font-size: 13px;
}

.tr-password-form { max-width: 420px; }

.tr-password-note,
.tr-profile-note {
  margin: 0;
  color: var(--texto-suave);
  font-size: 13px;
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
