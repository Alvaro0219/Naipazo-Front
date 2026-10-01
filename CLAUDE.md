# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend de **Truco Online** (Fase 1: fichas virtuales). Vue 3 `<script setup>` + Quasar 2 + Vite + Pinia +
Vue Router 4 + Axios. El backend vive en un repo hermano: `../truco-back` (necesario para casi todo).
La especificación completa está en `../PROYECTO_TRUCO_ONLINE.md`; la arquitectura sale de la skill
`fullstack-scaffold` (`~/.claude/skills/fullstack-scaffold/frontend-architecture.md`).

## Comandos

```bash
npm run dev      # :5173
npm run build    # dist/ (verificación de que todo compila; no hay tests ni linter)
```

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
- **Router:** `meta.public`, `meta.guestOnly` y `meta.role`; un único `beforeEach` decide los accesos.
- **El front no implementa reglas de truco:** la mesa (M4) solo mostrará las acciones que el servidor manda
  en `availableActions`. Las reglas de `utils/validators.js` son solo feedback del formulario; el backend
  sigue siendo la autoridad.
- **Tema:** `main.js` importa `quasar/src/css/index.sass` (no `quasar/dist/quasar.css`) para que apliquen los
  colores de `src/quasar-variables.sass`; `vite.config.js` pasa esa ruta como absoluta. Requiere `sass-embedded`.
- **Estilos:** clases propias con prefijo `tr-`; las compartidas están en `styles/app-unified.css`. Diseño
  mobile-first: `AppLayout` muestra tabs inferiores bajo 1024px y sidebar desde 1024px.
- Textos de UI en español rioplatense con voseo. El aviso "las fichas son virtuales, no tienen valor
  monetario y no son canjeables" (`components/ChipsNotice.vue`) es obligatorio en el registro y la billetera.
- Despliegue en Cloudflare Pages; `public/_redirects` resuelve el ruteo SPA.
