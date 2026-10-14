// ⚙️ BASE DEL PROYECTO — colección "inquiries" (consultas del formulario)
// Las respuestas del operador se guardan ANIDADAS dentro de cada consulta
// (objetos anidados, clase 9 de MongoDB).
import mongoose from 'mongoose'

export const INQUIRY_TYPES = ['general', 'cotizacion', 'asesoria']
export const INQUIRY_STATUS = ['nueva', 'en_proceso', 'respondida', 'cerrada']

const replySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, minlength: 10 },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'],
    },
    phone: { type: String, trim: true, match: [/^\d{7,15}$/, 'Teléfono inválido (solo números, 7 a 15 dígitos)'] },
    type: { type: String, enum: INQUIRY_TYPES, required: [true, 'El tipo de consulta es obligatorio'] },
    subject: { type: String, required: [true, 'El asunto es obligatorio'], trim: true, maxlength: 120 },
    message: {
      type: String,
      required: [true, 'El mensaje es obligatorio'],
      trim: true,
      minlength: [10, 'El mensaje debe tener al menos 10 caracteres'],
      maxlength: [1000, 'El mensaje no puede superar 1000 caracteres'],
    },
    status: { type: String, enum: INQUIRY_STATUS, default: 'nueva' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // si la envió alguien logueado
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('Inquiry', inquirySchema)
