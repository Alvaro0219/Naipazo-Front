# N0 · Inventario para el rediseño "Noche porteña"

Base: `ESTILOS_NAIPAZO.md` (raíz del proyecto). Relevado el 08/10/2026 sobre `main` (front `bd54047`, back limpio).
Antes de empezar no había cambios sin commitear en ninguno de los dos repos.

## 1. Decisiones del dueño que pisan la guía

| Tema | Guía | Decisión |
|---|---|---|
| 2 vs 2, canto pendiente | Se encienden los dos lados del equipo que responde | **Solo el lado del rival que responde** (responde uno solo, el más mano: R-TRUCO-04). Lo de "si tu compañero ya respondió" no aplica |
| 2 vs 2, cartas jugadas | Baza en curso en cruz y las anteriores como tres puntos | **Se ven todas las cartas jugadas**, cada una delante de quien la jugó (como hoy) |
| Naipes, resolución | Hasta 170 px de ancho en la mano | Buscar una versión de **más resolución** de la misma baraja (vectorial de Wikimedia) en N5 |
| Naipes, borde | Radio 9 px y sombra | **Filete fino de 1 px con el redondeo del dibujo** (como hoy) más la sombra corta |
| Ajustes | "En ajustes…" (no existe la pantalla) | Sección **Ajustes dentro de Perfil**: jugar con un toque, cartel de cantos, efectos de luz |
| Sonidos | "Se mantienen los efectos actuales" | La app **no tiene sonidos**. N4 suma solo voces (archivos del dueño), el tic de los últimos 5 s y el acorde de victoria |
| Fuentes | Bricolage Grotesque e Instrument Sans autoalojadas | No están en el proyecto: se bajan de Google Fonts (OFL) en N1 |
| `CREDITS.md` | "Ya registradas" | No existe: se crea en `truco-front/` (cartas CC BY-SA 3.0, fuentes, Sol de Mayo, voces) |
| Dorso | Artboard "Dorso 1 · Sol de Mayo" | No hay acceso al canvas: se hace con la tabla de 11.2 |
| Apuesta rápida | Chips 500 / 1.000 / 2.500 / 5.000 | Se ocultan los que superan el tope (salas privadas: 1.000; general: 10.000; mínima 10) |

## 2. Pantallas y rutas

| Ruta | Archivo | Hito |
|---|---|---|
| `/login` | `pages/login.vue` | N2 |
| `/registro` | `pages/register.vue` | N2 |
| `/recuperar` | `pages/forgot-password.vue` | N2 |
| `/restablecer?token=` | `pages/reset-password.vue` | N2 |
| `/verificar-email?token=` | `pages/verify-email.vue` | N2 |
| `/terminos`, `/privacidad` | `pages/terms.vue`, `pages/privacy.vue` | N6 |
| `/` (Partidas) | `pages/lobby/index.vue` | N2 |
| `/mesa/:roomId` | `pages/table.vue` (sala de espera, mesa, fin) | N2 (espera), N3, N4, N7 |
| `/torneos/:id` | `pages/tournaments/detail.vue` | N6 |
| `/billetera` | `pages/wallet.vue` | N6 |
| `/historial`, `/historial/:id` | `pages/history/index.vue`, `detail.vue` | N6 |
| `/ranking` | `pages/ranking.vue` | N6 |
| `/perfil` | `pages/profile.vue` (+ Ajustes nuevos) | N6 |
| `/admin` | `pages/admin/index.vue` (+ `ChipFlowsCard`, `IntegrityCard`) | N6 |
| `/dev/cartas` | `pages/dev/cards.vue` → pasa a `/dev/naipes` | N5 |
| `/dev/componentes` (nueva, solo desarrollo) | — | N1 |
| Pantalla sin conexión | `public/offline.html` | N8 |

Layout: `layouts/AppLayout.vue` (encabezado, barra lateral en escritorio y tabs inferiores en celular).

## 3. Diálogos, banners y estados

| Qué | Dónde | Estados |
|---|---|---|
| Crear partida | `components/CreateGameDialog.vue` | Mesa / Torneo, 1 vs 1 / 2 vs 2, puntos, apuesta, cupos, errores (saldo, ya estás en otra) |
| Sala privada | `components/PrivateRoomDialog.vue` | Crear (monto escrito, tope), Unirme (código, confirmar, errores) |
| Aviso de fichas virtuales | `components/ChipsNotice.vue` | Registro, billetera, crear partida |
| Verificación de email | `components/EmailVerifyBanner.vue` | Sin verificar, reenviado, límite |
| Saldo | `components/BalanceChip.vue` | Normal, cargando |
| Carga / vacío | `components/LoadingState.vue` | Cargando, vacío con texto e ícono |
| Avisos | `$q.notify` (11 en la mesa, varios más) | Éxito, error, info |
| Sala de espera 1 vs 1 | `table.vue` | Pública, privada con código, cancelada, vencida (`expired`) |
| Sala de espera 2 vs 2 | `table.vue` | Asientos libres y ocupados, cambio de asiento, "Estoy listo" con tildes, salir |
| Mesa 1 vs 1 | `TableBoard.vue`, `PlayedCards.vue`, `PlayerHand.vue`, `ActionBar.vue`, `ScoreBoard.vue`, `TurnTimer.vue` | Tu turno, turno del rival, canto pendiente (tuyo y del rival), envido resuelto, mano terminada, malas/buenas |
| Mesa 2 vs 2 | `TableBoard2v2.vue` | Lo mismo con 4 lugares, señas enviadas y recibidas |
| Conexión | `ConnectionBanner.vue` | Se cortó tu conexión (reconectando), rival desconectado con cuenta regresiva |
| Sesión reemplazada | `table.vue` (`game.replaced`) | Pantalla con "Volver al lobby" |
| Partida suspendida | `table.vue` (`game.frozen`) | Diálogo con el mensaje del servidor |
| Abandonar | `table.vue` (confirmación) | 1 vs 1 y 2 vs 2 (texto de la pareja) |
| Fin de partida | `table.vue` (`tr-result`) | Ganaste, perdiste, abandono (rival o compañero), fichas, torneo (avanzás / quedaste afuera), revancha (pedir, aceptar, esperando, rechazada, vencida, falló) |
| Torneo | `tournaments/detail.vue` | Esperando jugadores, en juego, eliminado, campeón, cancelado, vencido |
| Mantenimiento | — | **No existe en la app**: el banner de 10.9 queda sin uso hasta que haya modo mantenimiento (M9) |

