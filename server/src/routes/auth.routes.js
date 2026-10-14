// 🎨 DUEÑO: Integrante C — registro, login y sesión.
// ✅ YA FUNCIONA: register, login, me, google (falta el botón en el frontend).
import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { requireAuth, signToken } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { ok, unauthorized, forbidden, HttpError } from '../utils/http.js'

const router = Router()

// Máximo 10 intentos cada 15 minutos por IP (evita fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { ok: false, error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
})

const session = (user) => ({ token: signToken(user), user: user.toPublic() })

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres')
      .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/).withMessage('El nombre solo puede tener letras y espacios'),
    body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/).withMessage('La contraseña debe tener una mayúscula')
      .matches(/[a-z]/).withMessage('La contraseña debe tener una minúscula')
      .matches(/\d/).withMessage('La contraseña debe tener un número'),
  ],
  validate,
  async (req, res) => {
    const { name, email, password } = req.body
    const user = new User({ name, email, provider: 'local' })
    await user.setPassword(password)
    user.loginCount = 1
    user.lastLogin = new Date()
    await user.save()
    ok(res, session(user), 201)
  },
)

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(), body('password').notEmpty().withMessage('Ingresá la contraseña')],
  validate,
  async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+passwordHash')
    if (!user || !(await user.checkPassword(req.body.password))) throw unauthorized('Email o contraseña incorrectos')
    if (!user.active) throw forbidden('Tu cuenta está desactivada')
    await user.registerLogin()
    ok(res, session(user))
  },
)

// POST /api/auth/google  { credential }  (token que devuelve Google Identity Services)
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null

router.post('/google', authLimiter, [body('credential').notEmpty()], validate, async (req, res) => {
  if (!googleClient) throw new HttpError(501, 'Login con Google no configurado (falta GOOGLE_CLIENT_ID)')
  let payload
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: env.GOOGLE_CLIENT_ID })
    payload = ticket.getPayload()
  } catch {
    throw unauthorized('No se pudo verificar la cuenta de Google')
  }
  let user = await User.findOne({ email: payload.email })
  if (!user) {
    user = new User({ name: payload.name, email: payload.email, provider: 'google', googleId: payload.sub, avatar: payload.picture })
  }
  if (!user.active) throw forbidden('Tu cuenta está desactivada')
  await user.registerLogin()
  ok(res, session(user))
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => ok(res, req.user.toPublic()))

export default router
