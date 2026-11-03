import '../testing/helpers.js'; // primero: deja el entorno en modo test antes de cargar la configuración
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'dotenv';
import { api } from '../testing/helpers.js';
import { originMatcher, parseClientUrls } from '../config/cors.js';
import { readEnv } from '../config/env.js';
import { isLocalDatabase, seedBlocker } from '../seed/guard.js';
import { emailDelivery, transportOptions } from '../utils/mailer.js';

const production = { NODE_ENV: 'production', MONGODB_URI: 'mongodb+srv://u:p@cluster0.abc.mongodb.net/portfolio', JWT_SECRET: 'x'.repeat(32) };

describe('variables de entorno', () => {
  it('exige MONGODB_URI y JWT_SECRET, salvo en los tests', () => {
    assert.throws(() => readEnv({}), /Faltan variables de entorno: MONGODB_URI, JWT_SECRET/);
    assert.throws(() => readEnv({ MONGODB_URI: 'mongodb://localhost/x' }), /JWT_SECRET/);
    assert.doesNotThrow(() => readEnv({ NODE_ENV: 'test' }));
  });

  it('en producción rechaza una JWT_SECRET corta', () => {
    assert.throws(() => readEnv({ ...production, JWT_SECRET: 'corta' }), /al menos 32 caracteres/);
    assert.equal(readEnv(production).jwtSecret.length, 32);
    assert.doesNotThrow(() => readEnv({ NODE_ENV: 'development', MONGODB_URI: 'x', JWT_SECRET: 'corta' }), 'en desarrollo alcanza con cualquiera');
  });

  it('CLIENT_URL: varias URLs, sin barra final, y la primera sin comodín', () => {
    const env = readEnv({ ...production, CLIENT_URL: ' https://mi-app.vercel.app/ , https://mi-app-*.vercel.app ' });
    assert.deepEqual(env.clientUrls, ['https://mi-app.vercel.app', 'https://mi-app-*.vercel.app']);

    assert.throws(() => readEnv({ ...production, CLIENT_URL: 'https://*.vercel.app' }), /no puede llevar \*/);
    assert.throws(() => readEnv({ ...production, CLIENT_URL: 'mi-app.vercel.app' }), /URLs completas/);
    assert.throws(() => readEnv({ ...production, CLIENT_URL: 'https://mi-app.vercel.app/login' }), /sin ruta/);
    assert.deepEqual(readEnv(production).clientUrls, ['http://localhost:5173'], 'sin CLIENT_URL queda el de desarrollo');
  });

  it('TRUST_PROXY: por defecto 1, acepta un número y rechaza lo demás', () => {
    assert.equal(readEnv(production).trustProxy, 1);
    assert.equal(readEnv({ ...production, TRUST_PROXY: '2' }).trustProxy, 2);
    assert.equal(readEnv({ ...production, TRUST_PROXY: '0' }).trustProxy, 0);
    for (const bad of ['abc', '-1', '1.5']) assert.throws(() => readEnv({ ...production, TRUST_PROXY: bad }), /TRUST_PROXY/, bad);
  });

  it('el remitente sale de MAIL_FROM, o de MAIL_USER si es un email', () => {
    assert.equal(readEnv({ ...production, MAIL_USER: 'proyecto@gmail.com' }).mailFrom, 'proyecto@gmail.com');
    const brevo = readEnv({ ...production, MAIL_USER: 'a1b2c3001@smtp-brevo.com', MAIL_FROM: 'hola@midominio.com' });
    assert.equal(brevo.mailFrom, 'hola@midominio.com');
    assert.equal(readEnv({ ...production, MAIL_USER: 'usuario-smtp-sin-arroba' }).mailFrom, '', 'un usuario SMTP que no es un email no sirve de remitente');
    assert.equal(readEnv(production).mailPort, 587);
    assert.throws(() => readEnv({ ...production, MAIL_PORT: 'dos' }), /MAIL_PORT/);
  });

  it('el .env.example, copiado tal cual y con solo lo obligatorio completado, es una configuración válida', () => {
    const example = parse(readFileSync(new URL('../../.env.example', import.meta.url)));
    const env = readEnv({ ...example, MONGODB_URI: 'mongodb://localhost/portfolio', JWT_SECRET: 'una-clave-de-desarrollo' });
    assert.deepEqual([env.port, env.trustProxy, env.mailPort, env.jwtExpiresIn, env.clientUrls], [4000, 1, 587, '7d', ['http://localhost:5173']]);
    assert.deepEqual([env.mailHost, env.mailFrom, env.googleClientId, env.cloudinary.configured], ['', '', '', false]);
    for (const name of ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL', 'PORT', 'TRUST_PROXY', 'MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS', 'MAIL_FROM', 'CLOUDINARY_URL', 'GOOGLE_CLIENT_ID', 'SEED_PASSWORD']) {
      assert.ok(name in example, `${name} figura en el .env.example`);
    }
  });

  it('una variable en blanco cuenta como no definida', () => {
    const env = readEnv({ ...production, TRUST_PROXY: '', MAIL_PORT: '', PORT: '', CLIENT_URL: '', JWT_EXPIRES_IN: '' });
    assert.deepEqual([env.trustProxy, env.mailPort, env.port, env.clientUrls, env.jwtExpiresIn], [1, 587, 4000, ['http://localhost:5173'], '7d']);
  });

  it('Cloudinary se considera configurado con CLOUDINARY_URL o con las tres variables', () => {
    assert.equal(readEnv(production).cloudinary.configured, false);
    assert.equal(readEnv({ ...production, CLOUDINARY_URL: 'cloudinary://k:s@nube' }).cloudinary.configured, true);
    assert.equal(readEnv({ ...production, CLOUDINARY_CLOUD_NAME: 'n', CLOUDINARY_API_KEY: 'k' }).cloudinary.configured, false);
    assert.equal(readEnv({ ...production, CLOUDINARY_CLOUD_NAME: 'n', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's' }).cloudinary.configured, true);
  });
});

