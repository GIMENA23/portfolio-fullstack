// 🎨 DUEÑO: Integrante B — recuperar contraseña en 3 pasos (/recuperar).
//   Paso 1: email → POST /api/auth/forgot (siempre el mismo mensaje)
//   Paso 2: el email trae un enlace con ?token=… (se lee de la URL)
//   Paso 3: nueva contraseña → POST /api/auth/reset
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi, backendPendiente } from '../services/api.js'
import { EnviadoLottie } from '../animations'
import PasswordReglas from '../components/PasswordReglas.jsx'
import ResumenErrores from '../components/ResumenErrores.jsx'
import { validarNuevaPassword } from '../components/passwordReglas.js'
import { simularEnvio, TOKEN_DE_PRUEBA } from './mockRecuperar.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_REGEX = /^[\w.-]{10,200}$/
const PASOS = ['Tu email', 'Revisá el correo', 'Nueva contraseña']

function Pasos({ actual }) {
  return (
    <ol className="list-unstyled d-flex gap-3 flex-wrap mb-4" aria-label="Pasos">
      {PASOS.map((p, i) => (
        <li
          key={p}
          className={`rotulo ${i + 1 === actual ? '' : 'text-muted'}`}
          aria-current={i + 1 === actual ? 'step' : undefined}
        >
          {i + 1}. {p}
        </li>
      ))}
    </ol>
  )
}

export default function Recuperar() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [enviado, setEnviado] = useState(false)
  const [hecho, setHecho] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const paso = hecho || token ? 3 : enviado ? 2 : 1
  const tokenValido = !token || TOKEN_REGEX.test(token)

  const pedirEnlace = async (e) => {
    e.preventDefault()
    const limpio = email.trim()
    const err = {}
    if (!limpio) err.email = 'El email es obligatorio.'
    else if (!EMAIL_REGEX.test(limpio)) err.email = 'Ingresá un email válido.'
    setErrores(err)
    if (Object.keys(err).length) return

    setGuardando(true)
    try {
      await authApi.forgot(limpio)
    } catch (ex) {
      if (backendPendiente(ex)) await simularEnvio() // TODO (C): quitar mock cuando esté el backend
      // Cualquier otro error también muestra el mismo mensaje: nunca revelamos si el email existe.
    } finally {
      setGuardando(false)
      setEnviado(true)
    }
  }

  const cambiar = async (e) => {
    e.preventDefault()
    const err = validarNuevaPassword(password, repetir)
    setErrores(err)
    if (Object.keys(err).length) return

    setGuardando(true)
    try {
      await authApi.reset(token, password)
      setHecho(true)
    } catch (ex) {
      if (backendPendiente(ex)) {
        await simularEnvio() // TODO (C): quitar mock cuando esté el backend
        setHecho(true)
      } else if (ex.details?.length) {
        const delBack = {}
        ex.details.forEach((d) => {
          delBack[d.field ?? 'general'] = d.message
        })
        setErrores(delBack)
      } else {
        setErrores({ general: ex.message || 'No se pudo cambiar la contraseña.' })
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-9 col-lg-6">
          <h1 className="h2 mb-2">Recuperar contraseña</h1>
          <Pasos actual={paso} />

          <div className="card">
            <div className="card-body p-4">
              {/* Paso 3 terminado */}
              {hecho && (
                <div className="text-center">
                  <div className="d-flex justify-content-center mb-2"><EnviadoLottie /></div>
                  <h2 className="h4">¡Contraseña actualizada!</h2>
                  <p className="text-secondary">Ya podés ingresar con tu nueva contraseña.</p>
                  <Link to="/login" className="btn btn-primary">Ir a ingresar</Link>
                </div>
              )}

              {/* Paso 3: enlace con token inválido */}
              {!hecho && token && !tokenValido && (
                <div>
                  <div className="alert alert-danger" role="alert">⚠ El enlace no es válido o está incompleto.</div>
                  <Link to="/recuperar" className="btn btn-primary">Pedir un enlace nuevo</Link>
                </div>
              )}

              {/* Paso 3: nueva contraseña */}
              {!hecho && token && tokenValido && (
                <form onSubmit={cambiar} noValidate>
                  <ResumenErrores errores={errores} etiquetas={{ password: 'Nueva contraseña', repetir: 'Repetir contraseña' }} />
                  {errores.general && (
                    <div className="alert alert-danger" role="alert">
                      ⚠ {errores.general} <Link to="/recuperar" className="alert-link">Pedir un enlace nuevo</Link>
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">Nueva contraseña</label>
                    <div className="input-group has-validation">
                      <input
                        id="password"
                        type={ver ? 'text' : 'password'}
                        className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        aria-describedby="reglas"
                        disabled={guardando}
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {ver ? 'Ocultar' : 'Ver'}
                      </button>
                      {errores.password && <div className="invalid-feedback">⚠ {errores.password}</div>}
                    </div>
                    <PasswordReglas id="reglas" password={password} />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="repetir" className="form-label fw-medium">Repetir contraseña</label>
                    <input
                      id="repetir"
                      type={ver ? 'text' : 'password'}
                      className={`form-control ${errores.repetir ? 'is-invalid' : ''}`}
                      value={repetir}
                      onChange={(e) => setRepetir(e.target.value)}
                      autoComplete="new-password"
                      disabled={guardando}
                    />
                    {errores.repetir && <div className="invalid-feedback">⚠ {errores.repetir}</div>}
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={guardando}>
                    {guardando ? 'Guardando…' : 'Cambiar contraseña'}
                  </button>
                </form>
              )}

              {/* Paso 2: revisá el correo */}
              {!token && enviado && (
                <div>
                  <div className="alert alert-success" role="status">
                    ✓ Si el email existe, te enviamos un enlace para cambiar la contraseña.
                  </div>
                  <p className="text-secondary">Abrí el enlace del correo para seguir con el paso 3. Si no llega, revisá la carpeta de spam.</p>
                  {/* TODO (C): quitar este enlace de prueba cuando el backend mande el email real */}
                  <p className="small text-muted mb-3">
                    Modo prueba: <Link to={`/recuperar?token=${TOKEN_DE_PRUEBA}`}>abrir enlace de ejemplo</Link>
                  </p>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setEnviado(false)}>
                    Usar otro email
                  </button>
                </div>
              )}

              {/* Paso 1: email */}
              {!token && !enviado && (
                <form onSubmit={pedirEnlace} noValidate>
                  <ResumenErrores errores={errores} etiquetas={{ email: 'Email' }} />
                  <p className="text-secondary">Ingresá tu email y te mandamos un enlace para elegir una contraseña nueva.</p>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-medium">Email</label>
                    <input
                      id="email"
                      type="email"
                      className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      maxLength={120}
                      disabled={guardando}
                    />
                    {errores.email && <div className="invalid-feedback">⚠ {errores.email}</div>}
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={guardando}>
                    {guardando ? 'Enviando…' : 'Enviar enlace'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center mt-3 mb-0">
            <Link to="/login" className="text-decoration-none">← Volver a ingresar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
