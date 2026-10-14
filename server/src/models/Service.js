// ⚙️ BASE DEL PROYECTO — colección "services"
import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], unique: true, trim: true },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [300, 'La descripción no puede superar 300 caracteres'],
    },
    icon: { type: String, trim: true },
    priceFrom: { type: Number, min: [0, 'El precio no puede ser negativo'] },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Service', serviceSchema)
