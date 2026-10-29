// 🎨 DUEÑO: Integrante B
import { useEffect, useState, useMemo } from 'react'
import { projectsApi } from '../services/api.js'
import Card from '../components/Card.jsx'
import CardGrid from '../components/CardGrid.jsx'
import { GuardaLoader } from '../animations'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTech, setSelectedTech] = useState('Todas')
  const [search, setSearch] = useState('')

  useEffect(() => {
    projectsApi
      .list()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Error al cargar los proyectos.'))
      .finally(() => setLoading(false))
  }, [])

  // Extraemos la lista única de tecnologías (stack) de todos los proyectos
  const allTechs = useMemo(() => {
    const techSet = new Set()
    projects.forEach((p) => {
      if (Array.isArray(p.stack)) {
        p.stack.forEach((tech) => {
          if (tech) techSet.add(tech.trim())
        })
      }
    })
    return ['Todas', ...Array.from(techSet).sort()]
  }, [projects])

  // Filtramos proyectos por tecnología seleccionada y texto de búsqueda
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesTech =
        selectedTech === 'Todas' ||
        (Array.isArray(p.stack) && p.stack.includes(selectedTech))

      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.title?.toLowerCase().includes(query) ||
        p.summary?.toLowerCase().includes(query) ||
        (Array.isArray(p.stack) &&
          p.stack.some((t) => t.toLowerCase().includes(query)))

      return matchesTech && matchesSearch
    })
  }, [projects, selectedTech, search])

  const handleResetFilters = () => {
    setSelectedTech('Todas')
    setSearch('')
  }

  return (
    <div className="container py-5">
      {/* Encabezado y buscador */}
      <div className="row align-items-end mb-4 g-3">
        <div className="col-lg-7">
          <h1 className="fw-bold mb-2">Proyectos</h1>
          <p className="text-secondary mb-0">
            Explorá los trabajos realizados, filtrá por tecnología o buscá por palabra clave.
          </p>
        </div>

        {!loading && !error && projects.length > 0 && (
          <div className="col-lg-5">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                🔍
              </span>
              <input
                type="search"
                className="form-control border-start-0"
                placeholder="Buscar proyecto o tecnología..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar proyecto"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones de filtro por tecnología */}
      {!loading && !error && allTechs.length > 1 && (
        <div className="mb-4">
          <div className="d-flex flex-wrap align-items-center gap-2">
            {allTechs.map((tech) => {
              const isActive = selectedTech === tech
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => setSelectedTech(tech)}
                  className={`btn btn-sm rounded-pill px-3 transition-all ${
                    isActive ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                  }`}
                >
                  {tech}
                </button>
              )
            })}

            {(selectedTech !== 'Todas' || search.trim() !== '') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-link text-decoration-none ms-auto"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="mt-2">
            <small className="text-muted">
              Mostrando {filteredProjects.length} de {projects.length} proyectos
            </small>
          </div>
        </div>
      )}

      {/* Loader animado mientras carga */}
      {loading && (
        <div className="py-5 my-4 d-flex flex-column align-items-center justify-content-center">
          <GuardaLoader />
          <p className="text-muted mt-3 mb-0">Cargando proyectos…</p>
        </div>
      )}

      {/* Error de API */}
      {error && (
        <div className="alert alert-danger shadow-sm" role="alert">
          {error}
        </div>
      )}

      {/* Grilla de proyectos */}
      {!loading && !error && (
        <CardGrid
          items={filteredProjects}
          empty={
            projects.length === 0
              ? 'Todavía no hay proyectos cargados.'
              : 'No se encontraron proyectos con los filtros seleccionados.'
          }
          renderItem={(p) => (
            <Card
              title={p.title}
              text={p.summary}
              image={p.images?.[0]}
              tags={p.stack}
              to={`/proyectos/${p._id}`}
            />
          )}
        />
      )}
    </div>
  )
}