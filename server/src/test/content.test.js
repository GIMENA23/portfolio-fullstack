import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, bearer, fieldsOf, tokenFor, useDatabase } from '../testing/helpers.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';

useDatabase();

const image = (name) => ({ url: `https://res.cloudinary.com/arce/${name}.jpg`, publicId: `arce/${name}` });

const projectBody = (overrides = {}) => ({
  title: 'Gestor de turnos',
  summary: 'Reservas online con roles y avisos por email.',
  problem: 'Un consultorio tomaba los turnos por teléfono.',
  solution: 'Una aplicación web para reservar turnos.',
  highlights: ['API REST en Express.'],
  role: 'Diseño, backend y frontend',
  duration: '8 semanas',
  stack: ['React', 'Node', 'MongoDB'],
  images: [image('turnos-1')],
  demoUrl: 'https://turnos.arce.dev',
  repoUrl: 'https://github.com/martinaarce/turnos',
  visible: true,
  ...overrides,
});

const serviceBody = (overrides = {}) => ({ name: 'Desarrollo web a medida', description: 'Sitios y aplicaciones completas.', priceFrom: 300000, visible: true, ...overrides });

describe('proyectos: lectura', () => {
  beforeEach(async () => {
    await Project.create([
      { ...projectBody({ title: 'Primero', stack: ['React', 'Node'] }), createdAt: new Date('2026-09-01') },
      { ...projectBody({ title: 'Destacado', stack: ['Express'], featured: true }), createdAt: new Date('2026-08-01') },
      { ...projectBody({ title: 'Reciente', stack: ['react'] }), createdAt: new Date('2026-10-01') },
      projectBody({ title: 'Borrador', visible: false }),
    ]);
  });

  it('el listado público muestra solo visibles, destacados primero y sin datos reservados', async () => {
    const res = await api().get('/api/projects');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((p) => p.title), ['Destacado', 'Reciente', 'Primero']);
    assert.deepEqual(res.body.meta, { page: 1, limit: 20, total: 3, totalPages: 1 });
    assert.deepEqual(Object.keys(res.body.data[0]).sort(), ['cover', 'featured', 'id', 'stack', 'summary', 'title']);
    assert.equal(res.body.data[0].cover, 'https://res.cloudinary.com/arce/turnos-1.jpg');
    assert.doesNotMatch(JSON.stringify(res.body), /demoUrl|repoUrl|problem|solution|highlights/);
  });

  it('filtra por tecnología sin distinguir mayúsculas y pagina', async () => {
    const react = await api().get('/api/projects?stack=REACT');
    assert.deepEqual(react.body.data.map((p) => p.title).sort(), ['Primero', 'Reciente']);

    const page = await api().get('/api/projects?limit=2&page=2');
    assert.equal(page.body.data.length, 1);
    assert.deepEqual(page.body.meta, { page: 2, limit: 2, total: 3, totalPages: 2 });

    assert.equal((await api().get('/api/projects?stack=.*')).body.data.length, 0); // no se interpreta como regex
  });

  it('el detalle exige sesión y trae todo', async () => {
    const [project] = await Project.find({ title: 'Primero' });
    assert.equal((await api().get(`/api/projects/${project.id}`)).status, 401);

    const res = await api().get(`/api/projects/${project.id}`).set(bearer(await tokenFor('user')));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.demoUrl, 'https://turnos.arce.dev');
    assert.equal(res.body.data.problem, 'Un consultorio tomaba los turnos por teléfono.');
    assert.deepEqual(res.body.data.images, [image('turnos-1')]);
  });

  it('un borrador es 404 para un usuario y visible para el admin; un id inválido es 404', async () => {
    const [draft] = await Project.find({ title: 'Borrador' });
    const user = await api().get(`/api/projects/${draft.id}`).set(bearer(await tokenFor('user')));
    assert.equal(user.status, 404);
    assert.equal(user.body.code, 'no_encontrado');

    const admin = await api().get(`/api/projects/${draft.id}`).set(bearer(await tokenFor('admin')));
    assert.equal(admin.status, 200);
    assert.equal(admin.body.data.visible, false);

    assert.equal((await api().get('/api/projects/abc').set(bearer(await tokenFor('user', 'otro@portfolio.test')))).status, 404);
  });
});

