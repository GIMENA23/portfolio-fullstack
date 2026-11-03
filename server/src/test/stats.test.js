import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { User, api, bearer, fieldsOf, tokenFor, useDatabase } from '../testing/helpers.js';
import { Inquiry } from '../models/Inquiry.js';
import { Login } from '../models/Login.js';
import { Visit } from '../models/Visit.js';

useDatabase();

const DAY = 86_400_000;
let counter = 0;

// Salta es UTC−3: 'T03:00:00Z' es la medianoche de allá y 'T02:59:00Z' el último minuto del día anterior.
const visitAt = (iso) => Visit.create({ path: '/', sessionId: `sesion-${++counter}`, createdAt: new Date(iso) });
const inquiryAt = (iso, type = 'general') =>
  Inquiry.create({ name: 'Ana Gómez', email: 'ana@ejemplo.com', type, budget: type === 'cotizacion' ? 'medio' : null, subject: 'Consulta de prueba', message: 'Quiero saber si ofrecés mantenimiento mensual.', createdAt: new Date(iso) });

describe('estadísticas: acceso', () => {
  it('solo el admin', async () => {
    for (const path of ['summary', 'visits', 'inquiries-by-type', 'registrations']) {
      assert.equal((await api().get(`/api/stats/${path}`)).status, 401, path);
      for (const role of ['user', 'operator']) {
        assert.equal((await api().get(`/api/stats/${path}`).set(bearer(await tokenFor(role, `${role}${path}@portfolio.test`)))).status, 403, `${role} ${path}`);
      }
    }
  });
});

