import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, bearer, fakeStorage, fieldsOf, signToken, tokenFor, useDatabase, User } from '../testing/helpers.js';
import { Inquiry } from '../models/Inquiry.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';

// Lo que manda y espera el frontend de client/ (client/src/services/api.js y las pantallas): nombres de campo en
// español en Contacto y Registro, multipart en proyectos, perfil y adjuntos, y la contraseña nueva sin la actual.
useDatabase();

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const JPEG = Buffer.from('ffd8ffe000104a464946', 'hex');
const PDF = Buffer.from('%PDF-1.4\n%contenido');
const GOOD = 'Portfolio2026';

const contacto = (overrides = {}) => ({
  nombre: 'Valentina Ríos',
  email: 'valentina@correo.com',
  telefono: '3874123456',
  tipo: 'general',
  asunto: 'Consulta sobre mantenimiento',
  mensaje: 'Quiero saber si ofrecés mantenimiento mensual para mi sitio.',
  ...overrides,
});

describe('contacto: lo que manda el formulario del sitio', () => {
  it('acepta los campos en español y guarda la consulta', async () => {
    const res = await api().post('/api/inquiries').send(contacto({ tipo: 'cotizacion', presupuesto: 'medio' }));
    assert.equal(res.status, 201);
    const stored = await Inquiry.findById(res.body.data.id);
    assert.deepEqual([stored.name, stored.phone, stored.type, stored.budget, stored.subject], ['Valentina Ríos', '3874123456', 'cotizacion', 'medio', 'Consulta sobre mantenimiento']);
  });

  it('los errores vuelven con los nombres del formulario', async () => {
    const res = await api().post('/api/inquiries').send(contacto({ nombre: 'Al', telefono: '123', asunto: 'Hola', mensaje: 'corto', tipo: 'cotizacion' }));
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(fieldsOf(res.body)).sort(), ['asunto', 'mensaje', 'nombre', 'presupuesto', 'telefono']);
    assert.equal(fieldsOf(res.body).presupuesto, 'Elegí un rango de presupuesto.');
    assert.equal(typeof res.body.error, 'string');
  });

  it('el adjunto llega como archivo en `adjunto` (multipart) y se guarda en la consulta', async () => {
    const res = await api()
      .post('/api/inquiries')
      .field('nombre', 'Valentina Ríos')
      .field('email', 'valentina@correo.com')
      .field('tipo', 'general')
      .field('asunto', 'Consulta con adjunto')
      .field('mensaje', 'Te mando el brief del proyecto para que lo mires.')
      .attach('adjunto', PDF, 'brief.pdf');
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const stored = await Inquiry.findById(res.body.data.id);
    assert.equal(stored.attachment.name, 'brief.pdf');
    assert.equal(stored.attachment.mime, 'application/pdf');
    assert.equal(fakeStorage.uploads[0].resourceType, 'raw');
  });

  it('un adjunto que no es PDF, JPG o PNG se rechaza en el campo `adjunto` y no guarda la consulta', async () => {
    const res = await api()
      .post('/api/inquiries')
      .field('nombre', 'Valentina Ríos')
      .field('email', 'valentina@correo.com')
      .field('tipo', 'general')
      .field('asunto', 'Consulta con adjunto')
      .field('mensaje', 'Te mando el brief del proyecto para que lo mires.')
      .attach('adjunto', Buffer.from('MZ\x90\x00', 'latin1'), 'virus.pdf');
    assert.equal(res.status, 415);
    assert.equal(fieldsOf(res.body).adjunto, 'Formato no permitido: solo PDF, JPG o PNG.');
    assert.equal(await Inquiry.countDocuments(), 0);
  });
});

