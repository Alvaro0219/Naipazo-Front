import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { api, openAs, playUntilFinished, registerUser, tableState } from './helpers.js';

test('2 vs 2 con apuesta: asientos, seña al compañero, reconexión, partida completa y revancha de 4', async ({ browser, request }) => {
  test.setTimeout(6 * 60 * 1000);
  const sessions = [];
  for (let i = 0; i < 4; i++) sessions.push(await registerUser(request, `par${i}`));
  const [p0, p1, p2, p3] = await Promise.all(sessions.map((s) => openAs(browser, s)));

  // El anfitrión crea la mesa 2 vs 2 y espera
  const { room } = await api(request, sessions[0], 'POST', '/rooms', { uuid: randomUUID(), targetPoints: 15, bet: 100, mode: '2v2' });
  await p0.page.goto(`/mesa/${room.id}`);
  await expect(p0.page.getByText('Esperando jugadores · 1 de 4')).toBeVisible();

  // Dos se suman desde el lobby (filtro 2 vs 2) y quedan en los primeros asientos libres (1 y 2)
  for (const p of [p1, p2]) {
    await p.page.goto('/');
    await p.page.locator('.tr-lobby-filters button', { hasText: '2 vs 2' }).click();
    const item = p.page.locator('.tr-game', { hasText: room.code });
    await expect(item).toContainText('de 4');
    await item.getByRole('button', { name: 'Unirme' }).click();
    await p.page.locator('.q-dialog').getByRole('button', { name: 'Jugar' }).click();
    await expect(p.page).toHaveURL(new RegExp(`/mesa/${room.id}`));
  }
  await expect(p0.page.getByText('Esperando jugadores · 3 de 4')).toBeVisible();

  // El del asiento 1 se cambia al 3 (pareja B, enfrente): queda libre el 1
  await p1.page.locator('.tr-wait4__seat--free').click();
  await expect(p1.page.locator('.tr-wait4__team').nth(1).locator('.tr-wait4__seat').nth(1)).toHaveText('Vos');
  await expect(p0.page.locator('.tr-wait4__team').nth(1).locator('.tr-wait4__seat').nth(0)).toHaveText('Libre');

  // El cuarto entra por la API (asiento 1) y arranca la partida para los cuatro
  await api(request, sessions[3], 'POST', `/rooms/${room.id}/join`, { seat: 1 });
  await p3.page.goto(`/mesa/${room.id}`);
  for (const p of [p0, p1, p2, p3]) await expect(p.page.locator('.tr-b4')).toBeVisible({ timeout: 20000 });

  // Equipos: 0 y 2 (p0, p2) contra 1 y 3 (p3, p1). Cada uno ve a su compañero arriba
  await expect(p0.page.locator('.tr-b4__top')).toContainText(sessions[2].user.username);
  await expect(p0.page.locator('.tr-b4__top')).toContainText('Compañero');
  await expect(p1.page.locator('.tr-b4__top')).toContainText(sessions[3].user.username);

  // Seña: p0 le hace una seña a p2; solo p2 la ve
  await p0.page.getByRole('button', { name: 'Señas' }).click();
  await p0.page.locator('.q-dialog').getByRole('button', { name: 'Ancho de espada' }).click();
  await expect(p2.page.locator('.tr-b4__received')).toContainText('Ancho de espada');
  for (const p of [p1, p3]) await expect(p.page.locator('.tr-b4__received')).toHaveCount(0);
  await expect(p0.page.locator('.tr-b4__received')).toHaveCount(0);

  // Reconexión: p3 pierde la red; los demás lo ven desconectado; vuelve y la mesa sigue
  await p3.context.setOffline(true);
  await p3.page.evaluate(() => window.__socketDebug.socket.io.engine.close());
  await expect(p0.page.getByText(/se desconectó\. Esperando reconexión/)).toBeVisible({ timeout: 30000 });
  await p3.context.setOffline(false);
  await expect(p0.page.getByText(/Esperando reconexión/)).toHaveCount(0, { timeout: 30000 });
  await expect.poll(async () => (await tableState(p3.page))?.phase).toBe('playing');

  // Partida completa: la pareja B se va al mazo cada vez que puede
  const players = [p0, p1, p2, p3].map((p) => ({ page: p.page, lose: (s) => s.team === 1 }));
  await playUntilFinished(players, { timeoutMs: 240000 });
  for (const p of [p0, p2]) await expect(p.page.locator('.tr-result')).toContainText('¡Ganaron la partida!');
  for (const p of [p1, p3]) await expect(p.page.locator('.tr-result')).toContainText('Ganaron ellos');
  const balances = await Promise.all(sessions.map((s) => api(request, s, 'GET', '/wallet').then((w) => w.balance)));
  expect(balances).toEqual([1100, 900, 1100, 900]);

  // Revancha: arranca recién cuando aceptan los cuatro
  await p0.page.getByRole('button', { name: 'Revancha' }).click();
  await expect(p0.page.getByText(/Aceptaron 1 de 4/)).toBeVisible();
  for (const p of [p1, p2, p3]) await p.page.locator('.tr-result').getByRole('button', { name: /Revancha|Aceptar revancha/ }).click();
  for (const p of [p0, p1, p2, p3]) await expect(p.page).not.toHaveURL(new RegExp(`/mesa/${room.id}$`), { timeout: 20000 });
  await expect(p0.page.locator('.tr-b4')).toBeVisible({ timeout: 20000 });

  // Cierre: abandona p1 (pareja B). Su compañero p3 recupera su apuesta; cada rival cobra 150
  await p1.page.getByRole('button', { name: 'Abandonar la partida' }).click();
  await p1.page.locator('.q-dialog').getByRole('button', { name: 'Abandonar' }).click();
  await expect(p3.page.locator('.tr-result')).toContainText('sin resultado');
  const after = await Promise.all(sessions.map((s) => api(request, s, 'GET', '/wallet').then((w) => w.balance)));
  expect(after).toEqual([1150, 800, 1150, 900]);

  for (const p of [p0, p1, p2, p3]) await p.context.close();
});
