import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// Tests unitarios del front (stores y composables). Los end-to-end van con Playwright (e2e/).
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.js']
  }
});
