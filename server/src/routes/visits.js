import { Router } from 'express';
import { Visit } from '../models/Visit.js';
import { optionalAuth } from '../middlewares/auth.js';
import { limit } from '../middlewares/rateLimit.js';
import { assertValid, asString, collect } from '../utils/validators.js';
import { ok, created } from '../utils/respond.js';

const router = Router();

const SESSION_ID = /^[A-Za-z0-9_-]{8,100}$/;
const PANELS = ['/admin', '/operador'];

// Solo el camino de la página: sin ?consulta ni #ancla, para que /proyectos?x=1 y /proyectos sean la misma.
const cleanPath = (value) => asString(value).trim().split(/[?#]/)[0];

const isPanel = (path) => PANELS.some((panel) => path === panel || path.startsWith(`${panel}/`));

// POST /api/visits — público (si trae sesión, la visita guarda quién fue)
router.post('/', optionalAuth, limit({ windowMs: 60 * 1000, max: 60, message: 'Demasiados pedidos seguidos. Probá de nuevo en un minuto.' }), async (req, res) => {
  const path = cleanPath(req.body?.path);
  const sessionId = asString(req.body?.sessionId);
  assertValid(
    collect({
      path: path.startsWith('/') && path.length <= 200 ? '' : 'La ruta tiene que empezar con / y tener hasta 200 caracteres.',
      sessionId: SESSION_ID.test(sessionId) ? '' : 'El sessionId tiene que tener entre 8 y 100 letras, números, guiones o guiones bajos.',
    }),
  );

  // Los paneles de gestión no cuentan como tráfico del sitio.
  if (isPanel(path)) return ok(res, { counted: false });

  try {
    const result = await Visit.updateOne({ sessionId, path }, { $setOnInsert: { userId: req.user?._id ?? null, createdAt: new Date() } }, { upsert: true });
    if (result.upsertedCount === 0) return ok(res, { counted: false });
  } catch (error) {
    if (error.code === 11000) return ok(res, { counted: false }); // otro pedido idéntico la registró un instante antes
    throw error;
  }
  created(res, { counted: true });
});

export default router;
