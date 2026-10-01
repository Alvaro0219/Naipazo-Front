<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Administración</h1>
      <p>Usuarios, bloqueos y ajustes de fichas. Todo ajuste queda registrado en el libro de movimientos.</p>
    </header>

    <q-input
      v-model="search"
      outlined
      dense
      clearable
      debounce="350"
      placeholder="Buscar por usuario o email"
      class="tr-admin-search"
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>

    <LoadingState :loading="firstLoad" :empty="!firstLoad && pagination.rowsNumber === 0" empty-label="No hay usuarios que coincidan." empty-icon="person_search">
      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[20, 50]"
        :grid="$q.screen.lt.md"
        flat
        class="tr-section-card"
        @request="onRequest"
      >
        <template #body-cell-isActive="props">
          <q-td :props="props">
            <q-badge :color="props.value ? 'positive' : 'negative'" :label="props.value ? 'Activo' : 'Bloqueado'" />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="tr-admin-actions">
            <q-btn flat dense no-caps color="primary" label="Fichas" @click="openAdjust(props.row)" />
            <q-btn
              flat
              dense
              no-caps
              :color="props.row.isActive ? 'negative' : 'positive'"
              :label="props.row.isActive ? 'Bloquear' : 'Desbloquear'"
              :disable="props.row.id === auth.user?.id"
              @click="toggleActive(props.row)"
            />
          </q-td>
        </template>
        <template #item="{ row }">
          <div class="col-12">
            <div class="tr-admin-card">
              <div class="tr-admin-card__head">
                <strong>{{ row.username }}</strong>
                <q-badge :color="row.isActive ? 'positive' : 'negative'" :label="row.isActive ? 'Activo' : 'Bloqueado'" />
                <q-badge v-if="row.role === 'admin'" color="primary" label="Admin" />
              </div>
              <div class="tr-admin-card__meta">{{ row.email }}</div>
              <div class="tr-admin-card__meta tr-num">
                {{ formatChips(row.balance) }} fichas · {{ row.stats?.played ?? 0 }} partidas
              </div>
              <div class="tr-admin-actions">
                <q-btn flat dense no-caps color="primary" label="Ajustar fichas" @click="openAdjust(row)" />
                <q-btn
                  flat
                  dense
                  no-caps
                  :color="row.isActive ? 'negative' : 'positive'"
                  :label="row.isActive ? 'Bloquear' : 'Desbloquear'"
                  :disable="row.id === auth.user?.id"
                  @click="toggleActive(row)"
                />
              </div>
            </div>
          </div>
        </template>
      </q-table>
    </LoadingState>

    <q-dialog v-model="adjust.open">
      <q-card class="tr-adjust">
        <q-form @submit.prevent="submitAdjust">
          <q-card-section>
            <h2 class="tr-adjust__title">Ajustar fichas de {{ adjust.user?.username }}</h2>
            <p class="tr-adjust__balance tr-num">Saldo actual: {{ formatChips(adjust.user?.balance ?? 0) }}</p>
          </q-card-section>
          <q-card-section class="column q-gutter-y-sm">
            <q-input
              v-model.number="adjust.amount"
              type="number"
              outlined
              label="Monto (negativo para descontar)"
              :rules="[(v) => (Number.isInteger(v) && v !== 0) || 'Ingresá un entero distinto de cero']"
            />
            <q-input
              v-model="adjust.reason"
              outlined
              label="Motivo"
              maxlength="200"
              :rules="[(v) => (v && v.trim().length >= 3) || 'Contá brevemente el motivo']"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated no-caps label="Aplicar ajuste" :loading="adjust.saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import LoadingState from '../../components/LoadingState.vue';
import { usePaginatedList } from '../../composables/usePaginatedList.js';
import { adjustUserChips, fetchAdminUsers, setUserStatus } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';
import { formatChips, formatDateTime } from '../../utils/format.js';

const $q = useQuasar();
const auth = useAuthStore();
const search = ref('');

const { rows, loading, firstLoad, pagination, onRequest, reload, refresh } = usePaginatedList({
  fetchFn: fetchAdminUsers,
  filters: computed(() => ({ search: search.value || '' })),
  label: 'los usuarios'
});

const columns = [
  { name: 'username', label: 'Usuario', field: 'username', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'balance', label: 'Fichas', field: 'balance', align: 'right', format: formatChips, classes: 'tr-num' },
  { name: 'played', label: 'Partidas', field: (r) => r.stats?.played ?? 0, align: 'right', classes: 'tr-num' },
  { name: 'createdAt', label: 'Alta', field: 'createdAt', align: 'left', format: formatDateTime },
  { name: 'isActive', label: 'Estado', field: 'isActive', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' }
];

const adjust = reactive({ open: false, user: null, amount: null, reason: '', operationId: null, saving: false });

function openAdjust(user) {
  // Un id por operación: si se reintenta el envío, el ajuste no se aplica dos veces
  Object.assign(adjust, { open: true, user, amount: null, reason: '', operationId: crypto.randomUUID() });
}

async function submitAdjust() {
  adjust.saving = true;
  try {
    await adjustUserChips(adjust.user.id, {
      amount: adjust.amount,
      reason: adjust.reason.trim(),
      operationId: adjust.operationId
    });
    $q.notify({ type: 'positive', message: `Ajuste aplicado a ${adjust.user.username}.` });
    adjust.open = false;
    refresh();
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'No se pudo aplicar el ajuste' });
  } finally {
    adjust.saving = false;
  }
}

function toggleActive(user) {
  const blocking = user.isActive;
  $q.dialog({
    title: blocking ? `¿Bloquear a ${user.username}?` : `¿Desbloquear a ${user.username}?`,
    message: blocking
      ? 'No va a poder iniciar sesión ni renovar su sesión actual.'
      : 'Va a poder volver a entrar y jugar.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: blocking ? 'Bloquear' : 'Desbloquear', color: blocking ? 'negative' : 'positive', unelevated: true, noCaps: true }
  }).onOk(async () => {
    try {
      await setUserStatus(user.id, !blocking);
      refresh();
    } catch (e) {
      $q.notify({ type: 'negative', message: e.message || 'No se pudo cambiar el estado' });
    }
  });
}

onMounted(reload);
</script>

<style scoped>
.tr-admin-search { max-width: 420px; background: #fff; }

.tr-admin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.tr-admin-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 4px;
  border-bottom: 1px solid #e2e8f0;
}

.tr-admin-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tr-admin-card__meta {
  color: #64748b;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.tr-admin-card .tr-admin-actions { justify-content: flex-start; }

.tr-adjust { width: min(92vw, 420px); }

.tr-adjust__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
}

.tr-adjust__balance {
  margin: 4px 0 0;
  color: #64748b;
}
</style>
