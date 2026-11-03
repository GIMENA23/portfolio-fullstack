// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { BotonModoNoche } from '../animations'

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
    <nav className="navbar navbar-expand-lg bg-body sticky-top py-2">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span className="logo-rombo" aria-hidden="true">ma</span>
          <span>arce.dev</span>
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
          <ul className="navbar-nav mx-lg-auto align-items-lg-center gap-lg-2 pt-2 pt-lg-0">
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
              <NavLink className={navLinkClass} to="/servicios">
                Servicios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/contacto">
                Contacto
              </NavLink>
            </li>
            {hasRole('operator') && (
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
          </ul>

          <ul className="navbar-nav align-items-lg-center gap-2 gap-lg-3 pt-2 pt-lg-0">
            <li className="nav-item">
              <BotonModoNoche />
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-pill-usuario" to="/cuenta">
                    <span className="nav-avatar" aria-hidden="true">{displayName.slice(0, 2).toUpperCase()}</span>
                    {displayName}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button type="button" className="btn btn-outline-primary btn-sm px-3" onClick={handleLogout}>
                    Salir
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link nav-ingresar" to="/login">
                    Ingresar
                  </NavLink>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary" to="/registro">
                    Registrarme
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}