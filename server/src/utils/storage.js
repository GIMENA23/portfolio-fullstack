import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './AppError.js';
import { env } from '../config/env.js';

// Guarda archivos en Cloudinary. Los demás módulos solo conocen `storage`, así que en los tests
// se reemplaza con `storage.use(...)` y no se sube nada a internet.

const cloudinaryProvider = {
  upload(buffer, { folder, resourceType }) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: resourceType }, (error, result) => (error ? reject(error) : resolve({ url: result.secure_url, publicId: result.public_id })))
        .end(buffer);
    });
  },

  // Cloudinary borra por tipo de recurso: los PDF se suben como "raw" y las imágenes como "image".
  remove({ url, publicId }) {
    return cloudinary.uploader.destroy(publicId, { resource_type: url.includes('/raw/upload/') ? 'raw' : 'image' });
  },

  // Solo se aceptan como propios los archivos de nuestra cuenta de Cloudinary.
  owns(url) {
    return typeof url === 'string' && url.startsWith(`https://res.cloudinary.com/${cloudinary.config().cloud_name}/`);
  },
};

const notConfigured = {
  upload() {
    throw new AppError(503, 'almacenamiento_no_configurado', 'La subida de archivos no está disponible por ahora.');
  },
  remove: async () => {},
  owns: () => false,
};

if (env.cloudinary.configured && !env.cloudinary.url) {
  cloudinary.config({ cloud_name: env.cloudinary.cloudName, api_key: env.cloudinary.apiKey, api_secret: env.cloudinary.apiSecret, secure: true });
}

let provider = env.cloudinary.configured ? cloudinaryProvider : notConfigured;

export const storage = {
  upload: (buffer, options) => provider.upload(buffer, options),
  remove: (file) => provider.remove(file),
  owns: (url) => provider.owns(url),
  use(replacement) {
    provider = replacement;
  },
};

// Borra archivos que ya no se usan. Si falla no pasa nada grave (queda un archivo huérfano), así que
// nunca rompe el pedido. Solo toca archivos que subimos nosotros.
export async function removeFiles(files) {
  const own = files.filter((file) => file?.publicId && storage.owns(file.url));
  const results = await Promise.allSettled(own.map((file) => storage.remove(file)));
  for (const result of results) {
    if (result.status === 'rejected') console.error('No se pudo borrar un archivo de Cloudinary:', result.reason?.message ?? result.reason);
  }
}
