// Deja vacía la base de los end-to-end antes de levantar su backend (playwright.config.js → webServer).
// Sin esto los datos se acumulan entre corridas (por ejemplo, el ranking se llena de jugadores de pruebas viejas).
// Corre con cwd = truco-back, así usa su mongoose. Guarda: SOLO borra una base llamada exactamente truco_e2e.
import { createRequire } from 'node:module';
import { join } from 'node:path';

const mongoose = createRequire(join(process.cwd(), 'package.json'))('mongoose');
const url = process.env.MONGO_URL;
const name = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/.exec(url || '')?.[1];
if (name !== 'truco_e2e') {
  console.error(`reset-db: me niego a borrar la base "${name}" (solo truco_e2e)`);
  process.exit(1);
}
await mongoose.connect(url);
await mongoose.connection.dropDatabase();
await mongoose.disconnect();
console.log('reset-db: truco_e2e vacía');
