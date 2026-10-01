import axios from 'axios';
import router from '../router/index.js';
import { useAuthStore } from '../stores/auth.js';
import { ApiError } from '../utils/ApiError.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// ─── Interceptors ───────────────────────────────────────

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`;
  return config;
});

/** Convierte cualquier error de Axios en ApiError, conservando el `code` del backend. */
function toApiError(error) {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  if (response?.data?.error) {
    return new ApiError(response.data.error.message, response.data.error.code || 'UNKNOWN_ERROR', response.status);
  }
  if (!response) {
    return new ApiError('No pudimos conectar con el servidor. Revisá tu conexión.', 'NETWORK_ERROR');
  }
  return new ApiError('Ocurrió un error inesperado.', 'UNKNOWN_ERROR', response.status);
}

function redirectToLoginWithReason(reason) {
  sessionStorage.setItem('auth_redirect_reason', reason);
  // router se importa en un ciclo (router → store → api → router): solo se usa en runtime
  if (router.currentRoute.value.path !== '/login') router.push('/login');
}

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const auth = useAuthStore();
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const isAuthRoute = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']
      .some((path) => originalRequest?.url?.includes(path));

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthRoute) throw toApiError(error);
    if (!auth.refreshToken) {
      auth.clearSession();
      redirectToLoginWithReason('session-expired');
      throw toApiError(error);
    }

    originalRequest._retry = true;
    try {
      if (!refreshPromise) refreshPromise = auth.refreshSession();
      await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
      return api.request(originalRequest);
    } catch (refreshError) {
      auth.clearSession();
      redirectToLoginWithReason('session-expired');
      throw toApiError(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

function unwrap(data, fallbackMessage, status = null) {
  if (!data?.success) {
    throw new ApiError(data?.error?.message || fallbackMessage, data?.error?.code || 'UNKNOWN_ERROR', status);
  }
  return data.data;
}

// ─── Auth ───────────────────────────────────────────────

export async function registerApi(payload) {
  const { data, status } = await api.post('/auth/register', payload);
  return unwrap(data, 'No se pudo crear la cuenta', status);
}

export async function loginApi(identifier, password) {
  const { data, status } = await api.post('/auth/login', { identifier, password });
  return unwrap(data, 'No se pudo iniciar sesión', status);
}

export async function refreshApi(refreshToken) {
  const { data, status } = await api.post('/auth/refresh', { refreshToken });
  return unwrap(data, 'No se pudo renovar la sesión', status);
}

export async function logoutApi(refreshToken) {
  const { data, status } = await api.post('/auth/logout', { refreshToken });
  return unwrap(data, 'No se pudo cerrar la sesión', status);
}

export async function fetchMe() {
  const { data, status } = await api.get('/auth/me');
  return unwrap(data, 'No se pudo obtener el usuario', status).user;
}

/** { username?: { available, reason? }, email?: { available, reason? } } */
export async function checkAvailability(params) {
  const { data, status } = await api.get('/auth/availability', { params });
  return unwrap(data, 'No se pudo verificar la disponibilidad', status);
}

// ─── Billetera ──────────────────────────────────────────

/** { balance, dailyGrant: { granted, amount, nextGrantAt } } */
export async function fetchWallet() {
  const { data, status } = await api.get('/wallet');
  return unwrap(data, 'No se pudo cargar la billetera', status);
}

/** { items, pagination: { page, limit, total, totalPages } } */
export async function fetchLedger({ page = 1, limit = 20 } = {}) {
  const { data, status } = await api.get('/wallet/ledger', { params: { page, limit } });
  return unwrap(data, 'No se pudo cargar el historial', status);
}

export default api;
