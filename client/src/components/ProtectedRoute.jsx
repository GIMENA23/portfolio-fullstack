// ⚙️ BASE DEL PROYECTO — protege rutas por sesión y por rol.
//   <ProtectedRoute>…</ProtectedRoute>                    → requiere estar logueado
//   <ProtectedRoute roles={['admin']}>…</ProtectedRoute>  → requiere un rol
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { GuardaTejida } from '../animations'
import { inicioPorRol } from '../services/rutas.js'

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    // Guarda a dónde quería ir para volver después del login, salvo los paneles:
    // al cerrar sesión en un panel no tiene que quedar «volver al panel» pendiente.
    const esPanel = /^\/(admin|operador)/.test(location.pathname)
    return <Navigate to="/login" replace state={esPanel ? undefined : { from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="sec-inner d-flex flex-column gap-3" style={{ maxWidth: 720 }}>
        <span className="rotulo">ERROR 403 · ACCESO DENEGADO</span>
        <h1 className="pagina-titulo">No tenés acceso a esta sección.</h1>
        <div style={{ maxWidth: 360 }}><GuardaTejida fina alCargar /></div>
        <p className="text-secondary mb-0">Tu cuenta no tiene permisos para ver esta página.</p>
        <Link to={inicioPorRol(user.role)} className="btn btn-primary align-self-start">Ir a mi inicio</Link>
      </div>
    )
  }

  return children
}
