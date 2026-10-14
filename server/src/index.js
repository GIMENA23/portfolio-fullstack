// ⚙️ BASE DEL PROYECTO — servidor Express.
// Todas las rutas ya están montadas: cada uno trabaja en su archivo de routes/.
import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

import authRoutes from './routes/auth.routes.js'
import projectRoutes from './routes/projects.routes.js'
import serviceRoutes from './routes/services.routes.js'
import inquiryRoutes from './routes/inquiries.routes.js'
import userRoutes from './routes/users.routes.js'
import { visitsRouter, statsRouter } from './routes/stats.routes.js'

const app = express()

app.set('trust proxy', 1) // necesario en Render para leer la IP real
app.use(cors({ origin: env.CLIENT_URL.split(',') }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, data: { status: 'online' } }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/inquiries', inquiryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/visits', visitsRouter)
app.use('/api/stats', statsRouter)

app.use('/api', notFoundHandler)
app.use(errorHandler)

await connectDB()
app.listen(env.PORT, () => console.log(`🚀 API escuchando en http://localhost:${env.PORT}`))