describe('CORS', () => {
  it('parseClientUrls recorta espacios y barras finales, y descarta vacíos', () => {
    assert.deepEqual(parseClientUrls('https://a.com/, ,https://b.com//'), ['https://a.com', 'https://b.com']);
  });

  it('originMatcher acepta las URLs exactas y los comodines de un solo nombre', () => {
    const allowed = originMatcher(['https://mi-app.vercel.app', 'https://mi-app-*-equipo.vercel.app', 'http://localhost:5173']);

    assert.equal(allowed('https://mi-app.vercel.app'), true);
    assert.equal(allowed('http://localhost:5173'), true);
    assert.equal(allowed('https://mi-app-git-main-equipo.vercel.app'), true, 'preview de Vercel');
    assert.equal(allowed('https://MI-APP.vercel.app'), true, 'el host no distingue mayúsculas');

    assert.equal(allowed('https://mi-app.vercel.app.evil.com'), false);
    assert.equal(allowed('https://evil.com/https://mi-app.vercel.app'), false);
    assert.equal(allowed('http://mi-app.vercel.app'), false, 'otro protocolo');
    assert.equal(allowed('https://mi-app-x.y-equipo.vercel.app'), false, 'el comodín no cruza puntos');
    assert.equal(allowed('https://mi-appXvercelXapp'), false, 'el punto del patrón es un punto, no "cualquier cosa"');
    assert.equal(allowed('http://localhost:51730'), false);
    assert.equal(originMatcher([])('https://cualquiera.com'), false);
  });

  const preflight = (origin) =>
    api()
      .options('/api/auth/login')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

  it('el preflight del cliente permitido trae los permisos y se guarda 10 minutos', async () => {
    const res = await preflight('http://localhost:5173');
    assert.equal(res.status, 204);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.match(res.headers['access-control-allow-headers'], /Authorization/i);
    assert.match(res.headers['access-control-allow-methods'], /PATCH/);
    assert.equal(res.headers['access-control-max-age'], '600');
  });

  it('un sitio ajeno no recibe permiso', async () => {
    const res = await preflight('https://sitio-ajeno.example');
    assert.equal(res.headers['access-control-allow-origin'], undefined);

    const real = await api().get('/api/health').set('Origin', 'https://sitio-ajeno.example');
    assert.equal(real.status, 200, 'el servidor responde igual: es el navegador el que no deja leer la respuesta');
    assert.equal(real.headers['access-control-allow-origin'], undefined);
  });

  it('un pedido real del cliente permitido refleja el origen; sin Origin no hay encabezado', async () => {
    const withOrigin = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    assert.equal(withOrigin.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.match(withOrigin.headers.vary, /Origin/);

    const without = await api().get('/api/health');
    assert.equal(without.status, 200);
    assert.equal(without.headers['access-control-allow-origin'], undefined);
  });
});

describe('configuración del email', () => {
  it('sin MAIL_HOST usa Gmail', () => {
    const options = transportOptions({ port: 587, user: 'proyecto@gmail.com', pass: 'clave' });
    assert.equal(options.service, 'gmail');
    assert.equal(options.host, undefined);
    assert.deepEqual(options.auth, { user: 'proyecto@gmail.com', pass: 'clave' });
  });

  it('con MAIL_HOST usa ese servidor: el puerto 2525 (que Render no bloquea) y el 587 sin SSL directo, el 465 con SSL', () => {
    const brevo = transportOptions({ host: 'smtp-relay.brevo.com', port: 2525, user: 'u', pass: 'p' });
    assert.deepEqual([brevo.host, brevo.port, brevo.secure, brevo.service], ['smtp-relay.brevo.com', 2525, false, undefined]);
    assert.equal(transportOptions({ host: 'h', port: 587, user: 'u', pass: 'p' }).secure, false);
    assert.equal(transportOptions({ host: 'h', port: 465, user: 'u', pass: 'p' }).secure, true);
  });

  it('sin credenciales, en producción NO simula el envío (no deja enlaces de recuperación en el registro ni dice "enviado")', () => {
    assert.equal(emailDelivery({ configured: true, nodeEnv: 'production' }), 'send');
    assert.equal(emailDelivery({ configured: false, nodeEnv: 'production' }), 'refuse');
    assert.equal(emailDelivery({ configured: false, nodeEnv: 'development' }), 'simulate');
    assert.equal(emailDelivery({ configured: false, nodeEnv: 'test' }), 'simulate');
    assert.equal(emailDelivery({ configured: false, nodeEnv: undefined }), 'simulate');
  });

  it('siempre tiene tiempos de espera: un puerto bloqueado falla en segundos, no deja colgado el pedido', () => {
    for (const options of [transportOptions({ user: 'u', pass: 'p' }), transportOptions({ host: 'h', port: 2525, user: 'u', pass: 'p' })]) {
      assert.ok(options.connectionTimeout <= 15_000 && options.greetingTimeout <= 15_000 && options.socketTimeout <= 30_000);
    }
  });
});

describe('seed: protección contra borrar la base equivocada', () => {
  it('reconoce las bases locales y las remotas', () => {
    for (const uri of ['mongodb://localhost:27017/portfolio', 'mongodb://127.0.0.1/portfolio', 'mongodb://u:p@localhost/x?a=b', 'mongodb://[::1]:27017/x', 'mongodb://localhost,127.0.0.1/x']) {
      assert.equal(isLocalDatabase(uri), true, uri);
    }
    for (const uri of ['mongodb+srv://u:p@cluster0.abc.mongodb.net/portfolio', 'mongodb://u:p@db.example.com:27017/x', 'mongodb://localhost,db.example.com/x', 'mongodb://localhost.evil.com/x', '', undefined, 'no es una uri']) {
      assert.equal(isLocalDatabase(uri), false, String(uri));
    }
  });

  it('en una base local corre sin pedir nada, con la contraseña por defecto', () => {
    assert.equal(seedBlocker({ uri: 'mongodb://localhost/portfolio', nodeEnv: 'development' }), null);
  });

  it('en una base remota exige una contraseña propia y --yes', () => {
    const remote = 'mongodb+srv://u:p@cluster0.abc.mongodb.net/portfolio';
    assert.match(seedBlocker({ uri: remote, nodeEnv: 'development', confirmed: true }), /SEED_PASSWORD/);
    assert.match(seedBlocker({ uri: remote, password: 'corta', confirmed: true }), /SEED_PASSWORD/);
    assert.match(seedBlocker({ uri: remote, password: 'una-clave-larga-123' }), /--yes/);
    assert.equal(seedBlocker({ uri: remote, password: 'una-clave-larga-123', confirmed: true }), null);
  });

  it('en producción también, aunque la base sea local', () => {
    assert.match(seedBlocker({ uri: 'mongodb://localhost/x', nodeEnv: 'production' }), /SEED_PASSWORD/);
    assert.equal(seedBlocker({ uri: 'mongodb://localhost/x', nodeEnv: 'production', password: 'una-clave-larga-123', confirmed: true }), null);
  });
});
