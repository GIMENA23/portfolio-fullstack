// ⚙️ BASE DEL PROYECTO — ejecuta las reglas de express-validator.
//   router.post('/x', [reglas...], validate, handler)
import { validationResult } from 'express-validator'
import { badRequest } from '../utils/http.js'

export function validate(req, res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }))
  next(badRequest('Revisá los datos ingresados', details))
}
