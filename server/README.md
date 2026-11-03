# server/ — API REST de arce.dev

Node + Express 5 + MongoDB (Mongoose). El contrato de endpoints, errores y modelos está en el documento «Contrato de API · arce.dev».

## Formato de las respuestas

```json
{ "ok": true, "data": { } }
{ "ok": false, "error": "Mensaje para mostrar", "code": "validacion", "details": [{ "field": "email", "message": "Email inválido" }] }
```

`error` es siempre un texto y `details` aparece solo en errores por campo: es lo que lee `client/src/services/api.js` (`ApiError.message` y `.details`). `code` es un identificador estable para comparar en el código; algunos errores suman datos propios (`attemptsLeft`, `retryAfterSeconds`). Las listas de usuarios y de consultas devuelven `data: { items, page, limit, total, pages }` (así las lee el sitio); la de proyectos es un array con `meta: { page, limit, total, totalPages }` al lado. Cada objeto trae `_id` (lo que usa el sitio) e `id` (el nombre del contrato).

## Cómo correrlo

```bash
npm install
cp .env.example .env     # completar MONGODB_URI y JWT_SECRET
npm run seed             # carga datos de prueba (borra la base). Cuentas: admin@, operador@ y usuario@portfolio.test
npm run dev              # http://localhost:4000/api/health
npm test                 # usa una MongoDB en memoria: no necesita .env ni Atlas
npm run smoke            # prueba una API ya publicada (ver DEPLOY.md)
```

**Para publicarla en Render:** [DEPLOY.md](DEPLOY.md) tiene el paso a paso, las variables de entorno y los problemas frecuentes. Ojo: en Render gratis los emails no salen por Gmail (bloquean los puertos 25, 465 y 587).

Sin `MAIL_USER` y `MAIL_PASS`, los emails no se envían: en desarrollo se imprimen en la consola, y en producción el envío falla a propósito (no se simula, para no dejar enlaces de recuperación en el registro). Sin `GOOGLE_CLIENT_ID`, `POST /api/auth/google` responde 503. Sin las variables de Cloudinary, `POST /api/uploads` responde 503 (y las consultas con adjunto no se pueden probar); en los tests se usa un Cloudinary falso.

## Estado

| Listo | Falta (según el contrato) |
| --- | --- |
| Configuración validada al arrancar (falla con un mensaje claro), errores en el formato del contrato, helmet | Hacer el deploy en Render (la guía está en DEPLOY.md) |
| CORS para Vercel: varias URLs, comodines para las previsualizaciones, sin barra final | |
| Los 9 modelos | |
| Email con servidor SMTP configurable (para Render), `npm run smoke` y un seed que no corre contra una base remota sin contraseña propia ni `--yes` | |
| `authenticate`, `optionalAuth`, `requireRole`, límite de intentos | Documento de arquitectura y de la API |
| `/api/users` (admin): listar, filtrar, cambiar rol, activar o desactivar, eliminar | |
| `/api/visits` y `/api/stats` (summary, visits, inquiries-by-type, registrations): las cuentas se hacen en hora de Salta | |
| `/api/inquiries`: enviar, bandeja con filtros, detalle, estado, responder por email y «mis consultas» | |
| `/api/uploads` (Cloudinary): imágenes de proyectos y perfil, adjuntos; borra las imágenes que dejan de usarse | |
| `/api/auth`: registro, login con bloqueo, Google, `me`, contraseña, borrar cuenta, recuperar y resetear | |
| `/api/profile`, `/api/projects`, `/api/services` (lecturas públicas y CRUD de admin) y `/api/admin/...` | |
| `npm run seed`: 40 usuarios, 6 proyectos, 4 servicios, 30 consultas, visitas y accesos de 30 días | |
| Revisión de seguridad hecha: 16 hallazgos corregidos y 7 riesgos documentados ([SECURITY.md](SECURITY.md)) | |
| 270 tests (auth, contenido, seed, consultas, subidas, usuarios, visitas, estadísticas, deploy y ataques de seguridad) | |

## Estructura (todo vive dentro de `src/`)

```
config/       variables de entorno (env.js las valida) y CORS (cors.js)
models/       un archivo por colección
routes/       un archivo por grupo de endpoints
seed/         datos fijos (data.js), generador (index.js) y protección (guard.js); el comando es seed.js
smoke.js      prueba de una API publicada: npm run smoke
testing/      helper de los tests (base en memoria, tokens)
middlewares/  auth (JWT y roles), errorHandler, rateLimit
utils/        AppError, validators y contentValidators (reglas y mensajes del contrato), serialize, pagination, dates y stats (rangos y series del dashboard), accounts (borrar una cuenta), mailer y emailTemplates, storage (Cloudinary), tokens
test/         tests con node:test + supertest
```

## Para agregar un endpoint

1. Crear `routes/<grupo>.js` y montarlo en `app.js`.
2. Validar con `utils/validators.js` y lanzar errores con `AppError`: nunca responder errores a mano.
3. Proteger con `authenticate` y `requireRole('admin')` según el nivel del contrato.
4. Responder con `ok()` o `created()` de `utils/respond.js`.
