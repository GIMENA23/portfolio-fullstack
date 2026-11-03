import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { User, api, bearer, fieldsOf, outbox, tokenFor, transport, useDatabase } from '../testing/helpers.js';
import { Inquiry } from '../models/Inquiry.js';

useDatabase();
afterEach(() => mock.restoreAll());

const form = (overrides = {}) => ({
  name: 'Martín Díaz',
  email: 'martin@correo.com',
  phone: '3874123456',
  type: 'cotizacion',
  budget: 'medio',
  subject: 'Sistema de turnos para mi consultorio',
  message: 'Necesito que mis pacientes saquen turno online y reciban un recordatorio por email.',
  ...overrides,
});

// Una consulta ya guardada, para probar la bandeja sin pasar por el formulario.
const saved = (overrides = {}) => Inquiry.create({ ...form({ budget: null }), type: 'general', ...overrides });

const send = (body, token) => {
  const req = api().post('/api/inquiries');
  if (token) req.set(bearer(token));
  return req.send(body);
};

describe('enviar una consulta', () => {
  it('guarda la consulta y manda la confirmación', async () => {
    const res = await send(form());
    assert.equal(res.status, 201);
    assert.deepEqual(Object.keys(res.body.data).sort(), ['createdAt', 'emailSent', 'id', 'number', 'status']);
    assert.equal(res.body.data.number, 1);
    assert.equal(res.body.data.status, 'nueva');
    assert.equal(res.body.data.emailSent, true);

    const stored = await Inquiry.findById(res.body.data.id);
    assert.equal(stored.userId, null);
    assert.equal(stored.budget, 'medio');

    assert.equal(outbox.length, 1);
    assert.equal(outbox[0].to, 'martin@correo.com');
    assert.equal(outbox[0].subject, 'Recibimos tu consulta · Cotización');
    assert.match(outbox[0].text, /Consulta N\.º 0001/);
    assert.match(outbox[0].text, /¡Gracias, Martín!/);
    assert.match(outbox[0].html, /Cotización de proyecto/);
    assert.match(outbox[0].html, /\/proyectos/);
    assert.match(outbox[0].html, /Martina Arce · Desarrolladora Fullstack · Salta, Argentina/);
  });

  it('las consultas se numeran en orden', async () => {
    assert.equal((await send(form())).body.data.number, 1);
    assert.equal((await send(form())).body.data.number, 2);
    assert.equal((await send(form({ type: 'general' }))).body.data.number, 3);
  });

  it('escapa el texto de la persona en el HTML del email', async () => {
    await send(form({ message: 'Tom & Jerry <3 cafés: necesito un sistema simple para mi local.' }));
    assert.match(outbox[0].html, /Tom &amp; Jerry &lt;3 cafés/);
    assert.doesNotMatch(outbox[0].html, /Tom & Jerry/);
  });

  it('quita etiquetas HTML y saltos de línea del asunto (no puede inyectar encabezados)', async () => {
    const res = await send(form({ subject: 'Hola\r\nBcc: otro@correo.com <script>x</script>' }));
    assert.equal(res.status, 201);
    const stored = await Inquiry.findById(res.body.data.id);
    assert.equal(stored.subject, 'Hola Bcc: otro@correo.com x');
    assert.doesNotMatch(outbox[0].subject, /[\r\n]/);
  });

  it('con sesión queda asociada a la cuenta; con un token roto se guarda como anónima', async () => {
    const token = await tokenFor('user');
    const user = await User.findOne({ email: 'user@portfolio.test' });

    const conSesion = await send(form(), token);
    assert.equal((await Inquiry.findById(conSesion.body.data.id)).userId.toString(), user.id);

    const tokenRoto = await send(form(), 'token-roto');
    assert.equal(tokenRoto.status, 201);
    assert.equal((await Inquiry.findById(tokenRoto.body.data.id)).userId, null);
  });

  it('una consulta que no es cotización ignora el presupuesto', async () => {
    const res = await send(form({ type: 'asesoria', budget: 'grande', phone: undefined }));
    assert.equal(res.status, 201);
    const stored = await Inquiry.findById(res.body.data.id);
    assert.equal(stored.budget, null);
    assert.equal(stored.phone, undefined);
  });

  it('valida con los mensajes del contrato', async () => {
    const vacio = await send({});
    assert.equal(vacio.status, 400);
    assert.deepEqual(fieldsOf(vacio.body), {
      name: 'Ingresá tu nombre.',
      email: 'Ingresá tu email.',
      type: 'Elegí el tipo de consulta.',
      subject: 'Escribí un asunto.',
      message: 'Contanos qué necesitás.',
    });
    assert.equal(await Inquiry.countDocuments(), 0);

    const mal = await send(form({ name: 'Ma', email: 'martin@correo', phone: '387-4123', budget: undefined, subject: 'Hola', message: 'Muy corto' }));
    assert.deepEqual(fieldsOf(mal.body), {
      name: 'Mínimo 3 letras.',
      email: 'Falta el dominio, por ejemplo martin@correo.com',
      phone: 'Solo números, sin espacios ni guiones.',
      budget: 'Elegí un rango de presupuesto.',
      subject: 'El asunto es muy corto (mínimo 5 caracteres).',
      message: 'Mínimo 20 caracteres (llevás 9).',
    });
  });

  it('distingue los errores del email y del teléfono', async () => {
    const field = async (overrides, key) => fieldsOf((await send(form(overrides))).body)[key];
    assert.equal(await field({ email: 'martin' }, 'email'), 'Falta la @, por ejemplo martin@correo.com');
    assert.equal(await field({ phone: '38741234' }, 'phone'), 'Tienen que ser 10 dígitos (código de área + número).');
    assert.equal(await field({ budget: 'enorme' }, 'budget'), 'Elegí un rango de presupuesto.');
    assert.equal(await field({ message: 'x'.repeat(1001) }, 'message'), 'Máximo 1000 caracteres.');
    assert.equal(await field({ subject: 'x'.repeat(121) }, 'subject'), 'Máximo 120 caracteres.');
  });

  it('el campo oculto anti-spam responde como si todo hubiera salido bien, sin guardar ni mandar nada', async () => {
    const res = await send(form({ website: 'http://spam.example' }));
    assert.equal(res.status, 201);
    assert.equal(res.body.data.number, 0);
    assert.equal(await Inquiry.countDocuments(), 0);
    assert.equal(outbox.length, 0);
  });

  it('acepta un adjunto subido por nosotros y rechaza los demás', async () => {
    const adjunto = { url: 'https://res.cloudinary.com/arce/raw/upload/arce/attachment/archivo-1', name: 'brief.pdf', size: 482113, mime: 'application/pdf' };
    const ok = await send(form({ attachment: adjunto }));
    assert.equal(ok.status, 201);
    assert.deepEqual((await Inquiry.findById(ok.body.data.id)).attachment.toObject(), adjunto);

    const invalido = 'El adjunto no es válido. Subilo de nuevo.';
    for (const attachment of [
      { ...adjunto, url: 'https://sitio-malicioso.example/brief.pdf' },
      { ...adjunto, size: 3 * 1024 * 1024 },
      { ...adjunto, mime: 'application/x-msdownload' },
      { ...adjunto, name: '' },
      'brief.pdf',
    ]) {
      const res = await send(form({ attachment }));
      assert.equal(res.status, 400);
      assert.equal(fieldsOf(res.body).attachment, invalido);
    }
  });

  it('si el email de confirmación falla, la consulta queda guardada y se avisa con emailSent: false', async () => {
    mock.method(console, 'error', () => {});
    mock.method(transport, 'sendMail', async () => {
      throw new Error('smtp caído');
    });
    const res = await send(form());
    assert.equal(res.status, 201);
    assert.equal(res.body.data.emailSent, false);
    assert.equal(await Inquiry.countDocuments(), 1);
  });
});

