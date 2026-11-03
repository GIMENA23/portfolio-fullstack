import mongoose from 'mongoose';

// Intentos de login por email y por IP. Se anota el intento ANTES de revisar la contraseña, así los pedidos
// simultáneos se cuentan entre sí. Mongo los borra solo a los 15 minutos (índice TTL), que es la ventana del bloqueo.
const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true },
  ip: { type: String, default: '' },
  at: { type: Date, default: Date.now, expires: 15 * 60 },
});

loginAttemptSchema.index({ email: 1, ip: 1, at: 1 });

export const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);
