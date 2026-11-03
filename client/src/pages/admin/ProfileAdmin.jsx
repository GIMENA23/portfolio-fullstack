// 🎨 DUEÑO: Integrante D — perfil del portfolio (/admin/perfil, rol admin).
// GET /api/profile, PUT /api/profile (multipart si hay foto). Si la API todavía no existe,
// usa mockPerfil.js y los cambios se ven solo en pantalla.
import { useEffect, useRef, useState } from 'react'
import { profileApi, backendPendiente } from '../../services/api.js'
import { GuardaLoader } from '../../animations'
import ResumenErrores from '../../components/ResumenErrores.jsx'
import { mockPerfil } from './mockPerfil.js'

const LIMITES = { pesoMax: 2 * 1024 * 1024, stackMax: 16, stackItemMax: 30 }
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const EXT_IMAGEN = /\.(jpe?g|png|webp)$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GITHUB_REGEX = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const LINKEDIN_REGEX = /^https:\/\/(?:www\.)?linkedin\.com\/in\/[\p{L}\p{N}_%-]{3,100}\/?$/u
const LETRAS_REGEX = /^[\p{L}]+(?: [\p{L}]+)*$/u

const ETIQUETAS = {
  name: 'Nombre',
  title: 'Título',
  tagline: 'Frase del inicio',
  bio: 'Presentación',
  email: 'Email',
  location: 'Ubicación',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  stack: 'Stack',
  photo: 'Foto',
}

const VACIO = { name: '', title: '', tagline: '', bio: '', email: '', location: '', github: '', linkedin: '' }

function validar(f, stack) {
  const e = {}
  const nombre = f.name.trim()
  if (!nombre) e.name = 'El nombre es obligatorio.'
  else if (nombre.length < 3 || nombre.length > 60) e.name = 'El nombre debe tener entre 3 y 60 caracteres.'
  else if (!LETRAS_REGEX.test(nombre)) e.name = 'Usá solo letras y espacios.'

  const titulo = f.title.trim()
  if (!titulo) e.title = 'El título es obligatorio.'
  else if (titulo.length < 3 || titulo.length > 60) e.title = 'El título debe tener entre 3 y 60 caracteres.'

  const frase = f.tagline.trim()
  if (!frase) e.tagline = 'La frase es obligatoria.'
  else if (frase.length > 60) e.tagline = 'La frase puede tener hasta 60 caracteres.'

  const bio = f.bio.trim()
  if (!bio) e.bio = 'La presentación es obligatoria.'
  else if (bio.length < 40 || bio.length > 400) e.bio = 'La presentación debe tener entre 40 y 400 caracteres.'

  const email = f.email.trim()
  if (!email) e.email = 'El email es obligatorio.'
  else if (!EMAIL_REGEX.test(email)) e.email = 'Ingresá un email válido.'

  const ubicacion = f.location.trim()
  if (!ubicacion) e.location = 'La ubicación es obligatoria.'
  else if (ubicacion.length < 3 || ubicacion.length > 60) e.location = 'La ubicación debe tener entre 3 y 60 caracteres.'

  const gh = f.github.trim()
  if (gh && !GITHUB_REGEX.test(gh)) e.github = 'Usá el formato https://github.com/usuario'
  const li = f.linkedin.trim()
  if (li && !LINKEDIN_REGEX.test(li)) e.linkedin = 'Usá el formato https://linkedin.com/in/usuario'

  if (stack.length === 0) e.stack = 'Agregá al menos una tecnología.'
  return e
}

