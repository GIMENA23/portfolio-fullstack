// ⚙️ BASE DEL PROYECTO — convierte cualquier error en una respuesta JSON prolija.
import mongoose from 'mongoose'
import multer from 'multer'

export function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Errores de validación de Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    return res.status(400).json({ ok: false, error: 'Datos inválidos', details })
  }
  // id con formato incorrecto (/api/projects/abc)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ ok: false, error: 'Identificador inválido' })
  }
  // Clave duplicada (ej. email ya registrado)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    return res.status(409).json({ ok: false, error: `Ya existe un registro con ese ${field}` })
  }
  // Archivos demasiado grandes, etc.
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el tamaño máximo (2 MB)' : err.message
    return res.status(400).json({ ok: false, error: msg })
  }

  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({
    ok: false,
    error: status === 500 ? 'Error interno del servidor' : err.message,
    ...(err.details && { details: err.details }),
  })
}
