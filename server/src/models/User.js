import mongoose from 'mongoose';
import { jsonOptions } from '../utils/serialize.js';

const passwordResetSchema = new mongoose.Schema({ tokenHash: String, expiresAt: Date }, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Null/ausente si la cuenta solo usa Google. Nunca sale en una consulta salvo select('+passwordHash').
    passwordHash: { type: String, select: false },
    googleId: { type: String, index: { unique: true, sparse: true } },
    role: { type: String, enum: ['user', 'operator', 'admin'], default: 'user' },
    active: { type: Boolean, default: true },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },
    newsletter: { type: Boolean, default: false },
    termsAcceptedAt: Date,
    passwordReset: { type: passwordResetSchema, select: false },
    // Versión de las sesiones. Cada token lleva la versión con la que se emitió; al cambiar o borrar la contraseña
    // se sube, y los tokens anteriores dejan de valer: si alguien robó una sesión, cambiar la contraseña la cierra.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export const User = mongoose.model('User', userSchema);