describe('bandeja del operador', () => {
  it('solo entran el operador y el admin', async () => {
    assert.equal((await api().get('/api/inquiries')).status, 401);
    const usuario = await api().get('/api/inquiries').set(bearer(await tokenFor('user')));
    assert.equal(usuario.status, 403);
    assert.equal(usuario.body.code, 'sin_permiso');
    assert.equal((await api().get('/api/inquiries').set(bearer(await tokenFor('operator')))).status, 200);
    assert.equal((await api().get('/api/inquiries').set(bearer(await tokenFor('admin')))).status, 200);
  });

  it('lista las más nuevas primero, con los datos de la fila, el mensaje y las respuestas', async () => {
    await saved({ name: 'Antigua Ana', createdAt: new Date('2026-10-01') });
    await saved({ name: 'Reciente Rosa', createdAt: new Date('2026-10-20'), replies: [{ text: 'x'.repeat(25), operatorId: (await User.create({ name: 'Operador Uno', email: 'op@x.test', role: 'operator' }))._id, operatorName: 'Operador Uno' }] });

    const res = await api().get('/api/inquiries').set(bearer(await tokenFor('operator')));
    assert.deepEqual(res.body.data.items.map((row) => row.name), ['Reciente Rosa', 'Antigua Ana']);
    assert.deepEqual(Object.keys(res.body.data.items[0]).sort(), ['_id', 'anonymized', 'attachment', 'budget', 'createdAt', 'email', 'id', 'message', 'name', 'number', 'phone', 'replies', 'repliesCount', 'status', 'subject', 'type']);
    assert.equal(res.body.data.items[0].repliesCount, 1);
    assert.equal(res.body.data.items[0].replies[0].operator.name, 'Operador Uno');
    assert.deepEqual([res.body.data.page, res.body.data.pages, res.body.data.total], [1, 1, 2]);
  });

  it('filtra por tipo, estado y texto, y los filtros se combinan', async () => {
    await saved({ name: 'Lucía Gómez', type: 'cotizacion', budget: 'chico', status: 'nueva', subject: 'Tienda online para mi emprendimiento' });
    await saved({ name: 'Sofía López', type: 'asesoria', status: 'en_proceso', subject: 'Revisión de arquitectura de API' });
    await saved({ name: 'Juan Pérez', type: 'general', status: 'respondida', email: 'juan@ejemplo.com' });
    const operator = bearer(await tokenFor('operator'));
    const names = async (query) => (await api().get(`/api/inquiries?${query}`).set(operator)).body.data.items.map((row) => row.name).sort();

    assert.deepEqual(await names('tipo=cotizacion'), ['Lucía Gómez']);
    assert.deepEqual(await names('estado=respondida'), ['Juan Pérez']);
    assert.deepEqual(await names('tipo=asesoria&estado=nueva'), []);
    assert.deepEqual(await names('q=ARQUITECTURA'), ['Sofía López']);
    assert.deepEqual(await names('q=juan@ejemplo'), ['Juan Pérez']);
    assert.deepEqual(await names('q=.*'), [], 'el texto buscado no se interpreta como regex');
  });

  it('desde y hasta incluyen el día entero, en hora de Salta', async () => {
    await saved({ name: 'Antes', createdAt: new Date('2026-10-15T01:00:00Z') }); // 14/10 22:00 en Salta
    await saved({ name: 'Madrugada', createdAt: new Date('2026-10-15T05:00:00Z') }); // 15/10 02:00
    await saved({ name: 'Noche', createdAt: new Date('2026-10-16T02:59:00Z') }); // 15/10 23:59
    await saved({ name: 'Después', createdAt: new Date('2026-10-16T03:00:00Z') }); // 16/10 00:00
    const operator = bearer(await tokenFor('operator'));
    const names = async (query) => (await api().get(`/api/inquiries?${query}`).set(operator)).body.data.items.map((row) => row.name).sort();

    assert.deepEqual(await names('desde=2026-10-15&hasta=2026-10-15'), ['Madrugada', 'Noche']);
    assert.deepEqual(await names('desde=2026-10-16'), ['Después']);
    assert.deepEqual(await names('hasta=2026-10-14'), ['Antes']);
  });

  it('rechaza filtros inválidos con un mensaje por campo', async () => {
    const res = await api().get('/api/inquiries?tipo=otro&estado=listo&desde=2026/10/01&hasta=2026-02-30').set(bearer(await tokenFor('operator')));
    assert.equal(res.status, 400);
    assert.deepEqual(fieldsOf(res.body), {
      tipo: 'Tipo no válido.',
      estado: 'Estado no válido.',
      desde: 'Fecha no válida. Usá AAAA-MM-DD.',
      hasta: 'Fecha no válida. Usá AAAA-MM-DD.',
    });

    const invertido = await api().get('/api/inquiries?desde=2026-10-20&hasta=2026-10-10').set(bearer(await tokenFor('operator', 'otro@portfolio.test')));
    assert.equal(fieldsOf(invertido.body).hasta, 'La fecha final tiene que ser igual o posterior a la inicial.');
  });

  it('pagina', async () => {
    for (let i = 0; i < 5; i++) await saved({ createdAt: new Date(2026, 9, 1 + i) });
    const res = await api().get('/api/inquiries?limit=2&page=3').set(bearer(await tokenFor('operator')));
    assert.equal(res.body.data.items.length, 1);
    assert.deepEqual([res.body.data.page, res.body.data.pages, res.body.data.total], [3, 3, 5]);
  });
});

