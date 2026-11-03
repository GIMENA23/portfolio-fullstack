// 🎨 DUEÑO: Integrante B (pantalla) · C (login con Google)
// Pantalla dividida del prototipo (Login.dc.html). Funciona con email y contraseña.
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import BotonGoogle from '../components/BotonGoogle.jsx'
import { inicioPorRol, rutaPermitida } from '../services/rutas.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const errors = {}
    const email = form.email.trim()
    if (!email) errors.email = 'Ingresá tu email.'
    else if (!EMAIL_REGEX.test(email)) errors.email = 'El email no es válido. Ejemplo: nombre@correo.com'

    if (!form.password) errors.password = 'Ingresá tu contraseña.'
    else if (form.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres.'
    return errors
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
    if (error) setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setFieldErrors({})
    setSending(true)

    try {
      const user = await login(form.email.trim(), form.password)
      // Admin y operador van siempre a su panel; el usuario vuelve a donde quería ir solo si puede verlo.
      const quiso = location.state?.from
      const destino = user.role === 'user' && rutaPermitida(user.role, quiso) ? quiso : inicioPorRol(user.role)
      navigate(destino, { replace: true })
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length > 0) {
        const apiErrors = {}
        err.details.forEach((d) => {
          const key = d.field || d.path || d.param
          if (key && !apiErrors[key]) apiErrors[key] = d.message || d.msg
        })
        setFieldErrors(apiErrors)
      }
      setError(err.message || 'Email o contraseña incorrectos.')
    } finally {
      setSending(false)
    }
  }

  // Autocompleta las cuentas de prueba (admin, operador y usuario)
  const fillDemoUser = (email) => {
    setForm({ email, password: 'Portfolio2026' })
    setFieldErrors({})
    setError('')
  }

  const onGoogle = async (credential) => {
    setError('')
    setSending(true)
    try {
      const user = await loginWithGoogle(credential)
      const quiso = location.state?.from
      const destino = user.role === 'user' && rutaPermitida(user.role, quiso) ? quiso : inicioPorRol(user.role)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo ingresar con Google.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      variante="carmin"
      tab="login"
      rotulo="ACCESO A PROYECTOS Y DEMOS"
      titulo="Entrá para ver las demos."
      pie="Gratis · sin tarjeta · solo tu email"
      lateral={<p className="mb-0" style={{ maxWidth: '28em', opacity: 0.94 }}>Con tu cuenta ves el detalle de cada proyecto, el código y las demos interactivas.</p>}
    >
      <BotonGoogle onCredential={onGoogle} onError={setError} disabled={sending} />
      <div className="separador-o">O CON TU EMAIL</div>

      {location.state?.from && (
        <div className="alert alert-light py-2 small mb-0" role="status">🔒 Iniciá sesión para ver el detalle de los proyectos y demos.</div>
      )}
      {error && (
        <div className="alert alert-danger py-2 small mb-0 fw-semibold" role="alert">⚠ {error}</div>
      )}

      <form onSubmit={onSubmit} noValidate className="d-flex flex-column gap-3">
        <div>
          <label htmlFor="email" className="form-label fw-semibold">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            disabled={sending}
          />
          {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
        </div>

        <div>
          <label htmlFor="password" className="form-label fw-semibold">Contraseña</label>
          <div className="input-group has-validation">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
              disabled={sending}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="Mostrar u ocultar contraseña"
              style={{ minWidth: 84 }}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
            {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
          </div>
        </div>

        <Link to="/recuperar" className="align-self-end small fw-semibold">¿Olvidaste tu contraseña?</Link>

        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <span className="small text-secondary text-center">
        Cuentas de prueba: admin@portfolio.test, operador@portfolio.test o usuario@portfolio.test · contraseña Portfolio2026
      </span>

      <div className="demo-roles">
        <span className="rotulo text-secondary" style={{ fontSize: '0.6875rem' }}>PROTOTIPO · ENTRAR COMO</span>
        <div className="grid">
          <button type="button" className="rol-btn rol-admin" onClick={() => fillDemoUser('admin@portfolio.test')}>Administrador</button>
          <button type="button" className="rol-btn rol-operador" onClick={() => fillDemoUser('operador@portfolio.test')}>Operador</button>
          <button type="button" className="rol-btn rol-usuario" onClick={() => fillDemoUser('usuario@portfolio.test')}>Usuario</button>
        </div>
      </div>
    </AuthLayout>
  )
}
