import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { api, bearer, fakeProvider, fakeStorage, fieldsOf, tokenFor, useDatabase } from '../testing/helpers.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';

useDatabase();
afterEach(() => mock.restoreAll());

const MB = 1024 * 1024;
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const JPEG = Buffer.from('ffd8ffe000104a464946', 'hex');
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
const PDF = Buffer.from('%PDF-1.4\n%contenido');
const EXE = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'latin1');
const padded = (header, size) => Buffer.concat([header, Buffer.alloc(size - header.length)]);

const upload = (token, kind, file, filename = 'archivo.png') => {
  const req = api().post('/api/uploads');
  if (token) req.set(bearer(token));
  if (kind !== undefined) req.field('kind', kind);
  if (file) req.attach('file', file, filename);
  return req;
};

describe('subida de archivos', () => {
  it('el admin sube una imagen y recibe su URL, publicId, nombre, peso y tipo real', async () => {
    const res = await upload(await tokenFor('admin'), 'project', padded(PNG, 4096), 'turnos 1.png');
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.data, {
      url: 'https://res.cloudinary.com/arce/image/upload/arce/project/archivo-1',
      publicId: 'arce/project/archivo-1',
      name: 'turnos 1.png',
      size: 4096,
      mime: 'image/png',
    });
    assert.deepEqual(fakeStorage.uploads, [{ folder: 'arce/project', resourceType: 'image', size: 4096 }]);
  });

  it('acepta JPG, PNG y WebP para proyectos y perfil', async () => {
    const admin = await tokenFor('admin');
    for (const [kind, file] of [['project', JPEG], ['project', WEBP], ['profile', PNG]]) {
      assert.equal((await upload(admin, kind, file)).status, 201, kind);
    }
  });

  it('el tipo se decide por el contenido, no por la extensión', async () => {
    const admin = await tokenFor('admin');
    const texto = await upload(admin, 'project', Buffer.from('esto es un texto'), 'foto.png');
    assert.equal(texto.status, 415);
    assert.equal(texto.body.code, 'formato_no_permitido');
    assert.equal(fieldsOf(texto.body).file, 'Formato no permitido: solo JPG, PNG o WebP.');

    assert.equal((await upload(admin, 'project', EXE, 'virus.png')).status, 415);
    assert.equal((await upload(admin, 'project', PDF, 'doc.jpg')).status, 415);
    assert.equal(fakeStorage.uploads.length, 0);

    // Una imagen real con extensión equivocada sí pasa: importa lo que es, no cómo se llama.
    const res = await upload(admin, 'project', JPEG, 'foto.pdf');
    assert.equal(res.status, 201);
    assert.equal(res.body.data.mime, 'image/jpeg');
  });

  it('un visitante sube adjuntos de contacto (PDF, JPG o PNG) y los PDF se guardan como raw', async () => {
    const pdf = await upload(null, 'attachment', PDF, 'brief.pdf');
    assert.equal(pdf.status, 201);
    assert.equal(pdf.body.data.mime, 'application/pdf');
    assert.equal(fakeStorage.uploads[0].resourceType, 'raw');
    assert.equal((await upload(null, 'attachment', PNG, 'captura.png')).status, 201);

    const webp = await upload(null, 'attachment', WEBP, 'foto.webp');
    assert.equal(webp.status, 415);
    assert.equal(fieldsOf(webp.body).file, 'Formato no permitido: solo PDF, JPG o PNG.');
  });

  it('las imágenes de proyecto y perfil son solo del admin', async () => {
    const anonimo = await upload(null, 'project', PNG);
    assert.equal(anonimo.status, 401);
    const usuario = await upload(await tokenFor('user'), 'profile', PNG);
    assert.equal(usuario.status, 403);
    assert.equal((await upload(await tokenFor('operator'), 'project', PNG)).status, 403);
    assert.equal(fakeStorage.uploads.length, 0);
  });

  it('rechaza más de 2 MB diciendo cuánto pesa, y acepta justo 2 MB', async () => {
    const admin = await tokenFor('admin');
    const imagen = await upload(admin, 'project', padded(PNG, 3 * MB));
    assert.equal(imagen.status, 413);
    assert.equal(imagen.body.code, 'archivo_pesado');
    assert.equal(fieldsOf(imagen.body).file, 'La imagen pesa 3.0 MB. El máximo es 2 MB.');

    const adjunto = await upload(null, 'attachment', padded(PDF, 2.5 * MB), 'brief.pdf');
    assert.equal(fieldsOf(adjunto.body).file, 'El archivo pesa 2.5 MB. El máximo es 2 MB.');

    assert.equal((await upload(admin, 'project', padded(PNG, 2 * MB))).status, 201);
  });

  it('un archivo gigante se corta sin leerlo entero', async () => {
    const res = await upload(await tokenFor('admin'), 'project', padded(PNG, 6 * MB));
    assert.equal(res.status, 413);
    assert.equal(fieldsOf(res.body).file, 'El archivo pesa más de 5 MB. El máximo es 2 MB.');
  });

  it('valida kind y archivo', async () => {
    const admin = await tokenFor('admin');
    assert.equal(fieldsOf((await upload(admin, 'otro', PNG)).body).kind, 'Tipo de subida no válido.');
    assert.equal(fieldsOf((await upload(admin, undefined, PNG)).body).kind, 'Tipo de subida no válido.');
    assert.equal(fieldsOf((await upload(admin, 'project')).body).file, 'Elegí un archivo.');

    const campoEquivocado = await api().post('/api/uploads').set(bearer(admin)).field('kind', 'project').attach('foto', PNG, 'a.png');
    assert.equal(campoEquivocado.status, 400);
    assert.match(fieldsOf(campoEquivocado.body).file, /un solo archivo/);
  });

  it('el nombre se limpia: sin carpetas, sin HTML', async () => {
    const admin = await tokenFor('admin');
    // supertest recorta el nombre antes de enviarlo, así que el multipart se arma a mano para mandarlo tal cual.
    const withName = (filename) => {
      const boundary = '----prueba';
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\nproject\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
        PNG,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      return api().post('/api/uploads').set(bearer(admin)).set('Content-Type', `multipart/form-data; boundary=${boundary}`).send(body);
    };
    assert.equal((await withName('../../etc/<b>foto</b>.png')).body.data.name, 'foto.png');
    assert.equal((await withName('C:\\Users\\yo\\Mi   foto.png')).body.data.name, 'Mi foto.png');
    assert.equal((await withName('<i></i>')).body.data.name, 'archivo');
  });

  it('si Cloudinary falla responde 502, sin detalles técnicos', async () => {
    mock.method(console, 'error', () => {});
    mock.method(fakeProvider, 'upload', async () => {
      throw new Error('getaddrinfo ENOTFOUND api.cloudinary.com');
    });
    const res = await upload(await tokenFor('admin'), 'project', PNG);
    assert.equal(res.status, 502);
    assert.equal(res.body.code, 'almacenamiento_error');
    assert.doesNotMatch(JSON.stringify(res.body), /ENOTFOUND/);
  });
});

