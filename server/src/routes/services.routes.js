// 🎨 DUEÑO: Integrante C (API) — la usan B (sitio) y D (CRUD admin).
// ✅ YA FUNCIONA: GET listado.
// ⏳ PENDIENTE (C): crear, editar y eliminar.
import { Router } from 'express'
import Service from '../models/Service.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import { ok, pendiente } from '../utils/http.js'

const router = Router()

// GET /api/services
router.get('/', async (req, res) => {
  ok(res, await Service.find({ visible: true }).sort({ order: 1, name: 1 }))
})

router.post('/', requireAuth, requireRole('admin'), pendiente('C', 'crear servicio'))
router.put('/:id', requireAuth, requireRole('admin'), pendiente('C', 'editar servicio'))
router.delete('/:id', requireAuth, requireRole('admin'), pendiente('C', 'eliminar servicio'))

export default router
