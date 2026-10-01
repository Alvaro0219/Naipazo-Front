import { ref, unref, watch } from 'vue';
import { useQuasar } from 'quasar';

/**
 * Listado paginado en el servidor, listo para `q-table` (v-model:pagination + @request).
 * `fetchFn({ page, limit, ...filters })` debe devolver `{ items, pagination: { total } }`.
 * `filters` (ref/computed opcional): al cambiar, se vuelve a la página 1.
 */
export function usePaginatedList({ fetchFn, filters = null, rowsPerPage = 20, label = 'el listado' }) {
  const $q = useQuasar();
  const rows = ref([]);
  const loading = ref(false);
  const firstLoad = ref(true);
  const pagination = ref({ page: 1, rowsPerPage, rowsNumber: 0 });

  async function onRequest({ pagination: next }) {
    loading.value = true;
    try {
      const { items, pagination: meta } = await fetchFn({
        page: next.page,
        limit: next.rowsPerPage,
        ...(unref(filters) || {})
      });
      rows.value = items;
      pagination.value = { ...next, rowsNumber: meta.total };
    } catch (e) {
      $q.notify({ type: 'negative', message: e.message || `No se pudo cargar ${label}` });
    } finally {
      loading.value = false;
      firstLoad.value = false;
    }
  }

  function reload() {
    return onRequest({ pagination: { ...pagination.value, page: 1 } });
  }

  function refresh() {
    return onRequest({ pagination: pagination.value });
  }

  if (filters) watch(filters, reload, { deep: true });

  return { rows, loading, firstLoad, pagination, onRequest, reload, refresh };
}
