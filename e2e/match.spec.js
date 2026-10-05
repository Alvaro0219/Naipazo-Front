import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { api, openAs, playUntilFinished, registerUser } from './helpers.js';

test('mesa con apuesta: un rival se une desde el lobby, partida completa y revancha', async ({ browser, request }) => {
  const hostSession = await registerUser(request, 'host');
  const guestSession = await registerUser(request, 'rival');
  const host = await openAs(browser, hostSession);
  const guest = await openAs(browser, guestSession);

  const room = await api(request, hostSession, 'POST', '/rooms', { uuid: randomUUID(), targetPoints: 15, bet: 100 });
  await host.page.goto(`/mesa/${room.room.id}`);
  await expect(host.page.getByText('Esperando un rival…')).toBeVisible();

  // El rival la encuentra en el lobby y se une
  await guest.page.goto('/');
  const item = guest.page.locator('.tr-game', { hasText: room.room.code });
  await item.getByRole('button', { name: 'Unirme' }).click();
  // Con apuesta pide confirmación
  await guest.page.locator('.q-dialog').getByRole('button', { name: 'Jugar' }).click();
  await expect(guest.page).toHaveURL(new RegExp(`/mesa/${room.room.id}`));
  await expect(host.page.locator('.tr-hand')).toBeVisible();

  // Partida completa: el rival se va al mazo cada vez que puede, gana el anfitrión
  await playUntilFinished([{ page: host.page, lose: false }, { page: guest.page, lose: true }]);
  await expect(host.page.locator('.tr-result')).toContainText('¡Ganaste la partida!');
  await expect(guest.page.locator('.tr-result')).toBeVisible();

  // Pozo: 200 al ganador (100 + 100), el perdedor pierde lo apostado
  const hostWallet = await api(request, hostSession, 'GET', '/wallet');
  const guestWallet = await api(request, guestSession, 'GET', '/wallet');
  expect(hostWallet.balance - guestWallet.balance).toBe(200);

  // Revancha: uno la pide, el otro la acepta y los dos van a la mesa nueva
  await host.page.getByRole('button', { name: 'Revancha' }).click();
  await guest.page.getByRole('button', { name: 'Aceptar revancha' }).click();
  await expect(host.page).not.toHaveURL(new RegExp(`/mesa/${room.room.id}$`));
  await expect(guest.page).toHaveURL(host.page.url());
  await expect(host.page.locator('.tr-hand')).toBeVisible();

  // Se cierra abandonando para no dejar la partida colgada
  await guest.page.getByRole('button', { name: 'Abandonar la partida' }).click();
  await guest.page.locator('.q-dialog').getByRole('button', { name: 'Abandonar' }).click();
  await expect(host.page.locator('.tr-result')).toBeVisible();
  await host.context.close();
  await guest.context.close();
});
