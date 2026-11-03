import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, bearer, useDatabase } from '../testing/helpers.js';
import { runSeed } from '../seed/index.js';
import { Counter } from '../models/Counter.js';
import { Inquiry } from '../models/Inquiry.js';
import { Login } from '../models/Login.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { Visit } from '../models/Visit.js';

useDatabase();

const NOW = new Date('2026-10-26T15:00:00.000Z');
const PASSWORD = 'ClavePrueba2026';
const DAY = 86_400_000;

describe('seed', () => {
  const seed = () => runSeed({ password: PASSWORD, now: NOW });

  it('carga las cantidades del contrato', async () => {
    const result = await seed();
    assert.equal(await User.countDocuments(), 40);
    assert.equal(await User.countDocuments({ role: 'admin' }), 1);
    assert.equal(await User.countDocuments({ role: 'operator' }), 1);
    assert.equal(await User.countDocuments({ active: false }), 1);
    assert.equal(await Project.countDocuments(), 6);
    assert.equal(await Project.countDocuments({ visible: false }), 1);
    assert.equal(await Service.countDocuments(), 4);
    assert.equal(await Inquiry.countDocuments(), 30);
    assert.equal(await Profile.countDocuments(), 1);
    assert.equal(result.users, 40);
  });

  it('6 cuentas se crean en el mes en curso', async () => {
    await seed();
    const monthStart = new Date('2026-10-01T03:00:00.000Z'); // 1 de octubre, hora de Salta
    assert.equal(await User.countDocuments({ createdAt: { $gte: monthStart } }), 6);
  });

  it('las consultas son 14 de cotización, 9 generales y 7 de asesoría, numeradas del 1 al 30', async () => {
    await seed();
    const porTipo = Object.fromEntries((await Inquiry.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }])).map(({ _id, n }) => [_id, n]));
    assert.deepEqual(porTipo, { cotizacion: 14, general: 9, asesoria: 7 });

    const consultas = await Inquiry.find().sort({ number: 1 });
    assert.deepEqual(consultas.map((c) => c.number), Array.from({ length: 30 }, (_, i) => i + 1));
    assert.ok(consultas.every((c, i) => i === 0 || c.createdAt >= consultas[i - 1].createdAt), 'el número sigue el orden de las fechas');
    assert.ok(consultas.every((c) => c.createdAt > new Date(NOW - 30 * DAY) && c.createdAt < NOW));
    assert.ok(consultas.every((c) => c.type !== 'cotizacion' || c.budget), 'toda cotización lleva presupuesto');
    assert.equal((await Counter.findById('inquiry')).seq, 30, 'la próxima consulta será la 31');
  });

  it('las consultas respondidas y cerradas tienen respuesta; las nuevas no', async () => {
    await seed();
    for (const status of ['respondida', 'cerrada']) {
      const consultas = await Inquiry.find({ status });
      assert.ok(consultas.length > 0);
      assert.ok(consultas.every((c) => c.replies.length === 1 && c.replies[0].sentAt >= c.createdAt));
    }
    assert.ok((await Inquiry.find({ status: 'nueva' })).every((c) => c.replies.length === 0));
    assert.deepEqual(
      (await Inquiry.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }])).map(({ _id, n }) => [_id, n]).sort(),
      [['cerrada', 5], ['en_proceso', 6], ['nueva', 8], ['respondida', 11]],
    );
  });

  it('Valentina tiene sus dos consultas: una respondida y una en proceso', async () => {
    await seed();
    const valentina = await User.findOne({ email: 'valentina@correo.com' });
    const suyas = await Inquiry.find({ userId: valentina._id }).sort({ number: 1 });
    assert.deepEqual(suyas.map((c) => [c.subject, c.status]), [
      ['Tienda online para mi emprendimiento', 'respondida'],
      ['Migrar mi base a MongoDB', 'en_proceso'],
    ]);
  });

  it('hay visitas y accesos todos los días de los últimos 30 días, sin salirse del rango', async () => {
    await seed();
    const porDia = (modelo, campo) =>
      modelo.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${campo}`, timezone: 'America/Argentina/Salta' } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

    const visitas = await porDia(Visit, 'createdAt');
    assert.equal(visitas.length, 30);
    assert.equal(visitas[0]._id, '2026-09-27');
    assert.equal(visitas.at(-1)._id, '2026-10-26');
    assert.ok(visitas.slice(0, -1).every(({ n }) => n >= 24 && n <= 72), 'entre 24 y 72 visitas por día');

    const accesos = await porDia(Login, 'at');
    assert.equal(accesos.length, 30);
    assert.ok((await Visit.countDocuments({ createdAt: { $gt: NOW } })) === 0);
  });

  it('loginCount y lastLogin de cada usuario coinciden con sus accesos', async () => {
    await seed();
    const totales = new Map((await Login.aggregate([{ $group: { _id: '$userId', n: { $sum: 1 }, last: { $max: '$at' } } }])).map((l) => [String(l._id), l]));
    for (const user of await User.find()) {
      const esperado = totales.get(String(user._id));
      assert.equal(user.loginCount, esperado?.n ?? 0, user.email);
      assert.equal(user.lastLogin?.getTime() ?? null, esperado?.last.getTime() ?? null, user.email);
    }
    assert.equal((await User.findOne({ email: 'admin@portfolio.test' })).loginCount > 0, true);
  });

  it('repetir el seed deja el mismo resultado, sin duplicar', async () => {
    await seed();
    const antes = (await Inquiry.find().sort({ number: 1 })).map((c) => [c.name, c.subject, c.status]);
    await seed();
    assert.equal(await User.countDocuments(), 40);
    assert.equal(await Inquiry.countDocuments(), 30);
    assert.deepEqual((await Inquiry.find().sort({ number: 1 })).map((c) => [c.name, c.subject, c.status]), antes);
  });

  it('las cuentas de prueba entran con la contraseña del seed y cada una llega a su panel', async () => {
    await seed();
    const login = (email, password = PASSWORD) => api().post('/api/auth/login').send({ email, password });

    const admin = await login('admin@portfolio.test');
    assert.equal(admin.status, 200);
    assert.equal(admin.body.data.user.role, 'admin');
    assert.equal((await login('operador@portfolio.test')).body.data.user.role, 'operator');
    assert.equal((await login('usuario@portfolio.test')).body.data.user.role, 'user');
    assert.equal((await login('admin@portfolio.test', 'otra')).status, 401);

    assert.equal((await login('julieta@ejemplo.com')).body.code, 'cuenta_desactivada');
    assert.equal((await login('valentina@correo.com')).status, 401, 'Valentina entra con Google, no tiene contraseña');

    const me = await api().get('/api/auth/me').set(bearer(admin.body.data.token));
    assert.deepEqual(me.body.data.providers, ['email']);
  });

  it('la API pública devuelve lo del seed', async () => {
    await seed();
    const proyectos = await api().get('/api/projects');
    assert.equal(proyectos.body.meta.total, 5);
    assert.deepEqual(proyectos.body.data.slice(0, 3).map((p) => p.title).sort(), ['Dashboard de ventas', 'Gestor de turnos', 'Tienda online']);

    const servicios = await api().get('/api/services');
    assert.deepEqual(servicios.body.data.map((s) => [s.name, s.priceFrom]), [
      ['Desarrollo web a medida', 300000],
      ['APIs REST', 200000],
      ['Bases de datos', 150000],
      ['Asesoría técnica', 50000],
    ]);

    assert.equal((await api().get('/api/profile')).body.data.name, 'Martina Arce');
  });

  it('el dashboard muestra datos con vida: visitas todos los días, accesos, consultas por tipo y registros', async () => {
    await seed();
    const login = await api().post('/api/auth/login').send({ email: 'admin@portfolio.test', password: PASSWORD });
    const admin = bearer(login.body.data.token);
    const get = async (path) => (await api().get(`/api/stats/${path}`).set(admin)).body.data;
    const period = 'desde=2026-10-13&hasta=2026-10-26'; // 14 días que terminan "hoy" para el seed

    const summary = await get(`summary?${period}`);
    assert.ok(summary.visits >= 13 * 24 && summary.visits <= 14 * 72, `visitas: ${summary.visits}`);
    assert.ok(summary.logins >= 13 * 14 && summary.logins <= 14 * 30, `accesos: ${summary.logins}`);
    assert.equal(summary.users, 40);

    const visits = await get(`visits?${period}`);
    assert.equal(visits.length, 14);
    assert.ok(visits.slice(0, 13).every((day) => day.total >= 24 && day.total <= 72), 'cada día completo tiene entre 24 y 72 visitas');
    assert.equal(visits.reduce((sum, day) => sum + day.total, 0), summary.visits, 'la serie suma lo mismo que la tarjeta');

    const byType = await get(`inquiries-by-type?desde=2026-09-27&hasta=2026-10-26`);
    assert.deepEqual(byType, [{ tipo: 'cotizacion', total: 14 }, { tipo: 'general', total: 9 }, { tipo: 'asesoria', total: 7 }]);
    assert.equal((await get('summary?desde=2026-09-27&hasta=2026-10-26&tipo=cotizacion')).inquiries, 14);

    const registrations = await get('registrations?desde=2026-06-01&hasta=2026-10-26&agrupar=semana');
    assert.equal(registrations.reduce((sum, week) => sum + week.total, 0), 40, 'las 40 cuentas, repartidas en semanas');
    assert.ok(registrations.filter((week) => week.total > 0).length >= 5, 'el gráfico de registros no es una sola barra');
  });

  it('los proyectos del seed se pueden editar sin que la API los rechace', async () => {
    await seed();
    const admin = await api().post('/api/auth/login').send({ email: 'admin@portfolio.test', password: PASSWORD });
    const token = bearer(admin.body.data.token);
    const { body } = await api().get('/api/admin/projects').set(token);
    for (const project of body.data) {
      const { images } = await Project.findById(project.id);
      const res = await api().put(`/api/projects/${project.id}`).set(token).send({ ...project, images: images.map(({ url, publicId }) => ({ url, publicId })) });
      assert.equal(res.status, 200, `${project.title}: ${JSON.stringify(res.body.error)}`);
    }
  });
});
