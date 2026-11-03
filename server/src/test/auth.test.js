import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

const fieldsOf = (body) => Object.fromEntries((body.details ?? []).map(({ field, message }) => [field, message]));

// El entorno tiene que estar listo antes de cargar la app (config/env.js lo lee al importarse).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-prueba';

const { createApp } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Inquiry } = await import('../models/Inquiry.js');
const { authenticate, optionalAuth, requireRole } = await import('../middlewares/auth.js');
const { errorHandler } = await import('../middlewares/errorHandler.js');
const { signToken } = await import('../utils/tokens.js');
const { outbox, backgroundMailSettled } = await import('../utils/mailer.js');

const app = createApp();
const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

const valid = {
  name: 'Valentina Ríos',
  email: 'valentina@correo.com',
  password: 'Valentina2026',
  passwordConfirm: 'Valentina2026',
  acceptTerms: true,
};
const register = (overrides = {}) => api().post('/api/auth/register').send({ ...valid, ...overrides });
const login = (password, email = valid.email) => api().post('/api/auth/login').send({ email, password });

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}, { timeout: 300_000 });

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
  outbox.length = 0;
});

describe('registro', () => {
  it('crea la cuenta, abre sesión y no expone la contraseña', async () => {
    const res = await register();
    assert.equal(res.status, 201);
    assert.equal(res.body.ok, true);
    assert.ok(res.body.data.token);
    assert.deepEqual(
      { name: res.body.data.user.name, email: res.body.data.user.email, role: res.body.data.user.role, providers: res.body.data.user.providers, loginCount: res.body.data.user.loginCount },
      { name: 'Valentina Ríos', email: 'valentina@correo.com', role: 'user', providers: ['email'], loginCount: 1 },
    );
    assert.doesNotMatch(JSON.stringify(res.body), /passwordHash|Valentina2026/);
  });

  it('guarda el email en minúsculas y sin espacios', async () => {
    const res = await register({ email: '  Valentina@Correo.COM ' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.email, 'valentina@correo.com');
  });

  it('responde 400 con un mensaje por campo', async () => {
    const res = await register({ name: 'Valentina', email: 'valentina@correo', password: 'corta', passwordConfirm: 'otra', acceptTerms: false });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'validacion');
    assert.deepEqual(fieldsOf(res.body), {
      name: 'Escribí nombre y apellido.',
      email: 'El email no es válido. Ejemplo: nombre@correo.com',
      password: 'La contraseña debe tener 8 caracteres o más, una mayúscula, una minúscula y un número.',
      passwordConfirm: 'Las contraseñas no coinciden.',
      acceptTerms: 'Tenés que aceptar para crear la cuenta.',
    });
  });

  it('rechaza nombres con símbolos o etiquetas HTML', async () => {
    const res = await register({ name: '<b>Valentina</b> Ríos' });
    assert.equal(res.status, 201); // las etiquetas se quitan antes de validar
    assert.equal(res.body.data.user.name, 'Valentina Ríos');
    const bad = await register({ email: 'otra@correo.com', name: 'Valen7ina Ríos' });
    assert.equal(fieldsOf(bad.body).name, 'Usá solo letras y espacios.');
  });

  it('responde 409 si el email ya tiene cuenta', async () => {
    await register();
    const res = await register({ name: 'Otra Persona' });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'email_en_uso');
    assert.equal(res.body.error, 'Ese email ya tiene una cuenta. ¿Querés ingresar?');
  });

  it('ignora operadores de Mongo en lugar de ejecutarlos', async () => {
    await register();
    const res = await api().post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });
});

describe('login', () => {
  beforeEach(() => register());

  it('devuelve token y usuario, y cuenta el acceso', async () => {
    const res = await login(valid.password);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.loginCount, 2);
    assert.ok(res.body.data.token);
  });

  it('con contraseña incorrecta cuenta los intentos que quedan', async () => {
    const res = await login('Incorrecta1');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'credenciales_invalidas');
    assert.equal(res.body.attemptsLeft, 4);
    assert.equal(res.body.error, 'Email o contraseña incorrectos (1 de 5 intentos).');
  });

  it('da el mismo error si el email no existe', async () => {
    const res = await login('Incorrecta1', 'nadie@correo.com');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'credenciales_invalidas');
  });

  it('al quinto fallo bloquea el email, aunque después venga la contraseña correcta', async () => {
    for (let intento = 1; intento <= 4; intento++) {
      const res = await login('Incorrecta1');
      assert.equal(res.status, 401);
      assert.equal(res.body.attemptsLeft, 5 - intento);
    }
    const quinto = await login('Incorrecta1');
    assert.equal(quinto.status, 429);
    assert.equal(quinto.body.code, 'demasiados_intentos');
    assert.ok(quinto.body.retryAfterSeconds > 0 && quinto.body.retryAfterSeconds <= 900);

    const conLaCorrecta = await login(valid.password);
    assert.equal(conLaCorrecta.status, 429);
  });

  it('un login correcto reinicia el contador', async () => {
    await login('Incorrecta1');
    await login('Incorrecta1');
    assert.equal((await login(valid.password)).status, 200);
    const res = await login('Incorrecta1');
    assert.equal(res.body.attemptsLeft, 4);
  });

  it('una cuenta desactivada recibe 403, y su token deja de servir', async () => {
    const { token } = (await login(valid.password)).body.data;
    await User.updateOne({ email: valid.email }, { active: false });

    const res = await login(valid.password);
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'cuenta_desactivada');

    const me = await api().get('/api/auth/me').set(bearer(token));
    assert.equal(me.status, 403);
    assert.equal(me.body.code, 'cuenta_desactivada');
  });
});

