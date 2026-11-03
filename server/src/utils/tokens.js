import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Un solo algoritmo, el mismo al firmar y al verificar: así nadie puede presentar un token con otro algoritmo.
const ALGORITHM = 'HS256';

// `tv` es la versión de las sesiones del usuario (ver User.tokenVersion).
export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), tv: user.tokenVersion ?? 0 }, env.jwtSecret, { algorithm: ALGORITHM, expiresIn: env.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] });

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

// El token viaja en el enlace del email; en la base solo queda su hash.
export function newResetToken(ttlMs = 60 * 60 * 1000) {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMs) };
}

export const hashResetToken = sha256;
