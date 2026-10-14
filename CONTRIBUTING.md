# Cómo trabajamos (leer antes de empezar)

## La regla de oro

**Cada uno toca solo sus archivos.** La base (rutas, layouts, conexión a la API, sesión, servidor) ya está armada. No hace falta modificarla para hacer tu parte.

| Integrante | Tus archivos |
|---|---|
| A — Diseño | `client/src/styles/`, `client/src/animations/`, `docs/` |
| B — Sitio público | `client/src/pages/*.jsx`, `client/src/components/` (incluye `home/`) |
| C — Backend | `server/src/routes/`, `server/src/utils/mailer.js`, `server/src/middlewares/upload.js` |
| D — Paneles | `client/src/pages/operator/`, `client/src/pages/admin/` |

Si necesitás cambiar un archivo **⚙️ base**, un modelo o un archivo de otro: **avisá en el grupo primero**.

Si necesitás una librería nueva (`npm install algo`), avisá también. Así no hay dos PR modificando `package.json` al mismo tiempo.

## Flujo diario con Git

```bash
# 1. Antes de empezar: traer lo último
git checkout main
git pull origin main

# 2. Crear una rama para tu tarea (una rama por tarea)
git checkout -b feat/contacto-formulario

# 3. Trabajar y guardar seguido
git add .
git commit -m "feat: validaciones del formulario de contacto"

# 4. Subir la rama
git push -u origin feat/contacto-formulario
```

5. En GitHub: **Compare & pull request**. Completá la plantilla y esperá la aprobación de otro integrante.
6. Una vez aprobado: **Squash and merge** y borrar la rama.

### Nombres de ramas

| Prefijo | Para qué | Ejemplo |
|---|---|---|
| `feat/` | Funcionalidad nueva | `feat/admin-dashboard` |
| `fix/` | Corregir un error | `fix/login-redirect` |
| `style/` | Solo diseño | `style/paleta-manual` |
| `docs/` | Documentación | `docs/arquitectura` |

### Si `main` cambió mientras trabajabas

```bash
git checkout main
git pull origin main
git checkout tu-rama
git merge main
```

Si aparece un conflicto, VS Code lo marca. Elegí qué conservar y hacé commit. Si es en un archivo de otro, preguntale antes de decidir.

## Cómo usar la API desde el frontend

No escribas `fetch` a mano: usá las funciones de `client/src/services/api.js`.

```jsx
import { inquiriesApi } from '../services/api.js'

try {
  await inquiriesApi.create(datos)
} catch (err) {
  err.message // mensaje general
  err.details // [{ field: 'email', message: 'Email inválido' }]
}
```

Para saber quién está logueado:

```jsx
import { useAuth } from '../context/AuthContext.jsx'

const { user, isAuthenticated, hasRole } = useAuth()
```

## Cómo agregar un endpoint (C)

Reemplazá el `pendiente(...)` del archivo de rutas por la función real. Respondé siempre con el mismo formato:

```js
import { ok, notFound, badRequest } from '../utils/http.js'

ok(res, data)                 // 200 { ok: true, data }
ok(res, data, 201)            // creado
throw notFound('No existe')   // 404 { ok: false, error }
```

Los errores de Mongoose (validación, duplicados, id inválido) se convierten solos en respuestas 400/409.

## Estilos (todos)

Usá las clases de Bootstrap y las variables de `theme.css` (`var(--color-primary)`). No escribas colores a mano: cuando A cambie la paleta, se actualiza todo el sitio.

## Nunca

- Subir el archivo `.env` o pegar claves en el código o en el grupo
- Hacer `git push` directo a `main`
- Hacer `git push --force`
- Ejecutar `npm run seed` contra la base compartida sin avisar (borra todo)
