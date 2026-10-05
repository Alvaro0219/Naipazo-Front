import { expect, test } from '@playwright/test';
import { PASSWORD, lastEmailTo, openAs, tokenFromEmail, uniqueName } from './helpers.js';

test('registro, verificación del email, recuperación de contraseña y login', async ({ browser }) => {
  const { page, context } = await openAs(browser, null);
  const username = uniqueName('reg');
  const email = `${username.toLowerCase()}@e2e.test`;

  // Registro por el formulario
  await page.goto('/registro');
  await page.getByLabel('Nombre de usuario').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Repetí la contraseña').fill(PASSWORD);
  await page.getByLabel('Acepto los términos y condiciones y la política de privacidad').click();
  await page.getByText('Declaro que soy mayor de 18 años').click();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  // Entra al lobby con el aviso de verificación
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.tr-verify-banner')).toContainText('Verificá tu email');

  // Enlace del email
  const verifyToken = tokenFromEmail(await lastEmailTo(email, 'Verificá tu email'));
  await page.goto(`/verificar-email?token=${verifyToken}`);
  await expect(page.getByText('Tu email quedó verificado')).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Partidas' })).toBeVisible();
  await expect(page.locator('.tr-verify-banner')).toHaveCount(0);

  // Cerrar sesión y recuperar la contraseña
  await page.evaluate(() => localStorage.removeItem('truco_session'));
  await page.goto('/login');
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
  await page.getByLabel('Email de tu cuenta').fill(email.toUpperCase());
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByText('Si el email está registrado')).toBeVisible();

  const resetToken = tokenFromEmail(await lastEmailTo(email, 'Cambiá tu contraseña'));
  await page.goto(`/restablecer?token=${resetToken}`);
  const newPassword = 'otra-clave-e2e-1';
  await page.getByLabel('Contraseña nueva').fill(newPassword);
  await page.getByLabel('Repetí la contraseña').fill(newPassword);
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Login con la contraseña nueva
  await page.getByLabel('Email o nombre de usuario').fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Partidas' })).toBeVisible();
  await context.close();
});
