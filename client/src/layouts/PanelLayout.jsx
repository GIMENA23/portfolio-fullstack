// ⚙️ BASE DEL PROYECTO — estructura común de los paneles (barra lateral + contenido).
// OperatorLayout y AdminLayout la usan con su propio menú.
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PanelLayout({ title, links }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="container-fluid">
      <div className="row">
        <aside className="col-12 col-md-3 col-xl-2 panel-sidebar p-3 text-white">
          <Link to="/" className="d-block text-white text-decoration-none fw-bold mb-1">← Ver sitio</Link>
          <div className="small opacity-75 mb-4">{title}</div>
          <nav className="nav flex-md-column gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
                {l.label}
              </NavLink>
            ))}
          </nav>
          <hr className="border-light opacity-25" />
          <div className="small opacity-75">{user?.email}</div>
          <button
            className="btn btn-outline-light btn-sm mt-2"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            Cerrar sesión
          </button>
        </aside>
        <main className="col-12 col-md-9 col-xl-10 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
