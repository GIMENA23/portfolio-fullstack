import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Inquiry } from '../models/Inquiry.js';
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth.js';
import { limit } from '../middlewares/rateLimit.js';
import { AppError, validationError } from '../utils/AppError.js';
import { withAliases } from '../utils/aliases.js';
import { INQUIRY_STATUSES, INQUIRY_TYPES, inquiryHandlers, replyHandlers, run } from '../utils/contentValidators.js';
import { DAY_MS, parseDay } from '../utils/dates.js';
import { inquiryConfirmationEmail, inquiryReplyEmail } from '../utils/emailTemplates.js';
import { sendMail } from '../utils/mailer.js';
import { escapeRegex, pageParams, pageResult } from '../utils/pagination.js';
import { currentProfile } from '../utils/profile.js';
import { created, ok } from '../utils/respond.js';
import { checkAndStoreAll, receiveFiles } from '../utils/uploadFile.js';
import { inquiryDetail, inquiryMine, inquiryReplies, inquiryRow } from '../utils/serialize.js';
import { asString, assertValid, cleanText, normalizeEmail } from '../utils/validators.js';

const router = Router();
const staff = [authenticate, requireRole('operator', 'admin')];

const inquiryNotFound = () => new AppError(404, 'no_encontrado', 'No encontramos esa consulta.');
const clientUrl = env.clientUrls[0];

// El formulario del sitio manda los campos en español (nombre, telefono, tipo, presupuesto, asunto, mensaje) y el
// adjunto como archivo en `adjunto` (multipart); los errores vuelven con esos mismos nombres. También se acepta
// JSON con los nombres de la API y un `attachment` ya subido a /api/uploads.
const FORM_FIELDS = { nombre: 'name', telefono: 'phone', tipo: 'type', presupuesto: 'budget', asunto: 'subject', mensaje: 'message', adjunto: 'attachment' };

// POST /api/inquiries — público (si trae sesión, la consulta queda en "Mis consultas")
router.post(
  '/',
  optionalAuth,
  limit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Enviaste varias consultas seguidas. Probá de nuevo en una hora.' }),
  // Va antes del tope por email: en multipart el email recién se conoce después de leer el formulario.
  receiveFiles({ single: 'adjunto' }),
  // Cada consulta le manda un email de confirmación al email que ella misma trae. Sin este tope, el formulario
  // sirve para mandarle mensajes (con texto a elección) a un tercero desde cualquier IP.
  limit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    key: (req) => normalizeEmail(req.body?.email),
    skip: (req) => !normalizeEmail(req.body?.email),
    message: 'Ese email ya recibió varias confirmaciones. Probá de nuevo en una hora.',
  }),
  withAliases(FORM_FIELDS, async (req, res) => {
    const body = req.body ?? {};

    // Campo oculto anti-spam: una persona no lo ve ni lo completa. Si trae texto, se responde como si todo hubiera salido bien.
    if (asString(body.website).trim()) {
      return created(res, { id: String(new mongoose.Types.ObjectId()), number: 0, status: 'nueva', createdAt: new Date(), emailSent: true });
    }

    const { data, errors } = run(body, inquiryHandlers, { partial: false });
    if (data.type === 'cotizacion' && !data.budget) errors.budget = 'Elegí un rango de presupuesto.';
    assertValid(errors);
    if (data.type !== 'cotizacion') data.budget = null;
    if (req.file) {
      const [{ url, name, size, mime }] = await checkAndStoreAll([req.file], 'attachment', 'attachment');
      data.attachment = { url, name, size, mime };
    }

    const inquiry = await Inquiry.create({ ...data, userId: req.user?._id ?? null });

    // La consulta ya está guardada: si el email de confirmación falla, el visitante igual ve el éxito.
    let emailSent = true;
    try {
      const profile = await currentProfile();
      await sendMail({ to: inquiry.email, ...inquiryConfirmationEmail({ inquiry, profile, clientUrl }) });
    } catch (error) {
      emailSent = false;
      console.error('No se pudo enviar la confirmación de la consulta', inquiry.number, error.message);
    }

    created(res, { id: String(inquiry._id), number: inquiry.number, status: inquiry.status, createdAt: inquiry.createdAt, emailSent });
  }),
);

