import { formatSalta } from './dates.js';

// Plantillas de los emails de consultas (sección 8 del contrato). HTML de 600 px con estilos en línea,
// porque Gmail y Outlook ignoran las hojas de estilo. Todo texto que viene de una persona se escapa.

export const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const paragraphs = (text) => escapeHtml(text).replace(/\r?\n/g, '<br>');

const TYPE_LABEL = { general: 'General', cotizacion: 'Cotización', asesoria: 'Asesoría' };
const TYPE_SUMMARY = { general: 'Consulta general', cotizacion: 'Cotización de proyecto', asesoria: 'Asesoría técnica' };

const ink = '#160F10';
const soft = '#5E5550';
const line = '#D8CEC2';
const crimson = '#9B1B22';
const gold = '#E3B04B';

const number = (inquiry) => String(inquiry.number).padStart(4, '0');

const button = (label, href, { primary }) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;font-weight:bold;font-size:15px;text-decoration:none;${
    primary ? `background:${ink};color:#EFE9E1;` : `border:1.5px solid ${ink};color:${ink};`
  }">${escapeHtml(label)}</a>`;

function layout({ eyebrow, heading, bodyHtml, buttons, footer }) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px 12px;background:#E4DCD1;font-family:Arial,Helvetica,sans-serif;color:${ink};">
<table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#F8F4EE;border:1px solid ${line};">
<tr><td style="background:${ink};padding:16px 28px;color:#EFE9E1;font-size:20px;font-weight:bold;">arce.dev</td></tr>
<tr><td style="height:6px;background:${gold};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:1px;color:${crimson};">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;">${escapeHtml(heading)}</h1>
${bodyHtml}
<div style="margin-top:24px;">${buttons.join('')}</div>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid ${line};font-size:12px;line-height:1.5;color:${soft};">${footer}</td></tr>
</table></body></html>`;
}

const quote = (title, bodyHtml) =>
  `<div style="margin-top:20px;padding:14px 16px;background:#EFE9E1;border-left:3px solid ${crimson};">
<p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:1px;color:${soft};">${escapeHtml(title)}</p>${bodyHtml}</div>`;

// Al guardar una consulta: confirmación para quien escribió.
export function inquiryConfirmationEmail({ inquiry, profile, clientUrl }) {
  const ownerName = profile.name.split(' ')[0];
  const firstName = inquiry.name.split(' ')[0];
  const sent = formatSalta(inquiry.createdAt);
  const intro = `Recibimos tu consulta. ${ownerName} te responde en menos de 48 horas hábiles.`;
  const rows = [
    ['Tipo', TYPE_SUMMARY[inquiry.type]],
    ['Asunto', inquiry.subject],
    ['Mensaje', inquiry.message],
    ['Enviada', sent],
  ];

  const html = layout({
    eyebrow: `CONSULTA N.º ${number(inquiry)}`,
    heading: `¡Gracias, ${firstName}!`,
    bodyHtml: `<p style="margin:0;font-size:16px;line-height:1.6;">${escapeHtml(intro)}</p>
${quote(
  'RESUMEN DE TU CONSULTA',
  rows.map(([label, value]) => `<p style="margin:4px 0;font-size:14px;line-height:1.5;"><strong>${label}</strong> &nbsp;${paragraphs(value)}</p>`).join(''),
)}
<p style="margin:20px 0 0;font-size:15px;">Mientras tanto, podés mirar los proyectos y probar las demos.</p>`,
    buttons: [button('Ver proyectos →', `${clientUrl}/proyectos`, { primary: true })],
    footer: `${escapeHtml(profile.name)} · ${escapeHtml(profile.title)} · ${escapeHtml(profile.location)}<br>Recibiste este email porque enviaste una consulta en arce.dev. Para seguir la conversación, escribinos a la dirección de este mensaje.`,
  });

  const text = [
    `Consulta N.º ${number(inquiry)}`,
    '',
    `¡Gracias, ${firstName}!`,
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Mientras tanto, podés mirar los proyectos y probar las demos: ${clientUrl}/proyectos`,
  ].join('\n');

  return { subject: `Recibimos tu consulta · ${TYPE_LABEL[inquiry.type]}`, html, text };
}

// Cuando el operador responde.
export function inquiryReplyEmail({ inquiry, replyText, profile, clientUrl, replyTo }) {
  const asked = formatSalta(inquiry.createdAt).split(' · ')[0];
  const subject = `Re: ${inquiry.subject}`;
  const buttons = [];
  if (replyTo) buttons.push(button('Responder', `mailto:${replyTo}?subject=${encodeURIComponent(subject)}`, { primary: true }));
  if (inquiry.userId) buttons.push(button('Ver en mi cuenta', `${clientUrl}/cuenta`, { primary: !replyTo }));

  const html = layout({
    eyebrow: `RESPUESTA A TU CONSULTA N.º ${number(inquiry)}`,
    heading: `Hola ${inquiry.name.split(' ')[0]}:`,
    bodyHtml: `<p style="margin:0;font-size:16px;line-height:1.6;">${paragraphs(replyText)}</p>
<p style="margin:20px 0 0;font-size:15px;line-height:1.5;">Saludos,<br><strong>${escapeHtml(profile.name)}</strong><br>${escapeHtml(profile.title)} · arce.dev</p>
${quote(`TU MENSAJE ORIGINAL · ${asked}`, `<p style="margin:0;font-size:14px;line-height:1.5;color:${soft};">${paragraphs(inquiry.message)}</p>`)}`,
    buttons,
    footer: `${escapeHtml(profile.name)} · ${escapeHtml(profile.title)}<br>Para seguir la conversación, escribinos a la dirección de este mensaje. Tu respuesta no queda en el historial de la consulta.`,
  });

  const text = [
    `Respuesta a tu consulta N.º ${number(inquiry)}`,
    '',
    `Hola ${inquiry.name.split(' ')[0]}:`,
    replyText,
    '',
    `Saludos, ${profile.name} · ${profile.title} · arce.dev`,
    '',
    `Tu mensaje original (${asked}):`,
    inquiry.message,
  ].join('\n');

  return { subject, html, text };
}