describe('detalle y estado', () => {
  it('el detalle trae todo y no cambia el estado', async () => {
    const inquiry = await saved({ type: 'cotizacion', budget: 'grande' });
    const res = await api().get(`/api/inquiries/${inquiry.id}`).set(bearer(await tokenFor('operator')));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.message, inquiry.message);
    assert.equal(res.body.data.budget, 'grande');
    assert.equal(res.body.data.phone, '3874123456');
    assert.equal(res.body.data.attachment, null);
    assert.equal(res.body.data.userId, null);
    assert.deepEqual(res.body.data.replies, []);
    assert.equal((await Inquiry.findById(inquiry.id)).status, 'nueva');
  });

  it('404 si no existe y 403 para un usuario común', async () => {
    const operator = bearer(await tokenFor('operator'));
    assert.equal((await api().get('/api/inquiries/6710f3e8a1b2c3d4e5f60931').set(operator)).status, 404);
    assert.equal((await api().get('/api/inquiries/abc').set(operator)).status, 404);
    const inquiry = await saved();
    assert.equal((await api().get(`/api/inquiries/${inquiry.id}`).set(bearer(await tokenFor('user')))).status, 403);
  });

  it('PATCH cambia el estado y rechaza los inválidos', async () => {
    const inquiry = await saved();
    const operator = bearer(await tokenFor('operator'));

    const res = await api().patch(`/api/inquiries/${inquiry.id}`).set(operator).send({ status: 'en_proceso' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'en_proceso');
    assert.equal((await api().patch(`/api/inquiries/${inquiry.id}`).set(operator).send({ status: 'cerrada' })).body.data.status, 'cerrada');

    const mal = await api().patch(`/api/inquiries/${inquiry.id}`).set(operator).send({ status: 'listo' });
    assert.equal(mal.status, 400);
    assert.equal(fieldsOf(mal.body).status, 'Estado no válido.');
    assert.equal((await api().patch(`/api/inquiries/${inquiry.id}`).set(bearer(await tokenFor('user'))).send({ status: 'cerrada' })).status, 403);
  });
});

