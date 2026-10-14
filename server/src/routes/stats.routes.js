// 🎨 DUEÑO: Integrante C (API) — visitas y métricas. La usa D (dashboard).
// ⏳ PENDIENTE (C). Tip: usar Model.countDocuments() y Model.aggregate() con $group por fecha.
import { Router } from 'express'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { pendiente } from '../utils/http.js'

export const visitsRouter = Router()
// POST /api/visits { path, sessionId } — público (lo llama el frontend en cada página)
visitsRouter.post('/', pendiente('C', 'registrar visita (sin duplicar por sesión y página)'))

export const statsRouter = Router()
statsRouter.use(requireAuth, requireRole('admin'))
statsRouter.get('/summary', pendiente('C', 'totales: visitas, usuarios, accesos autenticados, consultas'))
statsRouter.get('/visits', pendiente('C', 'visitas agrupadas ?desde=&hasta=&agrupar=dia|semana'))
statsRouter.get('/inquiries-by-type', pendiente('C', 'consultas agrupadas por tipo'))
statsRouter.get('/registrations', pendiente('C', 'registros agrupados por semana'))