// GET /api/inquiries — bandeja del operador: ?tipo=&estado=&desde=&hasta=&q=&page=&limit=
router.get('/', ...staff, async (req, res) => {
  const paging = pageParams(req.query);
  const errors = {};
  const filter = {};

  const tipo = asString(req.query.tipo);
  if (tipo) INQUIRY_TYPES.includes(tipo) ? (filter.type = tipo) : (errors.tipo = 'Tipo no válido.');
  const estado = asString(req.query.estado);
  if (estado) INQUIRY_STATUSES.includes(estado) ? (filter.status = estado) : (errors.estado = 'Estado no válido.');

  const from = req.query.desde === undefined || req.query.desde === '' ? null : parseDay(req.query.desde);
  const to = req.query.hasta === undefined || req.query.hasta === '' ? null : parseDay(req.query.hasta);
  if (req.query.desde && from === null) errors.desde = 'Fecha no válida. Usá AAAA-MM-DD.';
  if (req.query.hasta && to === null) errors.hasta = 'Fecha no válida. Usá AAAA-MM-DD.';
  if (from !== null && to !== null && to < from) errors.hasta = 'La fecha final tiene que ser igual o posterior a la inicial.';
  assertValid(errors);

  // "hasta" incluye todo ese día.
  if (from !== null || to !== null) {
    filter.createdAt = { ...(from !== null && { $gte: new Date(from) }), ...(to !== null && { $lt: new Date(to + DAY_MS) }) };
  }

  const q = cleanText(req.query.q);
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }];
  }

  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter).sort({ createdAt: -1, _id: -1 }).skip(paging.skip).limit(paging.limit),
    Inquiry.countDocuments(filter),
  ]);
  ok(res, pageResult(inquiries.map(inquiryRow), paging, total));
});

// GET /api/inquiries/mine — registrado: solo las consultas enviadas con su sesión
router.get('/mine', authenticate, async (req, res) => {
  const inquiries = await Inquiry.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  ok(res, inquiries.map(inquiryMine));
});

// GET /api/inquiries/:id — operador. Abrirla no cambia el estado.
router.get('/:id', ...staff, async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw inquiryNotFound();
  ok(res, inquiryDetail(inquiry));
});

// POST /api/inquiries/:id/reply — manda el email primero; recién si sale bien guarda la respuesta
router.post('/:id/reply', ...staff, async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw inquiryNotFound();
  if (inquiry.anonymizedAt) {
    throw new AppError(409, 'consulta_anonima', 'Esta consulta es de una cuenta que ya fue eliminada: no hay a dónde responderla.');
  }

  const { data, errors } = run(req.body, replyHandlers, { partial: false });
  assertValid(errors);

  try {
    const profile = await currentProfile();
    await sendMail({ to: inquiry.email, ...inquiryReplyEmail({ inquiry, replyText: data.text, profile, clientUrl, replyTo: env.mailFrom }) });
  } catch (error) {
    console.error('No se pudo enviar la respuesta de la consulta', inquiry.number, error.message);
    throw new AppError(502, 'email_no_enviado', 'No pudimos enviar el email. Probá de nuevo en un momento.');
  }

  inquiry.replies.push({ text: data.text, operatorId: req.user._id, operatorName: req.user.name, sentAt: new Date() });
  inquiry.status = 'respondida';
  await inquiry.save();
  ok(res, { id: String(inquiry._id), number: inquiry.number, status: inquiry.status, replies: inquiryReplies(inquiry) });
});

// PATCH /api/inquiries/:id — cambia el estado
router.patch('/:id', ...staff, async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw inquiryNotFound();

  const status = asString(req.body?.status);
  if (!INQUIRY_STATUSES.includes(status)) throw validationError({ status: 'Estado no válido.' });
  inquiry.status = status;
  await inquiry.save();
  ok(res, inquiryDetail(inquiry));
});

export default router;
