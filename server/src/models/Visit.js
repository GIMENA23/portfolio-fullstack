// ⚙️ BASE DEL PROYECTO — colección "visits" (contador de visitas)
import mongoose from 'mongoose'

const visitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, maxlength: 200 },
    sessionId: { type: String, maxlength: 64 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = anónimo
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

visitSchema.index({ createdAt: 1 })

export default mongoose.model('Visit', visitSchema)
