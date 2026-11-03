import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Login } from '../models/Login.js';
import { LoginAttempt } from '../models/LoginAttempt.js';
import { authenticate } from '../middlewares/auth.js';
import { limit } from '../middlewares/rateLimit.js';
import { AppError, validationError } from '../utils/AppError.js';
import { withAliases } from '../utils/aliases.js';
import { created, ok } from '../utils/respond.js';
import { deleteAccount } from '../utils/accounts.js';
import { google } from '../utils/google.js';
import { sendInBackground, sendPasswordResetEmail } from '../utils/mailer.js';
import { publicUser } from '../utils/serialize.js';
import { hashResetToken, newResetToken, signToken } from '../utils/tokens.js';
import {
  asString,
  assertValid,
  cleanText,
  collect,
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from '../utils/validators.js';

const router = Router();

const BCRYPT_COST = env.isTest ? 4 : 10;
const HOUR_MS = 60 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
// 5 fallos desde una misma IP bloquean ESA IP para esa cuenta: así quien conoce el email de alguien no puede dejarlo
// afuera desde otra conexión. Repartir intentos entre muchas IPs no sirve: 50 fallos en total la bloquean para todos.
const MAX_FAILED_LOGINS = 5;
const MAX_FAILED_PER_ACCOUNT = 50;

// Tope por IP, aparte del bloqueo por cuenta (se frenan los barridos de muchos emails desde un mismo lugar).
const registerLimit = limit({ windowMs: HOUR_MS, max: 20, message: 'Se crearon demasiadas cuentas desde esta conexión. Probá de nuevo en una hora.' });
const loginLimit = limit({ windowMs: LOCKOUT_MS, max: 20, skipSuccessfulRequests: true, message: 'Demasiados intentos fallidos desde esta conexión. Esperá 15 minutos.' });
const googleLimit = limit({ windowMs: LOCKOUT_MS, max: 30, message: 'Demasiados intentos desde esta conexión. Esperá 15 minutos.' });
const forgotIpLimit = limit({ windowMs: HOUR_MS, max: 10, message: 'Pediste demasiados enlaces desde esta conexión. Probá de nuevo en una hora.' });
const forgotEmailLimit = limit({
  windowMs: HOUR_MS,
  max: 3,
  key: (req) => normalizeEmail(req.body?.email),
  skip: (req) => !normalizeEmail(req.body?.email),
  message: 'Pediste demasiados enlaces. Probá de nuevo en una hora.',
});
const resetLimit = limit({ windowMs: HOUR_MS, max: 20, message: 'Demasiados intentos desde esta conexión. Probá de nuevo en una hora.' });
// Se compara contra este hash cuando el email no existe, para que tarde lo mismo que con un email real.
const DUMMY_HASH = bcrypt.hashSync('sin-cuenta', BCRYPT_COST);

const session = (user) => ({ token: signToken(user), user: publicUser(user) });

async function recordLogin(user, method) {
  user.loginCount += 1;
  user.lastLogin = new Date();
  await user.save();
  await Login.create({ userId: user._id, method });
}

const inactiveAccount = () => new AppError(403, 'cuenta_desactivada', 'Tu cuenta está desactivada. Escribinos para recuperarla.');

const emailInUse = () =>
  new AppError(409, 'email_en_uso', 'Ese email ya tiene una cuenta. ¿Querés ingresar?', {
    fields: { email: 'Ese email ya tiene una cuenta. ¿Querés ingresar?' },
  });

const lockedOut = (oldestFailure) =>
  new AppError(429, 'demasiados_intentos', 'Demasiados intentos. Esperá 15 minutos o recuperá tu contraseña.', {
    retryAfterSeconds: Math.max(1, Math.ceil((oldestFailure.getTime() + LOCKOUT_MS - Date.now()) / 1000)),
  });

// Nombre de Google → solo letras y espacios; si queda muy corto, se usa la parte local del email.
function googleName(name, email) {
  const letters = (value) =>
    asString(value).replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60).trim();
  const fromGoogle = letters(name);
  if (fromGoogle.length >= 3) return fromGoogle;
  const fromEmail = letters(email.split('@')[0]);
  return fromEmail.length >= 3 ? fromEmail : 'Usuario';
}

// POST /api/auth/register
// El formulario del sitio manda `nombre` y no pide repetir la contraseña ni aceptar términos: son opcionales,
// pero si vienen se validan.
const confirmIfSent = (password, confirm) => (confirm === undefined ? '' : validatePasswordConfirm(password, confirm));