describe('registro y Mi cuenta', () => {
  it('el registro acepta `nombre` sin repetir la contraseña ni aceptar términos', async () => {
    const res = await api().post('/api/auth/register').send({ nombre: 'Ana Gómez', email: 'ana@ejemplo.com', password: GOOD });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.data.user.name, 'Ana Gómez');
    assert.ok(res.body.data.token);
  });

  it('los errores del registro vuelven como `nombre`', async () => {
    const res = await api().post('/api/auth/register').send({ nombre: 'A1', email: 'ana@ejemplo.com', password: GOOD });
    assert.equal(res.status, 400);
    assert.ok(fieldsOf(res.body).nombre);
  });

  it('PATCH /me con { password } cambia la contraseña y devuelve un token nuevo; el viejo deja de servir', async () => {
    const { body } = await api().post('/api/auth/register').send({ nombre: 'Ana Gómez', email: 'ana@ejemplo.com', password: GOOD });
    const old = body.data.token;

    const res = await api().patch('/api/auth/me').set(bearer(old)).send({ password: 'ClaveNueva2026', currentPassword: GOOD });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(res.body.data.token);
    assert.equal((await api().get('/api/auth/me').set(bearer(old))).status, 401);
    assert.equal((await api().get('/api/auth/me').set(bearer(res.body.data.token))).status, 200);
    assert.equal((await api().post('/api/auth/login').send({ email: 'ana@ejemplo.com', password: 'ClaveNueva2026' })).status, 200);
  });

  it('si la cuenta tiene contraseña, PATCH /me exige la actual: sin ella o con otra no cambia nada', async () => {
    const { body } = await api().post('/api/auth/register').send({ nombre: 'Ana Gómez', email: 'ana@ejemplo.com', password: GOOD });
    const res = await api().patch('/api/auth/me').set(bearer(body.data.token)).send({ password: 'ClaveNueva2026', currentPassword: 'Otra12345' });
    assert.equal(res.status, 400);
    assert.equal(fieldsOf(res.body).currentPassword, 'La contraseña actual no es correcta.');

    const sin = await api().patch('/api/auth/me').set(bearer(body.data.token)).send({ password: 'ClaveNueva2026' });
    assert.equal(sin.status, 400);
    assert.equal(fieldsOf(sin.body).currentPassword, 'Ingresá tu contraseña actual.');
    assert.equal((await api().post('/api/auth/login').send({ email: 'ana@ejemplo.com', password: GOOD })).status, 200, 'la contraseña sigue siendo la de antes');
  });

  it('quien entró solo con Google crea su primera contraseña con PATCH /me, sin la actual', async () => {
    const user = await User.create({ name: 'Vicky Víctima', email: 'vicky@gmail.com', googleId: 'g-vicky' });
    const res = await api().patch('/api/auth/me').set(bearer(signToken(user))).send({ password: 'ClaveNueva2026' });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.data.providers, ['google', 'email']);
    assert.equal((await api().post('/api/auth/login').send({ email: 'vicky@gmail.com', password: 'ClaveNueva2026' })).status, 200);
  });

  it('PATCH /me valida la contraseña nueva y el nombre en su campo', async () => {
    const { body } = await api().post('/api/auth/register').send({ nombre: 'Ana Gómez', email: 'ana@ejemplo.com', password: GOOD });
    const res = await api().patch('/api/auth/me').set(bearer(body.data.token)).send({ password: 'corta' });
    assert.equal(res.status, 400);
    assert.ok(fieldsOf(res.body).password);
    const nombre = await api().patch('/api/auth/me').set(bearer(body.data.token)).send({ name: 'A1' });
    assert.ok(fieldsOf(nombre.body).name);
  });

  it('DELETE /me sin cuerpo borra la cuenta (el sitio pide ELIMINAR en pantalla)', async () => {
    const { body } = await api().post('/api/auth/register').send({ nombre: 'Ana Gómez', email: 'ana@ejemplo.com', password: GOOD });
    const res = await api().delete('/api/auth/me').set(bearer(body.data.token));
    assert.equal(res.status, 200);
    assert.equal(await User.countDocuments({ email: 'ana@ejemplo.com' }), 0);
  });

  it('el reset acepta { token, password } sin repetir la contraseña', async () => {
    const res = await api().post('/api/auth/reset').send({ token: 'a'.repeat(40), password: GOOD });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'token_invalido', 'llega a revisar el token: la contraseña ya no exige repetirse');
  });
});

