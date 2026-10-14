// ⚙️ BASE DEL PROYECTO — variables de entorno en un solo lugar.
export const env = {
  PORT: process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'solo-para-desarrollo-cambiar',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  MAIL_TO: process.env.MAIL_TO || process.env.MAIL_USER,
}

if (!env.MONGODB_URI) {
  console.error('❌ Falta MONGODB_URI en server/.env (ver server/.env.example)')
  process.exit(1)
}
