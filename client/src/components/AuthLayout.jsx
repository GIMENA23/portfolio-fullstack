// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
// Pantalla dividida de Login y Registro (Login.dc.html / Registro.dc.html):
// franja de color a la izquierda y formulario a la derecha; en celular se apila.
import { Link } from 'react-router-dom'
import { GuardaTejida } from '../animations'

export default function AuthLayout({ variante = 'carmin', rotulo, titulo, pie, tab, children, lateral }) {
  return (
    <div className="auth">
      <div className={`auth-franja ${variante === 'carmin' ? 'auth-franja-carmin' : ''}`}>
        <div className="auth-franja-inner">
          <Link to="/" className="auth-logo">
            <span className={`logo-rombo ${variante === 'carmin' ? 'logo-rombo-negro' : ''}`} aria-hidden="true">ma</span>
            arce.dev
          </Link>
          <div className="d-flex flex-column gap-3">
            <span className="rotulo">{rotulo}</span>
            <h1 className="auth-titulo">{titulo}</h1>
            {lateral}
          </div>
          <span className="small" style={{ opacity: 0.85 }}>{pie}</span>
        </div>
        <GuardaTejida alCargar delay={200} />
      </div>

      <div className="auth-lado">
        <div className="auth-form">
          <div role="tablist" aria-label="Ingresar o registrarse" className="auth-tabs">
            <Link to="/login" role="tab" aria-selected={tab === 'login'} className={`auth-tab ${tab === 'login' ? 'on' : ''}`}>Ingresar</Link>
            <Link to="/registro" role="tab" aria-selected={tab === 'registro'} className={`auth-tab ${tab === 'registro' ? 'on' : ''}`}>Crear cuenta</Link>
          </div>
          {children}
          <Link to="/" className="text-center small">← Volver al sitio</Link>
        </div>
      </div>
    </div>
  )
}
