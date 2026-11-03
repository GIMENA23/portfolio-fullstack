// ⚙️ BASE DEL PROYECTO — estructura común de los paneles (barra lateral + contenido).
// OperatorLayout y AdminLayout la usan con su propio menú.
// ≥ 768 px: barra lateral fija al costado (scrollea sola si hay muchas opciones).
// Celular: barra superior fija con botón ☰ que despliega el menú y la tarjeta del usuario.
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BotonModoNoche, RutaAnimada } from '../animations/index.js'
import { useAuth } from '../context/AuthContext.jsx'

const iniciales = (user) =>
  (user?.name || user?.email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

export default function PanelLayout({ title, links }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="panel-app">
      {/* Celular: barra superior fija */}
      <header className="panel-topbar d-md-none">
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none fw-bold navbar-brand m-0">
          <span className="logo-rombo" aria-hidden="true">ma</span>
          arce.dev
        </Link>
        <button
          type="button"
          className="panel-toggle"
          aria-expanded={abierto}
          aria-controls="panel-menu"
          aria-label={abierto ? 'Cerrar el menú' : 'Abrir el menú'}
          onClick={() => setAbierto(!abierto)}
        >
          <span aria-hidden="true">{abierto ? '✕' : '☰'}</span>
        </button>
      </header>

      <aside id="panel-menu" className={`panel-sidebar ${abierto ? 'abierto' : ''}`}>
        <div>
          <Link to="/" className="d-block text-decoration-none fw-bold mb-1" onClick={() => setAbierto(false)}>← Ver sitio</Link>
          <div className="rotulo">{title}</div>
        </div>

        <nav className="nav flex-column gap-1" aria-label={title}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link" onClick={() => setAbierto(false)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-md-auto d-flex flex-column gap-2">
          <div className="panel-usuario">
            <span className="panel-usuario-avatar" aria-hidden="true">{iniciales(user)}</span>
            <div className="panel-usuario-datos">
              <strong>{user?.name || 'Mi usuario'}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-light btn-sm flex-grow-1"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Cerrar sesión
            </button>
            <BotonModoNoche />
          </div>
        </div>
      </aside>

      <main className="panel-main">
        <RutaAnimada />
      </main>
    </div>
  )
}
