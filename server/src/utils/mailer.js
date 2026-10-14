// 🎨 DUEÑO: Integrante C — envío de emails con Nodemailer.
// Sin MAIL_USER/MAIL_PASS en .env, no envía nada: muestra el email en la consola
// (así se puede desarrollar sin configurar Gmail).
import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const transporter =
  env.MAIL_USER && env.MAIL_PASS
    ? nodemailer.createTransport({ service: 'gmail', auth: { user: env.MAIL_USER, pass: env.MAIL_PASS } })
    : null

export async function sendMail({ to, subject, text, html, replyTo }) {
  if (!transporter) {
    console.log('📧 [email simulado]', { to, subject, text })
    return { simulated: true }
  }
  return transporter.sendMail({ from: `"Portfolio" <${env.MAIL_USER}>`, to, subject, text, html, replyTo })
}
