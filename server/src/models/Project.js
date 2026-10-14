// ⚙️ BASE DEL PROYECTO — colección "projects" (cada proyecto incluye su demo)
import mongoose from 'mongoose'

const urlRegex = /^https?:\/\/.+/

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      maxlength: [80, 'El título no puede superar 80 caracteres'],
    },
    summary: {
      type: String,
      required: [true, 'El resumen es obligatorio'],
      trim: true,
      maxlength: [200, 'El resumen no puede superar 200 caracteres'],
    },
    description: { type: String, required: [true, 'La descripción es obligatoria'], trim: true },
    stack: {
      type: [String],
      validate: [(v) => v.length > 0, 'Indicá al menos una tecnología'],
    },
    images: { type: [String], default: [] },
    demoUrl: { type: String, trim: true, match: [urlRegex, 'La URL de la demo no es válida'] },
    repoUrl: { type: String, trim: true, match: [urlRegex, 'La URL del repositorio no es válida'] },
    featured: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Project', projectSchema)
