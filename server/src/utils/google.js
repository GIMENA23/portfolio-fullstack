import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';

// Verifica el token que entrega Google Identity Services. Los demás módulos solo conocen `google`, así que en
// los tests se reemplaza con `google.use(...)` y no hace falta hablar con Google.
const client = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const verifyWithGoogle = async (credential) => {
  const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
  return ticket.getPayload();
};

let verifier = client ? verifyWithGoogle : null;

export const google = {
  isConfigured: () => verifier !== null,
  verify: (credential) => verifier(credential),
  use(replacement) {
    verifier = replacement;
  },
};
