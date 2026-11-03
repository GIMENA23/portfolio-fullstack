# Contexto para Claude Code — TFI Lenguajes IV (UCASAL 2026)

Portfolio de desarrollador fullstack. Objetivo: PROMOCIONAR. Exposición: 26/10 al 13/11/2026.
Monorepo: `client/` (React + Vite + React Router + Bootstrap 5) y `server/` (Express 5 + Mongoose 9 + MongoDB Atlas, ESM).
Interfaz y textos en español (Argentina).

## Equipo y dueños de archivos
| Rol | Persona | Archivos propios |
|---|---|---|
| A Diseño/animaciones | Gimena (coordina) | client/src/styles/, client/src/animations/, docs/ |
| B Frontend público | Bernardo | client/src/pages/*.jsx, client/src/components/ (incl. home/) |
| C Backend/auth | Ezequiel | server/src/routes/, server/src/utils/mailer.js, server/src/middlewares/upload.js |
| D Paneles | Francisco | client/src/pages/operator/, client/src/pages/admin/ |

Archivos marcados `⚙️ BASE` (App.jsx, main.jsx, api.js, AuthContext, layouts, server index/config/models/middlewares): NO modificar sin que el usuario confirme que avisó al grupo.

## Reglas
- Tocar solo archivos del rol del usuario. Si hace falta otro, decirlo y no hacerlo.
- No instalar dependencias sin confirmación del usuario.
- Frontend: llamar a la API solo vía `client/src/services/api.js` (lanza ApiError con .message y .details[{field,message}]). Sesión: `useAuth()` → user, hasRole(), login…
- Backend: responder con `ok(res,data)` / `created(res,data)` de `utils/respond.js`; errores con `throw new AppError(status, code, mensaje, { fields })` o `validationError({ campo: mensaje })` de `utils/AppError.js`. Auth: `authenticate`, `optionalAuth`, `requireRole('admin')` de `middlewares/auth.js`. Validar con `utils/validators.js` y `utils/contentValidators.js` (no con express-validator).
- Formato API: `{ ok:true, data }` / `{ ok:false, error, details? }`. `error` es el mensaje (texto) y `details` es `[{ field, message }]` con el nombre del campo del formulario; además trae `code`. Todo objeto trae `_id` (e `id`). Las listas de usuarios y consultas son `data: { items, page, limit, total, pages }`.
- Estilos: clases de Bootstrap + variables de `styles/theme.css` (no colores a mano). Responsive obligatorio.
- Validación estricta de todos los campos, archivos (JPG/PNG/WebP, máx 2 MB) e imágenes, en front y back.
- Endpoints sin hacer responden 501 `pendiente('C', ...)`; páginas sin hacer muestran `<Placeholder>`. Al implementar, reemplazarlos.
- Git: rama por tarea (`feat/…`, `fix/…`, `style/…`), PR a main, nunca push directo ni --force, nunca subir `.env`.
- Teoría de la cátedra a priorizar: Fetch, REST/JSON/CRUD/códigos HTTP, Web Animations API, anime.js, React (props/state/hooks, componentes reutilizables), React Router (Outlet, index, 404, useParams), Vite, MongoDB.

## Endpoints (ver server/src/routes) — todos hechos ✅
Roles: público · user (con sesión) · operator · admin. Contrato completo en el documento «Contrato de API · arce.dev».
- **auth**: POST `register` (`nombre`, email, password), `login`, `google`, `forgot`, `reset` (`token`, `password`) · GET `me` · PATCH `me` (`name`, o `password` + `currentPassword`; la actual es obligatoria si la cuenta ya tiene contraseña) · DELETE `me` · POST `password`.
- **projects**: GET `/` (`?all=true` solo admin: todos, con detalle) · GET `/:id` (con sesión) · POST, PUT `/:id`, DELETE `/:id` (admin; multipart con `images`, `keepImages`, `stack` repetido, o JSON).
- **services**: GET `/` (el admin ve también los ocultos) · POST, PUT `/:id`, DELETE `/:id`, PATCH `/order` (admin). Campos: `name`, `description`, `icon` (code/server/database/chat), `color` (carmin/negro/vicuna/exito/oro), `priceFrom`, `order`, `visible`.
- **profile**: GET `/` (público) · PUT `/` (admin; multipart con `photo`, `stack` repetido y `experience` en JSON, o JSON). Sin foto nueva se conserva la anterior.
- **inquiries**: POST `/` (público; campos `nombre, email, telefono, tipo, presupuesto, asunto, mensaje` y `adjunto` como archivo PDF/JPG/PNG ≤ 2 MB; presupuesto obligatorio en cotización) · GET `/mine` (con sesión) · operador/admin: GET `/` (`?tipo&estado&desde&hasta&q&page`), GET `/:id`, POST `/:id/reply`, PATCH `/:id` (`status`).
- **users** (admin): GET `/` (`?role&q&page`), GET `/:id`, PATCH `/:id` (`role`, `active`; no se puede cambiar el rol ni desactivar a uno mismo), DELETE `/:id`.
- **uploads**: POST `/` (multipart `file` + `kind`: project/profile/attachment) · **visits**: POST `/` (`path`, `sessionId`) · **stats** (admin): GET `summary`, `visits`, `inquiries-by-type`, `registrations` (`?desde&hasta&agrupar&tipo`) · **admin**: GET `projects`, `services` · GET `/api/health`.
Modelos (9 colecciones): server/src/models (User, Login, LoginAttempt, Project, Service, Profile, Inquiry con replies anidadas, Visit, Counter).
API publicada: https://portfolio-fullstack-cidz.onrender.com (Render gratis: la primera petición tarda ~1 min si estaba dormida). Variables en `server/.env.example`; el paso a paso en `server/DEPLOY.md`.
Datos de prueba: `npm run seed` desde `server/` (borra todo; avisar; contra Atlas pide `SEED_PASSWORD` y `--yes`). Usuarios: admin@/operador@/usuario@portfolio.test · Portfolio2026.

## Ahorro de tokens (importante)
- No recorrer todo el repo: leer solo los archivos del rol y los que se nombran acá.
- Respuestas cortas, sin repetir código que no cambió, sin resúmenes largos.
- Al pedir un plan: no modificar archivos, devolver el formato pedido y nada más.
