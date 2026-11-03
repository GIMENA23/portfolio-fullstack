// 🎨 DUEÑO: Integrante B
import { useReveal, GuardaTejida } from '../../animations'
import EncabezadoSeccion from '../EncabezadoSeccion.jsx'
import bootstrapLogo from '../../assets/stack/bootstrap.svg'
import expressLogo from '../../assets/stack/express.svg'
import fastapiLogo from '../../assets/stack/fastapi.svg'
import gitLogo from '../../assets/stack/git.svg'
import html5Logo from '../../assets/stack/html5.svg'
import javascriptLogo from '../../assets/stack/javascript.svg'
import jsonLogo from '../../assets/stack/json.svg'
import mongodbLogo from '../../assets/stack/mongodb.svg'
import mongooseLogo from '../../assets/stack/mongoose.svg'
import nodejsLogo from '../../assets/stack/nodejs.svg'
import postgresqlLogo from '../../assets/stack/postgresql.svg'
import postmanLogo from '../../assets/stack/postman.svg'
import reactLogo from '../../assets/stack/react.svg'
import vitejsLogo from '../../assets/stack/vitejs.svg'
import vscodeLogo from '../../assets/stack/vscode.svg'

const STACK_CATEGORIES = [
  {
    id: 'frontend',
    title: 'Frontend',
    badge: 'Interfaz & UX',
    description: 'Construcción de interfaces reactivas, accesibles y adaptables a cualquier pantalla.',
    items: [
      {
        name: 'React',
        role: 'Librería UI / SPA',
        icon: reactLogo,
      },
      {
        name: 'JavaScript (ES6+)',
        role: 'Lenguaje principal',
        icon: javascriptLogo,
      },
      {
        name: 'Bootstrap 5',
        role: 'Sistema de grillas y UI',
        icon: bootstrapLogo,
      },
      {
        name: 'HTML5 & CSS3',
        role: 'Maquetación semántica',
        icon: html5Logo,
      },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    badge: 'Servidor & Seguridad',
    description: 'Lógica de negocio, APIs RESTful, validación de datos y autenticación por roles.',
    items: [
      {
        name: 'Node.js',
        role: 'Entorno de ejecución',
        icon: nodejsLogo,
      },
      {
        name: 'Express',
        role: 'Framework de API REST',
        icon: expressLogo,
      },
      {
        name: 'JWT & OAuth',
        role: 'Autenticación y sesiones',
        icon: jsonLogo,
      },
      {
        name: 'REST API',
        role: 'Arquitectura cliente-servidor',
        icon: fastapiLogo,
      },
    ],
  },
  {
    id: 'database',
    title: 'Datos',
    badge: 'Persistencia & Modelado',
    description: 'Almacenamiento en la nube, esquemas validados y consultas optimizadas.',
    items: [
      {
        name: 'MongoDB Atlas',
        role: 'Base de datos NoSQL',
        icon: mongodbLogo,
      },
      {
        name: 'Mongoose',
        role: 'ODM y modelado de datos',
        icon: mongooseLogo,
      },
      {
        name: 'SQL / Relacional',
        role: 'Consultas estructuradas',
        icon: postgresqlLogo,
      },
    ],
  },
  {
    id: 'tools',
    title: 'Herramientas',
    badge: 'Flujo de trabajo & Deploy',
    description: 'Control de versiones colaborativo, empaquetado rápido y entorno de desarrollo.',
    items: [
      {
        name: 'Git & GitHub',
        role: 'Control de versiones',
        icon: gitLogo,
      },
      {
        name: 'Vite',
        role: 'Bundler frontend ultrarrápido',
        icon: vitejsLogo,
      },
      {
        name: 'VS Code',
        role: 'Entorno de desarrollo',
        icon: vscodeLogo,
      },
      {
        name: 'Postman',
        role: 'Pruebas de endpoints API',
        icon: postmanLogo,
      },
    ],
  },
]

export default function Stack() {
  const ref = useReveal()

  return (
    <section id="stack" ref={ref} className="sec-negra">
      <GuardaTejida fina />
      <div className="sec-inner d-flex flex-column gap-4">
        <div className="sec-cabecera" data-reveal>
          <EncabezadoSeccion num="02" rotulo="STACK · CON QUÉ TRABAJO" titulo="Herramientas de punta a punta" dorado />
          <p className="mb-0" style={{ maxWidth: '32em', color: 'var(--pc-noche-suave)', fontSize: '0.9375rem' }}>
            Las mismas tecnologías que se ven en las clases de Lenguajes IV, aplicadas a proyectos reales.
          </p>
        </div>

        <div className="row g-3">
          {STACK_CATEGORIES.map((cat) => (
            <div key={cat.id} className="col-12 col-sm-6 col-lg-3" data-reveal>
              <div className="celda-stack">
                <h3>{cat.title}</h3>
                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                  {cat.items.map((tech) => (
                    <li key={tech.name} className="chip-stack" title={tech.role}>
                      <img
                        src={tech.icon}
                        alt=""
                        width="20"
                        height="20"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      {tech.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
