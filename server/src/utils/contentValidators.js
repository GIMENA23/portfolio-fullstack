import { SERVICE_COLORS } from '../models/Service.js';
import { storage } from './storage.js';
import { NAME_CHARS, asString, cleanText, normalizeEmail, validateEmail } from './validators.js';

// Validación + limpieza de lo que el admin manda para proyectos, servicios y perfil.
// Cada campo tiene un manejador que devuelve { value } (ya limpio) o { error } con el mensaje del contrato.
// Solo se aceptan los campos que figuran en los manejadores; el resto del body se ignora.

const ok = (value) => ({ value });
const bad = (error) => ({ error });

const HTTPS_URL = /^https:\/\/\S+\.\S+$/;
const GITHUB_URL = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9-]+\/?$/;
const LINKEDIN_URL = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-]+\/?$/;

// partial: true (PUT) valida solo lo que vino; false (POST) exige y completa todo.
export function run(body, handlers, { partial }) {
  const source = body && typeof body === 'object' ? body : {};
  const data = {};
  const errors = {};
  for (const [key, handle] of Object.entries(handlers)) {
    if (partial && source[key] === undefined) continue;
    const result = handle(source[key]);
    if (result.error) errors[key] = result.error;
    else data[key] = result.value;
  }
  return { data, errors };
}

// `short` puede ser una función que recibe el texto (para mensajes como "llevás 8").
// `oneLine` colapsa saltos de línea y espacios repetidos: para nombres y asuntos, que van a un encabezado de email.
const text =
  ({ min = 0, max, empty, short = empty, long, charset, charsetError, oneLine = false }) =>
  (raw) => {
    const value = oneLine ? cleanText(raw).replace(/\s+/g, ' ') : cleanText(raw);
    if (!value) return empty ? bad(empty) : ok('');
    if (value.length < min) return bad(typeof short === 'function' ? short(value) : short);
    if (value.length > max) return bad(long);
    if (charset && !charset.test(value)) return bad(charsetError);
    return ok(value);
  };

const bool =
  (fallback) =>
  (raw) => {
    if (raw === undefined) return ok(fallback);
    return typeof raw === 'boolean' ? ok(raw) : bad('Valor no válido.');
  };

// Lista de textos cortos (tecnologías, puntos técnicos). `duplicates`: texto del error, o null para descartarlos en silencio.
const stringList =
  ({ min = 0, max, itemMax, empty, tooMany, tooLong, duplicates = null }) =>
  (raw) => {
    if (raw === undefined || raw === null) raw = [];
    if (!Array.isArray(raw)) return bad(empty ?? 'Tiene que ser una lista.');
    const items = [];
    const seen = new Set();
    for (const entry of raw) {
      const item = cleanText(entry);
      if (!item) continue;
      if (item.length > itemMax) return bad(tooLong);
      if (seen.has(item.toLowerCase())) {
        if (duplicates) return bad(duplicates);
        continue;
      }
      seen.add(item.toLowerCase());
      items.push(item);
    }
    if (items.length < min) return bad(empty);
    if (items.length > max) return bad(tooMany);
    return ok(items);
  };

// URL opcional: vacío o null la borra.
const optionalUrl = (pattern, error) => (raw) => {
  if (raw === undefined || raw === null || raw === '') return ok(null);
  const value = typeof raw === 'string' ? raw.trim() : '';
  return pattern.test(value) ? ok(value) : bad(error);
};

const cloudFile = (raw) => {
  const url = typeof raw?.url === 'string' ? raw.url.trim() : '';
  const publicId = typeof raw?.publicId === 'string' ? raw.publicId.trim() : '';
  return HTTPS_URL.test(url) && publicId ? { url, publicId } : null;
};

const images = (raw) => {
  if (raw === undefined || raw === null) return ok([]);
  if (!Array.isArray(raw)) return bad('Tiene que ser una lista de imágenes.');
  if (raw.length > 5) return bad('Máximo 5 imágenes.');
  const files = raw.map(cloudFile);
  return files.includes(null) ? bad('Cada imagen necesita url (https) y publicId.') : ok(files);
};

