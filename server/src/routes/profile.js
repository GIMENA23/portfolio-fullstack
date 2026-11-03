import { Router } from 'express';
import { Profile } from '../models/Profile.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { profileHandlers, run } from '../utils/contentValidators.js';
import { ok } from '../utils/respond.js';
import { profileOut } from '../utils/serialize.js';
import { removeFiles } from '../utils/storage.js';
import { assertValid } from '../utils/validators.js';
import { defaultProfile } from '../seed/data.js';

const router = Router();

// GET /api/profile — público. Mientras el admin no guarde nada, devuelve el perfil del seed, nunca vacío.
router.get('/', async (_req, res) => {
  const profile = await Profile.findOne();
  ok(res, profileOut(profile ?? defaultProfile));
});

// PUT /api/profile — admin; reemplaza el perfil completo (los campos opcionales que no vengan se vacían)
router.put('/', authenticate, requireRole('admin'), async (req, res) => {
  const { data, errors } = run(req.body, profileHandlers, { partial: false });
  assertValid(errors);
  const previousPhoto = (await Profile.findOne())?.photo;
  const profile = await Profile.findOneAndUpdate({}, { $set: data }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true });
  if (previousPhoto?.publicId && previousPhoto.publicId !== data.photo?.publicId) await removeFiles([previousPhoto]);
  ok(res, profileOut(profile));
});

export default router;
