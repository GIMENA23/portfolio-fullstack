import { after, before, beforeEach } from 'node:test';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// El entorno tiene que estar listo antes de cargar la app (config/env.js lo lee al importarse).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-prueba';

const { createApp } = await import('../app.js');
export const { User } = await import('../models/User.js');
export const { signToken } = await import('../utils/tokens.js');

const { storage } = await import('../utils/storage.js');
export const { outbox, transport, backgroundMailSettled } = await import('../utils/mailer.js');

// Cloudinary falso: guarda en memoria qué se subió y qué se borró. Solo reconoce las URLs de res.cloudinary.com/arce/.
export const fakeStorage = { uploads: [], removed: [] };
export const fakeProvider = {
  async upload(buffer, { folder, resourceType }) {
    const n = fakeStorage.uploads.push({ folder, resourceType, size: buffer.length });
    return { url: `https://res.cloudinary.com/arce/${resourceType}/upload/${folder}/archivo-${n}`, publicId: `${folder}/archivo-${n}` };
  },
  async remove(file) {
    fakeStorage.removed.push(file.publicId);
  },
  owns: (url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/arce/'),
};
storage.use(fakeProvider);

const app = createApp();
export const api = () => request(app);
// Los errores de validación llegan como details: [{ field, message }]; los tests los comparan como objeto.
export const fieldsOf = (body) => Object.fromEntries((body.details ?? []).map(({ field, message }) => [field, message]));
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// Crea un usuario con ese rol y devuelve su token.
export async function tokenFor(role, email = `${role}@portfolio.test`) {
  const user = await User.create({ name: `Cuenta ${role}`, email, role });
  return signToken(user);
}

// Levanta una MongoDB en memoria para el archivo de tests y la deja vacía antes de cada test.
export function useDatabase() {
  let mongod;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  }, { timeout: 300_000 });

  after(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
    outbox.length = 0;
    fakeStorage.uploads.length = 0;
    fakeStorage.removed.length = 0;
  });
}
