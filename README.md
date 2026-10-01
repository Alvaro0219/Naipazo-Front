# truco-front

Frontend de **Truco Online** (Fase 1, fichas virtuales). Vue 3 (`<script setup>`) + Quasar 2 + Vite +
Pinia + Vue Router 4 + Axios. Sigue la arquitectura de la skill `fullstack-scaffold`.

## Puesta en marcha

```bash
npm install
cp .env.example .env    # VITE_API_URL y VITE_WS_URL apuntando al backend
npm run dev             # http://localhost:5173
```

Necesita el backend (`truco-back`) corriendo en `VITE_API_URL`.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite. |
| `npm run build` | Build de producción en `dist/`. |
| `npm run preview` | Sirve el build localmente. |

## Estructura

- `services/api.js`: único punto de contacto con el backend. Interceptor de refresh automático en 401
  y errores tipados (`ApiError` con `message` + `code`).
- `stores/auth.js`: sesión (tokens + usuario) persistida en `localStorage`.
- `stores/wallet.js`: saldo y crédito diario; muestra el aviso “¡Recibiste tus 1000 fichas de hoy!”.
- `layouts/AppLayout.vue`: sidebar en escritorio, header + tabs inferiores en celular.
- Prefijo de clases CSS propias: `tr-`.

## Despliegue

Cloudflare Pages (build `npm run build`, salida `dist`). `public/_redirects` ya resuelve el
ruteo SPA. Las variables `VITE_*` se inyectan en build time: si cambian, hay que redesplegar.
