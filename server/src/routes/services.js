import { Router } from 'express';
import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { AppError, validationError } from '../utils/AppError.js';
import { run, serviceHandlers } from '../utils/contentValidators.js';
import { created, ok } from '../utils/respond.js';
import { serviceOut } from '../utils/serialize.js';
import { assertValid } from '../utils/validators.js';

const router = Router();
const admin = [authenticate, requireRole('admin')];

const serviceNotFound = () => new AppError(404, 'no_encontrado', 'No encontramos ese servicio.');

const adminList = async () => (await Service.find().sort({ order: 1 })).map((service) => serviceOut(service, { admin: true }));

// Deja los `order` como 1, 2, 3… sin huecos (después de borrar uno).
async function renumber() {
  const services = await Service.find().sort({ order: 1 }).select('_id');
  await Service.bulkWrite(services.map((service, index) => ({ updateOne: { filter: { _id: service._id }, update: { order: index + 1 } } })));
}

// GET /api/services — público: solo los visibles, en orden
router.get('/', async (_req, res) => {
  const services = await Service.find({ visible: true }).sort({ order: 1 });
  ok(res, services.map((service) => serviceOut(service)));
});

// POST /api/services — admin; queda al final de la lista
router.post('/', ...admin, async (req, res) => {
  const { data, errors } = run(req.body, serviceHandlers, { partial: false });
  assertValid(errors);
  const last = await Service.findOne().sort({ order: -1 }).select('order');
  const service = await Service.create({ ...data, order: (last?.order ?? 0) + 1 });
  created(res, serviceOut(service, { admin: true }));
});

// PATCH /api/services/order — admin; recibe la lista completa de ids en el orden nuevo
router.patch('/order', ...admin, async (req, res) => {
  const ids = req.body?.ids;
  const current = await Service.find().select('_id');
  const known = new Set(current.map((service) => String(service._id)));
  const sent = Array.isArray(ids) ? ids.map(String) : [];
  const sameList = sent.length === known.size && new Set(sent).size === sent.length && sent.every((id) => known.has(id));
  if (!sameList) {
    throw validationError({ ids: 'La lista tiene que incluir todos los servicios, una sola vez cada uno.' });
  }

  await Service.bulkWrite(sent.map((id, index) => ({ updateOne: { filter: { _id: new mongoose.Types.ObjectId(id) }, update: { order: index + 1 } } })));
  ok(res, await adminList());
});

// PUT /api/services/:id — admin; cambia solo los campos que se envían
router.put('/:id', ...admin, async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw serviceNotFound();

  const { data, errors } = run(req.body, serviceHandlers, { partial: true });
  assertValid(errors);
  service.set(data);
  await service.save();
  ok(res, serviceOut(service, { admin: true }));
});

// DELETE /api/services/:id — admin
router.delete('/:id', ...admin, async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw serviceNotFound();
  await renumber();
  ok(res, { id: String(service._id) });
});

export default router;
