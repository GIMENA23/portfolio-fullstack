// Pruebas de ataque: cada test describe el comportamiento SEGURO que se espera. Si falla, es un hallazgo.
import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { api, backgroundMailSettled, bearer, outbox, signToken, tokenFor, transport, useDatabase, User } from '../testing/helpers.js';
import { Inquiry } from '../models/Inquiry.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';
import { google } from '../utils/google.js';
import { runSeed } from '../seed/index.js';
import { stripHtml } from '../utils/validators.js';

useDatabase();
afterEach(() => mock.restoreAll());

const SECRET = 'secreto-de-prueba';
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const GOOD = 'Clave2026ok';

// Un mundo con una persona de cada rol, más una víctima y un dato de cada tipo.
async function world() {
  const tokens = {
    anon: null,
    user: await tokenFor('user'),
    operator: await tokenFor('operator'),
    admin: await tokenFor('admin'),
  };
  const victimToken = await tokenFor('user', 'victima@portfolio.test');
  const victim = await User.findOne({ email: 'victima@portfolio.test' });
  const project = await Project.create({ title: 'Proyecto de prueba', summary: 'Resumen', stack: ['React'], visible: true });
  const service = await Service.create({ name: 'Servicio de prueba', description: 'Descripción', order: 1, visible: true });
  const inquiry = await Inquiry.create({ name: 'Ana Gómez', email: 'ana@ejemplo.com', type: 'general', subject: 'Consulta de prueba', message: 'Quiero saber si ofrecés mantenimiento mensual.', userId: victim._id });
  return { tokens, victim, victimToken, project, service, inquiry };
}

const call = (method, path, token, body) => {
  const req = api()[method](path);
  if (token) req.set(bearer(token));
  return body === undefined ? req : req.send(body);
};

const accounts = async (email = 'ana@ejemplo.com') => {
  const res = await api().post('/api/auth/register').send({ name: 'Ana Gómez', email, password: GOOD, passwordConfirm: GOOD, acceptTerms: true });
  return res.body.data;
};

