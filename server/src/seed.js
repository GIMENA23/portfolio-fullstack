import 'dotenv/config';
import mongoose from 'mongoose';
import { seedBlocker } from './seed/guard.js';
import { runSeed } from './seed/index.js';

// El seed solo necesita MONGODB_URI (no carga la configuración completa del servidor: no pide JWT_SECRET ni nada más).
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Falta MONGODB_URI. Definila en el .env o en la terminal antes de correr el seed.');
  process.exit(1);
}

const blocker = seedBlocker({
  uri,
  password: process.env.SEED_PASSWORD,
  confirmed: process.argv.includes('--yes'),
  nodeEnv: process.env.NODE_ENV,
});
if (blocker) {
  console.error(blocker);
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
} catch (error) {
  console.error(`No se pudo conectar a MongoDB: ${error.message}`);
  console.error('Revisá MONGODB_URI (usuario, contraseña codificada y nombre de la base) y que Atlas permita tu IP en Network Access.');
  process.exit(1);
}
console.log(`Base "${mongoose.connection.name}" en ${mongoose.connection.host}: se borra todo y se vuelve a cargar.`);

const summary = await runSeed({ password: process.env.SEED_PASSWORD || 'Portfolio2026' });
console.log(summary);
console.log(process.env.SEED_PASSWORD ? 'Contraseña de las cuentas: la de SEED_PASSWORD.' : 'Contraseña de las cuentas: Portfolio2026 (solo para desarrollo).');

await mongoose.disconnect();
