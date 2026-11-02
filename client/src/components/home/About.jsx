// 🎨 DUEÑO: Integrante B — página 404 (clase 7).
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="container py-5 my-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6 text-center">
          <div className="card border-0 shadow-sm p-4 p-md-5">
            <div className="card-body">
              <span className="badge rounded-pill text-bg-light border px-3 py-2 mb-3 text-secondary">
                Error HTTP 404
              </span>

              <p
                className="display-1 fw-bold mb-2"
                style={{ color: 'var(--color-primary, #0d6efd)', lineHeight: 1 }}
              >
                404
              </p>

              <h1 className="h3 fw-bold mb-3">Página no encontrada</h1>

              <p className="text-secondary mb-4">
                La ruta <code className="px-2 py-1 rounded bg-light">{location.pathname}</code> no existe o fue movida a otra dirección.
              </p>

              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline-secondary px-4"
                >
                  ← Volver atrás
                </button>
                <Link to="/" className="btn btn-primary px-4">
                  Ir al inicio
                </Link>
                <Link to="/proyectos" className="btn btn-outline-primary px-4">
                  Ver proyectos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}