# Revisión de seguridad del server/

Revisión del 27/10/2026. Se miró cada ruta de la API con la mentalidad de quien quiere romperla y se escribieron pruebas de ataque ([test/security.test.js](test/security.test.js) y [test/security-limits.test.js](test/security-limits.test.js)). Cada hallazgo se reprodujo con una prueba que fallaba **antes** del arreglo y pasa ahora.

**Resultado:** 16 hallazgos corregidos (2 altos, 7 medios, 7 bajos) y 8 riesgos que quedan por decisión del equipo (abajo). `npm audit` da 0 vulnerabilidades, en producción y en desarrollo. Los tests pasan: 248.

## Hallazgos corregidos

| # | Gravedad | Qué se podía hacer | Arreglo |
| --- | --- | --- | --- |
| 1 | Alta | Cambiar o recuperar la contraseña **no cerraba las sesiones abiertas**: un token robado seguía valiendo hasta 7 días. | Cada usuario tiene una versión de sesiones (`tokenVersion`) y el token lleva la versión con la que se emitió. Cambiar o recuperar la contraseña la sube, y los tokens anteriores dejan de valer. `POST /api/auth/password` devuelve un `token` nuevo para que quien la cambió siga con su sesión. |
| 2 | Alta (parcial) | **Secuestro de cuenta previo.** El registro no verifica el email: alguien registra `victima@gmail.com` con su propia clave y, cuando la víctima entra con Google, el servidor vinculaba la cuenta y la sesión del atacante seguía abierta. | Al vincular Google se **cierran las sesiones abiertas** y se anula un enlace de recuperación pendiente. **La contraseña ya no se borra** (decisión del equipo: las dos formas de entrar conviven, como en Mi cuenta → Seguridad del prototipo); lo que queda abierto es el riesgo 2 de abajo. |
| 3 | Media | **El bloqueo de login se salteaba con pedidos en paralelo:** 40 pedidos a la vez probaban las 40 contraseñas (el tope es 5). | El intento se anota **antes** de revisar la contraseña, así los pedidos simultáneos se cuentan entre sí. |
| 4 | Media | Cualquiera, conociendo el email del admin (está en el repositorio), podía **bloquearlo 15 minutos a voluntad**, por ejemplo en plena demo. | El bloqueo de 5 intentos es por **cuenta + IP**: quien falla desde su conexión no deja afuera al dueño. Para que repartir intentos entre muchas IPs no dé intentos ilimitados, 50 fallos en total bloquean la cuenta para todos. |
| 5 | Media | Sin límites por IP en registro, login, Google, recuperar y reset, ni un tope general. | Registro 20 por hora; login 20 fallos por 15 minutos (los logins correctos no cuentan, así una clase entera puede entrar desde la misma IP); Google 30 por 15 minutos; recuperar 10 por hora; reset 20 por hora; y 300 pedidos por minuto por IP en toda la API. |
| 6 | Media | **El formulario de contacto servía para mandar emails a un tercero:** cada consulta le manda una confirmación al email que ella misma trae, con texto a elección. | Máximo 3 confirmaciones por hora por email destinatario, desde cualquier IP. |
| 7 | Media | `forgot` tardaba más cuando el email **existía** (esperaba al servidor de emails): ese tiempo delataba qué emails tienen cuenta. | El email se manda en segundo plano; la respuesta tarda igual exista o no la cuenta. |
| 8 | Media | `kind=__proto__` o `kind=constructor` en la subida de archivos daba un **error 500**. | Se busca la clave con `Object.hasOwn`. |
| 9 | Media | **Denegación de servicio:** 90 KB de `<` en cualquier texto bloqueaban el servidor **más de 2 segundos por pedido** (la expresión que quita etiquetas HTML era cuadrática). Un solo cliente lo mantenía ocupado siempre. | Reemplazada por una versión lineal con el mismo resultado (probado contra la expresión original con 3000 combinaciones): de 7 segundos a milisegundos. |
| 10 | Baja | Una cuenta vinculada a una cuenta de Google entraba con **otra** cuenta de Google que tuviera el mismo email (por ejemplo, un email que la empresa reasigna a otra persona). | Si la cuenta ya tiene otro `googleId`, responde 403. Se busca primero por `googleId` y después por email. |
| 11 | Baja | El email aceptaba `a@x.com,b.com` (varios destinatarios), comillas, paréntesis, `<>` y más de 254 caracteres. | Formato más estricto en todo el servidor y largo máximo de 254. |
| 12 | Baja | Los tokens se aceptaban firmados con HS384 y HS512, no solo con el algoritmo que usamos. | Se fija HS256 al firmar y al verificar. |
| 13 | Baja | Una URL mal codificada (`/api/projects/%`) daba un error 500. | Los errores 4xx propios de Express responden 4xx (`pedido_invalido`). |
| 14 | Baja | Las respuestas de la API no decían que no se guarden en una caché. | `Cache-Control: no-store` en todo `/api`. |
| 15 | Baja | En producción sin `MAIL_USER` y `MAIL_PASS`, el servidor **mostraba el cuerpo de los emails en el registro** (incluidos los enlaces de recuperación, que dan acceso a una cuenta) y respondía «enviado» sin haber enviado nada. | En producción no se simula: el envío falla (`emailSent: false`, o 502 al responder una consulta) y no queda nada en el registro. |
| 16 | Baja | Cada subida se lee entera en memoria (hasta 10 MB): unas decenas simultáneas desde distintas IPs agotaban la memoria del plan gratuito. | Tope de lectura de 5 MB. |

