import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// Pruebas end-to-end (P8). Levantan su propio backend (4100) y front (5175) contra una base aparte
// (`truco_e2e`, mismo cluster que MONGO_URL), así no tocan ni los servidores ni la base de desarrollo.
// Usan el Chrome instalado en la máquina (channel: 'chrome'), sin descargar navegadores.
const BACK_DIR = fileURLToPath(new URL('../truco-back', import.meta.url));
const OUTBOX = fileURLToPath(new URL('./test-results/e2e-emails.jsonl', import.meta.url));

function e2eMongoUrl() {
  if (process.env.E2E_MONGO_URL) return process.env.E2E_MONGO_URL;
  const envFile = readFileSync(`${BACK_DIR}/.env`, 'utf8');
  const url = /^MONGO_URL=(.+)$/m.exec(envFile)?.[1]?.trim();
  if (!url) throw new Error('No encontré MONGO_URL en truco-back/.env (o definí E2E_MONGO_URL)');
  // Mismo cluster, otra base: reemplaza el nombre de la base por truco_e2e
  return url.replace(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)[^?]*/, '$1truco_e2e');
}

export const E2E = {
  api: 'http://localhost:4100/api',
  app: 'http://localhost:5175',
  outbox: OUTBOX
};

export default defineConfig({
  testDir: './e2e',
  timeout: 4 * 60 * 1000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: E2E.app,
    channel: 'chrome',
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: [
    {
      // Primero vacía truco_e2e (e2e/reset-db.mjs, con guarda por nombre) y después levanta el backend
      command: `node "${fileURLToPath(new URL('./e2e/reset-db.mjs', import.meta.url))}" && node src/app.js`,
      cwd: BACK_DIR,
      url: 'http://localhost:4100/health',
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        NODE_ENV: 'development',
        PORT: '4100',
        MONGO_URL: e2eMongoUrl(),
        CORS_ORIGINS: E2E.app,
        APP_URL: E2E.app,
        EMAIL_API_KEY: '',
        EMAIL_OUTBOX_FILE: OUTBOX,
        REQUIRE_EMAIL_VERIFICATION: 'false',
        REGISTER_MAX_PER_IP_PER_DAY: '1000',
        RATE_LIMITS_RELAXED: 'true',
        TOURNAMENT_NEXT_MATCH_SECONDS: '1'
      }
    },
    {
      command: 'npx vite --port 5175 --strictPort',
      url: E2E.app,
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        VITE_API_URL: E2E.api,
        VITE_WS_URL: 'http://localhost:4100'
      }
    }
  ]
});
