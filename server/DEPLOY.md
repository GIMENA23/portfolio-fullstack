# Deploy del server/ en Render

Guía paso a paso para publicar la API. El sistema son cuatro piezas, y el orden importa:

```
Navegador ──► Vercel (client/) ──► Render (server/) ──► MongoDB Atlas
                                        ├──► Cloudinary   (imágenes y adjuntos)
                                        └──► servicio SMTP (emails)
```

Los datos de Render de esta guía se verificaron en su documentación el 26/10/2026. Lo que no pude comprobar está marcado con **(verificá)**.

## Lo que tenés que saber antes de empezar

| Tema | Qué pasa en el plan gratuito de Render | Qué hacemos |
| --- | --- | --- |
| **Emails** | Render **bloquea la salida por los puertos 25, 465 y 587**. Gmail SMTP usa el 465 o el 587, así que **no funciona**. | Usar un servicio SMTP con el puerto **2525** (paso 3). Gmail queda solo para desarrollo en tu PC. |
| **Servidor dormido** | Se apaga tras 15 minutos sin tráfico y tarda **cerca de 1 minuto** en despertar. | Despertarlo antes de la demo o usar un monitor (paso 11). |
| **Horas** | 750 horas gratis por mes por workspace: alcanzan para **un** servicio 24/7. | No dejar dos servicios gratuitos prendidos todo el mes. |
| **Archivos** | El disco se borra en cada reinicio. | Todo archivo va a Cloudinary (ya es así). |
| **Shell** | No hay Shell ni SSH. | El seed se corre **desde tu PC** contra Atlas (paso 6). |
| **Cuenta** | No hace falta tarjeta para crear el servicio. | — |

## Variables de entorno

Se cargan en Render (**Environment**). `PORT` no hace falta: Render lo define.

| Variable | Valor en Render | De dónde sale |
| --- | --- | --- |
| `NODE_ENV` | `production` | Fijo. Activa las validaciones de producción. |
| `MONGODB_URI` | `mongodb+srv://USUARIO:CLAVE@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority` | Atlas (paso 1). |
| `JWT_SECRET` | 96 caracteres al azar | Generala (comando abajo). **Mínimo 32**: si es más corta el servidor no arranca. |
| `CLIENT_URL` | `https://tu-app.vercel.app` | Vercel (paso 9). Sin barra final y sin ruta. |
| `MAIL_HOST` | `smtp-relay.brevo.com` **(verificá)** | Panel de tu servicio SMTP. |
| `MAIL_PORT` | `2525` | Fijo: Render no bloquea este puerto. |
| `MAIL_USER` | usuario SMTP | Panel del servicio SMTP. |
| `MAIL_PASS` | clave SMTP | Panel del servicio SMTP. Es una *clave SMTP*, no la clave de la API. |
| `MAIL_FROM` | email remitente verificado | El que validaste en el servicio SMTP. |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` | Panel de Cloudinary (paso 2). |
| `GOOGLE_CLIENT_ID` | `1234-abc.apps.googleusercontent.com` | Google Cloud Console (paso 4). |
| `TRUST_PROXY` | `1` | Opcional (es el valor por defecto). Ver el paso 8. |

**No** cargues `SEED_PASSWORD` en Render: el seed se corre desde tu PC.

Para generar el `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Checklist

### 1. MongoDB Atlas

- [ ] Cluster gratuito (M0) creado.
- [ ] **Database Access:** un usuario con contraseña larga. Si la contraseña tiene caracteres especiales (`@`, `/`, `:`, `#`), codificalos en la URL (`@` → `%40`) o usá una contraseña solo con letras y números.
- [ ] **Network Access:** agregar `0.0.0.0/0` (permitir desde cualquier lugar). Render gratis no tiene una IP fija, así que no se puede restringir. Por eso la contraseña de la base tiene que ser fuerte.
- [ ] Copiar la cadena de conexión (**Connect → Drivers**) y ponerle el nombre de la base antes del `?`: `.../portfolio?retryWrites=...`.

### 2. Cloudinary

- [ ] Cuenta gratuita creada.
- [ ] Copiar la **API Environment variable** (empieza con `cloudinary://`) desde el panel. Es el valor de `CLOUDINARY_URL`.

