import { rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

// Límite de pedidos por clave (por defecto la IP). Al pasarse responde 429 `demasiados_intentos`.
// En los tests se desactiva para no mezclar casos; un archivo de tests puede activarlo con
// testing/enable-rate-limits.js (corre en su propio proceso, así que no afecta a los demás).
// `skipSuccessfulRequests` cuenta solo los pedidos que fallaron (por ejemplo logins con clave incorrecta).
// `skip(req)` deja pasar sin contar los pedidos que no corresponden (por ejemplo los que no traen un email válido,
// para que quien manda basura no gaste el cupo de los demás).
export function limit({ windowMs, max, key, message = 'Demasiados intentos. Probá de nuevo más tarde.', skipSuccessfulRequests = false, skip }) {
  if (env.isTest && !process.env.TEST_RATE_LIMITS) return (_req, _res, next) => next();

  return rateLimit({
    windowMs,
    limit: max,
    skipSuccessfulRequests,
    ...(skip && { skip }),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...(key && { keyGenerator: key }),
    handler: (req, _res, next) => {
      const resetTime = req.rateLimit?.resetTime?.getTime() ?? Date.now() + windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
      next(new AppError(429, 'demasiados_intentos', message, { retryAfterSeconds }));
    },
  });
}
