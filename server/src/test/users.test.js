import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { User, api, bearer, fieldsOf, signToken, tokenFor, useDatabase } from '../testing/helpers.js';
import { Inquiry } from '../models/Inquiry.js';
import { Login } from '../models/Login.js';
import { Visit } from '../models/Visit.js';

useDatabase();

const make = (name, email, extra = {}) => User.create({ name, email, ...extra });
const consulta = (userId) => Inquiry.create({ name: 'Ana Gómez', email: 'ana@ejemplo.com', type: 'general', subject: 'Consulta general', message: 'Quiero saber si ofrecés mantenimiento mensual.', userId });

describe('usuarios de admin: lectura', () => {
  let admin;
  beforeEach(async () => {
    admin = bearer(await tokenFor('admin'));
  });

  it('solo entra el admin', async () => {
    const { id } = await make('Ana Gómez', 'ana@ejemplo.com');
    for (const role of ['user', 'operator']) {
      const token = bearer(await tokenFor(role));
      assert.equal((await api().get('/api/users').set(token)).status, 403, role);
      assert.equal((await api().patch(`/api/users/${id}`).set(token).send({ active: false })).status, 403, role);
      assert.equal((await api().delete(`/api/users/${id}`).set(token)).status, 403, role);
    }
    assert.equal((await api().get('/api/users')).status, 401);
  });

  it('lista con las columnas del panel, los más nuevos primero, y sin datos de la contraseña', async () => {
    await make('Antigua Ana', 'ana@ejemplo.com', { passwordHash: 'hash-secreto', createdAt: new Date('2026-09-01') });
    await make('Valentina Ríos', 'valentina@correo.com', { googleId: 'g-1', createdAt: new Date('2026-10-14') });
    await make('Mateo Fernández', 'mateo@ejemplo.com', { googleId: 'g-2', passwordHash: 'otro-hash', createdAt: new Date('2026-10-05') });

    const res = await api().get('/api/users?rol=user').set(admin);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((u) => u.name), ['Valentina Ríos', 'Mateo Fernández', 'Antigua Ana']);
    assert.deepEqual(res.body.data.map((u) => u.providers), [['google'], ['google', 'email'], ['email']]);
    assert.deepEqual(Object.keys(res.body.data[0]).sort(), ['active', 'createdAt', 'email', 'id', 'lastLogin', 'loginCount', 'name', 'newsletter', 'providers', 'role']);
    assert.doesNotMatch(JSON.stringify(res.body), /hash|passwordReset/);
    assert.deepEqual(res.body.meta, { page: 1, limit: 20, total: 3, totalPages: 1 });
  });

  it('filtra por rol y por texto, y pagina', async () => {
    await make('Operador Uno', 'operador@portfolio.test', { role: 'operator' });
    await make('Lucía Gómez', 'lucia@ejemplo.com');
    await make('Julieta Sosa', 'julieta@ejemplo.com');
    const names = async (query) => (await api().get(`/api/users?${query}`).set(admin)).body.data.map((u) => u.name).sort();

    assert.deepEqual(await names('rol=operator'), ['Operador Uno']);
    assert.deepEqual(await names('rol=admin'), ['Cuenta admin']);
    assert.deepEqual(await names('q=GÓMEZ'), ['Lucía Gómez']);
    assert.deepEqual(await names('q=julieta@'), ['Julieta Sosa']);
    assert.deepEqual(await names('q=.*'), []);
    assert.deepEqual(await names('rol=user&q=sosa'), ['Julieta Sosa']);

    const page = await api().get('/api/users?limit=2&page=2').set(admin);
    assert.equal(page.body.data.length, 2);
    assert.deepEqual(page.body.meta, { page: 2, limit: 2, total: 4, totalPages: 2 });
  });

  it('rechaza un rol inválido', async () => {
    const res = await api().get('/api/users?rol=dios').set(admin);
    assert.equal(res.status, 400);
    assert.equal(fieldsOf(res.body).rol, 'Rol no válido.');
  });

  it('GET /:id devuelve un usuario; 404 si no existe', async () => {
    const user = await make('Ana Gómez', 'ana@ejemplo.com', { passwordHash: 'x' });
    const res = await api().get(`/api/users/${user.id}`).set(admin);
    assert.equal(res.body.data.email, 'ana@ejemplo.com');
    assert.deepEqual(res.body.data.providers, ['email']);
    assert.equal((await api().get('/api/users/6710f0c2a1b2c3d4e5f60718').set(admin)).status, 404);
    assert.equal((await api().get('/api/users/abc').set(admin)).status, 404);
  });
});