describe('borrado de archivos que ya no se usan', () => {
  const image = (name) => ({ url: `https://res.cloudinary.com/arce/image/upload/arce/project/${name}`, publicId: `arce/project/${name}` });
  const body = (images) => ({ title: 'Gestor de turnos', summary: 'Reservas online.', stack: ['React'], images, visible: true });

  it('al sacar una imagen de un proyecto se borra de Cloudinary; las que quedan, no', async () => {
    const admin = bearer(await tokenFor('admin'));
    const { body: created } = await api().post('/api/projects').set(admin).send(body([image('a'), image('b'), image('c')]));
    assert.equal(fakeStorage.removed.length, 0);

    await api().put(`/api/projects/${created.data.id}`).set(admin).send({ images: [image('c'), image('a')] });
    assert.deepEqual(fakeStorage.removed, ['arce/project/b']);

    await api().put(`/api/projects/${created.data.id}`).set(admin).send({ title: 'Otro título' });
    assert.deepEqual(fakeStorage.removed, ['arce/project/b'], 'cambiar otro campo no toca las imágenes');
  });

  it('al borrar el proyecto se borran todas sus imágenes', async () => {
    const admin = bearer(await tokenFor('admin'));
    const { body: created } = await api().post('/api/projects').set(admin).send(body([image('a'), image('b')]));
    await api().delete(`/api/projects/${created.data.id}`).set(admin);
    assert.deepEqual(fakeStorage.removed.sort(), ['arce/project/a', 'arce/project/b']);
  });

  it('no intenta borrar archivos que no son nuestros', async () => {
    const admin = bearer(await tokenFor('admin'));
    const ajena = { url: 'https://placehold.co/1200x800/png', publicId: 'seed/placeholder' };
    const { body: created } = await api().post('/api/projects').set(admin).send(body([ajena]));
    await api().delete(`/api/projects/${created.data.id}`).set(admin);
    assert.deepEqual(fakeStorage.removed, []);
  });

  it('un fallo al borrar no rompe el pedido', async () => {
    mock.method(console, 'error', () => {});
    mock.method(fakeProvider, 'remove', async () => {
      throw new Error('Cloudinary caído');
    });
    const admin = bearer(await tokenFor('admin'));
    const { body: created } = await api().post('/api/projects').set(admin).send(body([image('a')]));
    const res = await api().delete(`/api/projects/${created.data.id}`).set(admin);
    assert.equal(res.status, 200);
    assert.equal(await Project.countDocuments(), 0);
  });

  it('al cambiar la foto del perfil se borra la anterior', async () => {
    const admin = bearer(await tokenFor('admin'));
    const profile = (photo) => ({
      name: 'Martina Arce', title: 'Desarrolladora Fullstack', tagline: 'Productos web de punta a punta.',
      bio: 'Trabajo con pymes, startups y estudios que necesitan un sistema web completo.',
      email: 'hola@arce.dev', location: 'Salta, Argentina', photo,
    });
    await api().put('/api/profile').set(admin).send(profile(image('foto-1')));
    await api().put('/api/profile').set(admin).send(profile(image('foto-1')));
    assert.deepEqual(fakeStorage.removed, [], 'guardar con la misma foto no borra nada');

    await api().put('/api/profile').set(admin).send(profile(image('foto-2')));
    assert.deepEqual(fakeStorage.removed, ['arce/project/foto-1']);

    await api().put('/api/profile').set(admin).send(profile(null));
    assert.deepEqual(fakeStorage.removed, ['arce/project/foto-1', 'arce/project/foto-2']);
    assert.equal((await Profile.findOne()).photo, null);
  });
});