describe('control de acceso: nadie hace lo que su rol no permite', () => {
  const admin = ['admin'];
  const staff = ['operator', 'admin'];
  const registered = ['user', 'operator', 'admin'];

  // [método, ruta, cuerpo, roles permitidos]
  const routes = [
    ['get', () => '/api/users', undefined, admin],
    ['get', (w) => `/api/users/${w.victim.id}`, undefined, admin],
    ['patch', (w) => `/api/users/${w.victim.id}`, { role: 'admin' }, admin],
    ['delete', (w) => `/api/users/${w.victim.id}`, undefined, admin],
    ['get', () => '/api/admin/projects', undefined, admin],
    ['get', () => '/api/admin/services', undefined, admin],
    ['post', () => '/api/projects', { title: 'Hackeado', summary: 'x', stack: ['x'] }, admin],
    ['put', (w) => `/api/projects/${w.project.id}`, { title: 'Hackeado' }, admin],
    ['delete', (w) => `/api/projects/${w.project.id}`, undefined, admin],
    ['post', () => '/api/services', { name: 'Hackeado', description: 'x' }, admin],
    ['put', (w) => `/api/services/${w.service.id}`, { name: 'Hackeado' }, admin],
    ['delete', (w) => `/api/services/${w.service.id}`, undefined, admin],
    ['patch', () => '/api/services/order', { ids: [] }, admin],
    ['put', () => '/api/profile', { name: 'Hackeado' }, admin],
    ['get', () => '/api/stats/summary', undefined, admin],
    ['get', () => '/api/stats/visits', undefined, admin],
    ['get', () => '/api/stats/inquiries-by-type', undefined, admin],
    ['get', () => '/api/stats/registrations', undefined, admin],
    ['get', () => '/api/inquiries', undefined, staff],
    ['get', (w) => `/api/inquiries/${w.inquiry.id}`, undefined, staff],
    ['post', (w) => `/api/inquiries/${w.inquiry.id}/reply`, { text: 'Respuesta de prueba con más de veinte caracteres.' }, staff],
    ['patch', (w) => `/api/inquiries/${w.inquiry.id}`, { status: 'cerrada' }, staff],
    ['get', () => '/api/auth/me', undefined, registered],
    ['patch', () => '/api/auth/me', { name: 'Hackeado Uno' }, registered],
    ['post', () => '/api/auth/password', { password: GOOD, passwordConfirm: GOOD }, registered],
    ['delete', () => '/api/auth/me', { confirm: 'ELIMINAR' }, registered],
    ['get', () => '/api/inquiries/mine', undefined, registered],
    ['get', (w) => `/api/projects/${w.project.id}`, undefined, registered],
  ];

  for (const [method, path, body, allowed] of routes) {
    it(`${method.toUpperCase()} ${path({ victim: { id: ':id' }, project: { id: ':id' }, service: { id: ':id' }, inquiry: { id: ':id' } })}: anónimo 401, los demás roles 403`, async () => {
      const w = await world();
      for (const role of ['anon', 'user', 'operator', 'admin']) {
        if (allowed.includes(role)) continue;
        const res = await call(method, path(w), w.tokens[role], body);
        const expected = role === 'anon' ? 401 : 403;
        assert.equal(res.status, expected, `${role} recibió ${res.status}`);
        assert.equal(res.body.code, role === 'anon' ? 'no_autenticado' : 'sin_permiso');
      }
      // Nada se modificó.
      assert.equal(await User.countDocuments({ email: 'victima@portfolio.test' }), 1);
      assert.equal((await Project.findById(w.project.id)).title, 'Proyecto de prueba');
      assert.equal((await Service.findById(w.service.id)).name, 'Servicio de prueba');
      assert.equal((await Inquiry.findById(w.inquiry.id)).status, 'nueva');
    });
  }

  it('las imágenes de proyecto y perfil solo las sube el admin', async () => {
    const w = await world();
    for (const kind of ['project', 'profile']) {
      const anon = await api().post('/api/uploads').field('kind', kind).attach('file', PNG, 'a.png');
      assert.equal(anon.status, 401);
      for (const role of ['user', 'operator']) {
        const res = await api().post('/api/uploads').set(bearer(w.tokens[role])).field('kind', kind).attach('file', PNG, 'a.png');
        assert.equal(res.status, 403, `${role} ${kind}`);
      }
    }
  });

  it('un usuario ve solo sus consultas, no las de otro, ni siquiera sabiendo el id', async () => {
    const w = await world();
    const ownerSees = await call('get', '/api/inquiries/mine', w.victimToken);
    assert.equal(ownerSees.body.data.length, 1);
    const otherSees = await call('get', '/api/inquiries/mine', w.tokens.user);
    assert.deepEqual(otherSees.body.data, []);
    assert.equal((await call('get', `/api/inquiries/${w.inquiry.id}`, w.victimToken)).status, 403, 'ni el dueño entra al detalle del operador');
  });

  it('un usuario no puede borrar ni modificar la cuenta de otro: DELETE y PATCH /me solo tocan la suya', async () => {
    const w = await world();
    await call('delete', '/api/auth/me', w.tokens.user, { confirm: 'ELIMINAR', id: w.victim.id, userId: w.victim.id });
    assert.equal(await User.countDocuments({ email: 'victima@portfolio.test' }), 1);
    assert.equal(await User.countDocuments({ email: 'user@portfolio.test' }), 0);
  });
});

describe('tokens: no se pueden falsificar', () => {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const probe = (token) => api().get('/api/auth/me').set(bearer(token));

  it('rechaza un token sin firma (alg: none), en cualquier mayúscula', async () => {
    const admin = await User.create({ name: 'Admin Real', email: 'admin@portfolio.test', role: 'admin' });
    for (const alg of ['none', 'None', 'NONE', 'nOnE']) {
      const token = `${b64({ alg, typ: 'JWT' })}.${b64({ sub: admin.id, iat: now, exp: now + 3600 })}.`;
      assert.equal((await probe(token)).status, 401, alg);
    }
  });

  it('rechaza un token firmado con otra clave, vencido, o con un sub inválido', async () => {
    const user = await User.create({ name: 'Ana Gómez', email: 'ana@ejemplo.com' });
    assert.equal((await probe(jwt.sign({ sub: user.id }, 'otra-clave-que-no-es-la-nuestra', { expiresIn: '7d' }))).status, 401);
    assert.equal((await probe(jwt.sign({ sub: user.id }, SECRET, { expiresIn: -10 }))).status, 401);
    assert.equal((await probe(jwt.sign({ sub: '6710f0c2a1b2c3d4e5f60718' }, SECRET, { expiresIn: '7d' }))).status, 401, 'sub de alguien que no existe');
    assert.equal((await probe(jwt.sign({ sub: { $ne: null } }, SECRET, { expiresIn: '7d' }))).status, 401, 'sub como operador de Mongo');
    assert.equal((await probe(jwt.sign({}, SECRET, { expiresIn: '7d' }))).status, 401, 'sin sub');
    assert.equal((await probe('esto.no.esunjwt')).status, 401);
    assert.equal((await probe(`${signToken(user)}x`)).status, 401, 'firma alterada');
  });

  it('solo acepta HS256, el algoritmo con el que firmamos', async () => {
    const user = await User.create({ name: 'Ana Gómez', email: 'ana@ejemplo.com' });
    assert.equal((await probe(signToken(user))).status, 200);
    for (const algorithm of ['HS384', 'HS512']) {
      assert.equal((await probe(jwt.sign({ sub: user.id }, SECRET, { algorithm, expiresIn: '7d' }))).status, 401, algorithm);
    }
  });

  it('un token sirve solo mientras la cuenta existe y está activa', async () => {
    const user = await User.create({ name: 'Ana Gómez', email: 'ana@ejemplo.com' });
    const token = signToken(user);
    await User.updateOne({ _id: user._id }, { active: false });
    assert.equal((await probe(token)).status, 403);
    await User.deleteOne({ _id: user._id });
    assert.equal((await probe(token)).status, 401);
  });
});

