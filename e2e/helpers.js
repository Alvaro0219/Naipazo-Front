import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { E2E } from '../playwright.config.js';

export const PASSWORD = 'clave-e2e-123';
let seq = 0;

/** Nombre de usuario único por corrida (3–20 caracteres). */
export function uniqueName(prefix) {
  seq += 1;
  return `${prefix}${Date.now().toString(36).slice(-5)}${seq}`.slice(0, 20);
}

/** Registra una cuenta por la API (más rápido que el formulario) y devuelve la sesión. */
export async function registerUser(request, prefix = 'e2e') {
  const username = uniqueName(prefix);
  const res = await request.post(`${E2E.api}/auth/register`, {
    data: { username, email: `${username.toLowerCase()}@e2e.test`, password: PASSWORD, acceptTerms: true, confirmAdult: true }
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()).data;
}

/** Un contexto de navegador por jugador: localStorage aislado (no se pisan las sesiones). */
export async function openAs(browser, session) {
  const context = await browser.newContext();
  if (session) {
    await context.addInitScript((s) => {
      if (!localStorage.getItem('truco_session')) localStorage.setItem('truco_session', JSON.stringify(s));
      localStorage.setItem('naipazo_sound', 'off');
    }, { accessToken: session.accessToken, refreshToken: session.refreshToken, user: session.user });
  }
  const page = await context.newPage();
  return { context, page, user: session?.user };
}

export async function api(request, session, method, path, data) {
  const res = await request.fetch(`${E2E.api}${path}`, {
    method, data, headers: { Authorization: `Bearer ${session.accessToken}` }
  });
  const body = await res.json();
  expect(body.success, JSON.stringify(body)).toBeTruthy();
  return body.data;
}

/** Último email enviado a esa dirección con ese texto en el asunto (el backend de e2e los escribe en EMAIL_OUTBOX_FILE). */
export async function lastEmailTo(email, subject) {
  let found;
  await expect.poll(() => {
    let lines = [];
    try { lines = readFileSync(E2E.outbox, 'utf8').trim().split('\n'); } catch { /* todavía no hay emails */ }
    found = lines.map((l) => JSON.parse(l)).filter((m) => m.to === email && m.subject.includes(subject)).at(-1);
    return Boolean(found);
  }, { timeout: 15000 }).toBe(true);
  return found;
}

export const tokenFromEmail = (mail) => /token=([0-9a-f]{64})/.exec(mail.text)?.[1];

/** Estado de la mesa leído del store (solo para decidir qué tocar; las jugadas se hacen con clics). */
export function tableState(page) {
  return page.evaluate(() => {
    const g = document.querySelector('#q-app, #app')?.__vue_app__?.config.globalProperties.$pinia._s.get('game');
    if (!g) return null;
    const v = g.view;
    return {
      roomId: g.roomId,
      replaced: g.replaced,
      finished: Boolean(g.finished),
      phase: v?.phase ?? null,
      me: v?.me?.id ?? null,
      opponent: v?.players?.find((p) => p.id !== v?.me?.id)?.id ?? null,
      actions: (v?.availableActions ?? []).map((a) => a.type ?? a)
    };
  });
}

/**
 * Hace una jugada si le toca. El que pierde se va al mazo apenas puede; el otro juega su primera carta
 * y no quiere ningún canto. Devuelve true si hizo algo.
 */
export async function step(page, { lose }) {
  const s = await tableState(page);
  if (!s || s.finished || s.phase !== 'playing' || !s.actions.length) return false;
  const iLose = typeof lose === 'function' ? lose(s) : lose;
  const actions = page.locator('.tr-actions');
  if (iLose && s.actions.includes('GO_TO_DECK')) {
    await actions.getByRole('button', { name: 'Me voy al mazo' }).click();
    await page.locator('.q-dialog').getByRole('button', { name: 'Me voy al mazo' }).click();
    return true;
  }
  if (s.actions.includes('REJECT')) {
    await actions.getByRole('button', { name: 'No quiero' }).click();
    return true;
  }
  if (s.actions.includes('PLAY_CARD')) {
    await page.locator('.tr-hand .tr-card--clickable').first().click();
    return true;
  }
  return false;
}

/**
 * Juega hasta que todas las mesas indicadas terminan. `players`: [{ page, lose }].
 * Falla si alguna página muestra el aviso de sesión reemplazada.
 */
export async function playUntilFinished(players, { timeoutMs = 180000 } = {}) {
  const start = Date.now();
  for (;;) {
    const states = await Promise.all(players.map((p) => tableState(p.page)));
    for (const s of states) expect(s?.replaced, 'apareció "Abriste esta mesa en otra pestaña"').toBeFalsy();
    if (states.every((s) => s?.finished)) return;
    if (Date.now() - start > timeoutMs) throw new Error('La partida no terminó a tiempo');
    let acted = false;
    for (const p of players) {
      try {
        acted = (await step(p.page, p)) || acted;
      } catch {
        // El botón pudo desaparecer entre leer el estado y hacer clic (el otro jugador actuó): se reintenta
      }
    }
    await players[0].page.waitForTimeout(acted ? 150 : 400);
  }
}

/** El que tenga el id mayor pierde: sirve cuando no se sabe de antemano quién enfrenta a quién. */
export const higherIdLoses = (s) => Boolean(s.opponent) && s.me > s.opponent;
