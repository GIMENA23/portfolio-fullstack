import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/tokens.js';

const bearerToken = (req) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

// Devuelve el usuario dueño del token. Revisa `active` en cada pedido, así que
// desactivar una cuenta corta también las sesiones que ya estaban abiertas.
async function userFromToken(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, 'no_autenticado', 'Tu sesión venció. Iniciá sesión de nuevo.');
  }
  // El hash se carga porque `providers` (publicUser) se calcula con él; publicUser nunca lo devuelve.
  const user = mongoose.isValidObjectId(payload.sub) ? await User.findById(payload.sub).select('+passwordHash') : null;
  if (!user) throw new AppError(401, 'no_autenticado', 'Tu sesión venció. Iniciá sesión de nuevo.');
  // Un token emitido antes del último cambio de contraseña ya no vale.
  if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new AppError(401, 'no_autenticado', 'Tu sesión venció. Iniciá sesión de nuevo.');
  }
  if (!user.active) throw new AppError(403, 'cuenta_desactivada', 'Tu cuenta está desactivada. Escribinos para recuperarla.');
  return user;
}

export async function authenticate(req, _res, next) {
  const token = bearerToken(req);
  if (!token) throw new AppError(401, 'no_autenticado', 'Iniciá sesión para continuar.');
  req.user = await userFromToken(token);
  next();
}

// Para endpoints públicos que mejoran si hay sesión (por ejemplo enviar una consulta).
// Un token inválido o vencido no es un error: el pedido sigue como anónimo.
export async function optionalAuth(req, _res, next) {
  req.user = null;
  const token = bearerToken(req);
  if (token) {
    try {
      req.user = await userFromToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}

// Se usa después de `authenticate`.
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) throw new AppError(403, 'sin_permiso', 'No tenés permiso para hacer esto.');
    next();
  };
