# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend de **Naipazo** (truco online con fichas virtuales). Vue 3 `<script setup>` + Quasar 2 + Vite + Pinia +
Vue Router 4 + Axios. El backend vive en un repo hermano: `../truco-back` (necesario para casi todo).
La especificación completa está en `../PROYECTO_TRUCO_ONLINE.md`; la arquitectura sale de la skill
`fullstack-scaffold` (`~/.claude/skills/fullstack-scaffold/frontend-architecture.md`).

## Comandos

```bash
npm run dev      # :5173
npm run build    # dist/ (verificación de que todo compila; no hay linter)
npm test         # unitarios con Vitest + happy-dom (src/**/__tests__: stores auth y wallet)
npm run test:e2e # end-to-end con Playwright (e2e/), ~3 min
```

**End-to-end (`playwright.config.js`):** levantan su propio backend en :4100 (base `truco_e2e`, derivada de
`MONGO_URL` de `../truco-back/.env`, o `E2E_MONGO_URL`) y su propio front en :5175, así no tocan los servidores
ni la base de desarrollo. Usan el Chrome instalado (`channel: chrome`) y **un contexto de navegador por jugador**
(localStorage aislado). Los emails salen por `EMAIL_OUTBOX_FILE` (`test-results/e2e-emails.jsonl`) y el backend
corre con `RATE_LIMITS_RELAXED`. Para manejar las partidas leen el store `game` y hacen clics (`e2e/helpers.js`);
el corte de red se simula con `setOffline` + `window.__socketDebug.socket` (solo existe en desarrollo).

`.env`: `VITE_API_URL` (base `/api`) y `VITE_WS_URL` (Socket.IO, desde M4). Se inyectan en build time.

## Arquitectura

- **`services/api.js` es el único lugar que conoce rutas del backend.** Cada endpoint es una función exportada
  que devuelve `data.data`. Todo error se convierte en `ApiError { message, code, status }` conservando el
  `code` del backend; las páginas reaccionan a códigos concretos (ej. `EMAIL_TAKEN`/`USERNAME_TAKEN` marcan
  el campo correspondiente en el registro).
- **Refresh automático:** el interceptor reintenta una vez ante 401 con una promesa de refresh compartida; si
  falla, limpia la sesión y redirige a `/login` dejando el motivo en `sessionStorage`. Hay un import circular
  intencional `router → stores/auth → services/api → router`; funciona porque `router` solo se usa en runtime.
- **Stores:** `auth` (tokens + usuario en `localStorage`, clave `truco_session`) y `wallet` (saldo y crédito
  diario, compartido entre la barra superior y la billetera). Toda respuesta de sesión pasa por
  `auth.applySession`, que alimenta a `wallet.ingest`, y este muestra el aviso "¡Recibiste tus N fichas de hoy!".
  El resto del estado vive en cada página.
- **Listados paginados en el servidor** (billetera, historial, ranking, admin): `composables/usePaginatedList.js`
  con `q-table` (`v-model:pagination` + `@request`). Es el equivalente de `useCrudResource` de la skill para
  colecciones paginadas; no hay pantallas CRUD clásicas.
- **Navegación:** `AppLayout` define `navItems` (Mesas, Historial, Ranking, Billetera, Perfil = las 5 tabs
  inferiores en celular). Admin solo aparece en la barra lateral y desde Perfil. Cerrar sesión está en Perfil
  (celular) y en la barra lateral (escritorio).
- **Router:** `meta.public`, `meta.guestOnly` y `meta.role`; un único `beforeEach` decide los accesos.
  La mesa (`/mesa/:roomId`) va fuera de `AppLayout`, a pantalla completa.
- **Tiempo real:** `composables/useSocket.js` mantiene **un solo** socket para toda la app (token en
  `auth` como función, así cada reintento usa el token vigente; ante `UNAUTHORIZED` refresca y reconecta).
  `stores/game.js` registra sus listeners una sola vez y, en cada `connect`, vuelve a emitir
  `room:join` para que el servidor reenvíe `game:state` (así funciona la reconexión). Las acciones salen
  por `game.sendAction(type, payload)` con un `actionId` uuid.
- La mesa (`components/game/`) es solo presentación de `game.view`; los botones son
  `view.availableActions`.
- **Decisiones de producto en la mesa:** no mostrar ayudas de tantos (ni los propios ni un resumen
  persistente del envido; solo el anuncio breve de lo que se cantó) y no mostrar el historial de jugadas.
  `game.log` (textos de `utils/gameText.js`) se sigue armando por si después se muestra en otro lado.