describe('estadísticas', () => {
  let admin;
  let adminUser;
  beforeEach(async () => {
    admin = bearer(await tokenFor('admin'));
    adminUser = await User.findOne({ email: 'admin@portfolio.test' });
  });
  const get = (path) => api().get(`/api/stats/${path}`).set(admin);

  describe('summary', () => {
    it('cuenta visitas, accesos y consultas del período, con los bordes en hora de Salta', async () => {
      // Período: 2 y 3 de octubre, hora de Salta = 2026-10-02T03:00Z hasta 2026-10-04T03:00Z (sin incluir).
      for (const iso of ['2026-10-02T02:59:00Z', '2026-10-02T03:00:00Z', '2026-10-03T12:00:00Z', '2026-10-04T02:59:00Z', '2026-10-04T03:00:00Z']) {
        await visitAt(iso);
        await Login.create({ userId: adminUser._id, method: 'password', at: new Date(iso) });
      }
      for (const [iso, type] of [['2026-10-02T15:00:00Z', 'cotizacion'], ['2026-10-03T15:00:00Z', 'cotizacion'], ['2026-10-03T16:00:00Z', 'general'], ['2026-10-02T20:00:00Z', 'asesoria'], ['2026-10-10T15:00:00Z', 'cotizacion']]) {
        await inquiryAt(iso, type);
      }

      const res = await get('summary?desde=2026-10-02&hasta=2026-10-03');
      assert.equal(res.status, 200);
      assert.equal(res.body.data.visits, 3);
      assert.equal(res.body.data.logins, 3);
      assert.equal(res.body.data.inquiries, 4);

      assert.equal((await get('summary?desde=2026-10-02&hasta=2026-10-03&tipo=cotizacion')).body.data.inquiries, 2);
      assert.equal((await get('summary?desde=2026-10-02&hasta=2026-10-03&tipo=asesoria')).body.data.inquiries, 1);
    });

    it('cuenta los usuarios: el total histórico y los creados este mes', async () => {
      await User.create({ name: 'Nueva Uno', email: 'n1@ejemplo.com' });
      await User.create({ name: 'Nueva Dos', email: 'n2@ejemplo.com' });
      await User.create({ name: 'Vieja Ana', email: 'vieja@ejemplo.com', createdAt: new Date(Date.now() - 60 * DAY) });

      const { users } = (await get('summary')).body.data;
      assert.deepEqual(users, { total: 4, newThisMonth: 3 }); // el admin del test más las dos nuevas
    });

    it('sin rango toma los últimos 14 días, contando hoy', async () => {
      await visitAt(new Date());
      await visitAt(new Date(Date.now() - 13 * DAY));
      await visitAt(new Date(Date.now() - 20 * DAY));
      assert.equal((await get('summary')).body.data.visits, 2);
    });

    it('devuelve números simples, sin textos', async () => {
      const { data } = (await get('summary')).body;
      assert.deepEqual(Object.keys(data).sort(), ['inquiries', 'logins', 'users', 'visits']);
      assert.ok([data.visits, data.logins, data.inquiries, data.users.total, data.users.newThisMonth].every(Number.isInteger));
    });
  });

  describe('visits', () => {
    it('devuelve todos los días del rango, con 0 donde no hubo visitas', async () => {
      for (const iso of ['2026-10-02T02:59:00Z', '2026-10-02T15:00:00Z', '2026-10-03T02:59:00Z', '2026-10-03T03:00:00Z', '2026-10-05T03:00:00Z']) await visitAt(iso);
      // 02/10 02:59Z es el 1/10 a las 23:59 de Salta: queda afuera. 03/10 02:59Z es todavía el 2/10 a las 23:59
      // (en UTC ya sería el 3). 03/10 03:00Z es el 3/10 a las 00:00.
      const res = await get('visits?desde=2026-10-02&hasta=2026-10-04&agrupar=dia');
      assert.deepEqual(res.body.data, [
        { date: '2026-10-02', count: 2 },
        { date: '2026-10-03', count: 1 },
        { date: '2026-10-04', count: 0 },
      ]);
    });

    it('por defecto agrupa por día', async () => {
      const res = await get('visits?desde=2026-10-02&hasta=2026-10-03');
      assert.deepEqual(res.body.data.map((d) => d.date), ['2026-10-02', '2026-10-03']);
    });

    it('agrupado por semana: la fecha es el lunes, y una semana cortada suma solo los días incluidos', async () => {
      // 2/10 viernes · 14/10 miércoles. Semanas: lunes 28/09, 5/10 y 12/10.
      for (const iso of ['2026-10-01T15:00:00Z', '2026-10-02T15:00:00Z', '2026-10-04T15:00:00Z', '2026-10-05T15:00:00Z', '2026-10-11T15:00:00Z', '2026-10-12T15:00:00Z', '2026-10-14T15:00:00Z', '2026-10-15T15:00:00Z']) {
        await visitAt(iso);
      }
      const res = await get('visits?desde=2026-10-02&hasta=2026-10-14&agrupar=semana');
      assert.deepEqual(res.body.data, [
        { date: '2026-09-28', count: 2 }, // viernes y domingo; el jueves 1/10 queda afuera del rango
        { date: '2026-10-05', count: 2 },
        { date: '2026-10-12', count: 2 }, // lunes y miércoles; el jueves 15/10 queda afuera
      ]);
    });

    it('una semana sin visitas aparece con 0', async () => {
      await visitAt('2026-10-02T15:00:00Z');
      const res = await get('visits?desde=2026-10-02&hasta=2026-10-20&agrupar=semana');
      assert.deepEqual(res.body.data.map((w) => [w.date, w.count]), [['2026-09-28', 1], ['2026-10-05', 0], ['2026-10-12', 0], ['2026-10-19', 0]]);
    });

    it('un solo día y el máximo de 366 días', async () => {
      assert.deepEqual((await get('visits?desde=2026-10-02&hasta=2026-10-02')).body.data, [{ date: '2026-10-02', count: 0 }]);
      assert.equal((await get('visits?desde=2025-10-26&hasta=2026-10-26')).body.data.length, 366);
    });
  });

  describe('inquiries-by-type', () => {
    it('devuelve siempre los tres tipos, en orden fijo, aunque alguno tenga 0', async () => {
      await inquiryAt('2026-10-02T15:00:00Z', 'cotizacion');
      await inquiryAt('2026-10-03T15:00:00Z', 'cotizacion');
      await inquiryAt('2026-10-03T16:00:00Z', 'asesoria');
      await inquiryAt('2026-10-20T15:00:00Z', 'general');

      const res = await get('inquiries-by-type?desde=2026-10-02&hasta=2026-10-15');
      assert.deepEqual(res.body.data, [
        { type: 'cotizacion', count: 2 },
        { type: 'general', count: 0 },
        { type: 'asesoria', count: 1 },
      ]);
    });
  });

  describe('registrations', () => {
    it('sin rango son las últimas 6 semanas, empezando en lunes', async () => {
      await User.create({ name: 'Hace Ocho', email: 'hace8@ejemplo.com', createdAt: new Date(Date.now() - 8 * DAY) });
      await User.create({ name: 'Hace Sesenta', email: 'hace60@ejemplo.com', createdAt: new Date(Date.now() - 60 * DAY) });

      const { data } = (await get('registrations')).body;
      assert.equal(data.length, 6);
      assert.ok(data.every(({ date }) => new Date(`${date}T00:00:00Z`).getUTCDay() === 1), 'todas las fechas son lunes');
      assert.equal(data.reduce((sum, week) => sum + week.count, 0), 2, 'el admin del test y el de hace 8 días; el de hace 60 queda afuera');
      assert.equal(data.at(-1).count >= 1, true, 'la semana en curso incluye al admin recién creado');
    });

    it('con rango y por día', async () => {
      await User.create({ name: 'Uno Dos', email: 'a@ejemplo.com', createdAt: new Date('2026-10-02T15:00:00Z') });
      await User.create({ name: 'Tres Cuatro', email: 'b@ejemplo.com', createdAt: new Date('2026-10-02T18:00:00Z') });
      const res = await get('registrations?desde=2026-10-01&hasta=2026-10-03&agrupar=dia');
      assert.deepEqual(res.body.data, [{ date: '2026-10-01', count: 0 }, { date: '2026-10-02', count: 2 }, { date: '2026-10-03', count: 0 }]);
    });
  });

  describe('validación', () => {
    it('rechaza fechas inválidas, rangos al revés y rangos de más de 366 días', async () => {
      const fields = async (query) => fieldsOf((await get(`visits?${query}`)).body);
      assert.deepEqual(await fields('desde=ayer&hasta=2026-02-30'), { desde: 'Fecha no válida. Usá AAAA-MM-DD.', hasta: 'Fecha no válida. Usá AAAA-MM-DD.' });
      assert.equal((await fields('desde=2026-10-20&hasta=2026-10-10')).hasta, 'La fecha final tiene que ser igual o posterior a la inicial.');
      assert.equal((await fields('desde=2025-10-25&hasta=2026-10-26')).hasta, 'El rango máximo es de 366 días.');
      assert.equal((await get('visits?desde=2025-10-25&hasta=2026-10-26')).status, 400);
    });

    it('rechaza un agrupar o un tipo desconocido, y junta todos los errores', async () => {
      assert.equal(fieldsOf((await get('visits?agrupar=mes')).body).agrupar, 'Agrupar tiene que ser dia o semana.');
      assert.equal((await get('registrations?agrupar=año')).status, 400);
      assert.equal(fieldsOf((await get('summary?tipo=otro')).body).tipo, 'Tipo no válido.');
      assert.deepEqual(Object.keys(fieldsOf((await get('summary?tipo=otro&desde=zzz')).body)).sort(), ['desde', 'tipo']);
      assert.deepEqual(Object.keys(fieldsOf((await get('visits?agrupar=mes&desde=zzz')).body)).sort(), ['agrupar', 'desde']);
    });
  });
});
