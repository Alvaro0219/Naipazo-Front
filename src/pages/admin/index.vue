<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>Administración</h1>
      <p>Usuarios, bloqueos y ajustes de fichas. Todo ajuste queda registrado en el libro de movimientos.</p>
    </header>

    <NzCampo
      v-model="search"
      clearable
      debounce="350"
      label="Buscar"
      placeholder="Usuario o email"
      class="tr-admin-search"
    >
      <template #prepend><Icono nombre="buscar" /></template>
    </NzCampo>

    <LoadingState :loading="firstLoad" :empty="!firstLoad && pagination.rowsNumber === 0" empty-label="No hay usuarios que coincidan." empty-icon="buscarUsuario">
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
            <NzChip :tono="props.value ? 'verde' : 'rojo'" :label="props.value ? 'Activo' : 'Bloqueado'" />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="tr-admin-actions">
            <NzBoton variante="texto" tamano="sm" label="Fichas" @click="openAdjust(props.row)" />
            <NzBoton
              variante="texto"
              tamano="sm"
              :tono="props.row.isActive ? 'rojo' : 'celeste'"
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
                <NzChip :tono="row.isActive ? 'verde' : 'rojo'" :label="row.isActive ? 'Activo' : 'Bloqueado'" />
                <NzChip v-if="row.role === 'admin'" tono="celeste" label="Admin" />
              </div>
              <div class="tr-admin-card__meta">{{ row.email }}</div>
              <div class="tr-admin-card__meta tr-num">
                {{ formatChips(row.balance) }} fichas · {{ row.stats?.played ?? 0 }} partidas
              </div>
              <div class="tr-admin-actions">
                <NzBoton variante="texto" tamano="sm" label="Ajustar fichas" @click="openAdjust(row)" />
                <NzBoton
              variante="texto"
              tamano="sm"
              :tono="row.isActive ? 'rojo' : 'celeste'"
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

    <IntegrityCard />
    <ChipFlowsCard />

    <NzHoja v-model="adjust.open" :titulo="`Ajustar fichas de ${adjust.user?.username ?? ''}`">
      <q-form class="column q-gutter-y-md" @submit.prevent="submitAdjust">
        <p class="tr-adjust__balance tr-num">Saldo actual: {{ formatChips(adjust.user?.balance ?? 0) }}</p>
        <NzCampo
          v-model.number="adjust.amount"
          type="number"
          label="Monto (negativo para descontar)"
          :rules="[(v) => (Number.isInteger(v) && v !== 0) || 'Ingresá un entero distinto de cero']"
        />
        <NzCampo
          v-model="adjust.reason"
          label="Motivo"
          maxlength="200"
          :rules="[(v) => (v && v.trim().length >= 3) || 'Contá brevemente el motivo']"
        />
        <div class="tr-adjust__acciones">
          <NzBoton variante="texto" label="Cancelar" @click="adjust.open = false" />
          <NzBoton type="submit" variante="principal" label="Aplicar ajuste" :loading="adjust.saving" />
        </div>
      </q-form>
    </NzHoja>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import ChipFlowsCard from '../../components/ChipFlowsCard.vue';
import IntegrityCard from '../../components/IntegrityCard.vue';
import LoadingState from '../../components/LoadingState.vue';
import { confirmar } from '../../composables/useConfirmar.js';
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
  confirmar({
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
.tr-admin-search { max-width: 420px; }

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
  border-bottom: 1px solid var(--linea);
}

.tr-admin-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tr-admin-card__meta {
  color: var(--texto-suave);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.tr-admin-card .tr-admin-actions { justify-content: flex-start; }

.tr-adjust__balance {
  margin: 0;
  color: var(--texto-suave);
  font-size: 14px;
}

.tr-adjust__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