describe('proyectos: CRUD de admin', () => {
  let admin;
  beforeEach(async () => {
    admin = bearer(await tokenFor('admin'));
  });

  it('solo el admin puede crear, modificar o borrar', async () => {
    const user = bearer(await tokenFor('user'));
    assert.equal((await api().post('/api/projects').send(projectBody())).status, 401);
    const prohibido = await api().post('/api/projects').set(user).send(projectBody());
    assert.equal(prohibido.status, 403);
    assert.equal(prohibido.body.code, 'sin_permiso');
  });

  it('crea un proyecto, queda como borrador si no se pide visible, y devuelve el detalle', async () => {
    const res = await api().post('/api/projects').set(admin).send(projectBody({ visible: undefined }));
    assert.equal(res.status, 201);
    assert.equal(res.body.data.visible, false);
    assert.equal(res.body.data.featured, false);
    assert.equal(res.body.data.title, 'Gestor de turnos');
    assert.equal((await api().get('/api/projects')).body.data.length, 0);
  });

  it('valida con los mensajes del contrato', async () => {
    const vacio = await api().post('/api/projects').set(admin).send({});
    assert.equal(vacio.status, 400);
    assert.deepEqual(fieldsOf(vacio.body), {
      title: 'Escribí un título de al menos 3 caracteres.',
      summary: 'El resumen es obligatorio.',
      stack: 'Indicá al menos una tecnología.',
    });

    const mal = await api()
      .post('/api/projects')
      .set(admin)
      .send(projectBody({ summary: 'x'.repeat(201), demoUrl: 'http://turnos.arce.dev', repoUrl: 'github.com/yo/turnos', images: Array(6).fill(image('a')) }));
    assert.deepEqual(fieldsOf(mal.body), {
      summary: 'Máximo 200 caracteres.',
      demoUrl: 'Tiene que empezar con https://',
      repoUrl: 'Tiene que empezar con https://',
      images: 'Máximo 5 imágenes.',
    });
  });

  it('limpia el stack: recorta, descarta vacíos y repetidos', async () => {
    const res = await api().post('/api/projects').set(admin).send(projectBody({ stack: [' React ', 'react', '', 'Node'] }));
    assert.deepEqual(res.body.data.stack, ['React', 'Node']);
  });

  it('quita etiquetas HTML de los textos', async () => {
    const res = await api().post('/api/projects').set(admin).send(projectBody({ title: '<script>alert(1)</script>Gestor' }));
    assert.equal(res.body.data.title, 'alert(1)Gestor');
  });

  it('PUT cambia solo lo que se envía', async () => {
    const { body } = await api().post('/api/projects').set(admin).send(projectBody());
    const id = body.data.id;

    const res = await api().put(`/api/projects/${id}`).set(admin).send({ visible: false, demoUrl: '' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.visible, false);
    assert.equal(res.body.data.demoUrl, null);
    assert.equal(res.body.data.title, 'Gestor de turnos');
    assert.deepEqual(res.body.data.stack, ['React', 'Node', 'MongoDB']);

    const mal = await api().put(`/api/projects/${id}`).set(admin).send({ title: 'ab' });
    assert.equal(mal.status, 400);
    assert.equal(fieldsOf(mal.body).title, 'Escribí un título de al menos 3 caracteres.');
  });

  it('DELETE borra y después es 404', async () => {
    const { body } = await api().post('/api/projects').set(admin).send(projectBody());
    const borrado = await api().delete(`/api/projects/${body.data.id}`).set(admin);
    assert.deepEqual(borrado.body, { ok: true, data: { id: body.data.id } });
    assert.equal((await api().delete(`/api/projects/${body.data.id}`).set(admin)).status, 404);
    assert.equal((await api().put(`/api/projects/${body.data.id}`).set(admin).send({ visible: true })).status, 404);
  });
});

describe('servicios', () => {
  let admin;
  beforeEach(async () => {
    admin = bearer(await tokenFor('admin'));
  });

  const create = (overrides) => api().post('/api/services').set(admin).send(serviceBody(overrides));

  it('el listado público trae solo los visibles, en orden y sin el campo visible', async () => {
    await create({ name: 'Primero' });
    await create({ name: 'Oculto', visible: false });
    await create({ name: 'Tercero', priceFrom: null });

    const res = await api().get('/api/services');
    assert.deepEqual(res.body.data.map((s) => [s.name, s.order]), [['Primero', 1], ['Tercero', 3]]);
    assert.equal(res.body.data[1].priceFrom, null);
    assert.equal('visible' in res.body.data[0], false);

    const todos = await api().get('/api/admin/services').set(admin);
    assert.deepEqual(todos.body.data.map((s) => [s.name, s.visible]), [['Primero', true], ['Oculto', false], ['Tercero', true]]);
  });

  it('crea al final de la lista con el color por defecto', async () => {
    const a = await create({ name: 'Uno' });
    const b = await create({ name: 'Dos' });
    assert.equal(a.status, 201);
    assert.equal(a.body.data.order, 1);
    assert.equal(b.body.data.order, 2);
    assert.equal(b.body.data.color, '#9B1B22');
  });

  it('no permite dos servicios con el mismo nombre, aunque cambien las mayúsculas', async () => {
    await create({ name: 'APIs REST' });
    const res = await create({ name: 'apis rest' });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'nombre_en_uso');
    assert.equal(fieldsOf(res.body).name, 'Ya existe un servicio con ese nombre.');
  });

  it('valida nombre, descripción, color y precio', async () => {
    const vacio = await api().post('/api/services').set(admin).send({});
    assert.deepEqual(fieldsOf(vacio.body), {
      name: 'Escribí un nombre de al menos 3 caracteres.',
      description: 'La descripción es obligatoria.',
    });

    const mal = await create({ description: 'x'.repeat(301), priceFrom: '300.000', color: '#123456' });
    assert.deepEqual(fieldsOf(mal.body), {
      description: 'Máximo 300 caracteres.',
      priceFrom: 'Solo números, sin puntos ni signo $.',
      color: 'Elegí uno de los colores de la paleta.',
    });
  });

  it('acepta el precio como número, como texto de dígitos o vacío (a consultar)', async () => {
    assert.equal((await create({ name: 'Uno', priceFrom: '150000' })).body.data.priceFrom, 150000);
    assert.equal((await create({ name: 'Dos', priceFrom: 0 })).body.data.priceFrom, 0);
    assert.equal((await create({ name: 'Tres', priceFrom: '' })).body.data.priceFrom, null);
    assert.equal((await create({ name: 'Cuatro', priceFrom: 10.5 })).status, 400);
    assert.equal((await create({ name: 'Cinco', priceFrom: -1 })).status, 400);
  });

  it('PUT cambia solo lo que se envía', async () => {
    const { body } = await create();
    const res = await api().put(`/api/services/${body.data.id}`).set(admin).send({ visible: false, color: '#4f6b3e' });
    assert.equal(res.body.data.visible, false);
    assert.equal(res.body.data.color, '#4F6B3E');
    assert.equal(res.body.data.name, 'Desarrollo web a medida');
  });

  it('PATCH /order reordena con la lista completa y rechaza listas incompletas', async () => {
    const ids = [];
    for (const name of ['Uno', 'Dos', 'Tres']) ids.push((await create({ name })).body.data.id);

    const res = await api().patch('/api/services/order').set(admin).send({ ids: [ids[2], ids[0], ids[1]] });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((s) => [s.name, s.order]), [['Tres', 1], ['Uno', 2], ['Dos', 3]]);

    for (const mala of [[ids[0], ids[1]], [ids[0], ids[0], ids[1]], [...ids, '6710f0c2a1b2c3d4e5f60718'], 'no-es-lista']) {
      const rechazo = await api().patch('/api/services/order').set(admin).send({ ids: mala });
      assert.equal(rechazo.status, 400);
      assert.ok(fieldsOf(rechazo.body).ids);
    }
  });

  it('DELETE borra y deja el orden sin huecos', async () => {
    const ids = [];
    for (const name of ['Uno', 'Dos', 'Tres']) ids.push((await create({ name })).body.data.id);
    assert.equal((await api().delete(`/api/services/${ids[0]}`).set(admin)).status, 200);
    assert.deepEqual((await Service.find().sort({ order: 1 })).map((s) => [s.name, s.order]), [['Dos', 1], ['Tres', 2]]);
    assert.equal((await api().delete(`/api/services/${ids[0]}`).set(admin)).status, 404);
  });

  it('solo el admin escribe', async () => {
    const user = bearer(await tokenFor('user'));
    assert.equal((await api().post('/api/services').send(serviceBody())).status, 401);
    assert.equal((await api().post('/api/services').set(user).send(serviceBody())).status, 403);
    assert.equal((await api().patch('/api/services/order').set(user).send({ ids: [] })).status, 403);
    assert.equal((await api().get('/api/admin/services').set(user)).status, 403);
  });
});

