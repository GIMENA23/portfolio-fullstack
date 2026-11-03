import path from 'node:path';
import multer from 'multer';
import { AppError, validationError } from './AppError.js';
import { detectMime } from './fileTypes.js';
import { storage } from './storage.js';
import { cleanText } from './validators.js';

const MB = 1024 * 1024;
export const MAX_SIZE = 2 * MB;
// Lo que se lee para poder decir cuánto pesa; más que eso se corta. Cada subida vive en memoria mientras se lee, y el
// plan gratuito de Render tiene poca: con 10 MB bastaban unas decenas de pedidos simultáneos desde distintas IPs.
export const PARSE_LIMIT = 5 * MB;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Qué se puede subir y quién puede hacerlo (sección 8 del contrato).
export const KINDS = {
  project: { adminOnly: true, types: IMAGE_TYPES, noun: 'La imagen', wrongFormat: 'Formato no permitido: solo JPG, PNG o WebP.' },
  profile: { adminOnly: true, types: IMAGE_TYPES, noun: 'La imagen', wrongFormat: 'Formato no permitido: solo JPG, PNG o WebP.' },
  attachment: { adminOnly: false, types: ['application/pdf', 'image/jpeg', 'image/png'], noun: 'El archivo', wrongFormat: 'Formato no permitido: solo PDF, JPG o PNG.' },
};

export const tooHeavy = (noun, size, field = 'file') =>
  new AppError(413, 'archivo_pesado', `${noun} pesa ${size}. El máximo es 2 MB.`, { fields: { [field]: `${noun} pesa ${size}. El máximo es 2 MB.` } });

// Solo el nombre, sin carpetas (ni con / ni con \) y sin HTML.
const safeName = (name) => path.posix.basename(cleanText(name).replace(/\\/g, '/')).replace(/\s+/g, ' ').slice(0, 100) || 'archivo';

// Mira el contenido (no la extensión) y el peso. Devuelve el tipo real; si algo está mal, lanza el error en `field`.
export function checkFile(file, kind, field = 'file') {
  const rule = KINDS[kind];
  const { buffer } = file;
  if (buffer.length > MAX_SIZE) throw tooHeavy(rule.noun, `${(buffer.length / MB).toFixed(1)} MB`, field);
  const mime = detectMime(buffer);
  if (!mime || !rule.types.includes(mime)) {
    throw new AppError(415, 'formato_no_permitido', rule.wrongFormat, { fields: { [field]: rule.wrongFormat } });
  }
  return mime;
}

// Sube un archivo ya revisado a Cloudinary.
export async function storeFile(file, kind, mime) {
  try {
    const stored = await storage.upload(file.buffer, { folder: `arce/${kind}`, resourceType: mime === 'application/pdf' ? 'raw' : 'image' });
    return { url: stored.url, publicId: stored.publicId, name: safeName(file.originalname), size: file.buffer.length, mime };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Falló la subida a Cloudinary:', error.message);
    throw new AppError(502, 'almacenamiento_error', 'No pudimos guardar el archivo. Probá de nuevo en un momento.');
  }
}

// Revisa todos los archivos antes de subir ninguno, así un archivo malo no deja otros subidos de más.
export async function checkAndStoreAll(files, kind, field) {
  const mimes = files.map((file) => checkFile(file, kind, field));
  return Promise.all(files.map((file, index) => storeFile(file, kind, mimes[index])));
}

// Lee un formulario multipart. `spec` es el método de multer: { single: 'file' } o { array: ['images', 5] }.
// Si el pedido no es multipart (JSON) no hace nada. preservePath: el nombre llega completo y lo limpiamos nosotros.
export function receiveFiles({ single, array, field = single ?? array[0] }) {
  const base = multer({ storage: multer.memoryStorage(), preservePath: true, limits: { fileSize: PARSE_LIMIT, files: single ? 1 : array[1], fields: 40 } });
  const parse = single ? base.single(single) : base.array(array[0], array[1]);
  return (req, res, next) => {
    parse(req, res, (error) => {
      if (!error) return next();
      if (error.code === 'LIMIT_FILE_SIZE') return next(tooHeavy('El archivo', `más de ${PARSE_LIMIT / MB} MB`, field));
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = single ? `Mandá un solo archivo, en el campo "${single}".` : `Mandá hasta ${array[1]} archivos, en el campo "${array[0]}".`;
        return next(validationError({ [field]: message }));
      }
      next(validationError({ [field]: 'No pudimos leer el archivo.' }));
    });
  };
}

const toArray = (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

// En multipart todo llega como texto: las listas repetidas vienen como texto o lista, y los booleanos como "true"/"false".
export function normalizeForm(body, { lists = [], booleans = [] }) {
  const out = { ...body };
  for (const key of lists) if (key in out) out[key] = toArray(out[key]);
  for (const key of booleans) if (out[key] === 'true' || out[key] === 'false') out[key] = out[key] === 'true';
  return out;
}

export { toArray };