const photo = (raw) => {
  if (raw === undefined || raw === null) return ok(null);
  const file = cloudFile(raw);
  return file ? ok(file) : bad('La foto necesita url (https) y publicId.');
};

export const projectHandlers = {
  title: text({ min: 3, max: 80, empty: 'Escribí un título de al menos 3 caracteres.', long: 'Máximo 80 caracteres.' }),
  summary: text({ max: 200, empty: 'El resumen es obligatorio.', long: 'Máximo 200 caracteres.' }),
  problem: text({ max: 1000, long: 'Máximo 1000 caracteres.' }),
  solution: text({ max: 1000, long: 'Máximo 1000 caracteres.' }),
  highlights: stringList({ max: 6, itemMax: 160, tooMany: 'Máximo 6 puntos.', tooLong: 'Cada punto puede tener hasta 160 caracteres.' }),
  role: text({ max: 80, long: 'Máximo 80 caracteres.' }),
  duration: text({ max: 40, long: 'Máximo 40 caracteres.' }),
  stack: stringList({
    min: 1,
    max: 12,
    itemMax: 24,
    empty: 'Indicá al menos una tecnología.',
    tooMany: 'Máximo 12 tecnologías.',
    tooLong: 'Cada tecnología puede tener hasta 24 caracteres.',
  }),
  images,
  demoUrl: optionalUrl(HTTPS_URL, 'Tiene que empezar con https://'),
  repoUrl: optionalUrl(HTTPS_URL, 'Tiene que empezar con https://'),
  visible: bool(false),
  featured: bool(false),
};

const price = (raw) => {
  if (raw === undefined || raw === null || raw === '') return ok(null);
  const isDigits = typeof raw === 'string' ? /^\d+$/.test(raw.trim()) : Number.isInteger(raw) && raw >= 0;
  if (!isDigits) return bad('Solo números, sin puntos ni signo $.');
  const value = Number(raw);
  return value > 100_000_000 ? bad('El precio es demasiado alto.') : ok(value);
};

export const serviceHandlers = {
  name: text({ min: 3, max: 60, empty: 'Escribí un nombre de al menos 3 caracteres.', long: 'Máximo 60 caracteres.' }),
  description: text({ max: 300, empty: 'La descripción es obligatoria.', long: 'Máximo 300 caracteres.' }),
  color: (raw) => {
    if (raw === undefined) return ok(SERVICE_COLORS[0]);
    const color = asString(raw).toUpperCase();
    return SERVICE_COLORS.includes(color) ? ok(color) : bad('Elegí uno de los colores de la paleta.');
  },
  priceFrom: price,
  visible: bool(false),
};

const experience = (raw) => {
  if (raw === undefined || raw === null) return ok([]);
  if (!Array.isArray(raw)) return bad('Tiene que ser una lista de puestos.');
  if (raw.length > 10) return bad('Máximo 10 puestos.');
  const jobs = raw.map((entry) => ({
    period: cleanText(entry?.period),
    role: cleanText(entry?.role),
    detail: cleanText(entry?.detail),
  }));
  const valid = jobs.every((job) => job.period && job.period.length <= 40 && job.role && job.role.length <= 100 && job.detail.length <= 200);
  return valid ? ok(jobs) : bad('Cada puesto necesita período (hasta 40 caracteres) y cargo (hasta 100); el detalle admite 200.');
};

export const INQUIRY_TYPES = ['general', 'cotizacion', 'asesoria'];
export const INQUIRY_STATUSES = ['nueva', 'en_proceso', 'respondida', 'cerrada'];
const BUDGETS = ['chico', 'medio', 'grande'];
const ATTACHMENT_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

const phone = (raw) => {
  if (raw === undefined || raw === null || raw === '') return ok(undefined);
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (/^\d{10}$/.test(value)) return ok(value);
  return bad(/\D/.test(value) || !value ? 'Solo números, sin espacios ni guiones.' : 'Tienen que ser 10 dígitos (código de área + número).');
};

