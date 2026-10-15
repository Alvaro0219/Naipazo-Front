import { expect, test } from '@playwright/test';
import { api, openAs, playUntilFinished, registerUser } from './helpers.js';

test('mesa con apuesta: un rival se une desde el lobby, partida completa y revancha', async ({ browser, request }) => {
  const hostSession = await registerUser(request, 'host');
  const guestSession = await registerUser(request, 'rival');
  const host = await openAs(browser, hostSession);
  const guest = await openAs(browser, guestSession);

  // El anfitrión crea la mesa desde el lobby: apuesta con el chip rápido de 500 (ESTILOS_NAIPAZO.md, 10.3)
  await host.page.goto('/');
  await host.page.getByRole('button', { name: 'Crear partida' }).click();
  const crear = host.page.locator('.q-dialog');
  await crear.getByRole('button', { name: '500', exact: true }).click();
  await expect(crear.locator('.tr-apuesta__valor')).toContainText('500');
  await crear.getByRole('button', { name: 'Crear mesa' }).click();
  await expect(host.page.getByText('Esperando un rival…')).toBeVisible();
  const roomId = host.page.url().split('/mesa/')[1];
  const code = (await host.page.locator('.tr-table__code').textContent()).trim();
  const room = { room: { id: roomId, code } };

  // El rival la encuentra en el lobby y se une
  await guest.page.goto('/');
  // En el lobby la mesa se reconoce por el anfitrión (el código solo se usa para las privadas)
  const item = guest.page.locator('.tr-game', { hasText: hostSession.user.username });
  await item.getByRole('button', { name: 'Unirme' }).click();
  // Con apuesta pide confirmación
  await guest.page.locator('.q-dialog').getByRole('button', { name: 'Jugar' }).click();
  await expect(guest.page).toHaveURL(new RegExp(`/mesa/${room.room.id}`));
  await expect(host.page.locator('.tr-hand')).toBeVisible();

  // Partida completa: el rival se va al mazo cada vez que puede, gana el anfitrión
  await playUntilFinished([{ page: host.page, lose: false }, { page: guest.page, lose: true }]);
  await expect(host.page.locator('.tr-result')).toContainText('¡Ganaste la partida!');
  await expect(guest.page.locator('.tr-result')).toBeVisible();

  // Pozo: 1.000 al ganador (500 + 500), el perdedor pierde lo apostado
  const hostWallet = await api(request, hostSession, 'GET', '/wallet');
  const guestWallet = await api(request, guestSession, 'GET', '/wallet');
  expect(hostWallet.balance - guestWallet.balance).toBe(1000);

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