### 3. Servicio de emails (SMTP por el puerto 2525)

Gmail no sirve en Render gratis. Brevo ofrece el puerto 2525 y un plan gratuito; su página oficial lista los puertos 587, 2525 y 465 y aclara que para SMTP se usa una *SMTP key*, no una API key. Otros servicios con puerto 2525 también sirven.

- [ ] Crear la cuenta y **validar un remitente** (un email tuyo). Ese es el valor de `MAIL_FROM`.
- [ ] En **SMTP & API → SMTP**, generar una clave SMTP. Anotar el servidor, el usuario y la clave.
- [ ] **(verificá)** El nombre del servidor SMTP, el límite diario del plan gratuito (recuerdo unos 300 emails por día) y que el remitente se pueda usar sin dominio propio. No pude leerlo en su documentación.
- [ ] Los emails pueden caer en la carpeta de spam si el remitente no tiene un dominio verificado. Para la demo, avisale a la profesora que revise spam.

### 4. Google (login con Google)

- [ ] En Google Cloud Console, crear un **OAuth Client ID** de tipo *Web application*.
- [ ] En **Authorized JavaScript origins** poner `http://localhost:5173` y, cuando exista, la URL de Vercel (paso 9).
- [ ] Copiar el Client ID: va en `GOOGLE_CLIENT_ID` (Render) y en `VITE_GOOGLE_CLIENT_ID` (Vercel).

### 5. Crear el servicio en Render

**New → Web Service** y conectar el repositorio de GitHub.

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| **Root Directory** | `server` |
| Language | Node |
| **Build Command** | `npm ci --omit=dev` |
| **Start Command** | `npm start` |
| Instance Type | Free |
| **Health Check Path** (en *Advanced*) | `/api/health` |
| Auto-Deploy | Yes |

- [ ] Los valores de arriba cargados. El **Build Command** importa: sin `--omit=dev` se instalarían las herramientas de test, que bajan un binario de MongoDB de cientos de MB.
- [ ] Todas las variables de la tabla de arriba cargadas. En `CLIENT_URL` poné por ahora `http://localhost:5173`; la cambiás en el paso 9.
- [ ] El deploy termina en verde y los logs muestran `MongoDB conectado` y `API escuchando`.
- [ ] Anotar la URL: `https://TU-SERVICIO.onrender.com`.
- [ ] La versión de Node sale del campo `engines` del `package.json` (`>=20.6 <25`). Render recomienda tener un límite superior, y ya lo tiene.

Si el log dice `Faltan variables de entorno` o `JWT_SECRET es muy corta`, el servidor se negó a arrancar a propósito: corregí la variable y redeployá. Si dice `No se pudo conectar a MongoDB`, revisá el paso 1.

Opcional: en **Settings → Build Filters** poné `server/**` para que un cambio en `client/` no redeploye la API.

### 6. Cargar los datos de prueba (desde tu PC)

El seed **borra todo** lo que haya en la base y la deja con los datos de la demo. Contra una base que no es local pide una contraseña propia y un `--yes` (para que no se corra por accidente).

PowerShell:

```powershell
$env:MONGODB_URI = "mongodb+srv://USUARIO:CLAVE@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority"
$env:SEED_PASSWORD = "una-clave-larga-y-propia"
npm run seed -- --yes
```

Bash:

```bash
MONGODB_URI="mongodb+srv://..." SEED_PASSWORD="una-clave-larga-y-propia" npm run seed -- --yes
```

- [ ] El resumen muestra 40 usuarios, 6 proyectos, 4 servicios y 30 consultas.
- [ ] Anotar la contraseña: es la de `admin@portfolio.test`, `operador@portfolio.test` y `usuario@portfolio.test`. Se la das a la profesora **por fuera del repositorio**.

### 7. Probar la API desplegada

PowerShell:

```powershell
$env:API_URL = "https://TU-SERVICIO.onrender.com"; $env:ADMIN_PASSWORD = "la-clave-del-seed"
npm run smoke
```

Bash:

```bash
API_URL=https://TU-SERVICIO.onrender.com ADMIN_PASSWORD=la-clave-del-seed npm run smoke
```

