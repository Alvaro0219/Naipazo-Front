import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('quasar', () => ({ Notify: { create: vi.fn() } }));
const fetchWallet = vi.fn();
vi.mock('../../services/api.js', () => ({ fetchWallet: (...args) => fetchWallet(...args) }));

const { Notify } = await import('quasar');
const { useWalletStore } = await import('../wallet.js');

describe('store wallet: el saldo no se pierde', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchWallet.mockReset();
    Notify.create.mockClear();
  });

  it('un aviso sin saldo numérico nunca pisa el último saldo conocido', () => {
    const wallet = useWalletStore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    wallet.ingest({ balance: 1200 }, 'sesión');
    wallet.ingest({}, 'wallet:update'); // sin saldo: se ignora en silencio
    wallet.ingest({ balance: null }, 'wallet:update'); // saldo inválido: se ignora y se registra
    wallet.ingest({ balance: '50' }, 'wallet:update');
    expect(wallet.balance).toBe(1200);
    expect(wallet.lastSource).toBe('sesión');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('avisa el crédito diario solo cuando se acreditó', () => {
    const wallet = useWalletStore();
    wallet.ingest({ balance: 1000, dailyGrant: { granted: true, amount: 1000, nextGrantAt: 'mañana' } }, 'sesión');
    wallet.ingest({ balance: 1000, dailyGrant: { granted: false, amount: 1000, nextGrantAt: 'mañana' } }, 'GET /wallet');
    expect(Notify.create).toHaveBeenCalledTimes(1);
    expect(wallet.nextGrantAt).toBe('mañana');
  });

  it('refresh relee el saldo y, si falla, conserva el último valor', async () => {
    const wallet = useWalletStore();
    fetchWallet.mockResolvedValueOnce({ balance: 900, dailyGrant: null });
    await wallet.refresh();
    expect(wallet.balance).toBe(900);
    expect(wallet.lastSource).toBe('GET /wallet');

    fetchWallet.mockRejectedValueOnce(new Error('sin red'));
    await expect(wallet.refresh()).resolves.toBeUndefined();
    expect(wallet.balance).toBe(900);
    expect(wallet.loading).toBe(false);
  });

  it('no dispara dos lecturas a la vez', async () => {
    const wallet = useWalletStore();
    let resolve;
    fetchWallet.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const first = wallet.refresh();
    await wallet.refresh();
    resolve({ balance: 10, dailyGrant: null });
    await first;
    expect(fetchWallet).toHaveBeenCalledTimes(1);
  });
});
