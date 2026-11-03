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
    const datos = { ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])), stack }
    if (!fotoNueva) return datos
    const fd = new FormData()
    Object.entries(datos).forEach(([k, v]) => {
      if (k === 'stack') v.forEach((s) => fd.append('stack', s))
      else fd.append(k, v)
    })
    fd.append('photo', fotoNueva.file)
    return fd
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
  const campo = (name, label, props = {}) => (
    <div className={props.col ?? 'col-12 col-md-6'}>
      <label htmlFor={name} className="form-label fw-medium">{label}</label>
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
      {props.ayuda && <div className="form-text">{props.ayuda}</div>}
    </div>
  )

  return (
    <div>
      <span className="rotulo">LO QUE EDITES ACÁ SE VE EN EL SITIO</span>
      <h1 className="h2 mb-3">Mi perfil</h1>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <form onSubmit={guardar} noValidate>
            <ResumenErrores errores={errores} etiquetas={ETIQUETAS} />
            {errores.general && <div className="alert alert-danger" role="alert">⚠ {errores.general}</div>}
            {aviso && (
              <div className="alert alert-success" role="status">
                ✓ {aviso}
                {soloPantalla && <span className="d-block small">Modo prueba: el cambio se ve solo en pantalla (la API todavía no guarda).</span>}
              </div>
            )}

            <div className="row g-3">
              {campo('name', 'Nombre', { input: { maxLength: 60, autoComplete: 'name' } })}
              {campo('title', 'Título', { input: { maxLength: 60 } })}
              {campo('tagline', 'Frase del inicio', { col: 'col-12', input: { maxLength: 60 }, ayuda: `${form.tagline.length}/60` })}

              <div className="col-12">
                <div className="d-flex justify-content-between">
                  <label htmlFor="bio" className="form-label fw-medium">Presentación</label>
                  <small className="text-muted">{form.bio.length}/400</small>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  maxLength={400}
                  className={`form-control ${errores.bio ? 'is-invalid' : ''}`}
                  value={form.bio}
                  onChange={cambiar}
                  disabled={guardando}
                />
                {errores.bio && <div className="invalid-feedback">{errores.bio}</div>}
                <div className="form-text">Entre 40 y 400 caracteres.</div>
              </div>

              {campo('email', 'Email', { input: { type: 'email', maxLength: 120 } })}
              {campo('location', 'Ubicación', { input: { maxLength: 60 } })}
              {campo('github', 'GitHub (opcional)', { input: { placeholder: 'https://github.com/usuario', maxLength: 100 } })}
              {campo('linkedin', 'LinkedIn (opcional)', { input: { placeholder: 'https://linkedin.com/in/usuario', maxLength: 120 } })}

              <div className="col-12">
                <label htmlFor="chip" className="form-label fw-medium">Stack ({stack.length}/{LIMITES.stackMax})</label>
                <div className="input-group has-validation">
                  <input
                    id="chip"
                    className={`form-control ${errores.stack ? 'is-invalid' : ''}`}
                    value={chip}
                    onChange={(e) => setChip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        agregarChip()
                      }
                    }}
                    placeholder="Ej: React"
                    maxLength={LIMITES.stackItemMax}
                    disabled={guardando}
                  />
                  <button type="button" className="btn btn-outline-primary" onClick={agregarChip} disabled={guardando}>Agregar</button>
                  {errores.stack && <div className="invalid-feedback">{errores.stack}</div>}
                </div>
                <ul className="list-unstyled d-flex flex-wrap gap-2 mt-2 mb-0">
                  {stack.map((s) => (
                    <li key={s} className="badge text-bg-secondary d-inline-flex align-items-center gap-2">
                      {s}
                      <button type="button" className="btn-close btn-close-white" style={{ fontSize: '0.5rem' }} onClick={() => quitarChip(s)} aria-label={`Quitar ${s}`} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-12">
                <label htmlFor="photo" className="form-label fw-medium">Foto (opcional)</label>
                <input
                  id="photo"
                  ref={inputFoto}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className={`form-control ${errores.photo ? 'is-invalid' : ''}`}
                  onChange={elegirFoto}
                  disabled={guardando}
                  aria-describedby="photo-ayuda"
                />
                {errores.photo && <div className="invalid-feedback">{errores.photo}</div>}
                <div id="photo-ayuda" className="form-text">JPG, PNG o WebP · máximo 2 MB.</div>
                {fotoNueva && (
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={quitarFoto}>Quitar la foto elegida</button>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar perfil'}
            </button>
          </form>
        </div>

        {/* Vista previa en vivo del hero */}
        <div className="col-12 col-xl-5">
          <div className="position-sticky" style={{ top: '1rem' }}>
            <p className="rotulo mb-2">Vista previa del inicio</p>
            <div className="card">
              <div className="card-body p-4 text-center text-lg-start">
                {foto && (
                  <img src={foto} alt="" className="rounded-circle border mb-3" style={{ width: 96, height: 96, objectFit: 'cover' }} />
                )}
                <p className="rotulo mb-2">
                  {(form.title || 'Título').toUpperCase()} · {(form.location || 'Ubicación').split(',')[0].toUpperCase()}
                </p>
                <p className="fs-5 text-muted mb-2">Hola, soy {form.name || 'tu nombre'}</p>
                <p className="h2 mb-3">{form.tagline || 'Tu frase del inicio'}</p>
                <p className="text-secondary mb-3">{form.bio || 'Tu presentación aparece acá.'}</p>
                <ul className="list-unstyled d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start mb-0">
                  {stack.map((s) => (
                    <li key={s} className="badge text-bg-secondary">{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