- [ ] Todas las líneas con ✔ (la primera puede tardar cerca de 1 minuto si el servidor dormía). Sin `CLIENT_ORIGIN`, la prueba de CORS se omite: se hace en el paso 10.

### 8. Los límites de intentos y la IP de los visitantes

Los límites (5 consultas por hora, el bloqueo de 5 logins fallidos por cuenta y conexión, el tope de 300 pedidos por minuto, etc.) cuentan por IP: están descritos en [SECURITY.md](SECURITY.md). Render pone un proxy delante del servidor y `TRUST_PROXY=1` le dice a Express cuántos saltos confiar. No pude comprobar en su documentación cuántos proxies hay, así que se verifica probando **(verificá)**:

- [ ] Desde tu PC, mandar 6 consultas seguidas desde el formulario de contacto: la 6.ª tiene que responder el error «Enviaste varias consultas seguidas».
- [ ] Enseguida, mandar una desde tu celular **con datos móviles** (otra red): tiene que funcionar.
- [ ] Si el celular también recibe el error, el servidor ve la misma IP para todos: poné `TRUST_PROXY=2` en Render y repetí. Esto importa también para el bloqueo de login: con una sola IP para todos, alguien que falle 5 veces con el email del admin dejaría afuera a todo el mundo.
- [ ] Al terminar las pruebas, volvé a correr el seed (paso 6) para dejar la base limpia: las consultas de prueba no se pueden borrar desde el panel.

### 9. Vercel (con B)

- [ ] **Root Directory:** `client`. Framework: Vite.
- [ ] Variables de entorno: `VITE_API_URL` = `https://TU-SERVICIO.onrender.com` (sin `/api` ni barra final: el cliente agrega `/api`; confirmalo con B) y `VITE_GOOGLE_CLIENT_ID`.
- [ ] Un archivo `client/vercel.json` para que React Router funcione al recargar o abrir un enlace directo (sin esto, `/recuperar?token=…`, que es el enlace del email de recuperación, da 404):

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- [ ] Anotar la URL de producción: `https://TU-APP.vercel.app`.
- [ ] Volver a Render → **Environment** y poner `CLIENT_URL=https://TU-APP.vercel.app`. Render reinicia solo.
- [ ] En Google Cloud, sumar `https://TU-APP.vercel.app` a *Authorized JavaScript origins* (paso 4).

### 10. CORS con Vercel

La API solo acepta pedidos del navegador desde las URLs de `CLIENT_URL` (varias, separadas por coma, sin barra final ni ruta). La **primera** se usa también en los enlaces de los emails y no puede llevar `*`.

| Situación | `CLIENT_URL` |
| --- | --- |
| Solo producción | `https://tu-app.vercel.app` |
| Producción y local | `https://tu-app.vercel.app,http://localhost:5173` |
| Producción y previsualizaciones de Vercel | `https://tu-app.vercel.app,https://tu-app-*-tu-equipo.vercel.app` |

En el comodín, el `*` reemplaza **un** tramo del nombre (letras, números y guiones, sin puntos). Vercel arma las previsualizaciones como `tu-app-<hash>-<equipo>.vercel.app` y `tu-app-git-<rama>-<equipo>.vercel.app`: las dos entran. Nunca pongas `https://*.vercel.app`, que dejaría entrar a cualquier proyecto de Vercel.

- [ ] Probar el permiso (tiene que aparecer `access-control-allow-origin` con tu URL):

```bash
curl -i -X OPTIONS https://TU-SERVICIO.onrender.com/api/auth/login \
  -H "Origin: https://TU-APP.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
```

- [ ] O, más cómodo, correr el paso 7 agregando el origen (`$env:CLIENT_ORIGIN = "https://TU-APP.vercel.app"` en PowerShell, o `CLIENT_ORIGIN=https://TU-APP.vercel.app` antes del comando en Bash). Con una previsualización de Vercel, probá con su URL.

### 11. Mantener el servidor despierto

- [ ] **Opción 1, sin automatizar:** abrir `https://TU-SERVICIO.onrender.com/api/health` unos 5 minutos antes de la demo y esperar el `{"ok":true…}`.
- [ ] **Opción 2, un monitor** (UptimeRobot, cron-job.org u otro gratuito) que pida `/api/health` cada 5 a 10 minutos, **solo durante el período de exposición** (26/10 al 13/11): 750 horas alcanzan para un servicio todo el mes, pero no para dos.

