// 🎨 DUEÑO: Integrante B — página 404 (clase 7).
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <p className="display-1 fw-bold text-primary mb-0">404</p>
      <h1 className="h3">Página no encontrada</h1>
      <p className="text-muted">La dirección que buscás no existe.</p>
      <Link to="/" className="btn btn-primary">Volver al inicio</Link>
    </div>
  )
}
