// 🎨 DUEÑO: Integrante B
// Solo para usuarios registrados (la ruta está protegida en App.jsx).
// Versión mínima funcionando con useParams (clase 7). B: diseño, galería, demo embebida, Web Share.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectsApi } from '../services/api.js'
import { GuardaLoader } from '../animations'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [showEmbedDemo, setShowEmbedDemo] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setActiveImage(0)
    setShowEmbedDemo(false)

    projectsApi
      .get(id)
      .then((data) => setProject(data))
      .catch((err) => setError(err.message || 'No se pudo cargar el proyecto.'))
      .finally(() => setLoading(false))
  }, [id])

  // Implementación de Web Share API con fallback a portapapeles
  const handleShare = async () => {
    if (!project) return
    const shareData = {
      title: project.title,
      text: project.summary || `Mirá el proyecto ${project.title}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        setShareFeedback('¡Enlace copiado al portapapeles!')
        setTimeout(() => setShareFeedback(''), 3000)
      }
    } catch (err) {
      // Si el usuario cancela el cuadro de compartir nativo, no mostramos error
      if (err.name !== 'AbortError') {
        setShareFeedback('No se pudo compartir el enlace.')
        setTimeout(() => setShareFeedback(''), 3000)
      }
    }
  }

  if (loading) {
    return (
      <div className="container py-5 my-5 d-flex flex-column align-items-center justify-content-center">
        <GuardaLoader />
        <p className="text-muted mt-3 mb-0">Cargando detalle del proyecto…</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm" role="alert">
          {error || 'Proyecto no encontrado.'}
        </div>
        <Link to="/proyectos" className="btn btn-outline-primary">
          ← Volver a proyectos
        </Link>
      </div>
    )
  }

  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : []
  const currentImage = images[activeImage] || null

  return (
    <div className="container py-5">
      {/* Navegación superior y botón de compartir */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <Link to="/proyectos" className="btn btn-sm btn-outline-secondary">
          ← Volver a proyectos
        </Link>

        <div className="d-flex align-items-center gap-2">
          {shareFeedback && (
            <span className="badge text-bg-success py-2 px-3">{shareFeedback}</span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="btn btn-sm btn-outline-primary"
          >
            🔗 Compartir proyecto
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Columna izquierda: Galería e información detallada */}
        <div className="col-lg-8">
          {/* Galería de imágenes */}
          {images.length > 0 ? (
            <div className="card border-0 shadow-sm overflow-hidden mb-4">
              <div
                className="position-relative bg-light d-flex align-items-center justify-content-center"
                style={{ minHeight: 320, maxHeight: 480 }}
              >
                <img
                  src={currentImage}
                  alt={`${project.title} - imagen ${activeImage + 1}`}
                  className="img-fluid w-100"
                  style={{ maxHeight: 480, objectFit: 'cover' }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-dark btn-sm position-absolute start-0 ms-2 rounded-circle opacity-75"
                      style={{ width: 36, height: 36 }}
                      onClick={() =>
                        setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                      }
                      aria-label="Imagen anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark btn-sm position-absolute end-0 me-2 rounded-circle opacity-75"
                      style={{ width: 36, height: 36 }}
                      onClick={() =>
                        setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                      }
                      aria-label="Siguiente imagen"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {images.length > 1 && (
                <div className="card-footer bg-white border-top-0 p-3 d-flex gap-2 overflow-auto">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={imgUrl + idx}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      className={`p-0 border rounded overflow-hidden flex-shrink-0 ${
                        idx === activeImage ? 'border-primary border-2 shadow-sm' : 'opacity-50'
                      }`}
                      style={{ width: 72, height: 52 }}
                      aria-label={`Ver imagen ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card border-0 shadow-sm mb-4 bg-light p-5 text-center text-muted">
              Sin imágenes de vista previa disponibles
            </div>
          )}

          {/* Descripción del proyecto */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold mb-3">Sobre este proyecto</h2>
              {project.summary && (
                <p className="lead fs-6 text-secondary mb-3">{project.summary}</p>
              )}
              <div className="text-body" style={{ whiteSpace: 'pre-line' }}>
                {project.description}
              </div>
            </div>
          </div>

          {/* Demo embebida interactiva */}
          {project.demoUrl && showEmbedDemo && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <span className="fw-semibold">Vista previa interactiva</span>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEmbedDemo(false)}
                  aria-label="Cerrar demo embebida"
                />
              </div>
              <div className="card-body p-0">
                <div className="ratio ratio-16x9">
                  <iframe
                    src={project.demoUrl}
                    title={`Demo de ${project.title}`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              </div>
              <div className="card-footer bg-light small text-muted">
                Si el sitio externo bloquea la vista embebida, usá el botón &ldquo;Abrir demo en pestaña nueva&rdquo;.
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Ficha técnica y acciones */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-lg-top" style={{ top: '1.5rem' }}>
            <div className="card-body p-4">
              <h1 className="h3 fw-bold mb-3">{project.title}</h1>

              {/* Stack tecnológico */}
              {Array.isArray(project.stack) && project.stack.length > 0 && (
                <div className="mb-4">
                  <h2 className="h6 text-uppercase text-muted small fw-bold mb-2">
                    Tecnologías utilizadas
                  </h2>
                  <div className="d-flex flex-wrap gap-1">
                    {project.stack.map((t) => (
                      <span
                        key={t}
                        className="badge rounded-pill text-bg-primary fw-medium px-3 py-2"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="d-grid gap-2">
                {project.demoUrl && (
                  <>
                    <a
                      className="btn btn-primary"
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      🚀 Abrir demo en pestaña nueva
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setShowEmbedDemo((prev) => !prev)}
                    >
                      {showEmbedDemo ? 'Ocultar demo embebida' : '🖥️ Probar demo acá mismo'}
                    </button>
                  </>
                )}

                {project.repoUrl && (
                  <a
                    className="btn btn-outline-secondary"
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💻 Ver repositorio de código
                  </a>
                )}
              </div>

              <hr className="my-4 text-muted" />

              {/* CTA hacia contacto */}
              <div className="small text-secondary">
                <p className="mb-2">¿Te interesa un desarrollo similar a este proyecto?</p>
                <Link to="/contacto" className="btn btn-sm btn-light border w-100 fw-medium">
                  Consultar por un proyecto parecido →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}