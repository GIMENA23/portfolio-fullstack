// ⚙️ BASE DEL PROYECTO — autenticación con JWT y control de roles.
//   router.get('/x', requireAuth, handler)                    → logueado
//   router.post('/x', requireAuth, requireRole('admin'), h)   → solo admin
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'
import { unauthorized, forbidden } from '../utils/http.js'

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

async function loadUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    return user && user.active ? user : null
  } catch {
    return null
  }
}

/** Exige sesión iniciada. Deja el usuario en req.user. */
export async function requireAuth(req, res, next) {
  req.user = await loadUser(req)
  if (!req.user) return next(unauthorized())
  next()
}

/** Si hay sesión, deja req.user; si no, sigue igual (para rutas públicas). */
export async function optionalAuth(req, res, next) {
  req.user = await loadUser(req)
  next()
}

/** Exige uno de los roles indicados. Usar DESPUÉS de requireAuth. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(forbidden())
  next()
}