describe('responder por email', () => {
  const reply = (id, token, text) => api().post(`/api/inquiries/${id}/reply`).set(bearer(token)).send({ text });
  const answer = 'Hola Martín, gracias por escribir. Te propongo una reserva online por día y profesional.';

  it('manda el email, guarda la respuesta con quién la escribió y pasa a respondida', async () => {
    const inquiry = await saved();
    const res = await reply(inquiry.id, await tokenFor('operator'), answer);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'respondida');
    assert.equal(res.body.data.number, 1);
    assert.equal(res.body.data.replies.length, 1);
    assert.equal(res.body.data.replies[0].text, answer);
    assert.equal(res.body.data.replies[0].operatorName, 'Cuenta operator');
    assert.ok(res.body.data.replies[0].sentAt);

    assert.equal(outbox.length, 1);
    assert.equal(outbox[0].to, 'martin@correo.com');
    assert.equal(outbox[0].subject, 'Re: Sistema de turnos para mi consultorio');
    assert.match(outbox[0].text, /Te propongo una reserva online/);
    assert.match(outbox[0].html, /RESPUESTA A TU CONSULTA N\.º 0001/);
    assert.match(outbox[0].html, /TU MENSAJE ORIGINAL/);
    assert.match(outbox[0].html, /Necesito que mis pacientes/);
    assert.match(outbox[0].html, /Martina Arce/);
    assert.doesNotMatch(outbox[0].html, /Ver en mi cuenta/, 'una consulta anónima no tiene cuenta a la que ir');
  });

  it('si la consulta es de una cuenta, el email invita a verla en Mi cuenta', async () => {
    const user = await User.create({ name: 'Valentina Ríos', email: 'valentina@correo.com' });
    const inquiry = await saved({ userId: user._id });
    await reply(inquiry.id, await tokenFor('operator'), answer);
    assert.match(outbox[0].html, /Ver en mi cuenta/);
    assert.match(outbox[0].html, /localhost:5173\/cuenta/);
  });

  it('el admin también responde, y puede responder más de una vez', async () => {
    const inquiry = await saved();
    const admin = await tokenFor('admin');
    await reply(inquiry.id, admin, answer);
    const segunda = await reply(inquiry.id, admin, 'Te paso también el presupuesto detallado, con los tiempos de cada etapa.');
    assert.equal(segunda.body.data.replies.length, 2);
    assert.equal(outbox.length, 2);
  });

  it('no deja responder una consulta anonimizada (la cuenta se eliminó): no hay a dónde mandarla', async () => {
    const inquiry = await saved({ name: 'Cuenta eliminada', email: 'eliminada@anonimo.invalid', anonymizedAt: new Date() });
    const res = await reply(inquiry.id, await tokenFor('operator'), answer);
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'consulta_anonima');
    assert.equal(outbox.length, 0);
    assert.equal((await Inquiry.findById(inquiry.id)).replies.length, 0);
  });

  it('valida la respuesta', async () => {
    const inquiry = await saved();
    const operator = await tokenFor('operator');
    assert.equal(fieldsOf((await reply(inquiry.id, operator, '')).body).text, 'Escribí la respuesta antes de enviar.');
    assert.equal(fieldsOf((await reply(inquiry.id, operator, 'Gracias por todo')).body).text, 'La respuesta es muy corta (mínimo 20 caracteres).');
    assert.equal(fieldsOf((await reply(inquiry.id, operator, 'x'.repeat(5001))).body).text, 'Máximo 5000 caracteres.');
    assert.equal(outbox.length, 0);
  });

  it('si el email no sale, no guarda la respuesta ni cambia el estado, y se puede reintentar', async () => {
    mock.method(console, 'error', () => {});
    const falla = mock.method(transport, 'sendMail', async () => {
      throw new Error('smtp caído');
    });
    const inquiry = await saved({ status: 'en_proceso' });
    const operator = await tokenFor('operator');

    const res = await reply(inquiry.id, operator, answer);
    assert.equal(res.status, 502);
    assert.equal(res.body.code, 'email_no_enviado');
    const stored = await Inquiry.findById(inquiry.id);
    assert.equal(stored.status, 'en_proceso');
    assert.equal(stored.replies.length, 0);

    falla.mock.restore();
    assert.equal((await reply(inquiry.id, operator, answer)).status, 200);
    assert.equal((await Inquiry.findById(inquiry.id)).replies.length, 1);
  });

  it('un usuario común no responde y una consulta inexistente es 404', async () => {
    const inquiry = await saved();
    assert.equal((await reply(inquiry.id, await tokenFor('user'), answer)).status, 403);
    assert.equal((await reply('6710f3e8a1b2c3d4e5f60931', await tokenFor('operator'), answer)).status, 404);
    assert.equal(outbox.length, 0);
  });
});

