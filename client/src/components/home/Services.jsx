// 🎨 DUEÑO: Integrante B
import { useEffect, useState } from 'react'
import { servicesApi } from '../../services/api.js'
import Card from '../Card.jsx'
import CardGrid from '../CardGrid.jsx'
import { useReveal, GuardaLoader } from '../../animations'

// Catálogo de respaldo por si la base de datos aún no tiene servicios cargados
const FALLBACK_SERVICES = [
  {
    _id: 'srv-1',
    title: 'Desarrollo Web Fullstack',
    description:
      'Construcción de aplicaciones web completas de punta a punta con React en el frontend, Node.js/Express en el backend y MongoDB.',
    icon: '💻',
    priceFrom: 'A medida',
    features: ['SPA con React', 'API REST Segura', 'Diseño Responsive'],
  },
  {
    _id: 'srv-2',
    title: 'APIs, Integraciones y Backend',
    description:
      'Diseño de arquitecturas escalables, autenticación con JWT y Google, paneles administrativos y conexión con servicios externos.',
    icon: '⚙️',
    priceFrom: ' escalable',
    features: ['Node.js & Express', 'MongoDB Atlas', 'Seguridad JWT'],
  },
  {
    _id: 'srv-3',
    title: 'Optimización UI/UX & Performance',
    description:
      'Rediseño de interfaces modernas con Bootstrap 5, animaciones fluidas, mejora de tiempos de carga y adaptación móvil.',
    icon: '✨',
    priceFrom: 'Consultoría',
    features: ['Bootstrap 5', 'Animaciones', 'Accesibilidad'],
  },
]

const DEFAULT_ICONS = ['💻', '⚙️', '🚀', '✨', '🔒', '📱']

export default function Services() {
  const revealRef = useReveal()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    servicesApi
      .list()
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data) && data.length > 0) {
          setServices(data)
        } else {
          setServices(FALLBACK_SERVICES)
        }
      })
      .catch(() => {
        // Si el endpoint aún no está implementado por C, mostramos el catálogo base sin romper el Home
        if (isMounted) setServices(FALLBACK_SERVICES)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section id="services" ref={revealRef} className="container py-5">
      {/* Encabezado de sección */}
      <div className="text-center mb-5">
        <span className="badge rounded-pill text-bg-light border px-3 py-2 mb-2 text-secondary">
          Soluciones Profesionales
        </span>
        <h2 className="fw-bold mb-2">Servicios Ofrecidos</h2>
        <p className="text-secondary mb-0 mx-auto" style={{ maxWidth: '620px' }}>
          Desarrollo de software pensado para resolver necesidades reales, desde la interfaz de usuario hasta la base de datos en producción.
        </p>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="py-4 d-flex flex-column align-items-center justify-content-center">
          <GuardaLoader />
          <p className="text-muted small mt-3 mb-0">Cargando servicios…</p>
        </div>
      ) : (
        <CardGrid
          items={services}
          empty="No hay servicios disponibles en este momento."
          renderItem={(srv, idx) => {
            const title = srv.title || srv.name || srv.nombre || 'Servicio'
            const description =
              srv.description || srv.summary || srv.descripcion || ''
            const icon =
              srv.icon || DEFAULT_ICONS[idx % DEFAULT_ICONS.length]
            const badge =
              srv.priceFrom ||
              srv.price ||
              srv.precio ||
              srv.category ||
              null
            const tags = Array.isArray(srv.features)
              ? srv.features
              : Array.isArray(srv.tags)
                ? srv.tags
                : []

            return (
              <Card
                title={title}
                text={description}
                icon={icon}
                badge={badge ? `${badge}` : undefined}
                tags={tags}
                to="/contacto"
                actionLabel="Solicitar cotización →"
              />
            )
          }}
        />
      )}
    </section>
  )
}