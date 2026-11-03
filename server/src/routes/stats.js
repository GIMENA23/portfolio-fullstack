import { Router } from 'express';
import { Inquiry } from '../models/Inquiry.js';
import { Login } from '../models/Login.js';
import { User } from '../models/User.js';
import { Visit } from '../models/Visit.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { INQUIRY_TYPES } from '../utils/contentValidators.js';
import { addDays, mondayOf, parseDay, todaySalta } from '../utils/dates.js';
import { ok } from '../utils/respond.js';
import { inRange, resolveGrouping, resolveRange, series } from '../utils/stats.js';
import { assertValid, asString } from '../utils/validators.js';

// Números del dashboard. Todos aceptan ?desde=&hasta= (AAAA-MM-DD, ambos incluidos, hora de Salta);
// sin rango, los últimos 14 días.
const router = Router();
router.use(authenticate, requireRole('admin'));

// GET /api/stats/summary?tipo= — las cuatro tarjetas
router.get('/summary', async (req, res) => {
  const errors = {};
  const tipo = asString(req.query.tipo);
  if (tipo && !INQUIRY_TYPES.includes(tipo)) errors.tipo = 'Tipo no válido.';
  const range = resolveRange(req.query, { errors });

  const monthStart = new Date(parseDay(`${todaySalta().slice(0, 8)}01`));
  const [visits, logins, inquiries, total, newThisMonth] = await Promise.all([
    Visit.countDocuments(inRange('createdAt', range)),
    Login.countDocuments(inRange('at', range)),
    Inquiry.countDocuments({ ...inRange('createdAt', range), ...(tipo && { type: tipo }) }),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
  ]);
  ok(res, { visits, users: { total, newThisMonth }, logins, inquiries });
});

// GET /api/stats/visits?agrupar=dia|semana
router.get('/visits', async (req, res) => {
  const errors = {};
  const grouping = resolveGrouping(req.query, 'dia', errors);
  const range = resolveRange(req.query, { errors });
  ok(res, await series(Visit, 'createdAt', range, grouping));
});

// GET /api/stats/inquiries-by-type — siempre los tres tipos, aunque alguno tenga 0
router.get('/inquiries-by-type', async (req, res) => {
  const range = resolveRange(req.query);
  const rows = await Inquiry.aggregate([{ $match: inRange('createdAt', range) }, { $group: { _id: '$type', count: { $sum: 1 } } }]);
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  ok(res, ['cotizacion', 'general', 'asesoria'].map((type) => ({ type, count: counts.get(type) ?? 0 })));
});

// GET /api/stats/registrations?agrupar=semana — cuentas creadas. Sin rango: las últimas 6 semanas.
router.get('/registrations', async (req, res) => {
  const errors = {};
  const grouping = resolveGrouping(req.query, 'semana', errors);
  const range = resolveRange(req.query, { errors, defaultFrom: (to) => addDays(mondayOf(to), -35) });
  ok(res, await series(User, 'createdAt', range, grouping));
});

export default router;
