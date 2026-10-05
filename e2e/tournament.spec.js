import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { api, higherIdLoses, openAs, registerUser, step, tableState } from './helpers.js';

test('torneo de 4 completo: cada jugador en su navegador, sin sesiones reemplazadas', async ({ browser, request }) => {
  test.setTimeout(6 * 60 * 1000);
  const sessions = [];
  for (let i = 0; i < 4; i++) sessions.push(await registerUser(request, `tor${i}`));
  const players = [];
  for (const s of sessions) players.push(await openAs(browser, s));
  for (const p of players) await p.page.goto('/');

  const { tournament } = await api(request, sessions[0], 'POST', '/tournaments', { uuid: randomUUID(), size: 4, buyIn: 100, targetPoints: 15 });
  for (const s of sessions.slice(1)) await api(request, s, 'POST', `/tournaments/${tournament.id}/join`);

  // Al completarse el cupo, cada uno es llevado solo a su mesa
  for (const p of players) await expect(p.page).toHaveURL(/\/mesa\//, { timeout: 30000 });

  // Se juega todo: en cada partida pierde el de id mayor (se va al mazo). Hay que llegar a la final y terminarla.
  const deadline = Date.now() + 5 * 60 * 1000;
  for (;;) {
    const t = await api(request, sessions[0], 'GET', `/tournaments/${tournament.id}`);
    if (t.tournament.status === 'finished') break;
    expect(Date.now() < deadline, 'el torneo no terminó a tiempo').toBe(true);
    for (const p of players) {
      const s = await tableState(p.page);
      expect(s?.replaced, `apareció "Abriste esta mesa en otra pestaña" (${p.user.username})`).toBeFalsy();
      try { await step(p.page, { lose: higherIdLoses }); } catch { /* el otro jugó primero: se reintenta */ }
    }
    await players[0].page.waitForTimeout(200);
  }

  // Campeón: cobró 400 (4 × 100) y lo ve en el detalle del torneo
  const { tournament: done } = await api(request, sessions[0], 'GET', `/tournaments/${tournament.id}`);
  const champion = players.find((p) => p.user.id === done.winnerId);
  expect(champion).toBeTruthy();
  await champion.page.goto(`/torneos/${tournament.id}`);
  await expect(champion.page.locator('.tr-champion')).toContainText('¡Ganaste el torneo!');
  const wallet = await api(request, sessions[players.indexOf(champion)], 'GET', '/wallet');
  expect(wallet.balance).toBe(1000 - 100 + 400);
  for (const p of players) await p.context.close();
});
