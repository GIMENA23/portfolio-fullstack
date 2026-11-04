// 🎨 DUEÑO: Integrante B
import { useCallback, useEffect, useState, useMemo } from 'react'
import { projectsApi } from '../services/api.js'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { GuardaLoader, useReveal } from '../animations'
import HeroPagina from '../components/HeroPagina.jsx'
import ErrorAmable from '../components/ErrorAmable.jsx'

const TONOS = ['tono-carmin', 'tono-negro', 'tono-vicuna', 'tono-exito', 'tono-oro', 'tono-suave']

// Se monta cuando ya hay datos, así useReveal encuentra las tarjetas.
function Grilla({ items, logueada }) {
  const ref = useReveal({ paso: 80 })
  return (
    <div ref={ref} className="row g-4">
      {items.map((p, i) => (
        <div key={p._id} className="col-12 col-md-6 col-lg-4" data-reveal>
          <article className="tarjeta-proyecto h-100 d-flex flex-column overflow-hidden">
            <div className={`foto-proyecto ${TONOS[i % TONOS.length]}`}>
              {p.images?.[0] && <img src={p.images[0]} alt="" loading="lazy" />}
              <span className="foto-etiqueta">{logueada ? 'VER DEMO' : 'REQUIERE REGISTRO'}</span>
            </div>
            <div className="p-4 d-flex flex-column gap-2 flex-grow-1">
              <span className="rotulo">{(p.stack ?? []).slice(0, 3).join(' · ')}</span>
              <h3 className="h5 mb-0">{p.title}</h3>
              <p className="mb-0 small text-secondary flex-grow-1">{p.summary}</p>
              <Link to={`/proyectos/${p._id}`} className="fw-semibold small">Ver proyecto →</Link>
            </div>
          </article>
        </div>
      ))}
    </div>
  )
}

function Esqueletos() {
  return (
    <div role="status" className="d-flex flex-column gap-4">
      <GuardaLoader texto="Tejiendo proyectos…" />
      <div className="row g-4" aria-hidden="true">
        {[1, 2, 3].map((k) => (
          <div key={k} className="col-12 col-md-6 col-lg-4">
          <div className="skel">
            <span className="skel-b" style={{ height: 160 }} />
            <div className="p-4 d-flex flex-column gap-2">
              <span className="skel-b" style={{ width: '40%', height: 10 }} />
              <span className="skel-b" style={{ width: '70%', height: 18 }} />
              <span className="skel-b" style={{ width: '90%', height: 12 }} />
            </div>
          </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTech, setSelectedTech] = useState('Todos')
  const [search, setSearch] = useState('')

  const cargar = useCallback(
    () =>
      projectsApi
        .list()
        .then((data) => setProjects(Array.isArray(data) ? data : (data?.items ?? [])))
        .catch((err) => setError(err.message || 'No pudimos cargar los proyectos.'))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  const reintentar = () => {
    setLoading(true)
    setError('')
    cargar()
  }

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
    return ['Todos', ...Array.from(techSet).sort()]
  }, [projects])

  // Filtramos proyectos por tecnología seleccionada y texto de búsqueda
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesTech =
        selectedTech === 'Todos' ||
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
    setSelectedTech('Todos')
    setSearch('')
  }

  return (
    <>
      <HeroPagina
        rotulo={`${loading ? '…' : projects.length} PROYECTOS · DEMOS INTERACTIVAS`}
        titulo="Proyectos"
      />

      <section className="sec-inner d-flex flex-column gap-4" style={{ paddingTop: '2.5rem' }}>
        {!user && (
          <div className="bg-negro p-3 p-md-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <span>🔒 Registrate gratis para ver el detalle de cada proyecto y probar las demos.</span>
            <Link to="/registro" className="btn btn-cierre px-4">Crear cuenta</Link>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div role="group" aria-label="Filtrar por tecnología" className="d-flex flex-wrap gap-2">
              {allTechs.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  aria-pressed={selectedTech === tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`filtro ${selectedTech === tech ? 'on' : ''}`}
                >
                  {tech}
                </button>
              ))}
              {(selectedTech !== 'Todos' || search.trim() !== '') && (
                <button type="button" onClick={handleResetFilters} className="btn btn-link text-decoration-none">
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="input-group" style={{ maxWidth: 360 }}>
              <span className="input-group-text" aria-hidden="true">🔍</span>
              <input
                type="search"
                className="form-control"
                placeholder="Buscar proyecto o tecnología…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar proyecto"
              />
            </div>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <small className="text-muted" aria-live="polite">
            Mostrando {filteredProjects.length} de {projects.length} proyectos
          </small>
        )}

        {loading && <Esqueletos />}

        {error && <ErrorAmable mensaje={error} onReintentar={reintentar} />}

        {!loading && !error && filteredProjects.length === 0 && (
          <div className="alert alert-light mb-0" role="status">
            {projects.length === 0
              ? 'Todavía no hay proyectos cargados.'
              : 'No se encontraron proyectos con los filtros seleccionados.'}
          </div>
        )}

        {!loading && !error && filteredProjects.length > 0 && (
          <Grilla key={`${selectedTech}-${search}`} items={filteredProjects} logueada={!!user} />
        )}
      </section>
    </>
  )
}
