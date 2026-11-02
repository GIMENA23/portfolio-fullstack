// 🎨 DUEÑO: Integrante B
import { useState } from 'react'
import { useReveal } from '../../animations'

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
    title: 'Bases de Datos',
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
  const revealRef = useReveal()
  const [activeTab, setActiveTab] = useState('all')

  const visibleCategories =
    activeTab === 'all'
      ? STACK_CATEGORIES
      : STACK_CATEGORIES.filter((cat) => cat.id === activeTab)

  return (
    <section id="stack" ref={revealRef} className="container py-5">
      {/* Encabezado de la sección */}
      <div className="text-center mb-4">
        <span className="badge rounded-pill text-bg-light border px-3 py-2 mb-2 text-secondary">
          Arquitectura MERN
        </span>
        <h2 className="fw-bold mb-2">Tecnologías del Stack Fullstack</h2>
        <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '640px' }}>
          Herramientas y lenguajes utilizados para diseñar, construir y desplegar aplicaciones modernas de extremo a extremo.
        </p>

        {/* Botones de filtro por área */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`btn btn-sm rounded-pill px-3 ${
              activeTab === 'all' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
            }`}
          >
            Todo el stack
          </button>
          {STACK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`btn btn-sm rounded-pill px-3 ${
                activeTab === cat.id ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de categorías y tecnologías */}
      <div className="row g-4">
        {visibleCategories.map((category) => (
          <div
            key={category.id}
            className={activeTab === 'all' ? 'col-12 col-lg-6' : 'col-12'}
          >
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="h5 fw-bold mb-0">{category.title}</h3>
                  <span className="badge rounded-pill text-bg-light border text-secondary">
                    {category.badge}
                  </span>
                </div>

                <p className="text-secondary small mb-4">{category.description}</p>

                <div className="row g-3">
                  {category.items.map((tech) => (
                    <div key={tech.name} className="col-12 col-sm-6">
                      <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light border h-100">
                        <img
                          src={tech.icon}
                          alt={tech.name}
                          width="36"
                          height="36"
                          loading="lazy"
                          style={{ objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div>
                          <div className="fw-semibold small text-body">
                            {tech.name}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: '0.78rem' }}
                          >
                            {tech.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}