### 12. Prueba completa antes de entregar

Lo que `smoke` no cubre, a mano en el sitio publicado:

- [ ] Registrarse con un email nuevo e iniciar sesión.
- [ ] Iniciar sesión con Google.
- [ ] Ver el detalle de un proyecto con sesión, y que sin sesión pida registrarse.
- [ ] Enviar una consulta de cotización con un adjunto: llega el email de confirmación (revisá spam).
- [ ] Entrar como operador, responder: llega el email de respuesta, y la consulta aparece en «Mi cuenta» de quien la envió con sesión.
- [ ] Entrar como admin: crear un proyecto con imagen (se ve la imagen), cambiar un servicio de lugar, desactivar y reactivar un usuario, ver el dashboard con números.
- [ ] «Olvidé mi contraseña»: llega el email y el enlace abre la pantalla de nueva contraseña.
- [ ] Volver a correr el seed (paso 6) para dejar la base como la demo espera.

### Día de la exposición

- [ ] 10 minutos antes: abrir `/api/health` y correr `npm run smoke` (paso 7).
- [ ] La contraseña de las cuentas de prueba a mano.
- [ ] Plan B: el proyecto corriendo en `localhost` y el video de la demo, por si falla internet.

## Problemas frecuentes

| Qué ves | Causa probable | Qué hacer |
| --- | --- | --- |
| En el navegador: *blocked by CORS policy* | `CLIENT_URL` no coincide exactamente con la URL del cliente (`http` en vez de `https`, una ruta o un subdominio distinto). | Corregirla en Render y probar con el `curl` del paso 10. |
| La primera carga tarda cerca de un minuto | El servidor estaba dormido (plan gratuito). | Paso 11. |
| `No se pudo conectar a MongoDB` en los logs | `MONGODB_URI` mal escrita, contraseña con caracteres sin codificar, o Network Access sin `0.0.0.0/0`. | Paso 1. |
| `almacenamiento_no_configurado` (503) al subir | Falta `CLOUDINARY_URL` en Render. | Paso 2. |
| La consulta se guarda pero no llega el email (`emailSent: false`) | Puerto SMTP bloqueado (587/465), clave o remitente mal, o el remitente no está verificado. | Mirar los logs (`No se pudo enviar…`). Usar `MAIL_PORT=2525` y revisar el paso 3. |
| La consulta se guarda con `emailSent: false` y los logs dicen que falta configurar el envío | En producción, sin `MAIL_USER` y `MAIL_PASS` el servidor no simula emails: falla a propósito. | Cargar las variables de email (paso 3). |
| Los emails llegan a spam | Remitente sin dominio verificado. | Avisar que revisen spam. |
| Todos reciben el error «demasiados intentos» | El servidor ve una sola IP para todos. | `TRUST_PROXY=2` (paso 8). |
| El enlace del email lleva a `localhost` | La primera URL de `CLIENT_URL` es la de desarrollo. | Ponerla primero, con la URL de Vercel. |
| `/recuperar?token=…` o recargar `/proyectos/123` da 404 | Falta el `vercel.json` del paso 9. | Agregarlo en `client/`. |
| Google: `origin_mismatch` o login 503 | Falta la URL de Vercel en *Authorized JavaScript origins*, o falta `GOOGLE_CLIENT_ID`. | Paso 4. |
| El deploy falla antes de arrancar con `Faltan variables de entorno` | A propósito: el servidor no arranca mal configurado. | Cargar la variable que nombra el mensaje. |

## Seguridad

- El `.env` no se sube nunca al repositorio. Si una clave se filtra, cambiala en su servicio: contraseña de Atlas, `JWT_SECRET` (cierra todas las sesiones), clave de Cloudinary o clave SMTP.
- La base de Atlas queda abierta a cualquier IP: depende de la contraseña del usuario de la base. Que sea larga.
- `admin@portfolio.test` da acceso total al backend público. Cambiá la contraseña (volviendo a correr el seed con otra `SEED_PASSWORD`) o desactivá la cuenta cuando termine la evaluación.
