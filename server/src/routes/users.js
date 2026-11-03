import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { AppError, validationError } from '../utils/AppError.js';
import { deleteAccount } from '../utils/accounts.js';
import { escapeRegex, pageMeta, pageParams } from '../utils/pagination.js';
import { ok } from '../utils/respond.js';
import { publicUser } from '../utils/serialize.js';
import { asString, assertValid, cleanText, collect } from '../utils/validators.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

const ROLES = ['user', 'operator', 'admin'];

const userNotFound = () => new AppError(404, 'no_encontrado', 'No encontramos ese usuario.');
const forbidden = (message) => new AppError(403, 'sin_permiso', message);

// `providers` se calcula con el hash de la contraseña, así que hay que traerlo (publicUser nunca lo devuelve).
const withProviders = (query) => query.select('+passwordHash');

// GET /api/users?rol=&q=&page=&limit=
router.get('/', async (req, res) => {
  const paging = pageParams(req.query);
  const filter = {};

  const rol = asString(req.query.rol);
  if (rol) {
    if (!ROLES.includes(rol)) throw validationError({ rol: 'Rol no válido.' });
    filter.role = rol;
  }
  const q = cleanText(req.query.q);
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    withProviders(User.find(filter).sort({ createdAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit)),
    User.countDocuments(filter),
  ]);
  ok(res, users.map(publicUser), pageMeta(paging, total));
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const user = await withProviders(User.findById(req.params.id));
  if (!user) throw userNotFound();
  ok(res, publicUser(user));
});

// PATCH /api/users/:id — cambia `role` y/o `active`.
// Un admin no puede quitarse el rol, desactivarse ni borrarse a sí mismo. Eso también garantiza que siempre
// quede un admin activo: quien hace el pedido es un admin activo, y si el cambio es sobre otro, él sigue estando.
router.patch('/:id', async (req, res) => {
  const user = await withProviders(User.findById(req.params.id));
  if (!user) throw userNotFound();

  const { role, active } = req.body ?? {};
  if (role === undefined && active === undefined) throw validationError({}, 'No hay nada para guardar.');
  assertValid(
    collect({
      role: role === undefined || ROLES.includes(role) ? '' : 'Rol no válido.',
      active: active === undefined || typeof active === 'boolean' ? '' : 'Valor no válido.',
    }),
  );

  const isSelf = user._id.equals(req.user._id);
  if (isSelf && active === false) throw forbidden('No podés desactivar tu propia cuenta de administrador.');
  if (isSelf && role !== undefined && role !== 'admin') throw forbidden('No podés quitarte el rol de administrador.');

  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  await user.save();
  ok(res, publicUser(user));
});

// DELETE /api/users/:id — borra la cuenta y sus consultas
router.delete('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw userNotFound();
  if (user._id.equals(req.user._id)) throw forbidden('No podés eliminar tu propia cuenta.');

  await deleteAccount(user._id);
  ok(res, { id: String(user._id) });
});

export default router;
