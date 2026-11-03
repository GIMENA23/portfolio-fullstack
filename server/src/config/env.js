import 'dotenv/config';
import { parseClientUrls } from './cors.js';

// Lee y valida las variables de entorno. Falla al arrancar, con un mensaje claro, en lugar de romperse
// más tarde con un error difícil de entender.
export function readEnv(source) {
  const nodeEnv = source.NODE_ENV || 'development';
  const isTest = nodeEnv === 'test';

  if (!isTest) {
    const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((name) => !source[name]);
    if (missing.length) {
      throw new Error(`Faltan variables de entorno: ${missing.join(', ')}. Copiá .env.example a .env y completalo.`);
    }
  }
  if (nodeEnv === 'production' && source.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET es muy corta para producción: usá al menos 32 caracteres (la guía de deploy explica cómo generar una).');
  }

  // CLIENT_URL admite varias URLs separadas por coma; la primera se usa en los enlaces de los emails.
  const clientUrls = parseClientUrls(source.CLIENT_URL || 'http://localhost:5173');
  const invalid = clientUrls.filter((url) => !/^https?:\/\/[^\s/]+$/.test(url));
  if (!clientUrls.length || invalid.length) {
    throw new Error(`CLIENT_URL tiene que ser una o más URLs completas, separadas por coma y sin ruta (por ejemplo https://mi-app.vercel.app). Valor no válido: ${invalid.join(', ') || '(vacío)'}`);
  }
  if (clientUrls[0].includes('*')) {
    throw new Error('La primera URL de CLIENT_URL va en los enlaces de los emails y no puede llevar *. Ponela primero y los comodines después.');
  }

  // Cuántos proxies hay delante del servidor (Render pone uno). Si está mal, todos los visitantes
  // parecerían tener la misma IP y los límites de intentos se compartirían entre todos.
  // Una variable en blanco ("MAIL_PORT=" en el .env) cuenta como no definida.
  const given = (name) => source[name] !== undefined && source[name] !== '';

  const trustProxy = given('TRUST_PROXY') ? Number(source.TRUST_PROXY) : 1;
  if (!Number.isInteger(trustProxy) || trustProxy < 0) throw new Error('TRUST_PROXY tiene que ser un número entero de 0 en adelante.');

  const mailPort = given('MAIL_PORT') ? Number(source.MAIL_PORT) : 587;
  if (!Number.isInteger(mailPort) || mailPort <= 0) throw new Error('MAIL_PORT tiene que ser un número de puerto.');

  const mailUser = source.MAIL_USER || '';
  return {
    nodeEnv,
    isTest,
    port: Number(source.PORT) || 4000,
    mongoUri: source.MONGODB_URI,
    jwtSecret: source.JWT_SECRET,
    jwtExpiresIn: source.JWT_EXPIRES_IN || '7d',
    clientUrls,
    trustProxy,
    googleClientId: source.GOOGLE_CLIENT_ID || '',
    // Sin MAIL_HOST se usa Gmail. En Render gratis hay que usar otro servicio con puerto 2525 (ver DEPLOY.md).
    mailHost: source.MAIL_HOST || '',
    mailPort,
    mailUser,
    mailPass: source.MAIL_PASS || '',
    // Dirección que figura como remitente y a la que responden. Con Gmail es la misma MAIL_USER;
    // en otros servicios el usuario SMTP no es un email, así que va aparte.
    mailFrom: source.MAIL_FROM || (mailUser.includes('@') ? mailUser : ''),
    // Cloudinary se configura con CLOUDINARY_URL, o con las tres variables sueltas.
    cloudinary: {
      url: source.CLOUDINARY_URL || '',
      cloudName: source.CLOUDINARY_CLOUD_NAME || '',
      apiKey: source.CLOUDINARY_API_KEY || '',
      apiSecret: source.CLOUDINARY_API_SECRET || '',
      configured: Boolean(source.CLOUDINARY_URL || (source.CLOUDINARY_CLOUD_NAME && source.CLOUDINARY_API_KEY && source.CLOUDINARY_API_SECRET)),
    },
  };
}

export const env = readEnv(process.env);
