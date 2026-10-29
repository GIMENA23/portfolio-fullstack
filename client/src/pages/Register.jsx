// 🎨 DUEÑO: Integrante B (pantalla) · C (Google)
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const errors = {}
    const nombre = form.nombre.trim()
    const email = form.email.trim()

    if (!nombre) {
      errors.nombre = 'El nombre es obligatorio.'
    } else if (nombre.length < 2 || nombre.length > 80) {
      errors.nombre = 'El nombre debe tener entre 2 y 80 caracteres.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      errors.email = 'El correo electrónico es obligatorio.'
    } else if (!emailRegex.test(email)) {
      errors.email = 'Ingresá un formato de email válido.'
    }

    if (!form.password) {
      errors.password = 'La contraseña es obligatoria.'
    } else if (form.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.'
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.'
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
      // Llamamos a register provisto por useAuth (el backend suele esperar { nombre, email, password })
      await register({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      // Redirigir a proyectos después de registrarse exitosamente
      navigate('/proyectos', { replace: true })
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
      setError(err.message || 'No se pudo completar el registro. Intentá nuevamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-5" style={{ maxWidth: 460 }}>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <h1 className="h3 fw-bold mb-1">Crear una cuenta</h1>
                <p className="text-secondary small mb-0">
                  Completá tus datos para acceder a los proyectos y demos
                </p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>
                {/* Nombre */}
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label fw-medium">
                    Nombre completo
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className={`form-control ${fieldErrors.nombre ? 'is-invalid' : ''}`}
                    placeholder="Ej: Ana Gómez"
                    value={form.nombre}
                    onChange={onChange}
                    maxLength={80}
                    disabled={sending}
                    required
                  />
                  {fieldErrors.nombre && (
                    <div className="invalid-feedback">{fieldErrors.nombre}</div>
                  )}
                </div>

                {/* Email */}
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

                {/* Contraseña */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-medium">
                    Contraseña
                  </label>
                  <div className="input-group has-validation">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={onChange}
                      autoComplete="new-password"
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

                {/* Confirmar contraseña */}
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label fw-medium">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Repetitla contraseña"
                    value={form.confirmPassword}
                    onChange={onChange}
                    autoComplete="new-password"
                    disabled={sending}
                    required
                  />
                  {fieldErrors.confirmPassword && (
                    <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>
                  )}
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
                      Registrando cuenta…
                    </>
                  ) : (
                    'Registrarme'
                  )}
                </button>
              </form>

              {/* TODO (C): Botón "Registrarme con Google" (Google Identity Services) */}

              <hr className="my-4 text-muted" />

              <p className="small text-center mb-0">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="fw-medium text-decoration-none">
                  Ingresá acá
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}