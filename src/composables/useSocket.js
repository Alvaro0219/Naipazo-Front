import { ref } from 'vue';
import { Notify } from 'quasar';
import { io } from 'socket.io-client';
import router from '../router/index.js';
import { WS_URL } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useWalletStore } from '../stores/wallet.js';

// Una sola conexión Socket.IO para toda la app (lobby y mesa).
// Reconexión automática de socket.io + refresco del access token si el servidor lo rechaza.

let socket = null;
const status = ref('idle'); // idle | connecting | connected | disconnected

/** Solo en desarrollo: rastro para diagnosticar conexiones duplicadas (window.__socketDebug). */
export function socketDebug(entry) {
  if (!import.meta.env.DEV) return;
  const d = (window.__socketDebug ??= { created: 0, joins: [] });
  if (entry === 'created') d.created += 1;
  else d.joins.push({ ...entry, socketId: socket?.id, at: Date.now() });
}

function createSocket() {
  socketDebug('created');
  const s = io(WS_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    // Función: se evalúa en cada intento, así toma el token renovado
    auth: (cb) => cb({ token: useAuthStore().accessToken })
  });

  // Al (re)conectar se relee el saldo: pudo cambiar mientras no había conexión
  s.on('connect', () => { status.value = 'connected'; useWalletStore().refresh(); });
  s.on('disconnect', (reason) => {
    status.value = 'disconnected';
    // Si el servidor cortó la conexión a propósito, socket.io no reintenta solo
    if (reason === 'io server disconnect') s.connect();
  });
  s.io.on('reconnect_attempt', () => { status.value = 'connecting'; });

  s.on('connect_error', async (err) => {
    status.value = 'disconnected';
    if (err.message !== 'UNAUTHORIZED') return; // error de red: socket.io reintenta solo
    const auth = useAuthStore();
    try {
      await auth.refreshSession();
      s.connect();
    } catch {
      auth.clearSession();
      sessionStorage.setItem('auth_redirect_reason', 'session-expired');
      router.push('/login');
    }
  });

  s.on('wallet:update', (data) => useWalletStore().ingest(data, 'wallet:update'));

  // Arrancó una partida de un torneo en el que estoy: se va directo a la mesa
  s.on('tournament:match', ({ roomId, roundName }) => {
    if (router.currentRoute.value.path === `/mesa/${roomId}`) return;
    Notify.create({ type: 'info', icon: 'emoji_events', message: `¡Arranca tu ${(roundName || 'partida').toLowerCase()} del torneo!` });
    router.push(`/mesa/${roomId}`);
  });
  return s;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  status.value = 'idle';
}

export function useSocket() {
  if (!socket) socket = createSocket();

  function connect() {
    if (!socket.connected && useAuthStore().isAuthenticated) {
      status.value = 'connecting';
      socket.connect();
    }
  }

  return { socket, status, connect };
}