- **El front no implementa reglas de truco:** la mesa (M4) solo mostrará las acciones que el servidor manda
  en `availableActions`. Las reglas de `utils/validators.js` son solo feedback del formulario; el backend
  sigue siendo la autoridad.
- **Tema:** `main.js` importa `quasar/src/css/index.sass` (no `quasar/dist/quasar.css`) para que apliquen los
  colores de `src/quasar-variables.sass`; `vite.config.js` pasa esa ruta como absoluta. Requiere `sass-embedded`.
- **Estilos:** clases propias con prefijo `tr-`; las compartidas están en `styles/app-unified.css`. Diseño
  mobile-first: `AppLayout` muestra tabs inferiores bajo 1024px y sidebar desde 1024px.
- Textos de UI en español rioplatense con voseo. El aviso "las fichas son virtuales, no tienen valor
  monetario y no son canjeables" (`components/ChipsNotice.vue`) es obligatorio en el registro y la billetera.
- **Revancha (M7):** `stores/game.js` guarda `rematch` (eventos `game:rematch`); el panel de fin de partida de
  `pages/table.vue` la pide/acepta/rechaza y, al arrancar, navega a la mesa nueva. Las partidas de torneo no tienen
  revancha: muestran "Ver el torneo".
- **Partidas (lobby):** `pages/lobby/index.vue` lista **mesas y torneos juntos** (`lobby:rooms` + `lobby:tournaments`),
  diferenciados por color y etiqueta, con filtro por tipo (Todas / Mesas / Torneos). Un único botón "Crear partida" abre
  `CreateGameDialog`, donde se elige Mesa o Torneo con sus opciones. `/torneos` redirige al lobby.
- **Salas privadas:** el botón "Sala privada" del lobby abre `components/PrivateRoomDialog.vue` (Crear con monto escrito / Unirme con código: primero `fetchRoomByCode` para confirmar, después `joinRoomByCode`). No llegan por `lobby:rooms`; la sala de espera de `pages/table.vue` muestra el código y "Copiar código".
- **Torneos (M7):** `pages/tournaments/detail.vue` (cuadro en vivo con `tournament:subscribe` / `tournament:update`).
  `useSocket` escucha `tournament:match` en toda la app y lleva al jugador a su mesa; por eso `AppLayout` conecta el
  socket al montar.
- **App instalable (M7):** `public/manifest.webmanifest`, íconos generados con `node scripts/build-icons.mjs`
  (mismo dibujo que `favicon.svg`), `public/sw.js` mínimo (solo pantalla `offline.html`; no cachea API ni
  sockets) registrado en `main.js` únicamente en producción.
- **Cuentas (P4):** `/recuperar`, `/restablecer?token=`, `/verificar-email?token=` (públicas) y `/privacidad`.
  `EmailVerifyBanner` en el lobby; `auth.refreshUser()` relee el usuario si figura sin verificar (al montar
  `AppLayout` y al volver a la pestaña), así el aviso desaparece si verificó desde otro dispositivo.
- **Integridad (P5):** `PrivateRoomDialog` limita la apuesta a `config.privateMaxBet` (de `GET /api/config`);
  `ChipFlowsCard` en Administración. **Vencimientos (P6):** la mesa y el torneo muestran `cancelReason: 'expired'`.
- **Diagnóstico (P3):** en desarrollo, `window.__socketDebug` guarda los sockets creados, cada `room:join` con su
  origen y el socket (lo usan los e2e). El store `wallet` guarda `lastSource` e ignora saldos no numéricos.
- **2 vs 2 (M8):** `game.is2v2`, `game.partner`, `game.rivals`, `game.signs` / `lastSign` (evento `game:sign`) y
  `game.sendSign`. La mesa usa `components/game/TableBoard2v2.vue` (vos abajo, compañero arriba, rivales a los costados
  por posición relativa `(asiento - el mío + 4) % 4`; cada uno con TODAS las cartas que jugó en la mano delante, como en
  una mesa real); la sala de espera 2 vs 2 está en `pages/table.vue` (asientos por pareja, `changeSeat`, `leaveRoom` y,
  con la mesa completa, "Estoy listo" con `confirmReady`; arranca cuando confirman los 4). Lobby con filtro de modo; ranking y perfil con selector de modo.
  End-to-end con 4 contextos: `e2e/twovstwo.spec.js`.
- Git: siempre en `main`, sin ramas nuevas; no hacer push sin confirmarlo.
- Despliegue en Cloudflare Pages; `public/_redirects` resuelve el ruteo SPA.
