import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml } from './emailTemplates.js';

// Sin MAIL_USER y MAIL_PASS no se envía nada (ver emailDelivery más abajo).
const configured = Boolean(env.mailUser && env.mailPass);

// Sin MAIL_HOST se usa Gmail. Los tiempos de espera hacen que un puerto bloqueado (Render gratis bloquea
// el 25, 465 y 587) falle en segundos en lugar de dejar colgado el pedido de quien envía una consulta.
export function transportOptions({ host, port, user, pass }) {
  const timeouts = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };
  const auth = { user, pass };
  return host ? { host, port, secure: port === 465, auth, ...timeouts } : { service: 'gmail', auth, ...timeouts };
}

const transport = configured
  ? nodemailer.createTransport(transportOptions({ host: env.mailHost, port: env.mailPort, user: env.mailUser, pass: env.mailPass }))
  : nodemailer.createTransport({ jsonTransport: true });

// Se exporta para poder simular un fallo de envío en los tests.
export { transport };

// En los tests los emails se guardan acá.
export const outbox = [];

// 'send': hay credenciales y se envía. 'simulate': desarrollo y tests sin credenciales (se muestra en consola o se guarda
// en `outbox`). 'refuse': producción sin credenciales. Ahí NO se simula: el cuerpo de un email de recuperación lleva
// un enlace que da acceso a una cuenta y no tiene que quedar en el registro, y callar un envío que no se hizo haría
// decir "enviado" cuando no lo está.
export const emailDelivery = ({ configured, nodeEnv }) => (configured ? 'send' : nodeEnv === 'production' ? 'refuse' : 'simulate');
const delivery = emailDelivery({ configured, nodeEnv: env.nodeEnv });

export async function sendMail({ to, subject, html, text }) {
  if (delivery === 'refuse') throw new Error('El envío de emails no está configurado en el servidor (faltan MAIL_USER y MAIL_PASS).');
  await transport.sendMail({
    from: `"Martina Arce · arce.dev" <${env.mailFrom || 'no-reply@arce.dev'}>`,
    replyTo: env.mailFrom || undefined,
    to,
    subject,
    html,
    text,
  });
  if (delivery === 'simulate') {
    if (env.isTest) outbox.push({ to, subject, text, html });
    else console.log(`[email simulado] Para: ${to} · ${subject}\n${text}\n`);
  }
}

// Manda un email sin esperarlo ni dejar que un fallo tire el servidor: lo atrapa y lo deja en el registro.
const inFlight = new Set();

export function sendInBackground(send, description) {
  const task = send()
    .catch((error) => console.error(`No se pudo enviar ${description}:`, error.message))
    .finally(() => inFlight.delete(task));
  inFlight.add(task);
}

// Para los tests: espera a que terminen los envíos en segundo plano.
export const backgroundMailSettled = () => Promise.allSettled([...inFlight]);

export function sendPasswordResetEmail({ to, name, link }) {
  const text = `Hola ${name}:\n\nPara elegir una contraseña nueva entrá a este enlace. Vence en 1 hora.\n${link}\n\nSi no lo pediste, ignorá este mensaje.`;
  const html = `<p>Hola ${escapeHtml(name)}:</p><p>Para elegir una contraseña nueva entrá a este enlace. Vence en 1 hora.</p><p><a href="${link}">Elegir contraseña nueva</a></p><p>Si no lo pediste, ignorá este mensaje.</p>`;
  return sendMail({ to, subject: 'Recuperá tu contraseña', html, text });
}