router.post('/register', registerLimit, withAliases({ nombre: 'name' }, async (req, res) => {
  const { name, email, password, passwordConfirm, acceptTerms, newsletter } = req.body ?? {};
  assertValid(
    collect({
      name: validateName(name, { surname: true }),
      email: validateEmail(email),
      password: validatePassword(password),
      passwordConfirm: confirmIfSent(password, passwordConfirm),
      acceptTerms: acceptTerms === false ? 'Tenés que aceptar para crear la cuenta.' : '',
      newsletter: newsletter === undefined || typeof newsletter === 'boolean' ? '' : 'Valor no válido.',
    }),
  );

  const cleanEmail = normalizeEmail(email);
  if (await User.exists({ email: cleanEmail })) throw emailInUse();

  const user = new User({
    name: cleanText(name),
    email: cleanEmail,
    passwordHash: await bcrypt.hash(password, BCRYPT_COST),
    newsletter: newsletter === true,
    termsAcceptedAt: new Date(),
  });
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) throw emailInUse(); // dos registros simultáneos con el mismo email
    throw err;
  }
  await recordLogin(user, 'password');
  created(res, session(user));
}));

// POST /api/auth/login
router.post('/login', loginLimit, async (req, res) => {
  const body = req.body ?? {};
  const password = asString(body.password);
  assertValid(collect({ email: validateEmail(body.email), password: password ? '' : 'Ingresá tu contraseña.' }));

  const email = normalizeEmail(body.email);
  const ip = req.ip;
  const since = { $gte: new Date(Date.now() - LOCKOUT_MS) };

  // El intento se anota ANTES de mirar la contraseña. Si se contara después, 40 pedidos en paralelo verían
  // "0 intentos" los 40 y probarían 40 contraseñas; así cada uno se cuenta con los que ya llegaron.
  await LoginAttempt.create({ email, ip });
  const [fromThisIp, forThisAccount] = await Promise.all([
    LoginAttempt.find({ email, ip, at: since }).sort({ at: 1 }),
    LoginAttempt.countDocuments({ email, at: since }),
  ]);
  if (forThisAccount > MAX_FAILED_PER_ACCOUNT) {
    throw lockedOut((await LoginAttempt.findOne({ email, at: since }).sort({ at: 1 })).at);
  }
  if (fromThisIp.length > MAX_FAILED_LOGINS) throw lockedOut(fromThisIp[0].at);

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

  if (!user?.passwordHash || !passwordMatches) {
    const failures = fromThisIp.length; // incluye este intento
    if (failures >= MAX_FAILED_LOGINS) throw lockedOut(fromThisIp[0].at);
    throw new AppError(401, 'credenciales_invalidas', `Email o contraseña incorrectos (${failures} de ${MAX_FAILED_LOGINS} intentos).`, {
      attemptsLeft: MAX_FAILED_LOGINS - failures,
    });
  }

  await LoginAttempt.deleteMany({ email, ip });
  if (!user.active) throw inactiveAccount();
  await recordLogin(user, 'password');
  ok(res, session(user));
});