describe('mis consultas', () => {
  let token;
  let user;
  beforeEach(async () => {
    token = await tokenFor('user');
    user = await User.findOne({ email: 'user@portfolio.test' });
  });

  it('muestra solo las consultas de la sesión, las más nuevas primero, con la última respuesta', async () => {
    const operator = await User.create({ name: 'Operador Uno', email: 'op@x.test', role: 'operator' });
    await saved({ userId: user._id, subject: 'Tienda online para mi emprendimiento', createdAt: new Date('2026-10-12'), status: 'respondida', replies: [
      { text: 'Primera respuesta con propuesta de tiempos y costos.', operatorId: operator._id, operatorName: 'Operador Uno', sentAt: new Date('2026-10-13') },
      { text: 'Segunda respuesta con el presupuesto detallado final.', operatorId: operator._id, operatorName: 'Operador Uno', sentAt: new Date('2026-10-14') },
    ] });
    await saved({ userId: user._id, subject: 'Migrar mi base a MongoDB', createdAt: new Date('2026-10-15'), status: 'en_proceso' });
    await saved({ subject: 'De otra persona', email: 'otra@correo.com' });

    const res = await api().get('/api/inquiries/mine').set(bearer(token));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((c) => c.subject), ['Migrar mi base a MongoDB', 'Tienda online para mi emprendimiento']);
    assert.equal(res.body.data[0].lastReply, null);
    assert.deepEqual(res.body.data[1].lastReply, { text: 'Segunda respuesta con el presupuesto detallado final.', sentAt: '2026-10-14T00:00:00.000Z' });
    assert.deepEqual(Object.keys(res.body.data[1]).sort(), ['_id', 'createdAt', 'id', 'lastReply', 'message', 'number', 'replies', 'status', 'subject', 'type']);
    assert.doesNotMatch(JSON.stringify(res.body), /correo\.com|operatorName|operatorId|Operador Uno|De otra persona/);
  });

  it('una consulta enviada sin sesión no aparece, aunque el email coincida', async () => {
    await send(form({ email: 'user@portfolio.test' }));
    assert.deepEqual((await api().get('/api/inquiries/mine').set(bearer(token))).body.data, []);
  });

  it('una consulta enviada con sesión aparece enseguida', async () => {
    await send(form(), token);
    const res = await api().get('/api/inquiries/mine').set(bearer(token));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].status, 'nueva');
  });

  it('exige sesión, y /mine no se confunde con un id', async () => {
    assert.equal((await api().get('/api/inquiries/mine')).status, 401);
    assert.equal((await api().get('/api/inquiries/mine').set(bearer(token))).status, 200);
  });
});