describe('sesiones: una contraseña nueva cierra las sesiones anteriores', () => {
  it('cambiar la contraseña invalida los tokens viejos y entrega uno nuevo', async () => {
    const { token: stolen } = await accounts();
    const change = await api().post('/api/auth/password').set(bearer(stolen)).send({ currentPassword: GOOD, password: 'NuevaClave2026', passwordConfirm: 'NuevaClave2026' });
    assert.equal(change.status, 200);

    assert.equal((await api().get('/api/auth/me').set(bearer(stolen))).status, 401, 'el token robado dejó de servir');
    assert.ok(change.body.data.token, 'la respuesta trae un token nuevo para seguir con la sesión');
    assert.equal((await api().get('/api/auth/me').set(bearer(change.body.data.token))).status, 200);
  });

  it('recuperar la contraseña invalida todos los tokens anteriores', async () => {
    const { token: stolen } = await accounts();
    await api().post('/api/auth/forgot').send({ email: 'ana@ejemplo.com' });
    await backgroundMailSettled();
    const link = outbox.at(-1).text.match(/token=([a-f0-9]+)/)[1];
    assert.equal((await api().post('/api/auth/reset').send({ token: link, password: 'OtraClave2026', passwordConfirm: 'OtraClave2026' })).status, 200);

    assert.equal((await api().get('/api/auth/me').set(bearer(stolen))).status, 401);
    const fresh = await api().post('/api/auth/login').send({ email: 'ana@ejemplo.com', password: 'OtraClave2026' });
    assert.equal((await api().get('/api/auth/me').set(bearer(fresh.body.data.token))).status, 200);
  });

  it('cambiar la contraseña también anula un enlace de recuperación que seguía pendiente', async () => {
    const { token } = await accounts();
    await api().post('/api/auth/forgot').send({ email: 'ana@ejemplo.com' });
    await backgroundMailSettled();
    const link = outbox.at(-1).text.match(/token=([a-f0-9]+)/)[1];

    const change = await api().post('/api/auth/password').set(bearer(token)).send({ currentPassword: GOOD, password: 'NuevaClave2026', passwordConfirm: 'NuevaClave2026' });
    assert.equal(change.status, 200);
    const reuse = await api().post('/api/auth/reset').send({ token: link, password: 'Hackeada2026', passwordConfirm: 'Hackeada2026' });
    assert.equal(reuse.body.code, 'token_invalido');
  });
});

