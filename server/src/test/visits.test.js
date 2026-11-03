import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { User, api, bearer, fieldsOf, tokenFor, useDatabase } from '../testing/helpers.js';
import { Visit } from '../models/Visit.js';

useDatabase();

const SESSION = 'b3f6c1de-8a4e-4c8e-9d27-5a0f1e2b7c90';
const visit = (path, sessionId = SESSION, token) => {
  const req = api().post('/api/visits');
  if (token) req.set(bearer(token));
  return req.send({ path, sessionId });
};

describe('visitas', () => {
  it('cuenta la primera visita de una sesión a una página', async () => {
    const res = await visit('/proyectos');
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { ok: true, data: { counted: true } });

    const stored = await Visit.findOne();
    assert.deepEqual([stored.path, stored.sessionId, stored.userId], ['/proyectos', SESSION, null]);
    assert.ok(Date.now() - stored.createdAt.getTime() < 5000);
  });

  it('recargar la misma página no suma; otra página u otra sesión sí', async () => {
    assert.equal((await visit('/proyectos')).body.data.counted, true);

    const repetida = await visit('/proyectos');
    assert.equal(repetida.status, 200);
    assert.equal(repetida.body.data.counted, false);

    assert.equal((await visit('/contacto')).body.data.counted, true);
    assert.equal((await visit('/proyectos', 'otra-sesion-distinta')).body.data.counted, true);
    assert.equal(await Visit.countDocuments(), 3);
  });

  it('con sesión guarda quién fue; con un token roto, es anónima', async () => {
    const token = await tokenFor('user');
    const user = await User.findOne({ email: 'user@portfolio.test' });
    await visit('/', 'sesion-con-usuario', token);
    await visit('/', 'sesion-token-roto', 'token-roto');

    assert.equal((await Visit.findOne({ sessionId: 'sesion-con-usuario' })).userId.toString(), user.id);
    assert.equal((await Visit.findOne({ sessionId: 'sesion-token-roto' })).userId, null);
  });

  it('guarda solo el camino: sin ?consulta ni #ancla', async () => {
    await visit('/proyectos?stack=react#lista');
    assert.equal((await visit('/proyectos')).body.data.counted, false, 'es la misma página');
    assert.equal((await Visit.findOne()).path, '/proyectos');
  });

  it('los paneles de gestión no cuentan', async () => {
    for (const path of ['/admin', '/admin/usuarios', '/operador', '/operador/consultas/123']) {
      const res = await visit(path);
      assert.equal(res.status, 200, path);
      assert.equal(res.body.data.counted, false, path);
    }
    assert.equal(await Visit.countDocuments(), 0);
    assert.equal((await visit('/administracion')).body.data.counted, true, 'solo los prefijos exactos /admin y /operador');
  });

  it('valida la ruta y el sessionId', async () => {
    const mal = async (path, sessionId) => fieldsOf((await api().post('/api/visits').send({ path, sessionId })).body);

    assert.ok((await mal(undefined, SESSION)).path);
    assert.ok((await mal('proyectos', SESSION)).path);
    assert.ok((await mal(`/${'a'.repeat(200)}`, SESSION)).path);
    assert.ok((await mal('/', undefined)).sessionId);
    assert.ok((await mal('/', 'corto')).sessionId);
    assert.ok((await mal('/', 'tiene espacios y <tags>')).sessionId);
    assert.ok((await mal('/', { $ne: null })).sessionId);
    assert.equal(await Visit.countDocuments(), 0);
  });

  it('pedidos simultáneos idénticos cuentan una sola vez', async () => {
    const respuestas = await Promise.all(Array.from({ length: 8 }, () => visit('/proyectos')));
    assert.equal(respuestas.filter((res) => res.body.data.counted).length, 1);
    assert.equal(await Visit.countDocuments(), 1);
  });
});
