# Portfolio Fullstack — TFI Lenguajes IV (UCASAL 2026)

Portfolio de un desarrollador fullstack con sitio público, registro de usuarios, panel de operador y panel de administrador.

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + React Router + Bootstrap 5 |
| Backend | Node.js + Express (API REST) |
| Base de datos | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt · Google Identity Services |
| Emails | Nodemailer |

## Cómo correrlo en tu compu

Requisitos: **Node.js 22 o superior** y **Git**.

```bash
git clone https://github.com/USUARIO/portfolio-fullstack.git
cd portfolio-fullstack
npm run install:all
```

Crear los archivos de entorno (pedile los valores a la coordinadora por privado, **nunca por el grupo ni en GitHub**):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Levantar todo (API + sitio a la vez):

```bash
npm run dev
```

- Sitio: http://localhost:5173
- API: http://localhost:4000/api/health

## Usuarios de prueba

Se crean con `npm run seed` (⚠️ borra y recarga la base). Contraseña de todos: `Portfolio2026`

| Rol | Email |
|---|---|
| Administrador | admin@portfolio.test |
| Operador | operador@portfolio.test |
| Usuario registrado | usuario@portfolio.test |

## ¿Qué ya funciona?

- Todas las rutas del sitio y de los paneles, con protección por rol
- Login con email y contraseña, registro (API), sesión con JWT
- Listado y detalle de proyectos (el detalle exige estar logueado)
- Listado de servicios (API)
- Modelos de la base con validaciones y datos de prueba

Lo que falta está marcado:
- En el sitio: recuadros punteados **"Pendiente · Integrante X"**
- En la API: responde `501 Pendiente (C): …`

## Estructura y dueños

```
client/src/
├── App.jsx, main.jsx            ⚙️ base (no tocar)
├── services/api.js              ⚙️ base — todas las llamadas a la API
├── context/AuthContext.jsx      ⚙️ base — useAuth()
├── layouts/                     ⚙️ base
├── styles/theme.css             A — colores y fuentes
├── animations/                  A — animaciones reutilizables
├── components/home/             B (+ A) — una sección por archivo
├── components/, pages/*.jsx     B — sitio público
├── pages/operator/              D — panel de operador
└── pages/admin/                 D — panel de administrador

server/src/
├── index.js, config/            ⚙️ base (no tocar)
├── middlewares/                 ⚙️ base (auth, validate, errores) · C (upload)
├── models/                      ⚙️ base — avisar antes de cambiar un campo
├── routes/                      C — un archivo por recurso
├── utils/mailer.js              C
└── seed.js                      datos de prueba
```

Reglas de trabajo en equipo: ver [CONTRIBUTING.md](CONTRIBUTING.md).
