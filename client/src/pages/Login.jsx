// 🎨 DUEÑO: Integrante B (pantalla) · C (login con Google)
// Ya funciona con email y contraseña para que todos puedan probar los roles.
// B: mejorar diseño y validaciones. C: agregar el botón de Google.
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email) {
      errors.email = 'Ingresá tu correo electrónico.'
    } else if (!emailRegex.test(email)) {
      errors.email = 'Ingresá un formato de email válido.'
    }

    if (!form.password) {
      errors.password = 'Ingresá tu contraseña.'
    } else if (form.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.'
    }

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
      const destino =
        location.state?.from ||
        (user.role === 'admin'
          ? '/admin'
          : user.role === 'operator'
            ? '/operador'
            : '/proyectos')
      navigate(destino, { replace: true })
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length > 0) {
        const apiErrors = {}
        err.details.forEach((d) => {
          const key = d.field || d.path || d.param
          if (key && !apiErrors[key]) {
            apiErrors[key] = d.message || d.msg
          }
        })
        setFieldErrors(apiErrors)
      }
      setError(err.message || 'Credenciales inválidas. Revisá tus datos.')
    } finally {
      setSending(false)
    }
  }

  // Relleno rápido de usuarios de prueba para agilizar las pruebas y la demo
  const fillDemoUser = (email) => {
    setForm({ email, password: 'Portfolio2026' })
    setFieldErrors({})
    setError('')
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5" style={{ maxWidth: 460 }}>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <h1 className="h3 fw-bold mb-1">Iniciar sesión</h1>
                <p className="text-secondary small mb-0">
                  Ingresá tus credenciales para acceder a tu cuenta
                </p>
              </div>

              {location.state?.from && (
                <div className="alert alert-info py-2 small" role="alert">
                  🔒 Iniciá sesión para ver el detalle de los proyectos y demos.
                </div>
              )}

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-medium">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    placeholder="nombre@ejemplo.com"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="email"
                    disabled={sending}
                    required
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">{fieldErrors.email}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label fw-medium">
                    Contraseña
                  </label>
                  <div className="input-group has-validation">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={onChange}
                      autoComplete="current-password"
                      disabled={sending}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                    {fieldErrors.password && (
                      <div className="invalid-feedback">{fieldErrors.password}</div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-medium"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Ingresando…
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </button>
              </form>

              {/* TODO (C): botón "Ingresar con Google" (Google Identity Services) → loginWithGoogle(credential) */}

              <hr className="my-4 text-muted" />

              <p className="small text-center mb-0">
                ¿No tenés cuenta?{' '}
                <Link to="/registro" className="fw-medium text-decoration-none">
                  Registrate acá
                </Link>
              </p>

              {/* Acceso rápido a cuentas de prueba en entorno local */}
              {import.meta.env.DEV && (
                <div className="mt-4 pt-3 border-top">
                  <p className="text-muted text-center mb-2" style={{ fontSize: '0.75rem' }}>
                    Cuentas de prueba (autocompletar):
                  </p>
                  <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => fillDemoUser('usuario@portfolio.test')}
                    >
                      Usuario
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => fillDemoUser('operador@portfolio.test')}
                    >
                      Operador
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => fillDemoUser('admin@portfolio.test')}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}