describe('proyectos del panel (multipart)', () => {
  const create = (admin, fields = {}, files = []) => {
    const req = api().post('/api/projects').set(admin);
    const all = { title: 'Gestor de turnos', summary: 'Reservas online.', description: 'Sistema de reservas con roles y avisos por email para consultorios.', demoUrl: 'https://demo.arce.dev', repoUrl: '', featured: 'true', visible: 'true', ...fields };
    for (const [key, value] of Object.entries(all)) req.field(key, value);
    req.field('stack', 'React').field('stack', 'Node');
    files.forEach(({ buffer, name }) => req.attach('images', buffer, name));
    return req;
  };

  it('crea un proyecto con texto, stack repetido, booleanos como texto e imágenes que se suben', async () => {
    const admin = bearer(await tokenFor('admin'));
    const res = await create(admin, {}, [{ buffer: PNG, name: 'a.png' }, { buffer: JPEG, name: 'b.jpg' }]);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.deepEqual(res.body.data.stack, ['React', 'Node']);
    assert.equal(res.body.data.featured, true);
    assert.equal(res.body.data.images.length, 2);
    assert.match(res.body.data.images[0], /^https:\/\//);
    assert.equal(res.body.data.description, 'Sistema de reservas con roles y avisos por email para consultorios.');
    assert.equal(fakeStorage.uploads.length, 2);
  });

  it('al editar, `keepImages` conserva las URLs indicadas, suma las nuevas y borra el resto', async () => {
    const admin = bearer(await tokenFor('admin'));
    const { body } = await create(admin, {}, [{ buffer: PNG, name: 'a.png' }, { buffer: JPEG, name: 'b.jpg' }]);
    const [first] = body.data.images;

    const req = api().put(`/api/projects/${body.data.id}`).set(admin).field('title', 'Gestor de turnos 2').field('keepImages', first).attach('images', PNG, 'c.png');
    const res = await req;
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.title, 'Gestor de turnos 2');
    assert.equal(res.body.data.images.length, 2);
    assert.equal(res.body.data.images[0], first);
    assert.equal(fakeStorage.removed.length, 1, 'la que no se conservó se borra de Cloudinary');
    assert.equal(res.body.data.summary, 'Reservas online.', 'lo que no se manda no cambia');
  });

  it('rechaza más de 5 imágenes y archivos que no son imágenes, en el campo `images`', async () => {
    const admin = bearer(await tokenFor('admin'));
    const seis = Array.from({ length: 6 }, (_, i) => ({ buffer: PNG, name: `${i}.png` }));
    const tooMany = await create(admin, {}, seis);
    assert.equal(tooMany.status, 400);
    assert.ok(fieldsOf(tooMany.body).images);

    const falso = await create(admin, {}, [{ buffer: PDF, name: 'doc.png' }]);
    assert.equal(falso.status, 415);
    assert.equal(fieldsOf(falso.body).images, 'Formato no permitido: solo JPG, PNG o WebP.');
    assert.equal(await Project.countDocuments(), 0);
    assert.equal(fakeStorage.uploads.length, 0);
  });

  it('los errores de texto vuelven en el campo del formulario', async () => {
    const admin = bearer(await tokenFor('admin'));
    const res = await create(admin, { title: 'ab', description: 'corta' });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(fieldsOf(res.body)).sort(), ['description', 'title']);
  });

  it('?all=true le da al admin todos los proyectos con el detalle; al resto, solo los visibles', async () => {
    const admin = bearer(await tokenFor('admin'));
    await create(admin, { title: 'Publicado', visible: 'true' });
    await create(admin, { title: 'Borrador', visible: 'false' });

    const todos = await api().get('/api/projects?all=true').set(admin);
    assert.deepEqual(todos.body.data.map((p) => p.title).sort(), ['Borrador', 'Publicado']);
    assert.equal(todos.body.data[0].visible !== undefined, true);

    const publico = await api().get('/api/projects?all=true').set(bearer(await tokenFor('user')));
    assert.deepEqual(publico.body.data.map((p) => p.title), ['Publicado']);
    assert.equal((await api().get('/api/projects?all=true')).body.data.length, 1);
  });
});

