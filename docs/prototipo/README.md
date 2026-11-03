# Prototipo arce.dev (fuente de diseño)

Estas son las pantallas del prototipo navegable hecho en Claude Design (lienzo «Pantallas arce.dev»).
Son la **referencia oficial** de diseño: textos, orden de secciones, tamaños, colores, espaciados y animaciones.

## Cómo leerlas
- Cada `*.dc.html` es una pantalla. El diseño está en el HTML con **estilos en línea** (`style="…"`): de ahí salen tamaños de letra, márgenes, anchos máximos y colores exactos.
- `{{algo}}` son huecos de datos/estado; la lógica está al final, en `<script type="text/x-dc">` (`renderVals()`), útil para ver datos de ejemplo y validaciones.
- `<sc-for>` repite un bloque por cada elemento; `<sc-if>` muestra un bloque según una condición.
- Las animaciones están en `<helmet><style>`: `.w` (palabras del título que suben), `.weave` (la guarda que se teje con clip-path), `.in` (aparición), `.pop`.
- Los colores en #HEX del prototipo equivalen a las variables `--pc-*` de `client/src/styles/theme.css`. En el código **no** se escriben #HEX: se usan las variables o las clases del tema.

## Qué archivo corresponde a qué página
| Página del sitio | Prototipo |
|---|---|
| `/` Inicio | `Main.dc.html` (escritorio), `Movil.dc.html` (celular), `InicioNoche.dc.html` (modo noche) |
| `/proyectos` | `Proyectos.dc.html`, `ProyectosMovil.dc.html` |
| `/proyectos/:id` | `Detalle.dc.html` |
| `/servicios` | `Servicios.dc.html` |
| `/contacto` | `Contacto.dc.html`, `ContactoMovil.dc.html` |
| `/login`, `/registro`, `/recuperar` | `Login.dc.html`, `Registro.dc.html`, `Recuperar.dc.html` |
| `/cuenta` | `Cuenta.dc.html` |
| 404 | `NoEncontrada.dc.html` |
| `/admin` | `Dashboard.dc.html`, `ProyectosAdmin.dc.html`, `ServiciosAdmin.dc.html`, `Usuarios.dc.html`, `Perfil.dc.html` |
| `/operador` | `Bandeja.dc.html`, `BandejaMovil.dc.html` |
| Emails | `EmailConfirmacion.dc.html`, `EmailRespuesta.dc.html` |

`*Usuario.dc.html` son las mismas páginas con sesión iniciada (solo cambia la navbar).
