import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { optionalAuth } from '../middlewares/auth.js';
import { limit } from '../middlewares/rateLimit.js';
import { AppError, validationError } from '../utils/AppError.js';
import { detectMime } from '../utils/fileTypes.js';
import { created } from '../utils/respond.js';
import { storage } from '../utils/storage.js';
import { asString, cleanText } from '../utils/validators.js';

const router = Router();

const MB = 1024 * 1024;
const MAX_SIZE = 2 * MB;
// Lo que se lee para poder decir cuánto pesa; más que eso se corta. Cada subida vive en memoria mientras se lee, y el
// plan gratuito de Render tiene poca: con 10 MB bastaban unas decenas de pedidos simultáneos desde distintas IPs.
const PARSE_LIMIT = 5 * MB;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Qué se puede subir y quién puede hacerlo (sección 8 del contrato).
const KINDS = {
  project: { adminOnly: true, types: IMAGE_TYPES, noun: 'La imagen', wrongFormat: 'Formato no permitido: solo JPG, PNG o WebP.' },
  profile: { adminOnly: true, types: IMAGE_TYPES, noun: 'La imagen', wrongFormat: 'Formato no permitido: solo JPG, PNG o WebP.' },
  attachment: { adminOnly: false, types: ['application/pdf', 'image/jpeg', 'image/png'], noun: 'El archivo', wrongFormat: 'Formato no permitido: solo PDF, JPG o PNG.' },
};

const tooHeavy = (noun, size) =>
  new AppError(413, 'archivo_pesado', `${noun} pesa ${size}. El máximo es 2 MB.`, { fields: { file: `${noun} pesa ${size}. El máximo es 2 MB.` } });

// preservePath: el nombre llega completo y lo limpiamos nosotros (si no, el parser lo corta en cualquier "/", incluso la de "</b>").
const parseFile = multer({ storage: multer.memoryStorage(), preservePath: true, limits: { fileSize: PARSE_LIMIT, files: 1, fields: 5 } }).single('file');

// Solo el nombre, sin carpetas (ni con / ni con \) y sin HTML.
const safeName = (name) => path.posix.basename(cleanText(name).replace(/\\/g, '/')).replace(/\s+/g, ' ').slice(0, 100) || 'archivo';

function receiveFile(req, res, next) {
  parseFile(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return next(tooHeavy('El archivo', `más de ${PARSE_LIMIT / MB} MB`));
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return next(validationError({ file: 'Mandá un solo archivo, en el campo "file".' }));
    next(validationError({ file: 'No pudimos leer el archivo.' }));
  });
}

// Los administradores suben sin límite; el resto (adjuntos de contacto) hasta 3 por hora por IP.
const visitorLimit = limit({ windowMs: 60 * 60 * 1000, max: 3, message: 'Subiste varios archivos seguidos. Probá de nuevo en una hora.' });
const limitVisitors = (req, res, next) => (req.user?.role === 'admin' ? next() : visitorLimit(req, res, next));

// POST /api/uploads — multipart/form-data con `file` y `kind` (project, profile o attachment)
router.post('/', optionalAuth, limitVisitors, receiveFile, async (req, res) => {
  const kind = asString(req.body?.kind);
  // hasOwn: con KINDS[kind] a secas, "__proto__" o "constructor" devolverían objetos heredados y romperían más abajo.
  const rule = Object.hasOwn(KINDS, kind) ? KINDS[kind] : undefined;
  if (!rule) throw validationError({ kind: 'Tipo de subida no válido.' });

  if (rule.adminOnly && req.user?.role !== 'admin') {
    throw req.user
      ? new AppError(403, 'sin_permiso', 'No tenés permiso para hacer esto.')
      : new AppError(401, 'no_autenticado', 'Iniciá sesión para continuar.');
  }
  if (!req.file) throw validationError({ file: 'Elegí un archivo.' });

  const { buffer, originalname } = req.file;
  if (buffer.length > MAX_SIZE) throw tooHeavy(rule.noun, `${(buffer.length / MB).toFixed(1)} MB`);

  const mime = detectMime(buffer);
  if (!mime || !rule.types.includes(mime)) {
    throw new AppError(415, 'formato_no_permitido', rule.wrongFormat, { fields: { file: rule.wrongFormat } });
  }

  let stored;
  try {
    stored = await storage.upload(buffer, { folder: `arce/${kind}`, resourceType: mime === 'application/pdf' ? 'raw' : 'image' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Falló la subida a Cloudinary:', error.message);
    throw new AppError(502, 'almacenamiento_error', 'No pudimos guardar el archivo. Probá de nuevo en un momento.');
  }

  created(res, { url: stored.url, publicId: stored.publicId, name: safeName(originalname), size: buffer.length, mime });
});

export default router;
