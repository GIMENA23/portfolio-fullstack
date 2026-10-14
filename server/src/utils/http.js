// ⚙️ BASE DEL PROYECTO — formato único de respuestas (clase 2: REST + JSON).
//   Éxito: { ok: true, data }
//   Error: { ok: false, error, details? }

export const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data })

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// Atajos: throw notFound('Proyecto no encontrado')
export const badRequest = (msg = 'Datos inválidos', details) => new HttpError(400, msg, details)
export const unauthorized = (msg = 'Tenés que iniciar sesión') => new HttpError(401, msg)
export const forbidden = (msg = 'No tenés permisos para esta acción') => new HttpError(403, msg)
export const notFound = (msg = 'No encontrado') => new HttpError(404, msg)

/**
 * Marca un endpoint que todavía no se programó.
 * Responde 501 indicando quién lo tiene asignado.
 * Cuando lo implementes, reemplazá pendiente(...) por tu función.
 */
export const pendiente = (owner, descripcion) => (req, res) =>
  res.status(501).json({ ok: false, error: `Pendiente (${owner}): ${descripcion}` })
