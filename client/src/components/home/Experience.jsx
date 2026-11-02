// 🎨 DUEÑO: Integrante B
import { useEffect, useState } from 'react'
import { useReveal } from '../../animations'

// Cambiá este usuario por tu usuario real de GitHub o el del equipo
const DEFAULT_GITHUB_USER = 'octocat'

const TIMELINE = [
  {
    id: 1,
    period: '2025 — Presente',
    role: 'Desarrollador Fullstack Freelance',
    place: 'Proyectos Independientes',
    type: 'Trabajo',
    description:
      'Diseño y desarrollo de aplicaciones web completas utilizando el stack MERN (MongoDB, Express, React y Node.js), autenticación JWT y despliegue en la nube.',
    tags: ['React', 'Node.js', 'MongoDB', 'Bootstrap 5'],
  },
  {
    id: 2,
    period: '2024 — 2025',
    role: 'Desarrollador Frontend',
    place: 'Prácticas Académicas & Colaborativas',
    type: 'Trabajo',
    description:
      'Construcción de interfaces responsivas, consumo de APIs REST, validación de formularios y optimización de experiencia de usuario.',
    tags: ['JavaScript', 'React Router', 'CSS3', 'Git'],
  },
  {
    id: 3,
    period: 'En curso',
    role: 'Formación Universitaria en Informática / Sistemas',
    place: 'Universidad Católica de Salta (UCASAL)',
    type: 'Estudio',
    description:
      'Especialización en ingeniería de software, arquitectura cliente-servidor, bases de datos y programación web avanzada (Lenguajes IV).',
    tags: ['Arquitectura Web', 'Bases de Datos', 'Ingeniería de Software'],
  },
]

const FALLBACK_REPOS = [
  {
    id: 'fallback-1',
    name: 'portfolio-fullstack-mern',
    description:
      'Aplicación web fullstack con React, Express y MongoDB, panel administrativo y autenticación por roles.',
    html_url: 'https://github.com',
    language: 'JavaScript',
    stargazers_count: 12,
    forks_count: 3,
  },
  {
    id: 'fallback-2',
    name: 'rest-api-nodejs-jwt',
    description:
      'Servidor backend con Express, validación estricta de datos, seguridad con JWT y arquitectura modular.',
    html_url: 'https://github.com',
    language: 'JavaScript',
    stargazers_count: 8,
    forks_count: 2,
  },
  {
    id: 'fallback-3',
    name: 'ui-components-react',
    description:
      'Colección de componentes reutilizables en React con soporte responsive en Bootstrap 5 y animaciones.',
    html_url: 'https://github.com',
    language: 'JSX',
    stargazers_count: 6,
    forks_count: 1,
  },
]

export default function Experience() {
  const revealRef = useReveal()

  const [username, setUsername] = useState(DEFAULT_GITHUB_USER)
  const [inputUser, setInputUser] = useState(DEFAULT_GITHUB_USER)
  const [repos, setRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoadingRepos(true)
    setUsingFallback(false)

    fetch(
      `https://api.github.com/users/${encodeURIComponent(
        username
      )}/repos?sort=updated&per_page=4`
    )
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo obtener el perfil de GitHub')
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data) && data.length > 0) {
          setRepos(data.slice(0, 4))
        } else {
          setRepos(FALLBACK_REPOS)
          setUsingFallback(true)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setRepos(FALLBACK_REPOS)
        setUsingFallback(true)
      })
      .finally(() => {
        if (isMounted) setLoadingRepos(false)
      })

    return () => {
      isMounted = false
    }
  }, [username])

  const handleUserSearch = (e) => {
    e.preventDefault()
    const clean = inputUser.trim()
    if (clean) setUsername(clean)
  }

  return (
    <section id="experience" ref={revealRef} className="container py-5">
      {/* Encabezado de la sección */}
      <div className="text-center mb-5">
        <span className="badge rounded-pill text-bg-light border px-3 py-2 mb-2 text-secondary">
          Trayectoria & Código
        </span>
        <h2 className="fw-bold mb-2">Experiencia y Formación</h2>
        <p className="text-secondary mb-0 mx-auto" style={{ maxWidth: '640px' }}>
          Recorrido académico y profesional junto con actividad reciente obtenida directamente desde la API pública de GitHub.
        </p>
      </div>

      <div className="row g-5">
        {/* Columna izquierda: Línea de tiempo */}
        <div className="col-lg-7">
          <h3 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
            <span>📌</span> Línea de tiempo
          </h3>

          <div className="position-relative ps-4 border-start border-2 border-primary-subtle">
            {TIMELINE.map((item, idx) => (
              <div
                key={item.id}
                className={`position-relative ${
                  idx !== TIMELINE.length - 1 ? 'mb-4' : ''
                }`}
              >
                {/* Punto indicador en la línea */}
                <span
                  className="position-absolute top-0 start-0 translate-middle rounded-circle border border-2 border-white shadow-sm"
                  style={{
                    width: '14px',
                    height: '14px',
                    marginLeft: '-1.5rem',
                    marginTop: '1.25rem',
                    backgroundColor: 'var(--color-primary, #0d6efd)',
                  }}
                />

                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                      <span className="badge rounded-pill text-bg-light border text-secondary">
                        {item.period}
                      </span>
                      <span
                        className={`badge rounded-pill ${
                          item.type === 'Trabajo'
                            ? 'text-bg-primary'
                            : 'text-bg-secondary'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <h4 className="h5 fw-bold mb-1">{item.role}</h4>
                    <p className="text-primary small fw-medium mb-2">
                      {item.place}
                    </p>
                    <p className="text-secondary small mb-3">
                      {item.description}
                    </p>

                    <div className="d-flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge text-bg-light border fw-normal text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: Repositorios reales desde GitHub API */}
        <div className="col-lg-5">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h3 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
              <span>💻</span> Repositorios en GitHub
            </h3>
            <span className="badge text-bg-light border text-muted">
              GitHub REST API
            </span>
          </div>

          {/* Buscador de usuario de GitHub en vivo */}
          <form onSubmit={handleUserSearch} className="mb-3">
            <div className="input-group input-group-sm shadow-sm">
              <span className="input-group-text bg-white text-muted">@</span>
              <input
                type="text"
                className="form-control"
                placeholder="Usuario de GitHub..."
                value={inputUser}
                onChange={(e) => setInputUser(e.target.value)}
                aria-label="Usuario de GitHub"
              />
              <button type="submit" className="btn btn-outline-primary">
                Cargar
              </button>
            </div>
          </form>

          {usingFallback && (
            <div className="alert alert-light border small py-2 mb-3 text-secondary">
              Mostrando repositorios destacados del equipo. Podés ingresar cualquier usuario válido de GitHub arriba.
            </div>
          )}

          {loadingRepos ? (
            <div className="card border-0 shadow-sm p-4 text-center text-muted">
              <div className="spinner-border spinner-border-sm text-primary mx-auto mb-2" role="status" />
              <small>Consultando API de GitHub…</small>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="card border-0 shadow-sm text-decoration-none text-reset"
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <h4 className="h6 fw-bold text-primary mb-0 text-break">
                        {repo.name}
                      </h4>
                      <span className="badge rounded-pill text-bg-light border small">
                        ★ {repo.stargazers_count ?? 0}
                      </span>
                    </div>

                    <p className="text-secondary small mb-2">
                      {repo.description || 'Repositorio de código público en GitHub.'}
                    </p>

                    <div className="d-flex align-items-center justify-content-between small text-muted">
                      <span>{repo.language || 'Código'}</span>
                      <span>Ver en GitHub →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}