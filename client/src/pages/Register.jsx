// 🎨 DUEÑO: Integrante B — registro (Registro.dc.html): franja negra y formulario con reglas en vivo.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import PasswordReglas from '../components/PasswordReglas.jsx'
import { passwordValida } from '../components/passwordReglas.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const NOMBRE_REGEX = /^[\p{L}' ]+$/u

const BENEFICIOS = ['Detalle completo de cada proyecto', 'Demos interactivas para probar', 'Acceso al código fuente']

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '', terms: false })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [tocados, setTocados] = useState({})
  const [intentado, setIntentado] = useState(false)

  const validate = (f = form) => {
    const errors = {}
    const nombre = f.nombre.trim()
    const email = f.email.trim().toLowerCase()

    if (!nombre) errors.nombre = 'Ingresá tu nombre y apellido.'
    else if (nombre.length < 3) errors.nombre = 'Mínimo 3 letras.'
    else if (nombre.length > 60) errors.nombre = 'Máximo 60 caracteres.'
    else if (!NOMBRE_REGEX.test(nombre)) errors.nombre = 'Usá solo letras y espacios.'
    else if (!nombre.includes(' ')) errors.nombre = 'Escribí nombre y apellido.'

    if (!email) errors.email = 'Ingresá tu email.'
    else if (!EMAIL_REGEX.test(email)) errors.email = 'El email no es válido. Ejemplo: nombre@correo.com'

    if (!passwordValida(f.password)) errors.password = 'La contraseña no cumple todas las reglas.'

    if (!f.confirmPassword) errors.confirmPassword = 'Repetí la contraseña.'
    else if (f.confirmPassword !== f.password) errors.confirmPassword = 'Las contraseñas no coinciden.'

    if (!f.terms) errors.terms = 'Tenés que aceptar para crear la cuenta.'
    return errors
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }
  const onBlur = (e) => setTocados((t) => ({ ...t, [e.target.name]: true }))

  const errores = validate()
  const apiErrores = fieldErrors
  const mostrar = (k) => (apiErrores[k] || ((tocados[k] || intentado) && errores[k])) || ''
  const cantidad = Object.keys(errores).length

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIntentado(true)
    if (cantidad > 0) return

    setFieldErrors({})
    setSending(true)
    try {
      await register({
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      navigate('/proyectos', { replace: true })
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length > 0) {
        const apiErrors = {}
        err.details.forEach((d) => {
          const key = d.field || d.path || d.param
          if (key && !apiErrors[key]) apiErrors[key] = d.message || d.msg
        })
        setFieldErrors(apiErrors)
      }
      setError(err.message || 'No se pudo completar el registro. Intentá nuevamente.')
    } finally {
      setSending(false)
    }
  }

  const coincide = form.confirmPassword && form.confirmPassword === form.password && passwordValida(form.password)

  return (
    <AuthLayout
      variante="negro"
      tab="registro"
      rotulo="CUENTA GRATUITA"
      titulo="Creá tu cuenta."
      pie="Solo usamos tu email para tu cuenta."
      lateral={
        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
          {BENEFICIOS.map((b) => (
            <li key={b} className="d-flex gap-2">
              <span style={{ color: 'var(--pc-dorado)' }} aria-hidden="true">◆</span>
              {b}
            </li>
          ))}
        </ul>
      }
    >
      <button type="button" className="btn btn-google" onClick={() => setError('El registro con Google todavía no está disponible.')}>
        {/* TODO (C): registro con Google (Google Identity Services) → loginWithGoogle(credential) */}
        Registrarme con Google
      </button>
      <div className="separador-o">O CON TU EMAIL</div>

      <form onSubmit={onSubmit} noValidate className="d-flex flex-column gap-3">
        {error && <div className="alert alert-danger py-2 small mb-0 fw-semibold" role="alert">⚠ {error}</div>}

        <div>
          <label htmlFor="nombre" className="form-label fw-semibold">Nombre y apellido</label>
          <input
            id="nombre" name="nombre" autoComplete="name"
            className={`form-control ${mostrar('nombre') ? 'is-invalid' : ''}`}
            value={form.nombre} onChange={onChange} onBlur={onBlur} disabled={sending}
          />
          {mostrar('nombre') && <div className="invalid-feedback">{mostrar('nombre')}</div>}
        </div>

        <div>
          <label htmlFor="email" className="form-label fw-semibold">Email</label>
          <input
            id="email" name="email" type="email" autoComplete="email"
            className={`form-control ${mostrar('email') ? 'is-invalid' : ''}`}
            value={form.email} onChange={onChange} onBlur={onBlur} disabled={sending}
          />
          {mostrar('email') && <div className="invalid-feedback">{mostrar('email')}</div>}
        </div>

        <div>
          <label htmlFor="password" className="form-label fw-semibold">Contraseña</label>
          <input
            id="password" name="password" type="text" autoComplete="new-password"
            className="form-control font-mono" style={{ borderColor: 'var(--pc-texto)' }}
            value={form.password} onChange={onChange} onBlur={onBlur} disabled={sending}
            aria-describedby="reglas"
          />
        </div>
        <PasswordReglas id="reglas" password={form.password} grilla />

        <div>
          <label htmlFor="confirmPassword" className="form-label fw-semibold">Repetir contraseña</label>
          <input
            id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
            className={`form-control ${mostrar('confirmPassword') ? 'is-invalid' : ''}`}
            value={form.confirmPassword} onChange={onChange} onBlur={onBlur} disabled={sending}
          />
          {mostrar('confirmPassword') && <div className="invalid-feedback">{mostrar('confirmPassword')}</div>}
          {coincide && <span className="campo-ok">✓ Las contraseñas coinciden</span>}
        </div>

        <div>
          <label className="d-flex gap-2 align-items-start small fw-medium">
            <input
              type="checkbox" name="terms" className="form-check-input mt-1" style={{ width: 20, height: 20, flex: 'none' }}
              checked={form.terms} onChange={onChange} disabled={sending}
            />
            <span>Acepto que mis datos se usen solo para gestionar mi cuenta.</span>
          </label>
          {mostrar('terms') && <span className="campo-error d-block mt-1">⚠ {mostrar('terms')}</span>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Creando cuenta…' : cantidad === 0 ? 'Crear cuenta y ver proyectos →' : 'Crear cuenta'}
        </button>
        {intentado && cantidad > 0 && (
          <span role="alert" className="campo-error text-center" style={{ fontSize: '0.875rem' }}>
            ⚠ Revisá {cantidad} campo(s) marcados en rojo.
          </span>
        )}
        <span className="small text-secondary text-center">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </span>
      </form>
    </AuthLayout>
  )
}
