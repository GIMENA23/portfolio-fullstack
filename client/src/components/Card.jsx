// 🎨 DUEÑO: Integrante B — componente reutilizable (ejemplo práctico de la clase 5).
// Se usa para proyectos y para servicios.
import { Link } from 'react-router-dom'

export default function Card({ title, text, image, tags = [], to, footer }) {
  return (
    <article className="card h-100 shadow-sm border-0">
      {image && <img src={image} className="card-img-top" alt={title} loading="lazy" />}
      <div className="card-body d-flex flex-column">
        <h3 className="card-title h5">{title}</h3>
        {text && <p className="card-text text-muted flex-grow-1">{text}</p>}
        {tags.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2">
            {tags.map((t) => (
              <span key={t} className="badge text-bg-light border">{t}</span>
            ))}
          </div>
        )}
        {to && <Link to={to} className="btn btn-outline-primary btn-sm mt-auto align-self-start">Ver más</Link>}
        {footer}
      </div>
    </article>
  )
}