export default function ProfileAdmin() {
  const [form, setForm] = useState(VACIO)
  const [stack, setStack] = useState([])
  const [chip, setChip] = useState('')
  const [fotoActual, setFotoActual] = useState('') // URL guardada
  const [fotoNueva, setFotoNueva] = useState(null) // { file, url }
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [experiencia, setExperiencia] = useState([])
  const [nuevaExp, setNuevaExp] = useState({ period: '', role: '', detail: '' })
  const [errExp, setErrExp] = useState('')
  const [soloPantalla, setSoloPantalla] = useState(false)
  const inputFoto = useRef(null)

  const cargarDatos = (p) => {
    setForm({
      name: p.name ?? '',
      title: p.title ?? '',
      tagline: p.tagline ?? '',
      bio: p.bio ?? '',
      email: p.email ?? '',
      location: p.location ?? '',
      github: p.github ?? '',
      linkedin: p.linkedin ?? '',
    })
    setStack(p.stack ?? [])
    setExperiencia(p.experience ?? [])
    setFotoActual(p.photo ?? '')
  }

  useEffect(() => {
    let activo = true
    profileApi
      .get()
      .then((p) => {
        if (activo) cargarDatos(p)
      })
      .catch((ex) => {
        if (!activo) return
        if (backendPendiente(ex)) {
          cargarDatos(mockPerfil) // TODO (C): quitar mock cuando esté el backend
          setSoloPantalla(true)
        } else {
          setErrores({ general: ex.message })
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  // Libera la vista previa de la foto cuando cambia o al salir
  useEffect(() => () => fotoNueva && URL.revokeObjectURL(fotoNueva.url), [fotoNueva])

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((er) => ({ ...er, [name]: undefined }))
  }

  const agregarChip = () => {
    const valor = chip.trim()
    if (!valor) return
    let problema = ''
    if (valor.length > LIMITES.stackItemMax) problema = `Cada tecnología puede tener hasta ${LIMITES.stackItemMax} caracteres.`
    else if (stack.some((s) => s.toLowerCase() === valor.toLowerCase())) problema = `"${valor}" ya está en la lista.`
    else if (stack.length >= LIMITES.stackMax) problema = `Máximo ${LIMITES.stackMax} tecnologías.`
    if (problema) {
      setErrores((er) => ({ ...er, stack: problema }))
      return
    }
    setStack((s) => [...s, valor])
    setChip('')
    setErrores((er) => ({ ...er, stack: undefined }))
  }

  const quitarChip = (valor) => setStack((s) => s.filter((x) => x !== valor))

  const elegirFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    let problema = ''
    if (!TIPOS_IMAGEN.includes(file.type) || !EXT_IMAGEN.test(file.name)) problema = `"${file.name}" no es válida: solo JPG, PNG o WebP.`
    else if (file.size > LIMITES.pesoMax) problema = `"${file.name}" pesa más de 2 MB.`
    if (problema) {
      setErrores((er) => ({ ...er, photo: problema }))
      e.target.value = ''
      return
    }
    setFotoNueva({ file, url: URL.createObjectURL(file) })
    setErrores((er) => ({ ...er, photo: undefined }))
  }

  const quitarFoto = () => {
    setFotoNueva(null)
    if (inputFoto.current) inputFoto.current.value = ''
  }

  const armarCuerpo = () => {
    const datos = { ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])), stack, experience: experiencia }
    if (!fotoNueva) return datos
    const fd = new FormData()
    Object.entries(datos).forEach(([k, v]) => {
      if (k === 'stack') v.forEach((s) => fd.append('stack', s))
      else if (k === 'experience') fd.append('experience', JSON.stringify(v))
      else fd.append(k, v)
    })
    fd.append('photo', fotoNueva.file)
    return fd
  }

  const agregarExperiencia = () => {
    const e = { period: nuevaExp.period.trim(), role: nuevaExp.role.trim(), detail: nuevaExp.detail.trim() }
    let problema = ''
    if (e.period.length < 3 || e.period.length > 30) problema = 'El período debe tener entre 3 y 30 caracteres (ej.: 2024 — HOY).'
    else if (e.role.length < 3 || e.role.length > 80) problema = 'El puesto debe tener entre 3 y 80 caracteres.'
    else if (e.detail.length > 150) problema = 'El detalle puede tener hasta 150 caracteres.'
    else if (experiencia.length >= 8) problema = 'Máximo 8 experiencias.'
    setErrExp(problema)
    if (problema) return
    setExperiencia((x) => [...x, e])
    setNuevaExp({ period: '', role: '', detail: '' })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setAviso('')
    const problemas = validar(form, stack)
    setErrores(problemas)
    if (Object.keys(problemas).length) return

    setGuardando(true)
    try {
      const guardado = await profileApi.put(armarCuerpo())
      setSoloPantalla(false)
      if (guardado) cargarDatos(guardado)
      setFotoNueva(null)
      setAviso('Perfil guardado.')
    } catch (ex) {
      if (backendPendiente(ex)) {
        // TODO (C): quitar mock cuando esté el backend
        setSoloPantalla(true)
        if (fotoNueva) setFotoActual(fotoNueva.url)
        setAviso('Perfil guardado.')
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

  if (cargando) return <GuardaLoader texto="Cargando perfil…" />

  const foto = fotoNueva?.url || fotoActual
  const iniciales = (form.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
  const campo = (name, label, props = {}) => (
    <div style={{ minWidth: 0 }} className={props.ancho ? 'perfil-ancho' : ''}>
      <label htmlFor={name} className="form-label fw-semibold">
        {label} {props.nota && <span className="fw-normal text-secondary small">{props.nota}</span>}
      </label>
      <input
        id={name}
        name={name}
        className={`form-control ${errores[name] ? 'is-invalid' : ''}`}
        value={form[name]}
        onChange={cambiar}
        disabled={guardando}
        {...props.input}
      />
      {errores[name] && <div className="invalid-feedback">{errores[name]}</div>}
    </div>
  )

  return (
    <div className="d-flex flex-column gap-3 py-2">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div>
          <span className="rotulo">LO QUE EDITES ACÁ SE VE EN EL SITIO</span>
          <h1 className="h2 mb-0">Mi perfil</h1>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          {aviso && <span role="status" className="campo-ok">✓ Perfil actualizado</span>}
          {Object.keys(errores).some((k) => errores[k]) && (
            <span role="alert" className="campo-error">⚠ No se guardó: revisá {Object.keys(errores).filter((k) => errores[k]).length} campo(s)</span>
          )}
          <button type="submit" form="form-perfil" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {soloPantalla && (
        <div className="alert alert-light mb-0 small" role="status">Modo prueba: los cambios se ven solo en pantalla (la API todavía no guarda).</div>
      )}

      <div className="admin-split">
        <div className="admin-split-main" style={{ gap: 16 }}>
          <form id="form-perfil" onSubmit={guardar} noValidate className="d-flex flex-column gap-3">
            <ResumenErrores errores={errores} etiquetas={ETIQUETAS} />
            {errores.general && <div className="alert alert-danger mb-0" role="alert">⚠ {errores.general}</div>}

            <section className="perfil-card">
              <h2>Datos personales</h2>
              <div className="d-flex flex-wrap align-items-center gap-3">
                {foto ? (
                  <img src={foto} alt="" className="rounded-circle border" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                ) : (
                  <span className="perfil-avatar" aria-hidden="true">{iniciales}</span>
                )}
                <div className="d-flex flex-column gap-1" style={{ minWidth: 0 }}>
                  <label htmlFor="photo" className="fw-semibold small">Foto de perfil</label>
                  <input
                    id="photo"
                    ref={inputFoto}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className={`form-control form-control-sm ${errores.photo ? 'is-invalid' : ''}`}
                    onChange={elegirFoto}
                    disabled={guardando}
                    aria-describedby="photo-ayuda"
                    style={{ maxWidth: 300 }}
                  />
                  {errores.photo && <div className="invalid-feedback">{errores.photo}</div>}
                  <span id="photo-ayuda" className="small text-secondary">JPG, PNG o WebP · cuadrada · máx. 2 MB</span>
                  {fotoNueva && <button type="button" className="btn btn-link btn-sm p-0 align-self-start" onClick={quitarFoto}>Quitar la foto elegida</button>}
                </div>
              </div>

              <div className="perfil-par">
                {campo('name', 'Nombre', { input: { maxLength: 60, autoComplete: 'name' } })}
                {campo('title', 'Título profesional', { input: { maxLength: 60 } })}
              </div>

              <div>
                <label htmlFor="tagline" className="form-label fw-semibold">
                  Frase del inicio <span className="fw-normal text-secondary small">Título grande del hero · {form.tagline.length} / 60</span>
                </label>
                <input id="tagline" name="tagline" className={`form-control ${errores.tagline ? 'is-invalid' : ''}`} value={form.tagline} onChange={cambiar} maxLength={60} disabled={guardando} />
                {errores.tagline && <div className="invalid-feedback">{errores.tagline}</div>}
              </div>

              <div>
                <label htmlFor="bio" className="form-label fw-semibold">
                  Presentación <span className="fw-normal text-secondary small">Sección Perfil · {form.bio.length} / 400</span>
                </label>
                <textarea id="bio" name="bio" rows="3" maxLength={400} className={`form-control ${errores.bio ? 'is-invalid' : ''}`} value={form.bio} onChange={cambiar} disabled={guardando} />
                {errores.bio && <div className="invalid-feedback">{errores.bio}</div>}
              </div>

              <div className="perfil-par">
                {campo('email', 'Email público', { input: { type: 'email', maxLength: 120 } })}
                {campo('location', 'Ubicación', { input: { maxLength: 60 } })}
                {campo('github', 'GitHub', { input: { placeholder: 'https://github.com/usuario', maxLength: 100 } })}
                {campo('linkedin', 'LinkedIn', { input: { placeholder: 'https://linkedin.com/in/usuario', maxLength: 120 } })}
              </div>
            </section>

            <section className="perfil-card">
              <h2>Stack <span className="fw-normal text-secondary small">{stack.length} / {LIMITES.stackMax}</span></h2>
              <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                {stack.map((s) => (
                  <li key={s} className="perfil-chip">
                    {s}
                    <button type="button" onClick={() => quitarChip(s)} aria-label={`Quitar ${s}`}>✕</button>
                  </li>
                ))}
              </ul>
              <div className="d-flex flex-wrap gap-2">
                <label htmlFor="chip" className="visually-hidden">Nueva tecnología</label>
                <input
                  id="chip"
                  className={`form-control ${errores.stack ? 'is-invalid' : ''}`}
                  style={{ flex: '1 1 220px', minWidth: 0 }}
                  value={chip}
                  onChange={(e) => setChip(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      agregarChip()
                    }
                  }}
                  placeholder="Agregar tecnología, ej.: TypeScript"
                  maxLength={LIMITES.stackItemMax}
                  disabled={guardando}
                />
                <button type="button" className="btn btn-outline-primary" onClick={agregarChip} disabled={guardando}>+ Agregar</button>
              </div>
              {errores.stack && <span className="campo-error">⚠ {errores.stack}</span>}
            </section>

            <section className="perfil-card" aria-labelledby="exp-titulo">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <h2 id="exp-titulo">Experiencia</h2>
              </div>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {experiencia.map((e, i) => (
                  <li key={`${e.period}-${e.role}-${i}`} className="perfil-exp">
                    <span className="linea-fecha">{e.period}</span>
                    <div style={{ minWidth: 0 }}>
                      <strong>{e.role}</strong>
                      {e.detail && <div className="small text-secondary">{e.detail}</div>}
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setExperiencia((x) => x.filter((_, k) => k !== i))} aria-label={`Quitar ${e.role}`}>Quitar</button>
                  </li>
                ))}
                {experiencia.length === 0 && <li className="text-secondary small">Todavía no cargaste experiencia.</li>}
              </ul>
              <div className="perfil-par">
                <div>
                  <label htmlFor="exp-periodo" className="form-label fw-semibold">Período</label>
                  <input id="exp-periodo" className="form-control" value={nuevaExp.period} onChange={(e) => setNuevaExp({ ...nuevaExp, period: e.target.value })} placeholder="2024 — HOY" maxLength={30} />
                </div>
                <div>
                  <label htmlFor="exp-puesto" className="form-label fw-semibold">Puesto</label>
                  <input id="exp-puesto" className="form-control" value={nuevaExp.role} onChange={(e) => setNuevaExp({ ...nuevaExp, role: e.target.value })} maxLength={80} />
                </div>
              </div>
              <div>
                <label htmlFor="exp-detalle" className="form-label fw-semibold">Detalle <span className="fw-normal text-secondary small">Opcional</span></label>
                <input id="exp-detalle" className="form-control" value={nuevaExp.detail} onChange={(e) => setNuevaExp({ ...nuevaExp, detail: e.target.value })} maxLength={150} />
              </div>
              {errExp && <span className="campo-error">⚠ {errExp}</span>}
              <button type="button" className="btn btn-outline-primary align-self-start" onClick={agregarExperiencia}>+ Agregar experiencia</button>
            </section>
          </form>
        </div>

        {/* Vista previa en vivo (como se ve en el inicio) */}
        <aside aria-label="Vista previa" className="admin-split-lateral d-flex flex-column gap-2">
          <span className="rotulo text-secondary" style={{ fontSize: '0.6875rem' }}>VISTA PREVIA EN EL SITIO</span>
          <div className="perfil-preview">
            <div className="banda perfil-preview-hero">
              <span className="rotulo">{(form.title || 'Título').toUpperCase()}</span>
              <strong>{form.tagline || 'Tu frase del inicio'}</strong>
              <span className="small" style={{ opacity: 0.9 }}>Soy {form.name || 'tu nombre'}.</span>
            </div>
            <div className="guarda-fina" aria-hidden="true" />
            <div className="perfil-preview-stack">
              {stack.map((s) => (
                <span key={s} className="perfil-preview-chip">{s}</span>
              ))}
            </div>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="fw-semibold small">Ver el inicio completo ↗</a>
        </aside>
      </div>
    </div>
  )
}
