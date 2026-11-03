import '../testing/enable-rate-limits.js'; // primero: activa los límites de pedidos para este archivo
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, bearer, outbox, tokenFor, useDatabase } from '../testing/helpers.js';

useDatabase();

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const GOOD = 'Clave2026ok';
const fromIp = (req, ip) => req.set('X-Forwarded-For', ip);

const register = (n, ip = '203.0.113.10') =>
  fromIp(api().post('/api/auth/register'), ip).send({ name: 'Ana Gómez', email: `ana${n}@ejemplo.com`, password: GOOD, passwordConfirm: GOOD, acceptTerms: true });
const login = (email, password, ip = '203.0.113.10') => fromIp(api().post('/api/auth/login'), ip).send({ email, password });
const inquiry = (email, ip = '203.0.113.10') =>
  fromIp(api().post('/api/inquiries'), ip).send({ name: 'Pedro Gómez', email, type: 'general', subject: 'Consulta general', message: 'Quiero saber si ofrecés mantenimiento mensual.' });

describe('límites de pedidos por IP', () => {
  it('registrarse: más de 20 cuentas por hora desde la misma IP se frena', async () => {
    const codes = [];
    for (let n = 0; n < 22; n++) codes.push((await register(n)).status);
    assert.equal(codes.filter((code) => code === 201).length, 20);
    assert.deepEqual(codes.slice(20), [429, 429]);

    const other = await register(99, '198.51.100.7');
    assert.equal(other.status, 201, 'otra IP no se ve afectada');
  });

  it('login: solo cuentan los intentos fallidos, así que una clase entera puede entrar desde la misma IP', async () => {
    const accounts = [];
    for (let n = 0; n < 6; n++) accounts.push((await register(n, `198.51.100.${n + 1}`)).body.data.user.email);

    for (let round = 0; round < 5; round++) {
      for (const email of accounts) assert.equal((await login(email, GOOD)).status, 200);
    }

    let blockedAt = null;
    for (let i = 0; i < 25; i++) {
      const res = await login(`otro${i}@ejemplo.com`, 'Incorrecta1x'); // emails distintos: no dispara el bloqueo por cuenta
      if (res.status === 429) {
        blockedAt = i + 1;
        break;
      }
    }
    assert.equal(blockedAt, 21, 'el intento 21 con clave incorrecta desde la misma IP se frena');
    assert.equal((await login(accounts[0], GOOD)).status, 429, 'y mientras tanto esa IP no puede ni entrar bien: es un bloqueo de IP');
    assert.equal((await login(accounts[0], GOOD, '198.51.100.200')).status, 200, 'pero otra IP sí');
  });

  it('recuperar contraseña: no se puede mandar emails a muchas cuentas desde una IP', async () => {
    const codes = [];
    for (let n = 0; n < 12; n++) codes.push((await fromIp(api().post('/api/auth/forgot'), '203.0.113.10').send({ email: `victima${n}@ejemplo.com` })).status);
    assert.equal(codes.filter((code) => code === 200).length, 10);
    assert.deepEqual(codes.slice(10), [429, 429]);
  });

  it('login con Google y reset de contraseña también tienen límite por IP', async () => {
    const google = [];
    for (let n = 0; n < 35; n++) google.push((await fromIp(api().post('/api/auth/google'), '203.0.113.10').send({ credential: `token-${n}` })).status);
    assert.ok(google.includes(429), 'Google sin límite');

    const reset = [];
    for (let n = 0; n < 25; n++) reset.push((await fromIp(api().post('/api/auth/reset'), '203.0.113.11').send({ token: `${n}`.repeat(20), password: GOOD, passwordConfirm: GOOD })).status);
    assert.ok(reset.includes(429), 'reset sin límite');
  });

  it('un tope general por IP frena un chorro de pedidos de cualquier tipo', async () => {
    const codes = [];
    for (let n = 0; n < 320; n++) codes.push((await fromIp(api().get('/api/health'), '203.0.113.50')).status);
    assert.ok(codes.includes(429), '320 pedidos seguidos no se frenaron');
    assert.equal(codes.filter((code) => code === 200).length, 300);
    assert.equal((await fromIp(api().get('/api/health'), '203.0.113.51')).status, 200, 'otra IP no se ve afectada');
  });
});

describe('límites por destinatario: el formulario no sirve para mandar spam a un tercero', () => {
  it('el mismo email recibe como máximo 3 confirmaciones por hora, aunque las pidan desde IPs distintas', async () => {
    for (let n = 0; n < 3; n++) assert.equal((await inquiry('victima@ejemplo.com', `198.51.100.${n + 1}`)).status, 201);
    const fourth = await inquiry('victima@ejemplo.com', '198.51.100.40');
    assert.equal(fourth.status, 429);
    assert.equal(fourth.body.code, 'demasiados_intentos');
    assert.equal(outbox.filter((mail) => mail.to === 'victima@ejemplo.com').length, 3, 'el cuarto no mandó nada');

    assert.equal((await inquiry('otra@ejemplo.com', '198.51.100.41')).status, 201, 'otro destinatario no se ve afectado');
  });

  it('los emails con mayúsculas o espacios cuentan como el mismo destinatario', async () => {
    for (const email of ['Victima2@Ejemplo.com', ' victima2@ejemplo.com ', 'VICTIMA2@EJEMPLO.COM']) assert.equal((await inquiry(email, '198.51.100.1')).status, 201);
    assert.equal((await inquiry('victima2@ejemplo.com', '198.51.100.2')).status, 429);
  });
});

describe('subida de adjuntos', () => {
  it('quien no es admin sube hasta 3 por hora por IP; el admin no tiene ese tope', async () => {
    const upload = (ip, token) => {
      const req = fromIp(api().post('/api/uploads'), ip).field('kind', 'attachment').attach('file', PNG, 'a.png');
      return token ? req.set(bearer(token)) : req;
    };
    const codes = [];
    for (let n = 0; n < 5; n++) codes.push((await upload('203.0.113.20')).status);
    assert.deepEqual(codes, [201, 201, 201, 429, 429]);

    const admin = await tokenFor('admin');
    for (let n = 0; n < 6; n++) assert.equal((await upload('203.0.113.20', admin)).status, 201);
  });
});
