// 🎨 DUEÑO: Integrante B — «Mi cuenta» (/cuenta, requiere sesión).
// Pestañas: Mis datos | Seguridad | Mis consultas | Eliminar cuenta.
// Endpoints: PATCH /api/auth/me, DELETE /api/auth/me, GET /api/inquiries/mine
// (si todavía no existen, se usan los datos de prueba de mockCuenta.js).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, inquiriesApi, backendPendiente } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { GuardaLoader } from '../animations'
import PasswordReglas from '../components/PasswordReglas.jsx'
import ResumenErrores from '../components/ResumenErrores.jsx'
import { validarNuevaPassword } from '../components/passwordReglas.js'
import { TIPOS, formatoFecha } from './operator/inquiryLabels.js'
import { mockMisConsultas } from './mockCuenta.js'

const TABS = [
  { id: 'datos', label: 'Mis datos' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'consultas', label: 'Mis consultas' },
  { id: 'eliminar', label: 'Eliminar cuenta' },
]

// Estado de consulta: siempre ícono + texto (clases .estado-* de theme.css)
const ESTADOS = {
  nueva: { clase: 'estado-nueva', icono: '●', label: 'Nueva' },
  en_proceso: { clase: 'estado-en-proceso', icono: '◐', label: 'En proceso' },
  respondida: { clase: 'estado-respondida', icono: '✓', label: 'Respondida' },
  cerrada: { clase: 'estado-cerrada', icono: '○', label: 'Cerrada' },
}

const NOMBRE_REGEX = /^[\p{L}]+(?: [\p{L}]+)*$/u

function Aviso({ texto, soloPantalla }) {
  if (!texto) return null
  return (
    <div className="alert alert-success" role="status">
      ✓ {texto}
      {soloPantalla && <span className="d-block small">Modo prueba: el cambio se ve solo en pantalla (la API todavía no guarda).</span>}
    </div>
  )
}

