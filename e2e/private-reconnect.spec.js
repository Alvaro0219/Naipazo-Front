import { expect, test } from '@playwright/test';
import { api, openAs, registerUser, step, tableState } from './helpers.js';

test('sala privada por código: no aparece en el lobby y se entra con el código', async ({ browser, request }) => {
  const hostSession = await registerUser(request, 'priv');
  const guestSession = await registerUser(request, 'amigo');
  const host = await openAs(browser, hostSession);
  const guest = await openAs(browser, guestSession);

  await host.page.goto('/');
  await host.page.getByRole('button', { name: 'Sala privada' }).click();
  await host.page.locator('.q-dialog').getByLabel('Fichas por jugador').fill('150');
  await host.page.locator('.q-dialog').getByRole('button', { name: 'Crear sala' }).click();
  await expect(host.page.getByText('Sala privada: pasale este código')).toBeVisible();
  const code = (await host.page.locator('.tr-table__code').textContent()).trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

  // Otro jugador no la ve en el lobby
  await guest.page.goto('/');
  await expect(guest.page.getByRole('heading', { name: 'Partidas' })).toBeVisible();
  await expect(guest.page.locator('.tr-game', { hasText: code })).toHaveCount(0);

  // Se une con el código, escrito en minúsculas
  await guest.page.getByRole('button', { name: 'Sala privada' }).click();
  const dialog = guest.page.locator('.q-dialog');
  await dialog.getByRole('button', { name: 'Unirme' }).first().click();
  await dialog.getByLabel('Código de la sala').fill(code.toLowerCase());
  await dialog.getByRole('button', { name: 'Buscar sala' }).click();
  await expect(dialog.locator('.tr-private__found')).toContainText('150 fichas por jugador');
  await dialog.locator('.q-card__actions').getByRole('button', { name: 'Unirme' }).click();

  await expect(guest.page).toHaveURL(host.page.url());
  await expect(guest.page.locator('.tr-hand')).toBeVisible();

  // Cierre
  await guest.page.getByRole('button', { name: 'Abandonar la partida' }).click();
  await guest.page.locator('.q-dialog').getByRole('button', { name: 'Abandonar' }).click();
  await expect(host.page.locator('.tr-result')).toBeVisible();
  await host.context.close();
  await guest.context.close();
});

test('desconexión y reconexión en mitad de una mano', async ({ browser, request }) => {
  const aSession = await registerUser(request, 'conA');
  const bSession = await registerUser(request, 'conB');
  const a = await openAs(browser, aSession);
  const b = await openAs(browser, bSession);

  const { room } = await api(request, aSession, 'POST', '/rooms', { uuid: crypto.randomUUID(), targetPoints: 15, bet: 0 });
  await api(request, bSession, 'POST', `/rooms/${room.id}/join`);
  await a.page.goto(`/mesa/${room.id}`);
  await b.page.goto(`/mesa/${room.id}`);
  await expect(a.page.locator('.tr-hand')).toBeVisible();
  await expect(b.page.locator('.tr-hand')).toBeVisible();

  // Se juega la primera carta de la mano (quien sea mano)
  await expect.poll(async () => (await step(a.page, { lose: false })) || (await step(b.page, { lose: false }))).toBe(true);
  const before = await tableState(b.page);

  // B pierde la conexión (sin red y con el WebSocket cortado): A ve el aviso de espera
  await b.context.setOffline(true);
  await b.page.evaluate(() => window.__socketDebug.socket.io.engine.close());
  await expect(a.page.getByText(/se desconectó\. Esperando reconexión/)).toBeVisible({ timeout: 30000 });

  // B vuelve: recupera la mesa en el mismo punto y A deja de ver el aviso
  await b.context.setOffline(false);
  await expect(a.page.getByText(/Esperando reconexión/)).toHaveCount(0, { timeout: 30000 });
  await expect.poll(async () => (await tableState(b.page))?.phase).toBe('playing');
  const after = await tableState(b.page);
  expect(after.roomId).toBe(before.roomId);
  expect(after.replaced).toBeFalsy();
  await expect(b.page.locator('.tr-hand')).toBeVisible();

  await b.page.getByRole('button', { name: 'Abandonar la partida' }).click();
  await b.page.locator('.q-dialog').getByRole('button', { name: 'Abandonar' }).click();
  await expect(a.page.locator('.tr-result')).toBeVisible();
  await a.context.close();
  await b.context.close();
});
