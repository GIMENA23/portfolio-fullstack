// ⚙️ BASE DEL PROYECTO — colección "users"
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const ROLES = ['user', 'operator', 'admin']

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre no puede superar 60 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'],
    },
    passwordHash: { type: String, select: false }, // no se devuelve en las consultas
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ROLES, default: 'user' },
    active: { type: Boolean, default: true },
    loginCount: { type: Number, default: 0 }, // contador de accesos autenticados
    lastLogin: { type: Date },
  },
  { timestamps: true },
)

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10)
}

userSchema.methods.checkPassword = function (password) {
  return this.passwordHash ? bcrypt.compare(password, this.passwordHash) : false
}

/** Registra un acceso (para el contador de usuarios autenticados). */
userSchema.methods.registerLogin = function () {
  this.loginCount += 1
  this.lastLogin = new Date()
  return this.save()
}

/** Datos seguros para mandar al frontend. */
userSchema.methods.toPublic = function () {
  const { _id, name, email, role, provider, avatar, active, createdAt, lastLogin, loginCount } = this
  return { _id, name, email, role, provider, avatar, active, createdAt, lastLogin, loginCount }
}

export default mongoose.model('User', userSchema)