describe('perfil', () => {
  const profileBody = (overrides = {}) => ({
    name: 'Martina Arce',
    title: 'Desarrolladora Fullstack',
    phrase: 'Productos web de punta a punta.',
    bio: 'Trabajo con pymes, startups y estudios que necesitan un sistema web completo.',
    email: 'Hola@Arce.dev',
    location: 'Salta, Argentina · remoto',
    github: 'https://github.com/martinaarce',
    linkedin: 'https://linkedin.com/in/martinaarce',
    photo: image('martina'),
    stack: ['React', 'Node.js'],
    experience: [{ period: '2024 — HOY', role: 'Desarrolladora fullstack independiente', detail: 'Sistemas a medida.' }],
    ...overrides,
  });

  it('sin nada guardado devuelve el perfil del seed, nunca vacío', async () => {
    const res = await api().get('/api/profile');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Martina Arce');
    assert.ok(res.body.data.stack.length > 0);
  });

  it('el admin guarda el perfil y GET lo devuelve', async () => {
    const admin = bearer(await tokenFor('admin'));
    const res = await api().put('/api/profile').set(admin).send(profileBody({ phrase: 'Otra frase.' }));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'hola@arce.dev');
    assert.equal(res.body.data.phrase, 'Otra frase.');

    const leido = await api().get('/api/profile');
    assert.deepEqual(leido.body.data, res.body.data);
    assert.deepEqual(leido.body.data.photo, image('martina'));
  });

  it('PUT reemplaza el perfil entero: lo opcional que no se manda se vacía', async () => {
    const admin = bearer(await tokenFor('admin'));
    await api().put('/api/profile').set(admin).send(profileBody());
    const res = await api().put('/api/profile').set(admin).send(profileBody({ github: undefined, photo: undefined, stack: undefined }));
    assert.equal(res.body.data.github, null);
    assert.equal(res.body.data.photo, null);
    assert.deepEqual(res.body.data.stack, []);
  });

  it('valida con los mensajes del contrato', async () => {
    const admin = bearer(await tokenFor('admin'));
    const vacio = await api().put('/api/profile').set(admin).send({});
    assert.equal(vacio.status, 400);
    assert.deepEqual(Object.keys(fieldsOf(vacio.body)).sort(), ['bio', 'email', 'location', 'name', 'phrase', 'title']);

    const mal = await api()
      .put('/api/profile')
      .set(admin)
      .send(profileBody({ name: 'Martina 3', title: 'Dev', phrase: 'x'.repeat(61), bio: 'Muy corta', github: 'https://github.com/a/b', linkedin: 'http://linkedin.com/in/yo', stack: ['React', 'react'], email: 'hola@arce' }));
    assert.deepEqual(fieldsOf(mal.body), {
      name: 'Usá solo letras y espacios.',
      title: 'Mínimo 5 caracteres.',
      phrase: 'La frase tiene que tener entre 1 y 60 caracteres.',
      bio: 'Mínimo 40 caracteres.',
      email: 'El email no es válido. Ejemplo: nombre@correo.com',
      github: 'Tiene que ser https://github.com/tu-usuario',
      linkedin: 'Tiene que ser https://linkedin.com/in/tu-usuario',
      stack: 'Ya está en el stack.',
    });
  });

  it('solo el admin puede guardar', async () => {
    assert.equal((await api().put('/api/profile').send(profileBody())).status, 401);
    assert.equal((await api().put('/api/profile').set(bearer(await tokenFor('operator'))).send(profileBody())).status, 403);
  });
});

describe('listados de admin', () => {
  it('incluyen borradores, buscan por texto y filtran por visibilidad', async () => {
    await Project.create([projectBody({ title: 'Tienda online' }), projectBody({ title: 'Blog con CMS', visible: false })]);
    const admin = bearer(await tokenFor('admin'));

    const todos = await api().get('/api/admin/projects').set(admin);
    assert.equal(todos.body.data.length, 2);
    assert.equal(todos.body.meta.total, 2);

    assert.deepEqual((await api().get('/api/admin/projects?q=blog').set(admin)).body.data.map((p) => p.title), ['Blog con CMS']);
    assert.deepEqual((await api().get('/api/admin/projects?visible=false').set(admin)).body.data.map((p) => p.title), ['Blog con CMS']);
    assert.deepEqual((await api().get('/api/admin/projects?visible=true').set(admin)).body.data.map((p) => p.title), ['Tienda online']);
  });

  it('el operador y el usuario no entran', async () => {
    assert.equal((await api().get('/api/admin/projects')).status, 401);
    assert.equal((await api().get('/api/admin/projects').set(bearer(await tokenFor('operator')))).status, 403);
  });
});