/* ───────────── Mis datos ───────────── */
function Datos() {
  const { user, updateUser } = useAuth()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [soloPantalla, setSoloPantalla] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setAviso('')
    const limpio = nombre.trim().replace(/\s+/g, ' ')
    const err = {}
    if (!limpio) err.nombre = 'El nombre es obligatorio.'
    else if (limpio.length < 3 || limpio.length > 60) err.nombre = 'El nombre debe tener entre 3 y 60 caracteres.'
    else if (!NOMBRE_REGEX.test(limpio)) err.nombre = 'Usá solo letras y espacios.'
    setErrores(err)
    if (Object.keys(err).length) return

    setGuardando(true)
    try {
      await authApi.updateMe({ name: limpio })
      setSoloPantalla(false)
      updateUser({ name: limpio })
      setNombre(limpio)
      setAviso('Datos actualizados.')
    } catch (ex) {
      if (backendPendiente(ex)) {
        // TODO (C): quitar mock cuando esté el backend
        setSoloPantalla(true)
        updateUser({ name: limpio })
        setNombre(limpio)
        setAviso('Datos actualizados.')
      } else if (ex.details?.length) {
        const delBack = {}
        ex.details.forEach((d) => {
          delBack[d.field === 'name' ? 'nombre' : (d.field ?? 'general')] = d.message
        })
        setErrores(delBack)
      } else {
        setErrores({ general: ex.message })
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      <ResumenErrores errores={errores} etiquetas={{ nombre: 'Nombre' }} />
      {errores.general && <div className="alert alert-danger" role="alert">⚠ {errores.general}</div>}
      <Aviso texto={aviso} soloPantalla={soloPantalla} />
      <div className="mb-3">
        <label htmlFor="nombre" className="form-label fw-medium">Nombre</label>
        <input
          id="nombre"
          className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
          autoComplete="name"
          disabled={guardando}
        />
        {errores.nombre && <div className="invalid-feedback">⚠ {errores.nombre}</div>}
        <div className="form-text">Entre 3 y 60 caracteres, solo letras y espacios.</div>
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="form-label fw-medium">Email</label>
        <input id="email" className="form-control" value={user?.email ?? ''} readOnly aria-describedby="email-ayuda" />
        <div id="email-ayuda" className="form-text">El email no se puede cambiar.</div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}

/* ───────────── Seguridad ───────────── */
function Seguridad() {
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [soloPantalla, setSoloPantalla] = useState(false)

  const terminar = (pantalla) => {
    setSoloPantalla(pantalla)
    setAviso('Contraseña actualizada.')
    setPassword('')
    setRepetir('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setAviso('')
    const err = validarNuevaPassword(password, repetir)
    setErrores(err)
    if (Object.keys(err).length) return

    setGuardando(true)
    try {
      await authApi.updateMe({ password })
      terminar(false)
    } catch (ex) {
      if (backendPendiente(ex)) {
        terminar(true) // TODO (C): quitar mock cuando esté el backend
      } else if (ex.details?.length) {
        const delBack = {}
        ex.details.forEach((d) => {
          delBack[d.field ?? 'general'] = d.message
        })
        setErrores(delBack)
      } else {
        setErrores({ general: ex.message })
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      <ResumenErrores errores={errores} etiquetas={{ password: 'Nueva contraseña', repetir: 'Repetir contraseña' }} />
      {errores.general && <div className="alert alert-danger" role="alert">⚠ {errores.general}</div>}
      <Aviso texto={aviso} soloPantalla={soloPantalla} />
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
      <button type="submit" className="btn btn-primary" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

/* ───────────── Mis consultas ───────────── */
function MisConsultas() {
  const [consultas, setConsultas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [soloPantalla, setSoloPantalla] = useState(false)

  useEffect(() => {
    let activo = true
    inquiriesApi
      .mine()
      .then((data) => {
        if (activo) setConsultas(Array.isArray(data) ? data : (data?.items ?? []))
      })
      .catch((ex) => {
        if (!activo) return
        if (backendPendiente(ex)) {
          setConsultas(mockMisConsultas) // TODO (C): quitar mock cuando esté el backend
          setSoloPantalla(true)
        } else {
          setError(ex.message)
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  if (cargando) return <GuardaLoader texto="Cargando tus consultas…" />
  if (error) return <div className="alert alert-danger" role="alert">⚠ {error}</div>
  if (consultas.length === 0) return <p className="text-secondary mb-0">Todavía no enviaste ninguna consulta.</p>

  return (
    <>
      {soloPantalla && <p className="small text-muted">Modo prueba: estas consultas son de ejemplo.</p>}
      <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
        {consultas.map((c) => {
          const est = ESTADOS[c.status] ?? ESTADOS.nueva
          const respuesta = c.replies?.[c.replies.length - 1]
          return (
            <li key={c._id} className="card">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                  <h3 className="h6 mb-0">{c.subject}</h3>
                  <span className={`estado ${est.clase}`}>
                    <span aria-hidden="true">{est.icono}</span> {est.label}
                  </span>
                </div>
                <p className="rotulo mb-2">{TIPOS[c.type] ?? c.type} · {formatoFecha(c.createdAt)}</p>
                <p className="mb-0 text-secondary">{c.message}</p>
                {respuesta && (
                  <div className="mt-3 p-3 border-start border-3 border-primary bg-body-tertiary">
                    <p className="rotulo mb-1">Respuesta · {formatoFecha(respuesta.sentAt)}</p>
                    <p className="mb-0">{respuesta.text}</p>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/* ───────────── Eliminar cuenta ───────────── */
function Eliminar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  const salir = () => {
    logout()
    navigate('/')
  }

  const eliminar = async () => {
    if (texto !== 'ELIMINAR') return
    setEliminando(true)
    setError('')
    try {
      await authApi.deleteMe()
      salir()
    } catch (ex) {
      if (backendPendiente(ex)) {
        salir() // TODO (C): quitar mock cuando esté el backend (acá todavía no se borra nada)
      } else {
        setError(ex.message || 'No se pudo eliminar la cuenta.')
        setEliminando(false)
      }
    }
  }

  return (
    <div>
      <div className="alert alert-danger" role="alert">
        ⚠ Esta acción no se puede deshacer. Se borra tu cuenta y dejás de tener acceso.
      </div>
      {error && <div className="alert alert-danger" role="alert">⚠ {error}</div>}
      <div className="mb-3">
        <label htmlFor="confirmar" className="form-label fw-medium">
          Para confirmar, escribí <strong>ELIMINAR</strong>
        </label>
        <input
          id="confirmar"
          className="form-control"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
          disabled={eliminando}
        />
      </div>
      <button type="button" className="btn btn-danger" disabled={texto !== 'ELIMINAR' || eliminando} onClick={eliminar}>
        {eliminando ? 'Eliminando…' : 'Eliminar mi cuenta'}
      </button>
    </div>
  )
}

const PANELES = { datos: Datos, seguridad: Seguridad, consultas: MisConsultas, eliminar: Eliminar }

export default function Cuenta() {
  const [tab, setTab] = useState('datos')
  const Panel = PANELES[tab]

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <p className="rotulo mb-2">Mi cuenta</p>
          <h1 className="h2 mb-4">Tu cuenta</h1>

          <ul className="nav nav-tabs flex-nowrap overflow-auto mb-4" role="tablist">
            {TABS.map((t) => (
              <li className="nav-item" role="presentation" key={t.id}>
                <button
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls="panel-cuenta"
                  className={`nav-link text-nowrap ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>

          <div id="panel-cuenta" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            <Panel key={tab} />
          </div>
        </div>
      </div>
    </div>
  )
}
