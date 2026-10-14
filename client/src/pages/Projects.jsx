// 🎨 DUEÑO: Integrante B
// Versión mínima funcionando: lista los proyectos desde la API.
// B: agregar filtros por tecnología, animaciones y mejor diseño.
import { useEffect, useState } from 'react'
import { projectsApi } from '../services/api.js'
import Card from '../components/Card.jsx'
import CardGrid from '../components/CardGrid.jsx'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    projectsApi
      .list()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-5">
      <h1 className="h2 mb-4">Proyectos</h1>
      {loading && <p className="text-muted">Cargando…</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <CardGrid
          items={projects}
          empty="Todavía no hay proyectos cargados."
          renderItem={(p) => (
            <Card title={p.title} text={p.summary} image={p.images?.[0]} tags={p.stack} to={`/proyectos/${p._id}`} />
          )}
        />
      )}
    </div>
  )
}
