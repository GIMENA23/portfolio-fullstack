// 🎨 DUEÑO: Integrante C (API) — la usan B (formulario) y D (panel de operador).
// ⏳ PENDIENTE (C): todo. Ver el plan de trabajo, sección 4.5.
import { Router } from 'express'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { pendiente } from '../utils/http.js'

const router = Router()
const staff = [requireAuth, requireRole('operator', 'admin')]

// Público: guardar consulta + enviar email de aviso (utils/mailer.js) + límite por IP
router.post('/', pendiente('C', 'guardar consulta, validar y enviar email'))

// Operador / admin
router.get('/', ...staff, pendiente('C', 'listar con filtros ?tipo=&estado=&desde=&hasta=&q=&page='))
router.get('/:id', ...staff, pendiente('C', 'detalle de consulta'))
router.post('/:id/reply', ...staff, pendiente('C', 'responder por email y guardar en replies'))
router.patch('/:id', ...staff, pendiente('C', 'cambiar estado'))

export default router