const choice = (options, error, { optional = false } = {}) => (raw) => {
  if (optional && (raw === undefined || raw === null || raw === '')) return ok(null);
  return options.includes(raw) ? ok(raw) : bad(error);
};

// El adjunto tiene que ser un archivo que subimos nosotros: si no, cualquiera podría poner un enlace ajeno
// en la bandeja del operador.
const attachment = (raw) => {
  if (raw === undefined || raw === null) return ok(null);
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  const name = cleanText(raw.name).replace(/\s+/g, ' ').slice(0, 100);
  const valid = storage.owns(url) && name && Number.isInteger(raw.size) && raw.size > 0 && raw.size <= 2 * 1024 * 1024 && ATTACHMENT_MIMES.includes(raw.mime);
  return valid ? ok({ url, name, size: raw.size, mime: raw.mime }) : bad('El adjunto no es válido. Subilo de nuevo.');
};

export const inquiryHandlers = {
  name: text({ min: 3, max: 60, empty: 'Ingresá tu nombre.', short: 'Mínimo 3 letras.', long: 'Máximo 60 caracteres.', charset: NAME_CHARS, charsetError: 'Usá solo letras y espacios.', oneLine: true }),
  email: (raw) => {
    const message = validateEmail(raw, { detailed: true });
    return message ? bad(message) : ok(normalizeEmail(raw));
  },
  phone,
  type: choice(INQUIRY_TYPES, 'Elegí el tipo de consulta.'),
  budget: choice(BUDGETS, 'Elegí un rango de presupuesto.', { optional: true }),
  subject: text({ min: 5, max: 120, empty: 'Escribí un asunto.', short: 'El asunto es muy corto (mínimo 5 caracteres).', long: 'Máximo 120 caracteres.', oneLine: true }),
  message: text({ min: 20, max: 1000, empty: 'Contanos qué necesitás.', short: (value) => `Mínimo 20 caracteres (llevás ${value.length}).`, long: 'Máximo 1000 caracteres.' }),
  attachment,
};

export const replyHandlers = {
  text: text({ min: 20, max: 5000, empty: 'Escribí la respuesta antes de enviar.', short: 'La respuesta es muy corta (mínimo 20 caracteres).', long: 'Máximo 5000 caracteres.' }),
};

export const profileHandlers = {
  name: text({
    min: 3,
    max: 60,
    empty: 'El nombre es obligatorio.',
    short: 'Mínimo 3 letras.',
    long: 'Máximo 60 caracteres.',
    charset: NAME_CHARS,
    charsetError: 'Usá solo letras y espacios.',
  }),
  title: text({ min: 5, max: 60, empty: 'El título es obligatorio.', short: 'Mínimo 5 caracteres.', long: 'Máximo 60 caracteres.' }),
  phrase: text({ max: 60, empty: 'La frase tiene que tener entre 1 y 60 caracteres.', long: 'La frase tiene que tener entre 1 y 60 caracteres.' }),
  bio: text({ min: 40, max: 400, empty: 'La presentación es obligatoria.', short: 'Mínimo 40 caracteres.', long: 'Máximo 400 caracteres.' }),
  email: (raw) => {
    const message = validateEmail(raw);
    return message ? bad(message) : ok(normalizeEmail(raw));
  },
  location: text({ min: 3, max: 60, empty: 'La ubicación es obligatoria.', short: 'Mínimo 3 caracteres.', long: 'Máximo 60 caracteres.' }),
  github: optionalUrl(GITHUB_URL, 'Tiene que ser https://github.com/tu-usuario'),
  linkedin: optionalUrl(LINKEDIN_URL, 'Tiene que ser https://linkedin.com/in/tu-usuario'),
  photo,
  stack: stringList({
    max: 16,
    itemMax: 24,
    tooMany: 'Máximo 16 tecnologías.',
    tooLong: 'Cada tecnología puede tener hasta 24 caracteres.',
    duplicates: 'Ya está en el stack.',
  }),
  experience,
};
