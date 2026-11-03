import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.js';
import { limit } from '../middlewares/rateLimit.js';
import { AppError, validationError } from '../utils/AppError.js';
import { KINDS, checkFile, receiveFiles, storeFile } from '../utils/uploadFile.js';
import { created } from '../utils/respond.js';
import { asString } from '../utils/validators.js';

const router = Router();

const receiveFile = receiveFiles({ single: 'file' });

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

  const mime = checkFile(req.file, kind);
  created(res, await storeFile(req.file, kind, mime));
});

export default router;
