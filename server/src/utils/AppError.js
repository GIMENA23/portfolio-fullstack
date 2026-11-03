// Error esperado de la API. `extra` se copia a la respuesta: `fields` sale como `details: [{ field, message }]`
// y el resto (`attemptsLeft`, `retryAfterSeconds`) queda al lado de `error` y `code`.
export class AppError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const validationError = (fields, message = 'Revisá los campos marcados.') =>
  new AppError(400, 'validacion', message, { fields });
