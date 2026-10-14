// 🎨 DUEÑO: Integrante C — subida de imágenes con validación de tipo y peso.
//   router.post('/', upload.array('images', 5), handler)
// Hoy guarda en memoria (req.files[i].buffer). C decide si las sube a Cloudinary
// o las guarda en /uploads.
import multer from 'multer'
import { badRequest } from '../utils/http.js'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 5 }, // 2 MB por imagen, máx. 5
  fileFilter: (req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) cb(null, true)
    else cb(badRequest('Solo se permiten imágenes JPG, PNG o WebP'))
  },
})
