import { Router } from 'express';
import { Project } from '../models/Project.js';
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth.js';
import { AppError, validationError } from '../utils/AppError.js';
import { projectHandlers, run } from '../utils/contentValidators.js';
import { escapeRegex, pageMeta, pageParams } from '../utils/pagination.js';
import { created, ok } from '../utils/respond.js';
import { projectDetail, projectSummary } from '../utils/serialize.js';
import { removeFiles } from '../utils/storage.js';
import { checkAndStoreAll, normalizeForm, receiveFiles, toArray } from '../utils/uploadFile.js';
import { assertValid, cleanText } from '../utils/validators.js';

const router = Router();

const projectNotFound = () => new AppError(404, 'no_encontrado', 'No encontramos ese proyecto.');
const admin = [authenticate, requireRole('admin')];
const MAX_IMAGES = 5;

// GET /api/projects — público: solo proyectos visibles, en resumen.
// El admin, con ?all=true, recibe todos (también los borradores) con el detalle completo: el panel edita desde esta lista.
router.get('/', optionalAuth, async (req, res) => {
  const all = req.query.all === 'true' && req.user?.role === 'admin';
  const paging = pageParams(req.query, all ? { defaultLimit: 100 } : {});
  const filter = all ? {} : { visible: true };
  const stack = cleanText(req.query.stack);
  if (stack) filter.stack = new RegExp(`^${escapeRegex(stack)}$`, 'i');

  const [projects, total] = await Promise.all([
    Project.find(filter).sort(all ? { createdAt: -1 } : { featured: -1, createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Project.countDocuments(filter),
  ]);
  ok(res, projects.map(all ? projectDetail : projectSummary), pageMeta(paging, total));
});

// GET /api/projects/:id — registrado. Un borrador solo lo ve el admin.
router.get('/:id', authenticate, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project || (!project.visible && req.user.role !== 'admin')) throw projectNotFound();
  ok(res, projectDetail(project));
});

// El panel manda multipart (campos de texto, `stack` repetido, `keepImages` con las URLs que se conservan e `images` con
// los archivos nuevos). Con JSON se sigue aceptando `images: [{ url, publicId }]` (imágenes ya subidas a /api/uploads).
const receive = receiveFiles({ array: ['images', MAX_IMAGES] });
const prepare = (req) => (req.is('multipart/form-data') ? normalizeForm(req.body ?? {}, { lists: ['stack', 'keepImages', 'highlights'], booleans: ['featured', 'visible'] }) : (req.body ?? {}));

// Arma la lista final de imágenes del proyecto: las que se conservan más las nuevas.
async function multipartImages(req, body, current = []) {
  const kept = toArray(body.keepImages).map(String);
  const keptImages = current.filter((image) => kept.includes(image.url));
  const files = req.files ?? [];
  if (keptImages.length + files.length > MAX_IMAGES) throw validationError({ images: `Máximo ${MAX_IMAGES} imágenes.` });
  const uploaded = await checkAndStoreAll(files, 'project', 'images');
  return [...keptImages.map(({ url, publicId }) => ({ url, publicId })), ...uploaded.map(({ url, publicId }) => ({ url, publicId }))];
}

// POST /api/projects — admin
router.post('/', ...admin, receive, async (req, res) => {
  const multipart = req.is('multipart/form-data');
  const body = prepare(req);
  const { data, errors } = run(multipart ? { ...body, images: undefined } : body, projectHandlers, { partial: false });
  assertValid(errors);
  if (multipart) data.images = await multipartImages(req, body);
  created(res, projectDetail(await Project.create(data)));
});

// PUT /api/projects/:id — admin; cambia solo los campos que se envían (con multipart, las imágenes se arman siempre
// con keepImages + las nuevas)
router.put('/:id', ...admin, receive, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw projectNotFound();

  const multipart = req.is('multipart/form-data');
  const body = prepare(req);
  const { data, errors } = run(multipart ? { ...body, images: undefined } : body, projectHandlers, { partial: true });
  assertValid(errors);
  const previousImages = project.images.map(({ url, publicId }) => ({ url, publicId }));
  if (multipart) data.images = await multipartImages(req, body, previousImages);
  project.set(data);
  await project.save();
  if (data.images) {
    await removeFiles(previousImages.filter((old) => !data.images.some((image) => image.publicId === old.publicId)));
  }
  ok(res, projectDetail(project));
});

// DELETE /api/projects/:id — admin
router.delete('/:id', ...admin, async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw projectNotFound();
  await removeFiles(project.images);
  ok(res, { id: String(project._id) });
});

export default router;
