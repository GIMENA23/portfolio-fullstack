import mongoose from 'mongoose';

// Un documento por inicio de sesión correcto: permite contar "accesos autenticados" por período.
// Si la cuenta se elimina, el acceso se conserva con userId en null para que el total no baje.
const loginSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  method: { type: String, enum: ['password', 'google'], required: true },
  at: { type: Date, default: Date.now, index: true },
});

export const Login = mongoose.model('Login', loginSchema);
