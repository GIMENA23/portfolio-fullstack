import { Router } from 'express';
import { Profile } from '../models/Profile.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validationError } from '../utils/AppError.js';
import { profileHandlers, run } from '../utils/contentValidators.js';
import { ok } from '../utils/respond.js';
import { profileOut } from '../utils/serialize.js';
import { removeFiles } from '../utils/storage.js';
import { checkAndStoreAll, normalizeForm, receiveFiles } from '../utils/uploadFile.js';
import { assertValid } from '../utils/validators.js';
import { defaultProfile } from '../seed/data.js';

const router = Router();

// GET /api/profile — público. Mientras el admin no guarde nada, devuelve el perfil del seed, nunca vacío.
router.get('/', async (_req, res) => {
  const profile = await Profile.findOne();
  ok(res, profileOut(profile ?? defaultProfile));
});

// Con una foto nueva el panel manda multipart: campos de texto, `stack` repetido, `experience` como JSON y la foto en `photo`.
const receive = receiveFiles({ single: 'photo' });

function readBody(req) {
  if (!req.is('multipart/form-data')) return req.body ?? {};
  const body = normalizeForm(req.body ?? {}, { lists: ['stack'] });
  if (typeof body.experience === 'string') {
    try {
      body.experience = JSON.parse(body.experience);
    } catch {
      throw validationError({ experience: 'La experiencia no tiene un formato válido.' });
    }
  }
  return body;
}

// PUT /api/profile — admin; reemplaza el perfil completo (los campos opcionales que no vengan se vacían).
// La foto es la excepción: si no se manda ni una nueva ni `photo: null`, se conserva la que había.
router.put('/', authenticate, requireRole('admin'), receive, async (req, res) => {
  const body = readBody(req);
  const { data, errors } = run({ ...body, photo: req.file ? undefined : body.photo }, profileHandlers, { partial: false });
  assertValid(errors);

  const previousPhoto = (await Profile.findOne())?.photo;
  if (req.file) [data.photo] = await checkAndStoreAll([req.file], 'profile', 'photo');
  else if (body.photo === undefined) delete data.photo;
  if (data.photo) data.photo = { url: data.photo.url, publicId: data.photo.publicId };

  const profile = await Profile.findOneAndUpdate({}, { $set: data }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true });
  if (previousPhoto?.publicId && previousPhoto.publicId !== profile.photo?.publicId) await removeFiles([previousPhoto]);
  ok(res, profileOut(profile));
});

export default router;
