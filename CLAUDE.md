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
- Backend: responder con `ok(res,data,status)`; errores con `throw notFound()/badRequest(msg,details)/forbidden()` de `utils/http.js`. Auth: `requireAuth`, `requireRole('admin')`. Validar con express-validator + `validate`.
- Formato API: `{ ok:true, data }` / `{ ok:false, error, details? }`.
- Estilos: clases de Bootstrap + variables de `styles/theme.css` (no colores a mano). Responsive obligatorio.
- Validación estricta de todos los campos, archivos (JPG/PNG/WebP, máx 2 MB) e imágenes, en front y back.
- Endpoints sin hacer responden 501 `pendiente('C', ...)`; páginas sin hacer muestran `<Placeholder>`. Al implementar, reemplazarlos.
- Git: rama por tarea (`feat/…`, `fix/…`, `style/…`), PR a main, nunca push directo ni --force, nunca subir `.env`.
- Teoría de la cátedra a priorizar: Fetch, REST/JSON/CRUD/códigos HTTP, Web Animations API, anime.js, React (props/state/hooks, componentes reutilizables), React Router (Outlet, index, 404, useParams), Vite, MongoDB.

## Endpoints (ver server/src/routes)
auth: POST register/login/google, GET me ✅ · projects: GET / y /:id ✅, POST/PUT/DELETE ⏳ · services: GET ✅, CRUD ⏳ · inquiries: POST, GET ?tipo&estado&desde&hasta&q&page, GET /:id, POST /:id/reply, PATCH /:id ⏳ · users (admin) GET/PATCH/DELETE ⏳ · visits POST ⏳ · stats: summary, visits?agrupar, inquiries-by-type, registrations ⏳
Modelos: server/src/models (User, Project, Service, Inquiry con replies anidadas, Visit).
Datos de prueba: `npm run seed` (borra todo; avisar). Usuarios: admin@/operador@/usuario@portfolio.test · Portfolio2026.

## Ahorro de tokens (importante)
- No recorrer todo el repo: leer solo los archivos del rol y los que se nombran acá.
- Respuestas cortas, sin repetir código que no cambió, sin resúmenes largos.
- Al pedir un plan: no modificar archivos, devolver el formato pedido y nada más.
