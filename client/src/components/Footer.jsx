// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer
      className="border-top mt-auto pt-5 pb-4"
      style={{ backgroundColor: 'var(--color-surface, #f8f9fa)' }}
    >
      <div className="container">
        <div className="row g-4 pb-4 border-bottom">
          {/* Columna 1: Marca y presentación breve */}
          <div className="col-lg-5">
            <Link
              to="/"
              className="h5 fw-bold text-decoration-none text-reset d-inline-block mb-2"
            >
              Portfolio Fullstack
            </Link>
            <p className="text-secondary small mb-0" style={{ maxWidth: '380px' }}>
              Desarrollo de aplicaciones web modernas, escalables y seguras de punta a punta con React, Node.js y MongoDB.
            </p>
          </div>

          {/* Columna 2: Navegación rápida */}
          <div className="col-6 col-lg-3">
            <h2 className="h6 fw-bold text-uppercase small text-muted mb-3">
              Navegación
            </h2>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              <li>
                <Link to="/" className="text-decoration-none text-secondary">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/proyectos" className="text-decoration-none text-secondary">
                  Proyectos
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-decoration-none text-secondary">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-decoration-none text-secondary">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Perfiles y contacto directo */}
          <div className="col-6 col-lg-4">
            <h2 className="h6 fw-bold text-uppercase small text-muted mb-3">
              Conectemos
            </h2>
            <ul className="list-unstyled small mb-3 d-flex flex-column gap-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-decoration-none text-secondary"
                >
                  💻 GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-decoration-none text-secondary"
                >
                  🔗 LinkedIn
                </a>
              </li>
              <li>
                <Link to="/contacto" className="text-decoration-none text-secondary">
                  ✉️ Enviar consulta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior de derechos y cátedra */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 pt-3 small text-muted">
          <span>© {YEAR} Portfolio Fullstack · Todos los derechos reservados.</span>
          <span>TFI Lenguajes IV · UCASAL</span>
        </div>
      </div>
    </footer>
  )
}