import { createApp } from 'vue';
import { Quasar, Dialog, Notify } from 'quasar';
import quasarLang from 'quasar/lang/es';
import { createPinia } from 'pinia';
import router from './router/index.js';
import App from './App.vue';
// Sass fuente (no quasar/dist/quasar.css) para que apliquen los colores de quasar-variables.sass
import 'quasar/src/css/index.sass';
import '@quasar/extras/material-icons/material-icons.css';
import './styles/app.css';
import './styles/app-unified.css';

const app = createApp(App);
app.use(Quasar, {
  plugins: { Notify, Dialog },
  lang: quasarLang,
  config: { notify: { position: 'top', timeout: 3500 } }
});
app.use(createPinia());
app.use(router);

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info);
  Notify.create({ type: 'negative', message: 'Ocurrió un error inesperado. Probá de nuevo.' });
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled promise rejection]', event.reason);
  Notify.create({ type: 'negative', message: 'Ocurrió un error inesperado. Probá de nuevo.' });
});

app.mount('#app');

// App instalable (PWA): el service worker se registra solo en producción (en desarrollo molesta con Vite)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('No se pudo registrar el service worker:', err));
  });
}
