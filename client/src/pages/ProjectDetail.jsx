// 🎨 DUEÑO: Integrante B — detalle de proyecto (Detalle.dc.html).
// Solo para usuarios registrados (la ruta está protegida en App.jsx).
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectsApi } from '../services/api.js'
import { GuardaLoader, GuardaTejida, TituloAnimado, useReveal } from '../animations'
import ErrorAmable from '../components/ErrorAmable.jsx'

const TONOS = ['tono-carmin', 'tono-negro', 'tono-vicuna', 'tono-exito', 'tono-oro', 'tono-suave']

function Contenido({ project }) {
  const ref = useReveal()
  const [activeImage, setActiveImage] = useState(0)
  const [showEmbedDemo, setShowEmbedDemo] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')

  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : []
  const tono = TONOS[(project._id?.charCodeAt?.(project._id.length - 1) ?? 0) % TONOS.length]
  const stack = Array.isArray(project.stack) ? project.stack : []

  // Web Share API con respaldo al portapapeles
  const handleShare = async () => {
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
        setShareFeedback('✓ Enlace copiado')
        setTimeout(() => setShareFeedback(''), 3000)
      }
    } catch (err) {
      // Si cancela el cuadro de compartir nativo, no mostramos error
      if (err.name !== 'AbortError') {
        setShareFeedback('No se pudo compartir el enlace.')
        setTimeout(() => setShareFeedback(''), 3000)
      }
    }
  }

  return (
    <>
      <section className="sec-inner d-flex flex-column gap-3" style={{ paddingTop: '2rem', paddingBottom: '1.5rem' }}>
        <Link to="/proyectos" className="fw-semibold text-decoration-none align-self-start">← Volver a proyectos</Link>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div className="d-flex flex-column gap-2" style={{ minWidth: 0, flex: '1 1 420px' }}>
            <span className="rotulo">{stack.slice(0, 3).join(' · ')}</span>
            <TituloAnimado texto={project.title} className="pagina-titulo" />
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Abrir demo ↗</a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary">Ver código</a>
            )}
            {shareFeedback && <span role="status" className="small fw-semibold" style={{ color: 'var(--pc-exito)' }}>{shareFeedback}</span>}
            <button type="button" className="btn btn-outline-secondary" onClick={handleShare} aria-label="Copiar enlace del proyecto" style={{ width: 48, padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section className="sec-inner d-flex flex-column gap-3" style={{ paddingTop: '1rem', paddingBottom: '1.5rem' }}>
        <div className={`foto-proyecto ${tono}`} style={{ height: 'clamp(220px, 40vw, 440px)', alignItems: 'center', justifyContent: 'center' }}>
          {images[activeImage] && <img src={images[activeImage]} alt={`${project.title}, imagen ${activeImage + 1}`} />}
        </div>
        {images.length > 1 && (
          <div className="d-flex flex-wrap gap-2">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Ver imagen ${i + 1}`}
                aria-pressed={i === activeImage}
                onClick={() => setActiveImage(i)}
                style={{ width: 72, height: 54, padding: 0, border: `2px solid ${i === activeImage ? 'var(--pc-carmin)' : 'var(--pc-linea)'}`, background: 'none' }}
              >
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="sec-inner" style={{ paddingTop: 0, paddingBottom: 0 }}><GuardaTejida fina /></div>

      <section ref={ref} className="sec-inner d-flex flex-wrap gap-5" style={{ paddingTop: '2.5rem' }}>
        <div data-reveal className="d-flex flex-column gap-3" style={{ flex: '2 1 460px', minWidth: 0 }}>
          <h2 className="h3">Sobre el proyecto</h2>
          {project.summary && <p className="lead mb-0">{project.summary}</p>}
          {project.description && <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{project.description}</p>}

          {project.demoUrl && showEmbedDemo && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Vista previa interactiva</span>
                <button type="button" className="btn-close" onClick={() => setShowEmbedDemo(false)} aria-label="Cerrar demo embebida" />
              </div>
              <div className="ratio ratio-16x9 border">
                <iframe
                  src={project.demoUrl}
                  title={`Demo de ${project.title}`}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              </div>
              <p className="small text-secondary mt-2 mb-0">Si el sitio externo bloquea la vista embebida, usá «Abrir demo ↗».</p>
            </div>
          )}
        </div>

        <aside data-reveal className="tarjeta-proyecto align-self-start p-4 d-flex flex-column gap-3" style={{ flex: '1 1 280px', minWidth: 0 }}>
          {stack.length > 0 && (
            <div className="d-flex flex-column gap-2">
              <span className="rotulo text-secondary">TECNOLOGÍAS</span>
              <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                {stack.map((t) => (
                  <li key={t} className="chip-email small py-1 px-2">{t}</li>
                ))}
              </ul>
            </div>
          )}
          {project.demoUrl && !showEmbedDemo && (
            <button type="button" className="btn btn-outline-primary" onClick={() => setShowEmbedDemo(true)}>Ver demo acá</button>
          )}
          <Link to="/contacto" className="btn btn-primary">Quiero algo parecido</Link>
        </aside>
      </section>
    </>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    setLoading(true)
    setError('')
    projectsApi
      .get(id)
      .then((data) => setProject(data))
      .catch((err) => setError(err.message || 'No se pudo cargar el proyecto.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  if (loading) {
    return (
      <div className="sec-inner">
        <GuardaLoader texto="Cargando el proyecto…" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="sec-inner d-flex flex-column gap-3">
        <ErrorAmable mensaje={error || 'No encontramos este proyecto.'} onReintentar={cargar} />
        <Link to="/proyectos" className="btn btn-outline-primary align-self-start">← Volver a proyectos</Link>
      </div>
    )
  }

  return <Contenido key={project._id} project={project} />
}
