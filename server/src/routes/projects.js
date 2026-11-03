import { Router } from 'express';
import { Project } from '../models/Project.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { projectHandlers, run } from '../utils/contentValidators.js';
import { escapeRegex, pageMeta, pageParams } from '../utils/pagination.js';
import { created, ok } from '../utils/respond.js';
import { projectDetail, projectSummary } from '../utils/serialize.js';
import { removeFiles } from '../utils/storage.js';
import { assertValid, cleanText } from '../utils/validators.js';

const router = Router();

const projectNotFound = () => new AppError(404, 'no_encontrado', 'No encontramos ese proyecto.');

// GET /api/projects — público: solo proyectos visibles, en resumen
router.get('/', async (req, res) => {
  const paging = pageParams(req.query);
  const filter = { visible: true };
  const stack = cleanText(req.query.stack);
  if (stack) filter.stack = new RegExp(`^${escapeRegex(stack)}$`, 'i');

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ featured: -1, createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Project.countDocuments(filter),
  ]);
  ok(res, projects.map(projectSummary), pageMeta(paging, total));
});

// GET /api/projects/:id — registrado. Un borrador solo lo ve el admin.
router.get('/:id', authenticate, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project || (!project.visible && req.user.role !== 'admin')) throw projectNotFound();
  ok(res, projectDetail(project));
});

// POST /api/projects — admin
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const { data, errors } = run(req.body, projectHandlers, { partial: false });
  assertValid(errors);
  created(res, projectDetail(await Project.create(data)));
});

// PUT /api/projects/:id — admin; cambia solo los campos que se envían
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw projectNotFound();

  const { data, errors } = run(req.body, projectHandlers, { partial: true });
  assertValid(errors);
  const previousImages = project.images.map(({ url, publicId }) => ({ url, publicId }));
  project.set(data);
  await project.save();
  if (data.images) {
    await removeFiles(previousImages.filter((old) => !data.images.some((image) => image.publicId === old.publicId)));
  }
  ok(res, projectDetail(project));
});

// DELETE /api/projects/:id — admin
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw projectNotFound();
  await removeFiles(project.images);
  ok(res, { id: String(project._id) });
});

export default router;