describe('usuarios de admin: cambios', () => {
  let admin;
  let adminUser;
  beforeEach(async () => {
    admin = bearer(await tokenFor('admin'));
    adminUser = await User.findOne({ email: 'admin@portfolio.test' });
  });

  it('cambia el rol, y el nuevo rol vale en el siguiente pedido del usuario', async () => {
    const user = await make('Ana Gómez', 'ana@ejemplo.com');
    const token = bearer(signToken(user));
    assert.equal((await api().get('/api/admin/projects').set(token)).status, 403);

    const res = await api().patch(`/api/users/${user.id}`).set(admin).send({ role: 'admin' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.role, 'admin');
    assert.equal((await api().get('/api/admin/projects').set(token)).status, 200);

    assert.equal((await api().patch(`/api/users/${user.id}`).set(admin).send({ role: 'operator' })).body.data.role, 'operator');
  });

  it('desactivar corta el login y las sesiones abiertas; activar lo devuelve', async () => {
    const registro = await api().post('/api/auth/register').send({ name: 'Ana Gómez', email: 'ana@ejemplo.com', password: 'Clave2026ok', passwordConfirm: 'Clave2026ok', acceptTerms: true });
    const { id } = registro.body.data.user;
    const sesion = bearer(registro.body.data.token);
    const login = () => api().post('/api/auth/login').send({ email: 'ana@ejemplo.com', password: 'Clave2026ok' });

    const off = await api().patch(`/api/users/${id}`).set(admin).send({ active: false });
    assert.equal(off.body.data.active, false);
    assert.equal((await login()).body.code, 'cuenta_desactivada');
    assert.equal((await api().get('/api/auth/me').set(sesion)).status, 403);

    assert.equal((await api().patch(`/api/users/${id}`).set(admin).send({ active: true })).body.data.active, true);
    assert.equal((await login()).status, 200);
  });

  it('puede cambiar rol y estado en el mismo pedido', async () => {
    const user = await make('Ana Gómez', 'ana@ejemplo.com');
    const res = await api().patch(`/api/users/${user.id}`).set(admin).send({ role: 'operator', active: false });
    assert.deepEqual([res.body.data.role, res.body.data.active], ['operator', false]);
  });

  it('valida el pedido', async () => {
    const user = await make('Ana Gómez', 'ana@ejemplo.com');
    const patch = (body) => api().patch(`/api/users/${user.id}`).set(admin).send(body);

    const vacio = await patch({});
    assert.equal(vacio.status, 400);
    assert.equal(vacio.body.error, 'No hay nada para guardar.');
    assert.deepEqual(fieldsOf((await patch({ role: 'dios', active: 'si' })).body), { role: 'Rol no válido.', active: 'Valor no válido.' });
    assert.equal((await patch({ name: 'Otro Nombre' })).body.error, 'No hay nada para guardar.', 'el nombre y el email no se cambian desde acá');
    assert.equal((await api().patch('/api/users/6710f0c2a1b2c3d4e5f60718').set(admin).send({ active: false })).status, 404);
  });

  it('un admin no puede desactivarse, quitarse el rol ni borrarse a sí mismo', async () => {
    const patch = (body) => api().patch(`/api/users/${adminUser.id}`).set(admin).send(body);

    const desactivar = await patch({ active: false });
    assert.equal(desactivar.status, 403);
    assert.equal(desactivar.body.code, 'sin_permiso');
    assert.equal(desactivar.body.error, 'No podés desactivar tu propia cuenta de administrador.');

    assert.equal((await patch({ role: 'operator' })).body.error, 'No podés quitarte el rol de administrador.');
    assert.equal((await patch({ role: 'user', active: true })).status, 403);

    const borrar = await api().delete(`/api/users/${adminUser.id}`).set(admin);
    assert.equal(borrar.status, 403);
    assert.equal(borrar.body.error, 'No podés eliminar tu propia cuenta.');

    const intacto = await User.findById(adminUser.id);
    assert.deepEqual([intacto.role, intacto.active], ['admin', true]);
    assert.equal((await patch({ role: 'admin', active: true })).status, 200, 'confirmar lo que ya es no es un cambio');
  });

  it('un admin sí puede degradar a otro admin: él sigue siendo el administrador activo', async () => {
    const otro = await make('Otro Admin', 'otro@portfolio.test', { role: 'admin' });
    assert.equal((await api().patch(`/api/users/${otro.id}`).set(admin).send({ role: 'user', active: false })).status, 200);
    assert.equal(await User.countDocuments({ role: 'admin', active: true }), 1);
  });
});

describe('usuarios de admin: eliminar', () => {
  let admin;
  beforeEach(async () => {
    admin = bearer(await tokenFor('admin'));
  });

  it('borra la cuenta; conserva sin dueño sus consultas (anonimizadas), accesos y visitas', async () => {
    const user = await make('Ana Gómez', 'ana@ejemplo.com');
    const otro = await make('Nicolás Pérez', 'nicolas@ejemplo.com');
    await consulta(user._id);
    await consulta(otro._id);
    await Login.create([{ userId: user._id, method: 'password' }, { userId: otro._id, method: 'password' }]);
    await Visit.create([{ path: '/', sessionId: 'sesion-de-ana', userId: user._id }, { path: '/', sessionId: 'sesion-de-nico', userId: otro._id }]);

    const res = await api().delete(`/api/users/${user.id}`).set(admin);
    assert.deepEqual(res.body, { ok: true, data: { id: user.id } });

    assert.equal(await User.countDocuments({ email: 'ana@ejemplo.com' }), 0);
    assert.equal(await Inquiry.countDocuments(), 2, 'las consultas no desaparecen de la bandeja');
    const anonymized = await Inquiry.findOne({ anonymizedAt: { $ne: null } });
    assert.deepEqual([anonymized.name, anonymized.email, anonymized.userId], ['Cuenta eliminada', 'eliminada@anonimo.invalid', null]);
    assert.equal(await Inquiry.countDocuments({ userId: otro._id }), 1, 'las de otra cuenta no se tocan');
    assert.equal(await Login.countDocuments(), 2, 'el total de accesos no baja');
    assert.equal(await Login.countDocuments({ userId: null }), 1);
    assert.equal(await Visit.countDocuments(), 2, 'el contador de visitas no baja');
    assert.equal((await Visit.findOne({ sessionId: 'sesion-de-ana' })).userId, null);
    assert.equal((await Visit.findOne({ sessionId: 'sesion-de-nico' })).userId.toString(), otro.id);
  });

  it('el usuario borrado no puede seguir usando su token', async () => {
    const user = await make('Ana Gómez', 'ana@ejemplo.com');
    const token = bearer(signToken(user));
    await api().delete(`/api/users/${user.id}`).set(admin);
    assert.equal((await api().get('/api/auth/me').set(token)).status, 401);
  });

  it('404 si no existe; el admin puede borrar a otro admin', async () => {
    assert.equal((await api().delete('/api/users/6710f0c2a1b2c3d4e5f60718').set(admin)).status, 404);
    const otro = await make('Otro Admin', 'otro@portfolio.test', { role: 'admin' });
    assert.equal((await api().delete(`/api/users/${otro.id}`).set(admin)).status, 200);
  });
});
