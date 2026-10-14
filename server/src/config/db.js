// ⚙️ BASE DEL PROYECTO — conexión a MongoDB Atlas.
import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log(`✅ MongoDB conectado: ${mongoose.connection.name}`)
  } catch (err) {
    console.error('❌ No se pudo conectar a MongoDB:', err.message)
    console.error('   Revisá MONGODB_URI y que tu IP esté habilitada en Atlas (Network Access).')
    process.exit(1)
  }
}
