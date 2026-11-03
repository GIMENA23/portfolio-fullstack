import { validationError } from './AppError.js';

// Cada validador devuelve el mensaje de error del contrato, o '' si el valor es válido.
// Son las mismas reglas y textos del prototipo (sección 2 del contrato de API).

export const NAME_CHARS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;
// Sin comas, punto y coma, comillas, paréntesis ni <>: esos caracteres permitirían meter más de un destinatario o
// manipular los encabezados del email. El dominio son etiquetas separadas por punto, ninguna vacía.
const EMAIL_FORMAT = /^[^\s@,;:<>()[\]\\"]+@(?:[^\s@,;:<>()[\]\\".]+\.)+[a-z]{2,}$/i;
const EMAIL_MAX_LENGTH = 254;

export const asString = (value) => (typeof value === 'string' ? value : '');

// Quita las etiquetas HTML: desde cada "<" hasta el primer ">" que le sigue. Es lo mismo que replace(/<[^>]*>/g, ''),
// pero esa expresión es cuadrática: con 90 KB de "<" sin ">" bloqueaba el servidor más de 2 segundos por pedido.
// Si después de un "<" no queda ningún ">", ya no puede haber más etiquetas y se termina.
export function stripHtml(value) {
  const text = asString(value);
  let result = '';
  let from = 0;
  while (from < text.length) {
    const open = text.indexOf('<', from);
    const close = open === -1 ? -1 : text.indexOf('>', open + 1);
    if (close === -1) return result + text.slice(from);
    result += text.slice(from, open);
    from = close + 1;
  }
  return result;
}

export const cleanText = (value) => stripHtml(value).trim();

export const normalizeEmail = (value) => asString(value).trim().toLowerCase();

export function validateName(value, { surname = false } = {}) {
  const name = cleanText(value);
  if (!name) return surname ? 'Ingresá tu nombre y apellido.' : 'Ingresá tu nombre.';
  if (name.length < 3) return 'Mínimo 3 letras.';
  if (name.length > 60) return 'Máximo 60 caracteres.';
  if (!NAME_CHARS.test(name)) return 'Usá solo letras y espacios.';
  if (surname && !name.includes(' ')) return 'Escribí nombre y apellido.';
  return '';
}

// `detailed` (formulario de contacto) dice qué le falta al email; el resto usa un mensaje general.
export function validateEmail(value, { detailed = false } = {}) {
  const email = normalizeEmail(value);
  if (!email) return 'Ingresá tu email.';
  if (detailed && !email.includes('@')) return 'Falta la @, por ejemplo martin@correo.com';
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_FORMAT.test(email)) {
    return detailed ? 'Falta el dominio, por ejemplo martin@correo.com' : 'El email no es válido. Ejemplo: nombre@correo.com';
  }
  return '';
}

export function validatePassword(value) {
  const password = asString(value);
  const rules = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  if (!rules) return 'La contraseña debe tener 8 caracteres o más, una mayúscula, una minúscula y un número.';
  // bcrypt solo mira los primeros 72 bytes.
  if (Buffer.byteLength(password) > 72) return 'La contraseña puede tener hasta 72 caracteres.';
  return '';
}

export function validatePasswordConfirm(password, confirm) {
  if (!asString(confirm)) return 'Repetí la contraseña.';
  if (confirm !== password) return 'Las contraseñas no coinciden.';
  return '';
}

// Junta los resultados de varios validadores y deja solo los campos con error.
export const collect = (results) => Object.fromEntries(Object.entries(results).filter(([, message]) => message));

export function assertValid(fields) {
  if (Object.keys(fields).length) throw validationError(fields);
}
