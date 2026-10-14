// ⚙️ BASE DEL PROYECTO — protege rutas por sesión y por rol.
//   <ProtectedRoute>…</ProtectedRoute>                    → requiere estar logueado
//   <ProtectedRoute roles={['admin']}>…</ProtectedRoute>  → requiere un rol
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

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
    // Guarda a dónde quería ir para volver después del login.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h3">Acceso denegado</h1>
        <p className="text-muted">Tu cuenta no tiene permisos para ver esta sección.</p>
      </div>
    )
  }

  return children
}