## Lo que se probó y estaba bien

- **Control de acceso:** las 28 rutas protegidas, con anónimo, usuario, operador y admin: nadie hace lo que su rol no permite, y cuando se rechaza no se modifica nada. Un usuario no ve las consultas de otro ni sabiendo el id, y un borrador de proyecto es 404 para quien no es admin.
- **Tokens:** sin firma (`alg: none` en cualquier mayúscula), firmados con otra clave, vencidos, con un `sub` falso o como operador de Mongo, de una cuenta desactivada o borrada.
- **Inyección de operadores de Mongo** (`{"$ne": null}` y parecidos) en login, registro, recuperar, reset, filtros de listados, visitas, usuarios y consultas. Express 5 tampoco arma objetos desde la URL (`?rol[$ne]=x` se ignora).
- **Asignación masiva:** registrarse con `role: "admin"`, fijar `loginCount`, `googleId`, `_id`, `createdAt`; crear una consulta ya cerrada, con respuestas o a nombre de otro usuario; un `__proto__` en el cuerpo. Todo se ignora y no contamina los objetos del servidor.
- **Fuga de datos:** ninguna respuesta de la API (listados, detalles, estadísticas, «mi cuenta») incluye hashes, tokens de recuperación, `googleId` ni variables de entorno. Un error interno responde un mensaje genérico, sin rutas ni cadenas de conexión.
- **Archivos:** SVG con scripts, HTML disfrazado de imagen, ejecutables, GIF, ZIP, archivos vacíos o con la cabecera cortada: todos rechazados porque se mira el contenido, no la extensión.
- **Emails:** todo texto que escribe una persona se escapa en el HTML; nada del asunto o del nombre puede inyectar encabezados; los enlaces usan `CLIENT_URL` y no el encabezado `Host`.
- **CORS:** un sitio ajeno no recibe permiso, y el comodín de las previsualizaciones de Vercel no cruza puntos.
- **Dependencias** (`npm audit`) y **secretos:** 0 vulnerabilidades; el `.env` está en `.gitignore` y el repositorio solo tiene `.env.example`.

## Riesgos que quedan (decisiones del equipo)

1. **El token vive en `localStorage` del navegador** (así lo definió el plan). Si el cliente tiene una falla de XSS, se lo pueden robar. Para B: no usar `dangerouslySetInnerHTML`, y en Vercel agregar un `Content-Security-Policy` en `client/vercel.json`. La alternativa, cookies `httpOnly`, cambiaría cómo habla el cliente con la API.
2. **El registro no verifica el email.** Se pueden crear cuentas con emails de otras personas. El ataque de las sesiones robadas (hallazgo 1) está cerrado, pero el del hallazgo 2 queda a medias: si alguien registra `victima@gmail.com` con su clave y la víctima después entra con Google, la cuenta se vincula y **la clave del atacante sigue sirviendo**, porque vincular Google ya no borra la contraseña. La víctima la puede cambiar desde Mi cuenta, pero no se entera. Se cierra de verdad verificando el email al registrarse (email de confirmación y estado «sin verificar»); mientras tanto, alcanza con que el proyecto no tenga datos sensibles.
3. **El bloqueo por IP depende de `TRUST_PROXY`.** Si Render tiene más proxies de los que se confía, todos los visitantes parecen la misma IP. El paso 8 de [DEPLOY.md](DEPLOY.md) lo comprueba.
4. **Los límites de pedidos viven en la memoria del proceso:** se reinician con cada deploy y cuando Render duerme el servicio. Para este trabajo alcanza. A mayor escala harían falta un almacén compartido (Redis). El bloqueo de logins sí se guarda en la base.
5. **Contraseñas:** mínimo de 8 con mayúscula, minúscula y número; sin lista de contraseñas comunes ni segundo factor. `bcrypt` con costo 10: subirlo a 12 haría cada login unas 4 veces más lento en el procesador del plan gratuito, y ahí también se abre la puerta a saturarlo.
6. **`admin@portfolio.test` es un administrador con email público.** El bloqueo por IP lo protege de la fuerza bruta, pero conviene cambiar la contraseña (volver a correr el seed con otra `SEED_PASSWORD`) o desactivar la cuenta cuando termine la evaluación.
7. **«Eliminar mi cuenta» pide escribir `ELIMINAR`, no la contraseña:** quien robe una sesión puede borrar la cuenta. Es el flujo del prototipo.
8. **Al eliminar una cuenta, sus consultas se anonimizan, no se borran:** quedan el asunto y el mensaje (pueden contener datos personales que la persona escribió) y, si había un adjunto, el archivo sigue en Cloudinary aunque la consulta ya no lo muestre. Se decidió así para no alterar la bandeja del operador ni las estadísticas.

## Cómo repetir la revisión

```bash
npm test          # incluye test/security.test.js y test/security-limits.test.js
npm audit
```

Cada test de seguridad describe el comportamiento **seguro**: si alguno falla, es un hallazgo.
