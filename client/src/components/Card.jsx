// 🎨 DUEÑO: Integrante B — componente reutilizable (ejemplo práctico de la clase 5).
// Se usa para proyectos y para servicios.
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Card({
  title,
  subtitle,
  text,
  image,
  icon,
  badge,
  tags = [],
  to,
  actionLabel = 'Ver detalle →',
  footer,
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <article className="card h-100 shadow-sm border-0 overflow-hidden">
      {/* Imagen superior con altura uniforme (ideal para Proyectos) */}
      {image && !imgError && (
        <div
          className="bg-light position-relative overflow-hidden border-bottom"
          style={{ height: '200px' }}
        >
          <img
            src={image}
            className="w-100 h-100"
            style={{ objectFit: 'cover' }}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {badge && (
            <span className="badge rounded-pill text-bg-primary position-absolute top-0 end-0 m-3 shadow-sm">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Fallback si la imagen falla al cargar */}
      {image && imgError && (
        <div
          className="bg-light d-flex align-items-center justify-content-center text-muted small border-bottom"
          style={{ height: '200px' }}
        >
          Vista previa no disponible
        </div>
      )}

      <div className="card-body d-flex flex-column p-4">
        {/* Ícono o badge superior cuando no hay imagen (ideal para Servicios) */}
        {(icon || (badge && !image)) && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            {icon && (
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-3 bg-light border fs-4"
                style={{ width: '48px', height: '48px' }}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            {badge && !image && (
              <span className="badge rounded-pill text-bg-light border text-secondary">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Título y subtítulo */}
        <h3 className="card-title h5 fw-bold mb-1">
          {to ? (
            <Link to={to} className="text-decoration-none text-reset">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>

        {subtitle && (
          <p className="text-primary small fw-medium mb-2">{subtitle}</p>
        )}

        {/* Descripción */}
        {text && (
          <p className="card-text text-secondary flex-grow-1 mb-3">
            {text}
          </p>
        )}

        {/* Etiquetas / Tecnologías */}
        {Array.isArray(tags) && tags.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-3">
            {tags.map((t) => (
              <span
                key={t}
                className="badge rounded-pill text-bg-light border fw-normal text-secondary px-2 py-1"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Acción o pie de tarjeta */}
        {(to || footer) && (
          <div className="mt-auto pt-2 d-flex align-items-center justify-content-between gap-2">
            {to && (
              <Link
                to={to}
                className="btn btn-outline-primary btn-sm px-3 fw-medium"
              >
                {actionLabel}
              </Link>
            )}
            {footer}
          </div>
        )}
      </div>
    </article>
  )
}