// POST /api/auth/google
router.post('/google', googleLimit, async (req, res) => {
  const credential = asString(req.body?.credential);
  if (!credential) throw validationError({ credential: 'Falta el token de Google.' });
  if (!google.isConfigured()) {
    throw new AppError(503, 'google_no_configurado', 'El ingreso con Google no está disponible por ahora.');
  }

  let profile;
  try {
    profile = await google.verify(credential);
  } catch {
    profile = null;
  }
  if (!profile?.email || !profile.email_verified) {
    throw new AppError(401, 'no_autenticado', 'No pudimos verificar tu cuenta de Google. Probá de nuevo.');
  }

  const email = normalizeEmail(profile.email);
  // Primero por la cuenta de Google (que es lo que no cambia), después por email.
  let user =
    (await User.findOne({ googleId: profile.sub }).select('+passwordHash +passwordReset')) ??
    (await User.findOne({ email }).select('+passwordHash +passwordReset'));
  const isNew = !user;

  if (isNew) {
    user = new User({ name: googleName(profile.name, email), email, googleId: profile.sub, termsAcceptedAt: new Date() });
  } else if (!user.googleId) {
    // Ya existía una cuenta con ese email: se vincula con Google (que sí verificó el email). La contraseña NO se
    // borra: las dos formas de entrar conviven (Mi cuenta → Seguridad). Se cierran las sesiones abiertas y se
    // anula un enlace de recuperación pendiente. Riesgo conocido: ver SECURITY.md.
    user.googleId = profile.sub;
    user.passwordReset = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  } else if (user.googleId !== profile.sub) {
    // El email pertenece a otra cuenta de Google (por ejemplo, la empresa lo reasignó a otra persona).
    throw new AppError(403, 'sin_permiso', 'Este email ya está vinculado a otra cuenta de Google.');
  }
  if (!user.active) throw inactiveAccount();

  await recordLogin(user, 'google');
  res.status(isNew ? 201 : 200).json({ ok: true, data: { ...session(user), isNew } });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => ok(res, publicUser(req.user)));

// PATCH /api/auth/me
// Acepta { name }, { newsletter } o { password, currentPassword }. Si la cuenta ya tiene contraseña, para cambiarla hay
// que mandar la actual; quien entró solo con Google puede crear la primera sin ella.
// Al cambiar la contraseña se cierran las demás sesiones: la respuesta trae un `token` nuevo para esta.
router.patch('/me', authenticate, async (req, res) => {
  const { name, newsletter, password, passwordConfirm, currentPassword } = req.body ?? {};
  if (name === undefined && newsletter === undefined && password === undefined) {
    throw validationError({}, 'No hay nada para guardar.');
  }
  const user = await User.findById(req.user._id).select('+passwordHash +passwordReset');
  const fields = collect({
    name: name === undefined ? '' : validateName(name),
    newsletter: newsletter === undefined || typeof newsletter === 'boolean' ? '' : 'Valor no válido.',
    password: password === undefined ? '' : validatePassword(password),
    passwordConfirm: password === undefined ? '' : confirmIfSent(password, passwordConfirm),
  });
  if (password !== undefined && user.passwordHash) {
    if (!asString(currentPassword)) fields.currentPassword = 'Ingresá tu contraseña actual.';
    else if (!(await bcrypt.compare(asString(currentPassword), user.passwordHash))) fields.currentPassword = 'La contraseña actual no es correcta.';
  }
  assertValid(fields);

  if (name !== undefined) user.name = cleanText(name);
  if (newsletter !== undefined) user.newsletter = newsletter;
  if (password !== undefined) {
    user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    user.passwordReset = undefined;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  }
  await user.save();
  ok(res, { ...publicUser(user), ...(password !== undefined && { token: signToken(user) }) });
});

// POST /api/auth/password — crea la contraseña (cuenta de Google) o la cambia
router.post('/password', authenticate, async (req, res) => {
  const { currentPassword, password, passwordConfirm } = req.body ?? {};
  const user = await User.findById(req.user._id).select('+passwordHash +passwordReset');
  const hasPassword = Boolean(user.passwordHash);

  const fields = collect({
    password: validatePassword(password),
    passwordConfirm: validatePasswordConfirm(password, passwordConfirm),
  });
  if (hasPassword && !(await bcrypt.compare(asString(currentPassword), user.passwordHash))) {
    fields.currentPassword = 'La contraseña actual no es correcta.';
  }
  assertValid(fields);

  user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  user.passwordReset = undefined; // un enlace de recuperación pendiente ya no sirve
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // y las sesiones anteriores tampoco: se entrega una nueva
  await user.save();
  ok(res, { providers: publicUser(user).providers, token: signToken(user) });
});

// DELETE /api/auth/me — borra la cuenta; sus consultas quedan anonimizadas
router.delete('/me', authenticate, async (req, res) => {
  if (req.user.role !== 'user') {
    throw new AppError(403, 'sin_permiso', 'Las cuentas de operador y administrador las elimina un administrador desde Usuarios.');
  }
  // El sitio pide escribir ELIMINAR en la pantalla y no lo manda: si viene, tiene que ser correcto.
  if (req.body?.confirm !== undefined && req.body.confirm !== 'ELIMINAR') {
    throw validationError({ confirm: 'Escribí ELIMINAR para confirmar.' });
  }

  await deleteAccount(req.user._id);
  ok(res, { id: String(req.user._id) });
});

// POST /api/auth/forgot — responde lo mismo exista o no el email
router.post('/forgot', forgotIpLimit, forgotEmailLimit, async (req, res) => {
  assertValid(collect({ email: validateEmail(req.body?.email) }));

  const user = await User.findOne({ email: normalizeEmail(req.body.email), active: true });
  if (user) {
    const { token, tokenHash, expiresAt } = newResetToken();
    user.passwordReset = { tokenHash, expiresAt };
    await user.save();
    const link = `${env.clientUrls[0]}/recuperar?token=${token}`;
    // El email se manda sin hacer esperar la respuesta: si el pedido tardara más cuando la cuenta existe
    // (el servidor de emails es lento), esa demora delataría qué emails tienen cuenta.
    sendInBackground(() => sendPasswordResetEmail({ to: user.email, name: user.name, link }), 'el email de recuperación');
  }
  ok(res, { message: 'Si el email tiene una cuenta, te enviamos un enlace.' });
});

// POST /api/auth/reset
router.post('/reset', resetLimit, async (req, res) => {
  const { token, password, passwordConfirm } = req.body ?? {};
  assertValid(
    collect({
      password: validatePassword(password),
      passwordConfirm: confirmIfSent(password, passwordConfirm),
    }),
  );

  const user = await User.findOne({
    'passwordReset.tokenHash': hashResetToken(asString(token)),
    'passwordReset.expiresAt': { $gt: new Date() },
  }).select('+passwordHash +passwordReset');
  if (!user) throw new AppError(400, 'token_invalido', 'El enlace venció o ya se usó. Pedí uno nuevo.');

  user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  user.passwordReset = undefined;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // cierra todas las sesiones anteriores (si la cuenta estaba comprometida, ese es el punto)
  await user.save();
  await LoginAttempt.deleteMany({ email: user.email });
  ok(res, { message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
});

export default router;