describe('login con Google: no se puede secuestrar una cuenta', () => {
  const asGoogle = (payload) => google.use(async () => payload);
  const loginGoogle = () => api().post('/api/auth/google').send({ credential: 'cualquiera' });

  it('si alguien se registró con el email de la víctima, al vincular Google se cierran las sesiones que ya tenía abiertas', async () => {
    // El atacante crea la cuenta con el email de la víctima (el registro no verifica el email).
    const { token: attackerToken } = await accounts('victima@gmail.com');

    asGoogle({ sub: 'google-de-la-victima', email: 'victima@gmail.com', email_verified: true, name: 'Vicky Víctima' });
    const res = await loginGoogle();
    assert.equal(res.status, 200);
    // Decisión del equipo: vincular Google NO borra la contraseña (conviven las dos formas de entrar).
    // El riesgo que queda (el atacante puede volver a entrar con su contraseña) está en SECURITY.md.
    assert.deepEqual(res.body.data.user.providers, ['google', 'email']);
    assert.equal((await api().get('/api/auth/me').set(bearer(attackerToken))).status, 401, 'la sesión que el atacante ya tenía abierta se cerró');
    assert.equal((await api().get('/api/auth/me').set(bearer(res.body.data.token))).status, 200, 'la víctima sí');
  });

  it('quien entró solo con Google puede crearse una contraseña y las dos formas de entrar conviven', async () => {
    asGoogle({ sub: 'google-de-vicky', email: 'vicky@gmail.com', email_verified: true, name: 'Vicky Víctima' });
    const { token } = (await loginGoogle()).body.data;
    const res = await api().post('/api/auth/password').set(bearer(token)).send({ password: 'ClaveNueva2026', passwordConfirm: 'ClaveNueva2026' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.providers, ['google', 'email']);
    assert.equal((await api().post('/api/auth/login').send({ email: 'vicky@gmail.com', password: 'ClaveNueva2026' })).status, 200);
    assert.equal((await loginGoogle()).status, 200);
  });

  it('vincular Google deja la contraseña y las dos formas de entrar siguen funcionando', async () => {
    await accounts('ana@gmail.com');
    asGoogle({ sub: 'google-de-ana', email: 'ana@gmail.com', email_verified: true, name: 'Ana Gómez' });
    assert.equal((await loginGoogle()).status, 200);
    assert.equal((await api().post('/api/auth/login').send({ email: 'ana@gmail.com', password: GOOD })).status, 200, 'la contraseña sigue valiendo');
    assert.equal((await loginGoogle()).status, 200, 'y Google también');
  });

  it('no deja entrar a una cuenta ya vinculada con OTRA cuenta de Google que tenga el mismo email', async () => {
    asGoogle({ sub: 'google-original', email: 'persona@empresa.com', email_verified: true, name: 'Persona Original' });
    assert.equal((await loginGoogle()).status, 201);

    // La empresa reasigna el email a otra persona: otra cuenta de Google, mismo email.
    asGoogle({ sub: 'google-del-nuevo-dueno', email: 'persona@empresa.com', email_verified: true, name: 'Nuevo Dueño' });
    const res = await loginGoogle();
    assert.ok([401, 403].includes(res.status), `respondió ${res.status}`);
    assert.equal(res.body.data, undefined);
  });

  it('rechaza un email que Google no verificó, y un token que Google no reconoce', async () => {
    asGoogle({ sub: 'g1', email: 'sinverificar@gmail.com', email_verified: false, name: 'Sin Verificar' });
    assert.equal((await loginGoogle()).status, 401);
    google.use(async () => {
      throw new Error('Token used too late');
    });
    assert.equal((await loginGoogle()).status, 401);
    assert.equal(await User.countDocuments(), 0);
  });
});

describe('login: fuerza bruta', () => {
  const attempt = (password, ip, email = 'ana@ejemplo.com') =>
    api().post('/api/auth/login').set('X-Forwarded-For', ip).send({ email, password });

  it('un burst de pedidos en paralelo no consigue más intentos que el límite', async () => {
    await accounts();
    const burst = await Promise.all(Array.from({ length: 40 }, (_, i) => attempt(`Incorrecta${i}x`, '203.0.113.9')));
    const evaluated = burst.filter((res) => res.status === 401).length;
    assert.ok(evaluated <= 6, `se evaluaron ${evaluated} contraseñas de 40 en paralelo (el límite es 5)`);
    assert.ok(burst.every((res) => [401, 429].includes(res.status)));
  });

  it('quien falla desde una IP no bloquea a la persona real que entra desde otra', async () => {
    await accounts();
    for (let i = 0; i < 7; i++) await attempt(`Incorrecta${i}x`, '203.0.113.9'); // el atacante
    assert.equal((await attempt('Incorrecta9x', '203.0.113.9')).status, 429, 'el atacante queda bloqueado');

    const real = await attempt(GOOD, '198.51.100.7'); // la dueña, desde su casa
    assert.equal(real.status, 200, 'la dueña no queda bloqueada por lo que hace el atacante');
  });

  it('pero repartir los intentos entre muchas IPs tampoco da intentos ilimitados contra una cuenta', async () => {
    await accounts();
    for (let i = 0; i < 60; i++) await attempt(`Incorrecta${i}x`, `192.0.2.${i + 1}`);
    const res = await attempt(GOOD, '198.51.100.7');
    assert.equal(res.status, 429, 'con más de 50 fallos en total la cuenta se bloquea para todos');
  });

  it('un login correcto reinicia solo el contador de esa IP', async () => {
    await accounts();
    for (let i = 0; i < 3; i++) await attempt(`Incorrecta${i}x`, '203.0.113.9');
    assert.equal((await attempt(GOOD, '203.0.113.9')).status, 200);
    const next = await attempt('Incorrecta9x', '203.0.113.9');
    assert.equal(next.body.attemptsLeft, 4);
  });
});

describe('recuperar contraseña: no revela qué emails tienen cuenta', () => {
  it('responde igual de rápido exista o no la cuenta, sin esperar al servidor de emails', async () => {
    await accounts();
    mock.method(transport, 'sendMail', () => new Promise((resolve) => setTimeout(resolve, 600)));

    const started = Date.now();
    const known = await api().post('/api/auth/forgot').send({ email: 'ana@ejemplo.com' });
    const knownMs = Date.now() - started;
    const unknown = await api().post('/api/auth/forgot').send({ email: 'nadie@ejemplo.com' });
    const unknownMs = Date.now() - started - knownMs;

    assert.deepEqual(known.body, unknown.body);
    assert.ok(knownMs < 300, `con cuenta tardó ${knownMs} ms: esperó al email y eso delata que el email existe`);
    assert.ok(Math.abs(knownMs - unknownMs) < 250);
  });

  it('si el envío falla en segundo plano, el servidor no se cae', async () => {
    await accounts();
    mock.method(console, 'error', () => {});
    mock.method(transport, 'sendMail', async () => {
      throw new Error('smtp caído');
    });
    assert.equal((await api().post('/api/auth/forgot').send({ email: 'ana@ejemplo.com' })).status, 200);
    await new Promise((resolve) => setTimeout(resolve, 50)); // si hubiera un rechazo sin atrapar, Node lo reporta acá
    assert.equal((await api().get('/api/health')).status, 200);
  });
});

describe('inyección de operadores de Mongo', () => {
  it('login, registro y recuperar contraseña no aceptan objetos donde va un texto', async () => {
    await accounts();
    const bad = [{ $gt: '' }, { $ne: null }, { $regex: '.*' }, ['ana@ejemplo.com'], 123, true];
    for (const value of bad) {
      assert.equal((await api().post('/api/auth/login').send({ email: value, password: value })).status, 400, JSON.stringify(value));
      assert.equal((await api().post('/api/auth/forgot').send({ email: value })).status, 400, JSON.stringify(value));
      assert.equal((await api().post('/api/auth/register').send({ name: value, email: value, password: value, passwordConfirm: value, acceptTerms: true })).status, 400);
    }
  });

  it('el enlace de recuperación no se puede adivinar con un operador', async () => {
    await accounts();
    await api().post('/api/auth/forgot').send({ email: 'ana@ejemplo.com' });
    await backgroundMailSettled();
    for (const token of [{ $exists: true }, { $ne: '' }, { $gt: '' }, '', 'a'.repeat(64)]) {
      const res = await api().post('/api/auth/reset').send({ token, password: 'Hackeada2026', passwordConfirm: 'Hackeada2026' });
      assert.equal(res.body.code, 'token_invalido', JSON.stringify(token));
    }
    assert.equal((await api().post('/api/auth/login').send({ email: 'ana@ejemplo.com', password: GOOD })).status, 200, 'la contraseña sigue siendo la de ella');
  });

  it('los filtros de los listados no interpretan operadores en la URL', async () => {
    const w = await world();
    const admin = w.tokens.admin;
    const get = (path) => call('get', path, admin);

    // Express 5 no arma objetos con claves como "rol[$ne]": la clave se ignora (no filtra ni rompe) y eso es lo seguro.
    assert.equal((await get('/api/users?rol[$ne]=user')).body.meta.total, 4, 'se ignora: devuelve a todos, no "todos menos user"');
    assert.equal((await get('/api/users?q[$regex]=.*')).status, 200);
    assert.equal((await get('/api/users?q[$regex]=.*')).body.meta.total, 4, 'la clave literal "q[$regex]" se ignora: no filtra');
    assert.equal((await get('/api/inquiries?tipo[$ne]=general')).body.meta.total, 1, 'se ignora: devuelve todo, no "todo menos general"');
    assert.equal((await get('/api/inquiries?estado[$in][]=nueva')).body.meta.total, 1);
    assert.equal((await get('/api/inquiries?desde[$gt]=2020-01-01')).status, 200);
    assert.equal((await get('/api/admin/projects?visible[$ne]=true')).body.meta.total, 1, 'se ignora: no filtra');
    assert.equal((await api().get('/api/projects?stack[$ne]=zzz')).body.meta.total, 1);
    assert.equal((await api().get('/api/projects?stack=React&stack=Vue')).status, 200, 'parámetro repetido');
    assert.equal((await get('/api/stats/summary?tipo[$ne]=x')).status, 200);
  });

  it('el cuerpo de visitas, usuarios y consultas no acepta objetos', async () => {
    const w = await world();
    assert.equal((await api().post('/api/visits').send({ path: { $ne: 1 }, sessionId: { $ne: 1 } })).status, 400);
    assert.equal((await call('patch', `/api/users/${w.victim.id}`, w.tokens.admin, { role: { $ne: 'user' } })).status, 400);
    assert.equal((await api().post('/api/inquiries').send({ name: { $ne: 1 }, email: { $ne: 1 }, type: { $ne: 1 }, subject: { $ne: 1 }, message: { $ne: 1 } })).status, 400);
    assert.equal((await call('patch', `/api/inquiries/${w.inquiry.id}`, w.tokens.operator, { status: { $ne: 'x' } })).status, 400);
  });
});

describe('asignación masiva: el cliente no decide campos que no le tocan', () => {
  it('al registrarse no se puede pedir ser admin ni fijar otros campos', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Ana Gómez', email: 'ana@ejemplo.com', password: GOOD, passwordConfirm: GOOD, acceptTerms: true,
      role: 'admin', active: false, loginCount: 999, googleId: 'g-robado', passwordHash: 'x', _id: '6710f0c2a1b2c3d4e5f60718',
      createdAt: '2000-01-01', passwordReset: { tokenHash: 'x', expiresAt: '2099-01-01' },
    });
    assert.equal(res.status, 201);
    const user = await User.findOne({ email: 'ana@ejemplo.com' }).select('+passwordReset');
    assert.deepEqual([user.role, user.active, user.googleId, user.passwordReset], ['user', true, undefined, undefined]);
    assert.equal(user.loginCount, 1);
    assert.notEqual(user.id, '6710f0c2a1b2c3d4e5f60718');
    assert.ok(user.createdAt.getFullYear() >= 2026);
  });

  it('PATCH /auth/me solo cambia el nombre y el newsletter', async () => {
    const { token } = await accounts();
    const res = await api().patch('/api/auth/me').set(bearer(token)).send({ name: 'Ana María', role: 'admin', email: 'otro@x.com', active: false, loginCount: 5 });
    assert.equal(res.status, 200);
    const user = await User.findOne({ email: 'ana@ejemplo.com' });
    assert.deepEqual([user.name, user.role, user.active], ['Ana María', 'user', true]);
  });

  it('una consulta no puede nacer cerrada, con respuestas, a nombre de otro usuario ni con otro número', async () => {
    const w = await world();
    const res = await api().post('/api/inquiries').send({
      name: 'Pedro Gómez', email: 'pedro@ejemplo.com', type: 'general', subject: 'Consulta general', message: 'Quiero saber si ofrecés mantenimiento mensual.',
      status: 'cerrada', userId: w.victim.id, number: 999, replies: [{ text: 'Respuesta falsa del operador', operatorName: 'Martina' }], createdAt: '2000-01-01',
    });
    assert.equal(res.status, 201);
    const stored = await Inquiry.findById(res.body.data.id);
    assert.deepEqual([stored.status, stored.userId, stored.replies.length], ['nueva', null, 0]);
    assert.notEqual(stored.number, 999);
    assert.ok(stored.createdAt.getFullYear() >= 2026);
  });

  it('el admin tampoco puede fijar ids, fechas ni el orden de un servicio a la fuerza', async () => {
    const w = await world();
    const project = await call('post', '/api/projects', w.tokens.admin, { title: 'Nuevo proyecto', summary: 'Resumen', stack: ['x'], _id: '6710f0c2a1b2c3d4e5f60718', createdAt: '2000-01-01', __v: 99 });
    assert.notEqual(project.body.data.id, '6710f0c2a1b2c3d4e5f60718');
    const service = await call('post', '/api/services', w.tokens.admin, { name: 'Otro servicio', description: 'x', order: 1 });
    assert.equal(service.body.data.order, 2, 'el orden lo decide el servidor');
  });

  it('un __proto__ en el cuerpo no contamina los objetos del servidor', async () => {
    const body = '{"name":"Ana Gómez","email":"ana@ejemplo.com","password":"Clave2026ok","passwordConfirm":"Clave2026ok","acceptTerms":true,"__proto__":{"role":"admin","polluted":true},"constructor":{"prototype":{"polluted":true}}}';
    const res = await api().post('/api/auth/register').set('Content-Type', 'application/json').send(body);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'user');
    assert.equal({}.polluted, undefined);
    assert.equal({}.role, undefined);
  });
});

