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
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Completá email y contraseña')
      return
    }
    setSending(true)
    try {
      const user = await login(form.email.trim(), form.password)
      const destino =
        location.state?.from ||
        (user.role === 'admin' ? '/admin' : user.role === 'operator' ? '/operador' : '/proyectos')
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h3 mb-4">Ingresar</h1>
      {location.state?.from && (
        <div className="alert alert-info small">Iniciá sesión para ver los proyectos y demos.</div>
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" name="email" type="email" className="form-control" value={form.email} onChange={onChange} autoComplete="email" />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Contraseña</label>
          <input id="password" name="password" type="password" className="form-control" value={form.password} onChange={onChange} autoComplete="current-password" />
        </div>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <button className="btn btn-primary w-100" disabled={sending}>
          {sending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      {/* TODO (C): botón "Ingresar con Google" (Google Identity Services) → loginWithGoogle(credential) */}
      <p className="small text-center mt-3">
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  )
}