describe('google', () => {
  it('pide el token', async () => {
    const res = await api().post('/api/auth/google').send({});
    assert.equal(res.status, 400);
    assert.equal(fieldsOf(res.body).credential, 'Falta el token de Google.');
  });

  it('responde 503 mientras no haya GOOGLE_CLIENT_ID', async () => {
    const res = await api().post('/api/auth/google').send({ credential: 'abc' });
    assert.equal(res.status, 503);
    assert.equal(res.body.code, 'google_no_configurado');
  });
});

describe('sesión y cuenta propia', () => {
  let token;
  beforeEach(async () => {
    token = (await register()).body.data.token;
  });

  it('GET /me exige token y devuelve el usuario', async () => {
    const sinToken = await api().get('/api/auth/me');
    assert.equal(sinToken.status, 401);
    assert.equal(sinToken.body.code, 'no_autenticado');

    const malToken = await api().get('/api/auth/me').set(bearer('basura'));
    assert.equal(malToken.status, 401);

    const res = await api().get('/api/auth/me').set(bearer(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, valid.email);
    assert.deepEqual(res.body.data.providers, ['email']);
    assert.doesNotMatch(JSON.stringify(res.body), /passwordHash/);
  });

  it('PATCH /me cambia nombre y newsletter, pero no el email', async () => {
    const res = await api().patch('/api/auth/me').set(bearer(token)).send({ name: 'Valentina Ríos Gómez', newsletter: true, email: 'otro@correo.com' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Valentina Ríos Gómez');
    assert.equal(res.body.data.newsletter, true);
    assert.equal(res.body.data.email, valid.email);

    const vacio = await api().patch('/api/auth/me').set(bearer(token)).send({ name: '' });
    assert.equal(vacio.status, 400);
    assert.equal(fieldsOf(vacio.body).name, 'Ingresá tu nombre.');
  });

  it('POST /password cambia la contraseña pidiendo la actual', async () => {
    const nueva = { password: 'NuevaClave2026', passwordConfirm: 'NuevaClave2026' };
    const sinActual = await api().post('/api/auth/password').set(bearer(token)).send(nueva);
    assert.equal(sinActual.status, 400);
    assert.equal(fieldsOf(sinActual.body).currentPassword, 'La contraseña actual no es correcta.');

    const res = await api().post('/api/auth/password').set(bearer(token)).send({ ...nueva, currentPassword: valid.password });
    assert.equal(res.status, 200);
    assert.equal((await login(valid.password)).status, 401);
    assert.equal((await login('NuevaClave2026')).status, 200);
  });

  it('una cuenta de Google crea su primera contraseña sin la actual', async () => {
    const google = await User.create({ name: 'Mateo Fernández', email: 'mateo@ejemplo.com', googleId: 'google-123' });
    const res = await api()
      .post('/api/auth/password')
      .set(bearer(signToken(google)))
      .send({ password: 'Mateo2026', passwordConfirm: 'Mateo2026' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.providers, ['google', 'email']);
    assert.equal((await login('Mateo2026', 'mateo@ejemplo.com')).status, 200);
  });

  it('DELETE /me pide ELIMINAR, borra la cuenta y deja sus consultas anonimizadas', async () => {
    const user = await User.findOne({ email: valid.email });
    await Inquiry.create({ name: 'Valentina Ríos', email: valid.email, type: 'general', subject: 'Consulta general', message: 'Quiero saber si ofrecés mantenimiento mensual.', userId: user._id });

    const sinConfirmar = await api().delete('/api/auth/me').set(bearer(token)).send({ confirm: 'eliminar' });
    assert.equal(sinConfirmar.status, 400);
    assert.equal(fieldsOf(sinConfirmar.body).confirm, 'Escribí ELIMINAR para confirmar.');

    const res = await api().delete('/api/auth/me').set(bearer(token)).send({ confirm: 'ELIMINAR' });
    assert.equal(res.status, 200);
    assert.equal(await User.countDocuments(), 0);
    assert.equal((await api().get('/api/auth/me').set(bearer(token))).status, 401);

    // La consulta se queda (bandeja y estadísticas no cambian), pero sin nombre, email ni vínculo con la cuenta.
    const [inquiry] = await Inquiry.find();
    assert.equal(await Inquiry.countDocuments(), 1);
    assert.equal(inquiry.name, 'Cuenta eliminada');
    assert.equal(inquiry.email, 'eliminada@anonimo.invalid');
    assert.equal(inquiry.userId, null);
    assert.ok(inquiry.anonymizedAt);
    assert.equal(inquiry.message, 'Quiero saber si ofrecés mantenimiento mensual.');
  });

  it('un operador no puede borrarse a sí mismo', async () => {
    const operator = await User.create({ name: 'Operador Portfolio', email: 'operador@portfolio.test', role: 'operator' });
    const res = await api().delete('/api/auth/me').set(bearer(signToken(operator))).send({ confirm: 'ELIMINAR' });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'sin_permiso');
  });
});

describe('recuperar contraseña', () => {
  beforeEach(() => register());

  const requestLink = async () => {
    const res = await api().post('/api/auth/forgot').send({ email: valid.email });
    assert.equal(res.status, 200);
    await backgroundMailSettled(); // el email sale en segundo plano
    return outbox.at(-1)?.text.match(/token=([a-f0-9]+)/)?.[1];
  };
  const reset = (token, password = 'ClaveNueva2026') => api().post('/api/auth/reset').send({ token, password, passwordConfirm: password });

  it('responde lo mismo para un email que no existe, y no manda nada', async () => {
    const res = await api().post('/api/auth/forgot').send({ email: 'nadie@correo.com' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.message, 'Si el email tiene una cuenta, te enviamos un enlace.');
    await backgroundMailSettled();
    assert.equal(outbox.length, 0);
  });

  it('manda el enlace, cambia la clave y el enlace no sirve dos veces', async () => {
    const token = await requestLink();
    assert.ok(token, 'el email trae un enlace con token');
    assert.match(outbox.at(-1).text, /\/recuperar\?token=/);

    assert.equal((await reset(token)).status, 200);
    assert.equal((await login(valid.password)).status, 401);
    assert.equal((await login('ClaveNueva2026')).status, 200);

    const otraVez = await reset(token, 'OtraClave2026');
    assert.equal(otraVez.status, 400);
    assert.equal(otraVez.body.code, 'token_invalido');
  });

  it('rechaza un enlace vencido o inventado', async () => {
    const token = await requestLink();
    await User.updateOne({ email: valid.email }, { 'passwordReset.expiresAt': new Date(Date.now() - 1000) });
    assert.equal((await reset(token)).body.code, 'token_invalido');
    assert.equal((await reset('inventado')).body.code, 'token_invalido');
  });

  it('valida la contraseña nueva antes de mirar el token', async () => {
    const res = await reset('lo-que-sea', 'corta');
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'validacion');
  });

  it('el enlace sirve también para fijar la clave tras bloqueos de login', async () => {
    for (let i = 0; i < 5; i++) await login('Incorrecta1');
    assert.equal((await login(valid.password)).status, 429);
    const token = await requestLink();
    await reset(token);
    assert.equal((await login('ClaveNueva2026')).status, 200);
  });
});

describe('roles y sesión opcional', () => {
  const mini = express();
  mini.get('/solo-admin', authenticate, requireRole('admin'), (_req, res) => res.json({ ok: true }));
  mini.get('/abierta', optionalAuth, (req, res) => res.json({ email: req.user?.email ?? null }));
  mini.use(errorHandler);

  it('requireRole deja pasar al rol correcto y frena al resto', async () => {
    const user = await User.create({ name: 'Nicolás Pérez', email: 'nicolas@ejemplo.com' });
    const admin = await User.create({ name: 'Admin Portfolio', email: 'admin@portfolio.test', role: 'admin' });

    const prohibido = await request(mini).get('/solo-admin').set(bearer(signToken(user)));
    assert.equal(prohibido.status, 403);
    assert.equal(prohibido.body.code, 'sin_permiso');
    assert.equal((await request(mini).get('/solo-admin').set(bearer(signToken(admin)))).status, 200);
    assert.equal((await request(mini).get('/solo-admin')).status, 401);
  });

  it('optionalAuth toma la sesión si existe y sigue como anónimo si no', async () => {
    const user = await User.create({ name: 'Nicolás Pérez', email: 'nicolas@ejemplo.com' });
    assert.equal((await request(mini).get('/abierta').set(bearer(signToken(user)))).body.email, 'nicolas@ejemplo.com');
    assert.equal((await request(mini).get('/abierta').set(bearer('token-roto'))).body.email, null);
    assert.equal((await request(mini).get('/abierta')).body.email, null);
  });
});

describe('infraestructura', () => {
  it('GET /api/health responde', async () => {
    const res = await api().get('/api/health');
    assert.deepEqual(res.body, { ok: true, data: { status: 'up' } });
  });

  it('una ruta inexistente responde 404 en el formato de la API', async () => {
    const res = await api().get('/api/no-existe');
    assert.equal(res.status, 404);
    assert.equal(res.body.code, 'no_encontrado');
  });

  it('un JSON mal formado responde 400, no 500', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'validacion');
  });

  it('las consultas se numeran de a una, sin repetirse', async () => {
    const base = { name: 'Martín Díaz', email: 'martin@correo.com', type: 'general', subject: 'Consulta general', message: 'Necesito que me cuentes cómo trabajás con equipos.' };
    const numeros = [];
    for (let i = 0; i < 3; i++) numeros.push((await Inquiry.create(base)).number);
    assert.deepEqual(numeros, [1, 2, 3]);
  });
});