describe('denegación de servicio por texto malicioso', () => {
  it('stripHtml da el mismo resultado que la expresión original en cualquier combinación de < > y texto', () => {
    const original = (text) => text.replace(/<[^>]*>/g, '');
    const pieces = ['<', '>', 'a', ' ', '<b>', '</b>', '<<', '>>', '<a href="x">', 'ñ', '\n', '<!--', '-->'];
    let seed = 7;
    const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 3000; i++) {
      let text = '';
      for (let j = Math.floor(random() * 12); j > 0; j--) text += pieces[Math.floor(random() * pieces.length)];
      assert.equal(stripHtml(text), original(text), JSON.stringify(text));
    }
  });

  it('90 KB de "<" no bloquean el servidor: se procesan en milisegundos y se rechazan por su largo', async () => {
    const started = Date.now();
    assert.ok(stripHtml('<'.repeat(90_000)).length === 90_000);
    assert.ok(stripHtml(`${'<'.repeat(90_000)}>`) === '');
    assert.ok(Date.now() - started < 200, `tardó ${Date.now() - started} ms`);

    const evil = '<'.repeat(45_000); // dos campos de 45 KB caben en el límite de 100 KB del cuerpo
    const res = await api().post('/api/inquiries').send({ name: 'Ana Gómez', email: 'ana@ejemplo.com', type: 'general', subject: evil, message: evil });
    assert.equal(res.status, 400);
    assert.ok(Date.now() - started < 1000, `el pedido tardó ${Date.now() - started} ms`);

    const tooBig = await api().post('/api/inquiries').send({ message: '<'.repeat(150_000) });
    assert.equal(tooBig.status, 413, 'un cuerpo de más de 100 KB ni se procesa');
  });
});

