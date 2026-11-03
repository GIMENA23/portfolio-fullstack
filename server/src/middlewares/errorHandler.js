import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (_req, _res, next) => next(new AppError(404, 'no_encontrado', 'No encontramos lo que buscabas.'));

function toAppError(err) {
  if (err instanceof AppError) return err;

  // JSON mal formado o demasiado grande (body-parser de Express).
  if (err.type === 'entity.parse.failed') {
    return new AppError(400, 'validacion', 'El pedido no tiene un JSON válido.', { fields: {} });
  }
  if (err.type === 'entity.too.large') {
    return new AppError(413, 'pedido_muy_grande', 'El pedido es demasiado grande.');
  }

  // Errores del propio Express o de sus módulos con un 4xx (por ejemplo una URL mal codificada como /api/projects/%).
  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    return new AppError(err.status, 'pedido_invalido', 'El pedido no es válido.');
  }

  // Falla una regla del esquema de Mongoose.
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([path, e]) => [path, e.message]));
    return new AppError(400, 'validacion', 'Revisá los campos marcados.', { fields });
  }

  // Id con formato inválido (/api/projects/abc).
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(404, 'no_encontrado', 'No encontramos lo que buscabas.');
  }

  // Índice único: dos cuentas con el mismo email, dos servicios con el mismo nombre.
  if (err.code === 11000) {
    if (err.keyPattern?.email) {
      return new AppError(409, 'email_en_uso', 'Ese email ya tiene una cuenta. ¿Querés ingresar?', {
        fields: { email: 'Ese email ya tiene una cuenta. ¿Querés ingresar?' },
      });
    }
    if (err.keyPattern?.name) {
      return new AppError(409, 'nombre_en_uso', 'Ya existe un servicio con ese nombre.', {
        fields: { name: 'Ya existe un servicio con ese nombre.' },
      });
    }
    return new AppError(409, 'duplicado', 'Ya existe un registro con esos datos.');
  }

  return null;
}

// Express 5 detecta por la cantidad de parámetros que esto es un manejador de errores.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const appError = toAppError(err);

  if (!appError) {
    if (!env.isTest) console.error(err);
    return res.status(500).json({
      ok: false,
      error: 'Algo salió mal de nuestro lado. Probá de nuevo en un rato.',
      code: 'error_interno',
    });
  }

  // Formato que espera el frontend (client/src/services/api.js): `error` es el mensaje y `details` la lista por campo.
  const { fields, ...rest } = appError.extra;
  res.status(appError.status).json({
    ok: false,
    error: appError.message,
    code: appError.code,
    ...(fields && { details: Object.entries(fields).map(([field, message]) => ({ field, message })) }),
    ...rest,
  });
}
