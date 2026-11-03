import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

try {
  // Si Atlas no deja entrar a esta IP, falla en 10 segundos con un mensaje claro en lugar de colgarse.
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });
} catch (error) {
  console.error(`No se pudo conectar a MongoDB: ${error.message}`);
  console.error('Revisá MONGODB_URI (usuario, contraseña y nombre de la base) y que Atlas permita esta IP en Network Access.');
  process.exit(1);
}
console.log('MongoDB conectado');

const server = createApp().listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port}/api`);
});

// Render manda SIGTERM al reiniciar o redeployar: se termina lo que está en curso y se cierra la conexión.
function shutdown(signal) {
  console.log(`${signal} recibido: cerrando…`);
  setTimeout(() => process.exit(1), 10_000).unref(); // si algo cuelga, no se queda trabado el deploy
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
