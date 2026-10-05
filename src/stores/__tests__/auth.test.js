import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('quasar', () => ({ Notify: { create: vi.fn() } }));
vi.mock('../../composables/useSocket.js', () => ({ disconnectSocket: vi.fn(), useSocket: vi.fn(), socketDebug: vi.fn() }));
vi.mock('../../router/index.js', () => ({ default: { currentRoute: { value: { path: '/' } }, push: vi.fn() } }));

const { api, fetchWallet } = await import('../../services/api.js');
const { useAuthStore } = await import('../auth.js');

const session = (n) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  user: { id: 'u1', username: 'prueba', balance: 500 },
  dailyGrant: { granted: false, amount: 1000, nextGrantAt: null }
});
const response = (config, status, body) => ({ data: body, status, statusText: '', headers: {}, config });
const unauthorized = (config) => Promise.reject(Object.assign(new Error('401'), {
  config, response: response(config, 401, { success: false, error: { message: 'Token vencido', code: 'UNAUTHORIZED' } })
}));

describe('store auth: renovación de sesión compartida', () => {
  let refreshCalls;
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setActivePinia(createPinia());
    refreshCalls = 0;
    api.defaults.adapter = async (config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 20)); // que los dos pedidos lleguen mientras renueva
        return response(config, 200, { success: true, data: session(2) });
      }
      if (config.headers.Authorization !== 'Bearer access-2') return unauthorized(config);
      return response(config, 200, { success: true, data: { balance: 777, dailyGrant: null } });
    };
  });
  afterEach(() => { api.defaults.adapter = originalAdapter; });

  it('dos pedidos con el token vencido hacen un solo refresh y los dos se reintentan', async () => {
    const auth = useAuthStore();
    auth.applySession(session(1));
    const [a, b] = await Promise.all([fetchWallet(), fetchWallet()]);
    expect(refreshCalls).toBe(1);
    expect(a.balance).toBe(777);
    expect(b.balance).toBe(777);
    expect(auth.accessToken).toBe('access-2');
    expect(JSON.parse(localStorage.getItem('truco_session')).refreshToken).toBe('refresh-2');
  });

  it('si el refresh falla, cierra la sesión y deja el motivo para el login', async () => {
    api.defaults.adapter = async (config) => (config.url === '/auth/refresh'
      ? Promise.reject(Object.assign(new Error('401'), { config, response: response(config, 401, { success: false, error: { message: 'Sesión vencida', code: 'INVALID_REFRESH' } }) }))
      : unauthorized(config));
    const auth = useAuthStore();
    auth.applySession(session(1));
    await expect(fetchWallet()).rejects.toMatchObject({ code: 'INVALID_REFRESH' });
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('truco_session')).toBeNull();
    expect(sessionStorage.getItem('auth_redirect_reason')).toBe('session-expired');
  });
});