## 4. Cambios de textos y elementos a quitar

**"Truco online" (el nombre es Naipazo):**
- `index.html:14` `<title>Naipazo · Truco online</title>`
- `public/manifest.webmanifest:2` `"name": "Naipazo · Truco online"` (la descripción "Truco argentino online…" se mantiene: describe el juego)

**Flor (desaparece toda mención):**
- `components/CreateGameDialog.vue:96-97` ("Sin flor." y "Por ahora todas las mesas se juegan sin flor.")
- `components/PrivateRoomDialog.vue:94` ("sin flor")
- `pages/lobby/index.vue:95` ("sin flor")
- `pages/table.vue:8` ("sin flor")
- `pages/tournaments/detail.vue:13` ("sin flor")

**`$` como moneda:** ninguno.

**Emoji:** ningún carácter emoji. Íconos de cara: `pages/table.vue:174` (`sentiment_dissatisfied` al perder) y `pages/tournaments/detail.vue:56` (`sentiment_dissatisfied` al quedar afuera). Se reemplazan.

**Textos de estado y marcas en la mesa [Cambio de UX]:**
- `TableBoard.vue:8, 35` y `TableBoard2v2.vue:55, 209` — marca "Mano"
- `TableBoard.vue:77-86` y `TableBoard2v2.vue:184-193` — "Es tu turno", "Juega {nombre}", "Cantaste … Esperando respuesta…", "Te toca responder", "Ganaste la mano (+n)"
- `table.vue:7-8` — encabezado de la mesa con torneo, puntos, apuesta (pozo)
- `ConnectionBanner.vue:23, 27` — textos largos de desconexión (pasan a número chico y capa "Reconectando…")
- `TurnTimer.vue` — barra de tiempo (pasa a la luz del borde de la mesa)
- Versión y ping: **no se muestran** en ningún lado.

**Colores claros:** 64 apariciones de fondos claros (`#fff`, `#f…`, `bg-white`) en 25 archivos, entre ellos `styles/app-unified.css`, `styles/app.css`, `AppLayout.vue` y todas las páginas. Paleta Quasar actual: verde paño y dorado (`src/quasar-variables.sass`); `theme-color` y manifiesto en `#14532d`.

**Sombras y elevaciones:** 12 `box-shadow` propios y 98 usos de `q-card` (elevación por defecto de Quasar).

## 5. Datos que manda el servidor para la mesa

| Necesidad de la guía | Dato | Estado |
|---|---|---|
| Tiempo (6.4) | `game:state.turn = { playerIds, remainingMs, totalMs }` (el front calcula el plazo al recibirlo, F-04) | ✅ |
| Lado del tiempo / quién responde | `turn.playerIds` y `hand.pending.responderId` | ✅ |
| Cantos disponibles | `availableActions` | ✅ |
| Frontera malas/buenas | `scoreSections` por equipo (`malas`, `buenas` o `null` a 15) | ✅ |
| Tantos revelados y "Son buenas" | `game:event ENVIDO_RESULT { tantos }` (solo los cantados) y `hand.envido.result` | ✅ |
| Quién cantó (destello de dorsos, cartel) | `game:event CALL { playerId, call }`, `RESPONSE`, `WENT_TO_DECK` | ✅ |
| Baza ganada y parda | `hand.bazas[].winnerTeam` (`null` = parda) y `BAZA_WON { winnerPlayerId }` | ✅ |
| Rival desconectado (cuenta regresiva) | `disconnected[id].remainingMs` | ✅ |
| Fin: premio, abandono, resultado | `game:finished { chips, abandonedBy, results, endReason, score }` | ✅ |
| Premio del torneo (lobby y detalle) | `prize` en la serialización del torneo | ✅ |
| Mesas impagables | Saldo propio (store `wallet`) y `config.bet` | ✅ (se calcula en el front, no es una regla del juego) |
| Nombres de rondas ("Semifinal", "Final") | `round` y `size` | ✅ |

**Faltantes:** ninguno. No hace falta tocar el backend para N1–N8.

## 6. Pendientes para hitos siguientes

- N4: el dueño pasa los 9 archivos de voz (truco, retruco, vale cuatro, envido, real envido, falta envido, quiero, no quiero, me voy al mazo).
- N5: revisar si la versión vectorial de la baraja (Wikimedia, `Baraja española.svg`) tiene las 40 cartas; si no, avisar al dueño antes de decidir.
- N8: `public/offline.html` con los colores nuevos.
