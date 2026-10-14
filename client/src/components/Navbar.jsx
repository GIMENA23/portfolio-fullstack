// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, hasRole, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          Portfolio
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item"><NavLink className="nav-link" to="/" end>Inicio</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/proyectos">Proyectos</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/contacto">Contacto</NavLink></li>

            {hasRole('operator', 'admin') && (
              <li className="nav-item"><NavLink className="nav-link" to="/operador">Consultas</NavLink></li>
            )}
            {hasRole('admin') && (
              <li className="nav-item"><NavLink className="nav-link" to="/admin">Admin</NavLink></li>
            )}

            {user ? (
              <li className="nav-item d-flex align-items-center gap-2">
                <span className="small text-muted">Hola, {user.name.split(' ')[0]}</span>
                <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Salir</button>
              </li>
            ) : (
              <>
                <li className="nav-item"><NavLink className="nav-link" to="/login">Ingresar</NavLink></li>
                <li className="nav-item">
                  <Link className="btn btn-primary btn-sm" to="/registro">Registrarme</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
