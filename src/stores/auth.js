import { defineStore } from 'pinia';
import { fetchMe, loginApi, logoutApi, refreshApi, registerApi } from '../services/api.js';
import { disconnectSocket } from '../composables/useSocket.js';
import { useWalletStore } from './wallet.js';

const STORAGE_KEY = 'truco_session';

function parseStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null, user: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed.accessToken || null,
      refreshToken: parsed.refreshToken || null,
      user: parsed.user || null
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => parseStoredSession(),
  getters: {
    isAuthenticated: (s) => !!s.accessToken,
    isAdmin: (s) => s.user?.role === 'admin'
  },
  actions: {
    saveSession() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        accessToken: this.accessToken, refreshToken: this.refreshToken, user: this.user
      }));
    },
    hydrate() {
      Object.assign(this, parseStoredSession());
    },
    /** Aplica una respuesta de sesión del backend (login, registro o refresh). */
    applySession(res) {
      this.accessToken = res.accessToken;
      this.refreshToken = res.refreshToken;
      this.user = res.user;
      this.saveSession();
      useWalletStore().ingest({ balance: res.user?.balance, dailyGrant: res.dailyGrant }, 'sesión');
    },
    async login(identifier, password) {
      this.applySession(await loginApi(identifier, password));
    },
    async register(payload) {
      this.applySession(await registerApi(payload));
    },
    async refreshSession() {
      if (!this.refreshToken) throw new Error('Missing refresh token');
      this.applySession(await refreshApi(this.refreshToken));
    },
    /** Relee el usuario (por ejemplo, verificó el email desde otro dispositivo). */
    async refreshUser() {
      if (!this.accessToken) return;
      this.user = await fetchMe();
      this.saveSession();
    },
    clearSession() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem(STORAGE_KEY);
      useWalletStore().$reset();
      disconnectSocket();
    },
    async logout() {
      const token = this.refreshToken;
      this.clearSession();
      // Invalida los refresh tokens en el servidor; si falla, la sesión local ya se cerró
      if (token) await logoutApi(token).catch(() => {});
    }
  }
});