describe('validación del email', () => {
  it('no deja pasar emails con varios destinatarios, caracteres de encabezado ni más de 254 caracteres', async () => {
    const form = { name: 'Ana Gómez', type: 'general', subject: 'Consulta general', message: 'Quiero saber si ofrecés mantenimiento mensual.' };
    const evil = ['a@x.com,b.com', 'a@x.com;b.com', 'a<b>@x.com', '"a"@x.com', 'a(b)@x.com', 'a@x.com>', '<a@x.com', 'a@x.com\r\nBcc: z@y.com', 'a b@x.com', `${'a'.repeat(250)}@x.com`, 'a@x..com', 'a@.com'];
    for (const email of evil) {
      const res = await api().post('/api/inquiries').send({ ...form, email });
      assert.equal(res.status, 400, JSON.stringify(email));
    }
    for (const email of ['ana@ejemplo.com', 'ana.gomez+tag@sub.dominio.com.ar', "o'brien@ejemplo.com", 'josé@correo.com']) {
      assert.equal((await api().post('/api/inquiries').send({ ...form, email })).status, 201, email);
    }
    assert.equal(outbox.every((mail) => !/[\r\n,;<>]/.test(mail.to)), true, 'ningún destinatario llegó con caracteres raros');
  });
});

describe('respuestas del servidor', () => {
  it('lleva los encabezados de seguridad, no se anuncia y no deja que se guarden datos privados en una caché', async () => {
    const w = await world();
    const responses = [
      await api().get('/api/health'),
      await api().get('/api/no-existe'),
      await api().get('/api/auth/me'),
      await call('get', '/api/auth/me', w.tokens.user),
      await api().get('/api/projects'),
    ];
    for (const res of responses) {
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
      assert.ok(res.headers['strict-transport-security']);
      assert.equal(res.headers['x-powered-by'], undefined);
      assert.match(res.headers['cache-control'] ?? '', /no-store/, `${res.status}: falta Cache-Control: no-store`);
    }
  });

  it('una URL mal codificada es un 400, no un error del servidor', async () => {
    for (const path of ['/api/projects/%', '/api/projects/%E0%A4%A', '/api/inquiries/%zz', '/api/%']) {
      const res = await api().get(path);
      assert.ok(res.status >= 400 && res.status < 500, `${path} respondió ${res.status}`);
      assert.notEqual(res.body?.error?.code, 'error_interno', path);
    }
  });

  it('un fallo interno no muestra detalles técnicos', async () => {
    mock.method(console, 'error', () => {});
    mock.method(Project, 'find', () => {
      throw new Error('connect ECONNREFUSED mongodb://usuario:clave-secreta@host-interno:27017 en /app/routes/projects.js:22');
    });
    const res = await api().get('/api/projects');
    assert.equal(res.status, 500);
    assert.equal(res.body.code, 'error_interno');
    assert.doesNotMatch(JSON.stringify(res.body), /clave-secreta|host-interno|routes|ECONNREFUSED|stack/i);
  });

  it('ninguna respuesta de la API incluye hashes, tokens de recuperación ni identificadores de Google', async () => {
    await runSeed({ password: 'ClavePrueba2026', now: new Date() });
    const login = async (email) => (await api().post('/api/auth/login').send({ email, password: 'ClavePrueba2026' })).body.data.token;
    const admin = await login('admin@portfolio.test');
    const operator = await login('operador@portfolio.test');
    const user = await login('usuario@portfolio.test');
    await api().post('/api/auth/forgot').send({ email: 'usuario@portfolio.test' });

    const someUser = (await call('get', '/api/users?limit=1', admin)).body.data[0].id;
    const answered = await Inquiry.findOne({ 'replies.0': { $exists: true } });
    const project = await Project.findOne();
    const paths = [
      ['/api/users?limit=100', admin], [`/api/users/${someUser}`, admin], ['/api/auth/me', admin], ['/api/auth/me', user], ['/api/inquiries/mine', user],
      ['/api/inquiries?limit=100', operator], [`/api/inquiries/${answered.id}`, operator], ['/api/admin/projects', admin], ['/api/admin/services', admin],
      ['/api/stats/summary', admin], ['/api/stats/registrations', admin], ['/api/projects', null], [`/api/projects/${project.id}`, user], ['/api/services', null], ['/api/profile', null],
    ];
    const secrets = /passwordHash|tokenHash|passwordReset|\$2[aby]\$|googleId|termsAcceptedAt|"__v"|JWT_SECRET|MONGODB_URI/;
    for (const [path, token] of paths) {
      const res = await call('get', path, token);
      assert.equal(res.status, 200, path);
      assert.doesNotMatch(JSON.stringify(res.body), secrets, `${path} expone un dato secreto`);
    }
  });
});

