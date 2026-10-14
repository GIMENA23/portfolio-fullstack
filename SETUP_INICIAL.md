# Configuración inicial (la hace una sola persona, una sola vez)

Tiempo estimado: 40 minutos. Al terminar, el resto del equipo solo clona el repo y trabaja en su parte.

---

## Paso 0 — Instalar herramientas

- **Node.js 22 LTS o superior**: https://nodejs.org (verificar con `node -v`)
- **Git**: https://git-scm.com (verificar con `git -v`)
- **VS Code**: https://code.visualstudio.com
- **MongoDB Compass**: https://www.mongodb.com/try/download/compass

---

## Paso 1 — Base de datos en MongoDB Atlas

1. Entrar a https://www.mongodb.com/cloud/atlas/register y crear una cuenta (con Google sirve).
2. **Create a cluster** → elegir el plan **Free (M0)**:
   - Proveedor: AWS
   - Región: São Paulo (`sa-east-1`), la más cercana
   - Nombre: `portfolio`
3. Crear el usuario de la base. Atlas lo pide al crear el cluster; si no, se hace en **Database Access → Add New Database User**:
   - Usuario: `portfolio_app`
   - Contraseña: **Autogenerate** → copiarla y guardarla
   - Rol: *Read and write to any database*
4. **Network Access → Add IP Address → Allow access from anywhere** (`0.0.0.0/0`).
   Hace falta porque cada integrante se conecta desde una IP distinta, y Render también.
5. **Database → Connect → Drivers** → copiar la cadena de conexión. Es parecida a esta:
   ```
   mongodb+srv://portfolio_app:<db_password>@portfolio.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=portfolio
   ```
   Hacerle dos cambios:
   - Reemplazar `<db_password>` por la contraseña del paso 3.
   - Agregar el nombre de la base `portfolio` después de `.net/`:
   ```
   mongodb+srv://portfolio_app:CONTRASEÑA@portfolio.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority&appName=portfolio
   ```
6. **(Opcional) Invitar al equipo:** **Project → Access Manager → Invite to Project** con rol *Project Read Only*. Así pueden ver los datos en la web de Atlas.

---

## Paso 2 — Probar el proyecto en tu compu

1. Descomprimir `portfolio-fullstack.zip` y abrir la carpeta en VS Code.
2. Abrir la terminal (Ctrl + ñ) y ejecutar:
   ```bash
   npm run install:all
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   En Windows con CMD, usar `copy server\.env.example server\.env` y `copy client\.env.example client\.env`.
3. Completar `server/.env`:
   - `MONGODB_URI=` → la cadena del paso 1.5
   - `JWT_SECRET=` → un texto largo al azar. Se puede generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Cargar los datos de prueba y levantar el proyecto:
   ```bash
   npm run seed
   npm run dev
   ```
5. Probar:
   - http://localhost:5173 → el sitio abre y muestra recuadros "Pendiente".
   - **Proyectos** → aparecen 6 proyectos de ejemplo.
   - Click en uno → pide iniciar sesión.
   - Ingresar con `admin@portfolio.test` / `Portfolio2026` → aparecen los menús **Consultas** y **Admin**.
6. En **MongoDB Compass**: pegar la misma cadena de conexión → **Connect** → base `portfolio`. Se ven las colecciones `users`, `projects`, `services`, `inquiries` y `visits`. Abrir una consulta respondida para ver las respuestas anidadas.

---

## Paso 3 — Repositorio en GitHub

1. En https://github.com/new:
   - Nombre: `portfolio-fullstack`
   - Visibilidad: **Private** (o Public si la profe lo pide)
   - **No** marcar "Add a README" (ya viene en el proyecto)
   - **Create repository**
2. En la terminal de VS Code, dentro de la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "chore: base del proyecto"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/portfolio-fullstack.git
   git push -u origin main
   ```
3. Verificar en GitHub que **no** aparecen `.env` ni `node_modules`. El `.gitignore` los excluye.
4. **Settings → Collaborators → Add people** → invitar a los 3 compañeros por su usuario de GitHub.
5. Abrir `.github/CODEOWNERS` y reemplazar `@coordinadora`, `@usuarioA`, `@usuarioB`, etc. por los usuarios reales. Commit y push.

### Proteger la rama main (evita choques)

**Settings → Branches → Add branch ruleset** (o *Add classic branch protection rule*):
- Branch name pattern: `main`
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Require review from Code Owners
- ✅ **Block force pushes**
- **Create / Save**

> En repos privados de cuentas gratuitas, GitHub puede no aplicar estas reglas. En ese caso: hacer el repo público, o pedir **GitHub Education** (gratis con mail de la facultad), o simplemente acordar en el grupo que nadie sube directo a `main`.

### Tablero de tareas

**Projects → New project → Board** → columnas: *Por hacer · En curso · En revisión · Hecho*. Cargar las tareas del Plan de Trabajo (sección 6) con su responsable.

---

## Paso 4 — Pasarles las claves al equipo

Mandar por **mensaje privado** (no en el grupo, no en GitHub) el contenido de `server/.env`.

Cada uno:
```bash
git clone https://github.com/TU_USUARIO/portfolio-fullstack.git
cd portfolio-fullstack
npm run install:all
```
Después crea su `server/.env` con lo que le pasaste, crea `client/.env` copiando `client/.env.example`, y ejecuta `npm run dev`.

> Todos usan la misma base de Atlas, así que ven los mismos datos. Solo una persona ejecuta `npm run seed`, y avisando, porque borra todo.

---

## Paso 5 — Deploy (puede esperar a la semana 3)

### Backend en Render
1. https://render.com → entrar con GitHub → **New → Web Service** → elegir el repo.
2. Configurar:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
3. **Environment**: cargar las mismas variables de `server/.env`. En `CLIENT_URL` va la URL de Vercel (paso siguiente).
4. Al terminar, la API queda en algo como `https://portfolio-api.onrender.com/api/health`.

### Frontend en Vercel
1. https://vercel.com → entrar con GitHub → **Add New → Project** → elegir el repo.
2. Configurar:
   - Root Directory: `client`
   - Framework: Vite (lo detecta solo)
3. **Environment Variables**: `VITE_API_URL` = URL de Render, sin `/api` y sin barra final.
4. **Deploy**. Cada merge a `main` vuelve a publicar solo, y cada PR genera un link de vista previa.

> El plan gratis de Render "duerme" el backend tras 15 minutos sin uso. El primer pedido tarda unos 50 segundos. Antes de exponer, abrir la API un rato antes.

---

## Paso 6 (opcional, lo puede hacer C) — Login con Google y emails

**Google:**
1. https://console.cloud.google.com → crear el proyecto "Portfolio".
2. **APIs y servicios → Pantalla de consentimiento** → Externo.
3. **Credenciales → Crear → ID de cliente OAuth → Aplicación web**.
4. Orígenes autorizados: `http://localhost:5173` y la URL de Vercel.
5. Copiar el Client ID a:
   - `GOOGLE_CLIENT_ID` en `server/.env`
   - `VITE_GOOGLE_CLIENT_ID` en `client/.env`
   - las variables de Render y Vercel

**Gmail (Nodemailer):**
1. Crear un Gmail para el proyecto y activar la verificación en 2 pasos.
2. https://myaccount.google.com/apppasswords → crear una contraseña de aplicación.
3. Cargar `MAIL_USER` (el Gmail) y `MAIL_PASS` (la contraseña de 16 letras) en `server/.env`.

Hasta que esto esté configurado, los emails se muestran en la consola del servidor en lugar de enviarse.
