import { createApp } from 'vue';
import { Quasar, Dialog, Notify } from 'quasar';
import quasarLang from 'quasar/lang/es';
import { createPinia } from 'pinia';
import router from './router/index.js';
import App from './App.vue';
import Avatar from './components/ui/Avatar.vue';
import Ficha from './components/ui/Ficha.vue';
import Icono from './components/ui/Icono.vue';
import NzAviso from './components/ui/NzAviso.vue';
import NzBoton from './components/ui/NzBoton.vue';
import NzCampo from './components/ui/NzCampo.vue';
import NzChip from './components/ui/NzChip.vue';
import NzHoja from './components/ui/NzHoja.vue';
import NzPanel from './components/ui/NzPanel.vue';
import NzSegmentado from './components/ui/NzSegmentado.vue';
import NzSkeleton from './components/ui/NzSkeleton.vue';
import NzVacio from './components/ui/NzVacio.vue';
import SolDeMayo from './components/ui/SolDeMayo.vue';
// Sass fuente (no quasar/dist/quasar.css) para que apliquen los colores de quasar-variables.sass
import 'quasar/src/css/index.sass';
import '@quasar/extras/material-icons/material-icons.css';
// Naipazo · Noche porteña: tokens, fuentes autoalojadas y base global (ESTILOS_NAIPAZO.md)
import './css/tokens.css';
import './css/fonts.css';
import './css/base.css';

const app = createApp(App);
app.use(Quasar, {
  plugins: { Notify, Dialog },
  lang: quasarLang,
  // Modo oscuro fijo: no hay pantallas claras
  config: { dark: true, notify: { position: 'top', timeout: 3500 } }
});
// Componentes base de la guía (sección 5), disponibles en todas las pantallas
for (const [nombre, comp] of Object.entries({ Avatar, Ficha, Icono, NzAviso, NzBoton, NzCampo, NzChip, NzHoja, NzPanel, NzSegmentado, NzSkeleton, NzVacio, SolDeMayo })) {
  app.component(nombre, comp);
}
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
