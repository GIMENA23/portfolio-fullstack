// 🎨 DUEÑO: Integrante B
// Solo para usuarios registrados (la ruta está protegida en App.jsx).
// Versión mínima funcionando con useParams (clase 7). B: diseño, galería, demo embebida, Web Share.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectsApi } from '../services/api.js'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    projectsApi.get(id).then(setProject).catch((err) => setError(err.message))
  }, [id])

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/proyectos">← Volver a proyectos</Link>
      </div>
    )
  }
  if (!project) return <p className="container py-5 text-muted">Cargando…</p>

  return (
    <div className="container py-5">
      <Link to="/proyectos" className="small">← Volver a proyectos</Link>
      <h1 className="h2 mt-2">{project.title}</h1>
      <div className="d-flex flex-wrap gap-1 mb-3">
        {project.stack?.map((t) => <span key={t} className="badge text-bg-primary">{t}</span>)}
      </div>
      <p>{project.description}</p>
      <div className="d-flex gap-2">
        {project.demoUrl && <a className="btn btn-primary" href={project.demoUrl} target="_blank" rel="noreferrer">Ver demo</a>}
        {project.repoUrl && <a className="btn btn-outline-secondary" href={project.repoUrl} target="_blank" rel="noreferrer">Repositorio</a>}
      </div>
    </div>
  )
}
