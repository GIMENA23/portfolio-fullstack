// 🎨 DUEÑO: Integrante C (API) — la usan B (sitio) y D (CRUD admin).
// ✅ YA FUNCIONA: GET listado y GET detalle.
// ⏳ PENDIENTE (C): crear, editar y eliminar con imágenes.
import { Router } from 'express'
import Project from '../models/Project.js'
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.js'
import { ok, notFound, pendiente } from '../utils/http.js'

const router = Router()

// GET /api/projects?stack=react&all=true
// Público: solo visibles y con datos resumidos. Admin con ?all=true: todos.
router.get('/', optionalAuth, async (req, res) => {
  const isAdmin = req.user?.role === 'admin'
  const filter = {}
  if (!(isAdmin && req.query.all === 'true')) filter.visible = true
  if (req.query.stack) filter.stack = req.query.stack

  const fields = isAdmin ? '' : 'title summary stack images featured createdAt'
  const projects = await Project.find(filter).select(fields).sort({ featured: -1, createdAt: -1 })
  ok(res, projects)
})

// GET /api/projects/:id — solo usuarios registrados (requisito de la consigna)
router.get('/:id', requireAuth, async (req, res) => {
  const project = await Project.findById(req.params.id)
  if (!project || (!project.visible && req.user.role !== 'admin')) throw notFound('Proyecto no encontrado')
  ok(res, project)
})

// Admin
router.post('/', requireAuth, requireRole('admin'), pendiente('C', 'crear proyecto con imágenes (upload.array("images", 5))'))
router.put('/:id', requireAuth, requireRole('admin'), pendiente('C', 'editar proyecto'))
router.delete('/:id', requireAuth, requireRole('admin'), pendiente('C', 'eliminar proyecto'))

export default router
