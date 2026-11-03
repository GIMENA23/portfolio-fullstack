import { AppError } from './AppError.js';

const rename = (object, names) => Object.fromEntries(Object.entries(object).map(([key, value]) => [names[key] ?? key, value]));

// El frontend manda algunos formularios con los nombres de campo en español (nombre, asunto…) y espera los errores
// con esos mismos nombres. Esto traduce el body a los nombres de la API y, si falla la validación, los errores de
// vuelta. Si el pedido ya viene con los nombres de la API, no toca nada.
export function withAliases(aliases, handler) {
  const reverse = Object.fromEntries(Object.entries(aliases).map(([spanish, english]) => [english, spanish]));
  return async (req, res, next) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const spanish = Object.keys(aliases).some((key) => Object.hasOwn(body, key));
    if (spanish) req.body = rename(body, aliases);
    try {
      await handler(req, res, next);
    } catch (error) {
      if (spanish && error instanceof AppError && error.extra.fields) error.extra.fields = rename(error.extra.fields, reverse);
      throw error;
    }
  };
}
