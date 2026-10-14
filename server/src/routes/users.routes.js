// 🎨 DUEÑO: Integrante C (API) — la usa D (gestión de usuarios).
// ⏳ PENDIENTE (C).
import { Router } from 'express'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { pendiente } from '../utils/http.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

router.get('/', pendiente('C', 'listar usuarios ?q=&role=&page='))
router.patch('/:id', pendiente('C', 'cambiar rol o activar/desactivar'))
router.delete('/:id', pendiente('C', 'eliminar usuario'))

export default router