describe('archivos: nada que no sea una imagen o un PDF', () => {
  it('rechaza SVG con scripts, HTML disfrazado, ejecutables, GIF, archivos vacíos y cabeceras truncadas', async () => {
    const w = await world();
    const bad = {
      'svg con script': Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'),
      'html': Buffer.from('<html><script>alert(document.cookie)</script></html>'),
      'ejecutable': Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'latin1'),
      'script de shell': Buffer.from('#!/bin/sh\nrm -rf /\n'),
      'gif': Buffer.from('GIF89a\x01\x00\x01\x00', 'latin1'),
      'vacío': Buffer.alloc(0),
      'cabecera truncada': Buffer.from('ffd8', 'hex'),
      'zip': Buffer.from('PK\x03\x04', 'latin1'),
    };
    for (const [label, file] of Object.entries(bad)) {
      for (const [token, kind] of [[w.tokens.admin, 'project'], [null, 'attachment']]) {
        const req = api().post('/api/uploads').field('kind', kind).attach('file', file, 'foto.png');
        if (token) req.set(bearer(token));
        const res = await req;
        assert.ok([400, 415].includes(res.status), `${label} como ${kind}: respondió ${res.status}`);
      }
    }
  });

  it('el tipo "kind" no admite rutas ni operadores', async () => {
    const w = await world();
    for (const kind of ['../../etc', 'project/../../x', 'PROJECT', ' project', 'project\u0000', '__proto__', 'constructor']) {
      const res = await api().post('/api/uploads').set(bearer(w.tokens.admin)).field('kind', kind).attach('file', PNG, 'a.png');
      assert.equal(res.status, 400, JSON.stringify(kind));
    }
  });
});
