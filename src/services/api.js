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

// ─── Configuración pública del juego ────────────────────

/** { minBet, maxBet, houseRate, dailyGrantAmount, turnTimeoutSeconds, reconnectGraceSeconds } */
export async function fetchGameConfig() {
  const { data, status } = await api.get('/config');
  return unwrap(data, 'No se pudo cargar la configuración', status);
}

// ─── Salas ──────────────────────────────────────────────

/** { items, pagination } — salas en espera */
export async function fetchRooms(params = {}) {
  const { data, status } = await api.get('/rooms', { params });
  return unwrap(data, 'No se pudieron cargar las mesas', status);
}

/** Sala en espera o en juego del usuario, o null */
export async function fetchMyRoom() {
  const { data, status } = await api.get('/rooms/mine');
  return unwrap(data, 'No se pudo cargar tu mesa', status).room;
}

/** payload: { uuid, targetPoints, bet, isPrivate } — una sala privada no aparece en el lobby */
export async function createRoom(payload) {
  const { data, status } = await api.post('/rooms', payload);
  return unwrap(data, 'No se pudo crear la sala', status).room;
}

/** Sala en espera a partir de su código (para mostrar a qué se va a unir el jugador) */
export async function fetchRoomByCode(code) {
  const { data, status } = await api.get(`/rooms/code/${code}`);
  return unwrap(data, 'No encontramos esa sala', status).room;
}

export async function joinRoomByCode(code) {
  const { data, status } = await api.post('/rooms/join-by-code', { code });
  return unwrap(data, 'No se pudo entrar a la sala', status).room;
}

export async function joinRoom(roomId) {
  const { data, status } = await api.post(`/rooms/${roomId}/join`);
  return unwrap(data, 'No se pudo entrar a la sala', status).room;
}

export async function cancelRoom(roomId) {
  const { data, status } = await api.delete(`/rooms/${roomId}`);
  return unwrap(data, 'No se pudo cancelar la sala', status).room;
}

// ─── Torneos ────────────────────────────────────────────

/** { items, pagination } — torneos con inscripción abierta. params: { size, minBuyIn, maxBuyIn, page, limit } */
export async function fetchTournaments(params = {}) {
  const { data, status } = await api.get('/tournaments', { params });
  return unwrap(data, 'No se pudieron cargar los torneos', status);
}

/** Torneo en inscripción o en juego en el que sigo participando, o null */
export async function fetchMyTournament() {
  const { data, status } = await api.get('/tournaments/mine');
  return unwrap(data, 'No se pudo cargar tu torneo', status).tournament;
}

export async function fetchTournament(tournamentId) {
  const { data, status } = await api.get(`/tournaments/${tournamentId}`);
  return unwrap(data, 'No se pudo cargar el torneo', status).tournament;
}

/** payload: { uuid, size: 4 | 8, buyIn, targetPoints: 15 | 30 } */
export async function createTournament(payload) {
  const { data, status } = await api.post('/tournaments', payload);
  return unwrap(data, 'No se pudo crear el torneo', status).tournament;
}

export async function joinTournament(tournamentId) {
  const { data, status } = await api.post(`/tournaments/${tournamentId}/join`);
  return unwrap(data, 'No se pudo inscribir al torneo', status).tournament;
}

export async function leaveTournament(tournamentId) {
  const { data, status } = await api.post(`/tournaments/${tournamentId}/leave`);
  return unwrap(data, 'No se pudo salir del torneo', status).tournament;
}

export async function cancelTournament(tournamentId) {
  const { data, status } = await api.delete(`/tournaments/${tournamentId}`);
  return unwrap(data, 'No se pudo cancelar el torneo', status).tournament;
}

// ─── Historial y ranking ────────────────────────────────

/** { items, pagination } — partidas cerradas del usuario */
export async function fetchMatches({ page = 1, limit = 20 } = {}) {
  const { data, status } = await api.get('/matches', { params: { page, limit } });
  return unwrap(data, 'No se pudo cargar el historial', status);
}

export async function fetchMatch(matchId) {
  const { data, status } = await api.get(`/matches/${matchId}`);
  return unwrap(data, 'No se pudo cargar la partida', status).match;
}

/** params: { by: 'won' | 'chips', period: 'all' | 'month' | 'week', page, limit } */
export async function fetchRanking(params) {
  const { data, status } = await api.get('/ranking', { params });
  return unwrap(data, 'No se pudo cargar el ranking', status);
}

// ─── Perfil ─────────────────────────────────────────────

/** Devuelve una sesión nueva (las demás sesiones quedan cerradas) */
export async function changePassword(currentPassword, newPassword) {
  const { data, status } = await api.patch('/users/me/password', { currentPassword, newPassword });
  return unwrap(data, 'No se pudo cambiar la contraseña', status);
}

// ─── Admin ──────────────────────────────────────────────

export async function fetchAdminUsers({ search = '', page = 1, limit = 20 } = {}) {
  const { data, status } = await api.get('/admin/users', { params: { search, page, limit } });
  return unwrap(data, 'No se pudieron cargar los usuarios', status);
}

export async function setUserStatus(userId, isActive) {
  const { data, status } = await api.patch(`/admin/users/${userId}/status`, { isActive });
  return unwrap(data, 'No se pudo cambiar el estado', status).user;
}

/** payload: { amount, reason, operationId } */
export async function adjustUserChips(userId, payload) {
  const { data, status } = await api.post(`/admin/users/${userId}/adjust`, payload);
  return unwrap(data, 'No se pudo ajustar el saldo', status);
}

// ─── Tiempo real ────────────────────────────────────────

export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export default api;
