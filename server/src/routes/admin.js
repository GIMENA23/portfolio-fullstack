import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { escapeRegex, pageMeta, pageParams } from '../utils/pagination.js';
import { ok } from '../utils/respond.js';
import { projectDetail, serviceOut } from '../utils/serialize.js';
import { cleanText } from '../utils/validators.js';

// Listados del panel de admin: incluyen borradores y servicios ocultos.
const router = Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/projects?q=&visible=true|false&page=&limit=
router.get('/projects', async (req, res) => {
  const paging = pageParams(req.query);
  const filter = {};
  const q = cleanText(req.query.q);
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: pattern }, { summary: pattern }];
  }
  if (req.query.visible === 'true' || req.query.visible === 'false') filter.visible = req.query.visible === 'true';

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip(paging.skip).limit(paging.limit),
    Project.countDocuments(filter),
  ]);
  ok(res, projects.map(projectDetail), pageMeta(paging, total));
});

// GET /api/admin/services
router.get('/services', async (_req, res) => {
  const services = await Service.find().sort({ order: 1 });
  ok(res, services.map((service) => serviceOut(service, { admin: true })));
});

export default router;