describe('perfil del panel (multipart)', () => {
  const fields = {
    name: 'Martina Arce',
    title: 'Desarrolladora Fullstack',
    tagline: 'Productos web de punta a punta.',
    bio: 'Trabajo con pymes, startups y estudios que necesitan un sistema web completo.',
    email: 'hola@arce.dev',
    location: 'Salta, Argentina',
    github: '',
    linkedin: '',
  };
  const put = (admin, { photo, experience = [{ period: '2024 — HOY', role: 'Desarrolladora', detail: 'Sistemas.' }] } = {}) => {
    const req = api().put('/api/profile').set(admin);
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    req.field('stack', 'React').field('stack', 'Node.js').field('experience', JSON.stringify(experience));
    if (photo) req.attach('photo', photo, 'foto.png');
    return req;
  };

  it('guarda texto, stack repetido, experiencia en JSON y la foto subida', async () => {
    const admin = bearer(await tokenFor('admin'));
    const res = await put(admin, { photo: PNG });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.data.stack, ['React', 'Node.js']);
    assert.equal(res.body.data.experience[0].role, 'Desarrolladora');
    assert.match(res.body.data.photo, /^https:\/\//);
    assert.equal(res.body.data.github, '');
  });

  it('guardar sin foto nueva conserva la anterior; una foto nueva borra la vieja', async () => {
    const admin = bearer(await tokenFor('admin'));
    const first = (await put(admin, { photo: PNG })).body.data.photo;
    assert.equal((await put(admin)).body.data.photo, first);
    assert.equal(fakeStorage.removed.length, 0);

    const second = (await put(admin, { photo: JPEG })).body.data.photo;
    assert.notEqual(second, first);
    assert.equal(fakeStorage.removed.length, 1);
  });

  it('una experiencia que no es JSON o un archivo que no es imagen se rechazan en su campo', async () => {
    const admin = bearer(await tokenFor('admin'));
    const req = api().put('/api/profile').set(admin);
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    const mala = await req.field('stack', 'React').field('experience', 'esto no es json');
    assert.equal(mala.status, 400);
    assert.ok(fieldsOf(mala.body).experience);

    const falsa = await put(admin, { photo: PDF });
    assert.equal(falsa.status, 415);
    assert.equal(fieldsOf(falsa.body).photo, 'Formato no permitido: solo JPG, PNG o WebP.');
  });
});

describe('servicios del panel', () => {
  const body = (overrides = {}) => ({ name: 'Desarrollo web', description: 'Sitios y aplicaciones completas.', icon: 'code', color: 'carmin', priceFrom: 300000, order: 1, visible: true, ...overrides });

  it('GET /services le da al admin todos (con `visible`) y al resto solo los visibles', async () => {
    const admin = bearer(await tokenFor('admin'));
    await api().post('/api/services').set(admin).send(body());
    await api().post('/api/services').set(admin).send(body({ name: 'Oculto', order: 2, visible: false }));

    const asAdmin = await api().get('/api/services').set(admin);
    assert.deepEqual(asAdmin.body.data.map((s) => [s.name, s.visible]), [['Desarrollo web', true], ['Oculto', false]]);
    const publico = await api().get('/api/services');
    assert.deepEqual(publico.body.data.map((s) => s.name), ['Desarrollo web']);
    assert.equal(publico.body.data[0].visible, undefined);
  });

  it('guarda ícono, tono y el orden que manda el panel (▲▼ intercambia `order` con dos PUT)', async () => {
    const admin = bearer(await tokenFor('admin'));
    const a = (await api().post('/api/services').set(admin).send(body({ name: 'Uno', icon: 'server', color: 'oro', order: 1 }))).body.data;
    const b = (await api().post('/api/services').set(admin).send(body({ name: 'Dos', icon: 'chat', color: 'exito', order: 2 }))).body.data;
    assert.deepEqual([a.icon, a.color, a.order], ['server', 'oro', 1]);

    await Promise.all([
      api().put(`/api/services/${a.id}`).set(admin).send(body({ name: 'Uno', order: 2 })),
      api().put(`/api/services/${b.id}`).set(admin).send(body({ name: 'Dos', order: 1 })),
    ]);
    const lista = await api().get('/api/services').set(admin);
    assert.deepEqual(lista.body.data.map((s) => s.name), ['Dos', 'Uno']);
  });

  it('rechaza un ícono o un tono que el panel no ofrece, en su campo', async () => {
    const admin = bearer(await tokenFor('admin'));
    const res = await api().post('/api/services').set(admin).send(body({ icon: 'rocket', color: 'violeta', order: 1000 }));
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(fieldsOf(res.body)).sort(), ['color', 'icon', 'order']);
    assert.equal(await Service.countDocuments(), 0);
  });
});
