// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, hasRole, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Cerrar el menú móvil automáticamente al navegar a otra ruta
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `nav-link px-2 ${isActive ? 'active fw-semibold text-primary' : ''}`

  const displayName = (user?.name || user?.nombre || 'Usuario').split(' ')[0]

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary sticky-top shadow-sm py-2">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-2 text-white fw-bold small"
            style={{
              width: 30,
              height: 30,
              backgroundColor: 'var(--color-primary, #0d6efd)',
            }}
          >
            PF
          </span>
          <span>Portfolio</span>
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-controls="mainNav"
          aria-expanded={menuOpen}
          aria-label="Abrir menú de navegación"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2 pt-2 pt-lg-0">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/" end>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/proyectos">
                Proyectos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/contacto">
                Contacto
              </NavLink>
            </li>

            {hasRole('operator', 'admin') && (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/operador">
                  Consultas
                </NavLink>
              </li>
            )}

            {hasRole('admin') && (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/admin">
                  Admin
                </NavLink>
              </li>
            )}

            <li className="nav-item d-none d-lg-block mx-1 text-muted opacity-50">|</li>

            {user ? (
              <li className="nav-item d-flex align-items-center justify-content-between justify-content-lg-start gap-2 pt-2 pt-lg-0 border-top border-lg-0 mt-2 mt-lg-0">
                <span className="small text-secondary d-flex align-items-center gap-1">
                  Hola, <strong className="text-body">{displayName}</strong>
                  {user.role && user.role !== 'user' && (
                    <span className="badge rounded-pill text-bg-light border text-uppercase ms-1">
                      {user.role}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3"
                  onClick={handleLogout}
                >
                  Salir
                </button>
              </li>
            ) : (
              <li className="nav-item d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 pt-2 pt-lg-0 border-top border-lg-0 mt-2 mt-lg-0">
                <NavLink className="btn btn-link btn-sm text-decoration-none text-secondary" to="/login">
                  Ingresar
                </NavLink>
                <Link className="btn btn-primary btn-sm px-3" to="/registro">
                  Registrarme
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}