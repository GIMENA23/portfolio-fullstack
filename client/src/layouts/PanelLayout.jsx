// ⚙️ BASE DEL PROYECTO — estructura común de los paneles (barra lateral + contenido).
// OperatorLayout y AdminLayout la usan con su propio menú y su variante ('admin' | 'operador').
// ≥ 768 px: barra lateral fija al costado (scrollea sola si hay muchas opciones).
// Celular: barra superior fija con botón ☰ que despliega el menú y la tarjeta del usuario.
// Diseño: Dashboard.dc.html y Bandeja.dc.html.
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BotonModoNoche, GuardaTejida, RutaAnimada } from '../animations/index.js'
import { useAuth } from '../context/AuthContext.jsx'

// Trazos de los íconos del menú (SVG en línea, mismos del prototipo)
const ICONOS_PANEL = {
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  proyectos: 'M3 6h7l2 2h9v11H3z',
  servicios: 'M4 7h16M4 12h16M4 17h10',
  usuarios: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  consultas: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
  sitio: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  salir: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
}

const ETIQUETAS = {
  admin: { panel: 'PANEL ADMINISTRADOR', rol: 'ADMINISTRADOR' },
  operador: { panel: 'PANEL OPERADOR', rol: 'OPERADOR' },
}

const iniciales = (user) =>
  (user?.name || user?.email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

function Icono({ nombre }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONOS_PANEL[nombre]} />
    </svg>
  )
}

/**
 * grupos: [{ titulo: 'CONTENIDO Y MÉTRICAS', items: [{ to, label, end, icono }] }]
 * (también acepta `links` = lista simple de items, sin título de grupo).
 */
export default function PanelLayout({ variante = 'admin', grupos, links }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const et = ETIQUETAS[variante] ?? ETIQUETAS.admin
  const listas = grupos ?? [{ titulo: '', items: links ?? [] }]

  return (
    <div className={`panel-app panel-${variante}`}>
      {/* Celular: barra superior fija */}
      <header className="panel-topbar d-md-none">
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none navbar-brand m-0">
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
        <div className="d-flex flex-column gap-2">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none navbar-brand m-0" onClick={() => setAbierto(false)}>
            <span className="logo-rombo" aria-hidden="true">ma</span>
            arce.dev
          </Link>
          <span className="panel-etiqueta align-self-start">{et.panel}</span>
        </div>
        <GuardaTejida fina alCargar delay={100} />

        <nav className="nav flex-column gap-1" aria-label="Panel">
          {listas.map((g) => (
            <div key={g.titulo || 'menu'} className="d-flex flex-column gap-1">
              {g.titulo && <span className="panel-grupo">{g.titulo}</span>}
              {g.items.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="nav-link" onClick={() => setAbierto(false)}>
                  {l.icono && <Icono nombre={l.icono} />}
                  <span className="flex-grow-1">{l.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="panel-usuario-card mt-md-auto">
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            <span className="panel-usuario-avatar panel-avatar-grande" aria-hidden="true">{iniciales(user)}</span>
            <div className="panel-usuario-datos">
              <strong>{user?.name || 'Mi usuario'}</strong>
              <span>{user?.email}</span>
              <span className="rotulo" style={{ fontSize: '0.625rem' }}>{et.rol}</span>
            </div>
          </div>
          <div className="panel-acciones">
            <Link to="/" className="btn btn-outline-primary btn-sm" onClick={() => setAbierto(false)}>
              <Icono nombre="sitio" /> Ver sitio
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                navigate('/', { replace: true }) // primero salimos del panel, así no vuelve a /login
                logout()
              }}
            >
              <Icono nombre="salir" /> Salir
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
