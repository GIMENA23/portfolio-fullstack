// 🎨 DUEÑO: Integrante B
import { useReveal, GuardaTejida } from '../../animations'
import EncabezadoSeccion from '../EncabezadoSeccion.jsx'

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
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      },
      {
        name: 'JavaScript (ES6+)',
        role: 'Lenguaje principal',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      },
      {
        name: 'Bootstrap 5',
        role: 'Sistema de grillas y UI',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg',
      },
      {
        name: 'HTML5 & CSS3',
        role: 'Maquetación semántica',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
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
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      },
      {
        name: 'Express',
        role: 'Framework de API REST',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
      },
      {
        name: 'JWT & OAuth',
        role: 'Autenticación y sesiones',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/json/json-original.svg',
      },
      {
        name: 'REST API',
        role: 'Arquitectura cliente-servidor',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
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
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
      },
      {
        name: 'Mongoose',
        role: 'ODM y modelado de datos',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongoose/mongoose-original.svg',
      },
      {
        name: 'SQL / Relacional',
        role: 'Consultas estructuradas',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
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
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
      },
      {
        name: 'Vite',
        role: 'Bundler frontend ultrarrápido',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg',
      },
      {
        name: 'VS Code',
        role: 'Entorno de desarrollo',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
      },
      {
        name: 'Postman',
        role: 'Pruebas de endpoints API',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg',
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
