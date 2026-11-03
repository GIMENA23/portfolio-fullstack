import { useEffect, useRef, useState } from 'react'
import { projectsApi } from '../../services/api.js'
import { GuardaLoader } from '../../animations'

const LIMITES = {
  tituloMin: 3,
  tituloMax: 80,
  resumenMax: 200,
  descMin: 20,
  descMax: 3000,
  stackMax: 10,
  tecMax: 30,
  imagenesMax: 5,
  pesoMax: 2 * 1024 * 1024,
}
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const URL_VALIDA = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/

const TONOS = ['tono-carmin', 'tono-negro', 'tono-vicuna', 'tono-exito', 'tono-oro', 'tono-suave']

const VACIO = {
  title: '',
  summary: '',
  description: '',
  stack: '',
  demoUrl: '',
  repoUrl: '',
  featured: false,
  visible: true,
}

const aStack = (texto) =>
  texto
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

const pesoLegible = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const esImagenReal = (url) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = url
  })

export default function ProjectsAdmin() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soloPantalla, setSoloPantalla] = useState(false)
  const [aviso, setAviso] = useState('')

  const [formAbierto, setFormAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [existentes, setExistentes] = useState([])
  const [nuevas, setNuevas] = useState([])
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const inputArchivos = useRef(null)

  const [confirmarId, setConfirmarId] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    projectsApi
      .list({ all: 'true' })
      .then((data) => setProyectos(data.items ?? data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(''), 3500)
  }

  const validar = (f, imagenes = existentes.length + nuevas.length) => {
    const e = {}
    const titulo = f.title.trim()
    const resumen = f.summary.trim()
    const desc = f.description.trim()
    const stack = aStack(f.stack)

    if (!titulo) e.title = 'El título es obligatorio.'
    else if (titulo.length < LIMITES.tituloMin) e.title = `Mínimo ${LIMITES.tituloMin} caracteres.`
    else if (titulo.length > LIMITES.tituloMax) e.title = `Máximo ${LIMITES.tituloMax} caracteres.`

    if (!resumen) e.summary = 'El resumen es obligatorio.'
    else if (resumen.length > LIMITES.resumenMax) e.summary = `Máximo ${LIMITES.resumenMax} caracteres.`

    if (!desc) e.description = 'La descripción es obligatoria.'
    else if (desc.length < LIMITES.descMin) e.description = `Mínimo ${LIMITES.descMin} caracteres.`
    else if (desc.length > LIMITES.descMax) e.description = `Máximo ${LIMITES.descMax} caracteres.`

    if (stack.length === 0) e.stack = 'Indicá al menos una tecnología.'
    else if (stack.length > LIMITES.stackMax) e.stack = `Máximo ${LIMITES.stackMax} tecnologías.`
    else if (stack.some((t) => t.length > LIMITES.tecMax)) e.stack = `Cada tecnología puede tener hasta ${LIMITES.tecMax} caracteres.`
    else if (new Set(stack.map((t) => t.toLowerCase())).size !== stack.length) e.stack = 'Hay tecnologías repetidas.'

    if (f.demoUrl.trim() && !URL_VALIDA.test(f.demoUrl.trim())) e.demoUrl = 'Ingresá una URL que empiece con http:// o https://'
    if (f.repoUrl.trim() && !URL_VALIDA.test(f.repoUrl.trim())) e.repoUrl = 'Ingresá una URL que empiece con http:// o https://'

    if (imagenes > LIMITES.imagenesMax) e.images = `Máximo ${LIMITES.imagenesMax} imágenes por proyecto.`
    return e
  }

  const elegirImagenes = async (e) => {
    const archivos = [...e.target.files]
    e.target.value = ''
    const lugar = LIMITES.imagenesMax - existentes.length - nuevas.length
    const problemas = []
    const aceptadas = []

    for (const file of archivos) {
      if (aceptadas.length >= lugar) {
        problemas.push(`Se alcanzó el máximo de ${LIMITES.imagenesMax} imágenes.`)
        break
      }
      if (!TIPOS_IMAGEN.includes(file.type)) {
        problemas.push(`"${file.name}": solo se permiten JPG, PNG o WebP.`)
        continue
      }
      if (file.size > LIMITES.pesoMax) {
        problemas.push(`"${file.name}" pesa ${pesoLegible(file.size)} (máximo 2 MB).`)
        continue
      }
      const url = URL.createObjectURL(file)
      if (!(await esImagenReal(url))) {
        URL.revokeObjectURL(url)
        problemas.push(`"${file.name}" no es una imagen válida.`)
        continue
      }
      aceptadas.push({ file, url })
    }

    setNuevas((n) => [...n, ...aceptadas])
    setErrores((er) => ({ ...er, images: problemas.join(' ') || undefined }))
  }

  const quitarNueva = (url) => {
    URL.revokeObjectURL(url)
    setNuevas((n) => n.filter((x) => x.url !== url))
  }

  const quitarExistente = (url) => setExistentes((x) => x.filter((u) => u !== url))

  const limpiarNuevas = () => {
    nuevas.forEach((n) => URL.revokeObjectURL(n.url))
    setNuevas([])
  }

  const abrirNuevo = () => {
    limpiarNuevas()
    setEditandoId(null)
    setForm(VACIO)
    setExistentes([])
    setErrores({})
    setConfirmarId(null)
    setFormAbierto(true)
  }

  const abrirEditar = (p) => {
    limpiarNuevas()
    setEditandoId(p._id)
    setForm({
      title: p.title ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      stack: (p.stack ?? []).join(', '),
      demoUrl: p.demoUrl ?? '',
      repoUrl: p.repoUrl ?? '',
      featured: !!p.featured,
      visible: p.visible ?? true,
    })
    setExistentes(p.images ?? [])
    setErrores({})
    setConfirmarId(null)
    setFormAbierto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarForm = () => {
    limpiarNuevas()
    setFormAbierto(false)
    setEditandoId(null)
    setErrores({})
  }

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target
    const nuevo = { ...form, [name]: type === 'checkbox' ? checked : value }
    setForm(nuevo)
    if (errores[name]) setErrores({ ...errores, [name]: validar(nuevo)[name] })
  }

  const armarFormData = () => {
    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('summary', form.summary.trim())
    fd.append('description', form.description.trim())
    fd.append('demoUrl', form.demoUrl.trim())
    fd.append('repoUrl', form.repoUrl.trim())
    fd.append('featured', String(form.featured))
    fd.append('visible', String(form.visible))
    aStack(form.stack).forEach((t) => fd.append('stack', t))
    existentes.forEach((u) => fd.append('keepImages', u))
    nuevas.forEach(({ file }) => fd.append('images', file))
    return fd
  }

  const guardar = async (e) => {
    e.preventDefault()
    const problemas = validar(form)
    setErrores(problemas)
    if (Object.keys(problemas).length > 0) return

    setGuardando(true)
    try {
      const fd = armarFormData()
      const data = editandoId ? await projectsApi.update(editandoId, fd) : await projectsApi.create(fd)
      const lista = await projectsApi.list({ all: 'true' })
      setProyectos(lista.items ?? lista)
      mostrarAviso(editandoId ? 'Proyecto actualizado.' : `Proyecto "${data?.title ?? form.title.trim()}" creado.`)
      cerrarForm()
    } catch (err) {
      if (err.status === 501) { // datos de prueba
        setSoloPantalla(true)
        const local = {
          title: form.title.trim(),
          summary: form.summary.trim(),
          description: form.description.trim(),
          stack: aStack(form.stack),
          demoUrl: form.demoUrl.trim(),
          repoUrl: form.repoUrl.trim(),
          featured: form.featured,
          visible: form.visible,
          images: [...existentes, ...nuevas.map((n) => n.url)],
        }
        setProyectos((ps) =>
          editandoId
            ? ps.map((p) => (p._id === editandoId ? { ...p, ...local } : p))
            : [{ _id: `local-${Date.now()}`, createdAt: new Date().toISOString(), ...local }, ...ps],
        )
        mostrarAviso('Cambio aplicado solo en pantalla (la API todavía no guarda).')
        setNuevas([])
        setFormAbierto(false)
        setEditandoId(null)
      } else if (err.details?.length) {
        const delBack = {}
        err.details.forEach((d) => (delBack[d.field] = d.message))
        setErrores(delBack)
      } else {
        setErrores({ general: err.message })
      }
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    setEliminando(true)
    try {
      await projectsApi.remove(id)
      mostrarAviso('Proyecto eliminado.')
    } catch (err) {
      if (err.status !== 501) {
        setError(err.message)
        setEliminando(false)
        setConfirmarId(null)
        return
      }
      setSoloPantalla(true)
      mostrarAviso('Eliminado solo en pantalla (la API todavía no guarda).')
    }
    setProyectos((ps) => ps.filter((p) => p._id !== id))
    if (editandoId === id) cerrarForm()
    setConfirmarId(null)
    setEliminando(false)
  }

  const totalImagenes = existentes.length + nuevas.length
  const campo = (name) => `form-control ${errores[name] ? 'is-invalid' : ''}`

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <div className="me-auto">
          <span className="rotulo">{proyectos.length} PROYECTOS · {proyectos.filter((p) => p.visible !== false).length} VISIBLES</span>
          <h1 className="h2 mb-0">Proyectos y demos</h1>
        </div>
        {!formAbierto && (
          <button type="button" className="btn btn-primary" onClick={abrirNuevo} disabled={loading}>
            + Nuevo proyecto
          </button>
        )}
      </div>

      {soloPantalla && (
        <div className="alert alert-warning">
          La API todavía no guarda proyectos (pendiente de C). Los cambios se ven acá pero se
          pierden al recargar.
        </div>
      )}
      {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-split">
        <div className="admin-split-main">
          {loading && <GuardaLoader texto="Cargando proyectos…" />}

          {!loading && !error && proyectos.length === 0 && (
            <div className="alert alert-light border">Todavía no hay proyectos cargados.</div>
          )}

          {!loading && proyectos.length > 0 && (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}><span className="visually-hidden">Imagen</span></th>
                    <th>Proyecto</th>
                    <th className="d-none d-lg-table-cell">Stack</th>
                    <th>Visible</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map((p, idx) => (
                    <tr key={p._id} className={editandoId === p._id ? 'table-active' : ''}>
                      <td>
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="border" style={{ width: 64, height: 48, objectFit: 'cover' }} />
                        ) : (
                          <span className={`foto-proyecto foto-mini ${TONOS[idx % TONOS.length]}`} aria-hidden="true">
                            <span>{String(idx + 1).padStart(2, '0')}</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold">{p.title}</div>
                        <div className="small text-muted">{p.summary}</div>
                      </td>
                      <td className="d-none d-lg-table-cell small">{(p.stack ?? []).join(' · ')}</td>
                      <td>
                        <span className={`estado ${p.visible === false ? 'estado-cerrada' : 'estado-respondida'}`}>
                          <span aria-hidden="true">{p.visible === false ? '–' : '✓'}</span> {p.visible === false ? 'Oculto' : 'Visible'}
                        </span>
                        {p.featured && <span className="estado estado-en-proceso ms-1"><span aria-hidden="true">★</span> Destacado</span>}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap justify-content-end align-items-center gap-1">
                          {confirmarId === p._id ? (
                            <>
                              <span className="small text-nowrap">¿Eliminar «{p.title}»?</span>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => eliminar(p._id)} disabled={eliminando}>Eliminar</button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmarId(null)} disabled={eliminando}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEditar(p)}>Editar</button>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setConfirmarId(p._id)} aria-label={`Eliminar ${p.title}`}>Eliminar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <aside className="admin-split-lateral">
          {formAbierto ? (
        <form className={`card admin-form ${editandoId ? 'modo-editando' : 'modo-nuevo'}`} onSubmit={guardar} noValidate aria-label={editandoId ? 'Editar proyecto' : 'Nuevo proyecto'}>
          <div className="admin-modo d-flex justify-content-between align-items-start gap-2">
            <div style={{ minWidth: 0 }}>
              <span className="admin-modo-badge">{editandoId ? 'EDITANDO' : 'NUEVO'}</span>
              <h2 className="mb-0">{editandoId ? `Editando · ${form.title || '…'}` : 'Nuevo proyecto'}</h2>
              <span className="admin-modo-sub">{editandoId ? 'Los cambios se ven en el sitio al guardar.' : 'Completá los campos con * para poder crearlo.'}</span>
            </div>
            <button type="button" className="btn-close" onClick={cerrarForm} aria-label="Cerrar formulario" disabled={guardando} />
          </div>
          <div className="card-body">
            {errores.general && <div className="alert alert-danger">{errores.general}</div>}

            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="title" className="form-label">Título *</label>
                <input id="title" name="title" className={campo('title')} value={form.title} onChange={cambiar} maxLength={LIMITES.tituloMax} autoFocus />
                {errores.title && <div className="invalid-feedback">{errores.title}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="stack" className="form-label">Tecnologías *</label>
                <input id="stack" name="stack" className={campo('stack')} value={form.stack} onChange={cambiar} placeholder="React, Express, MongoDB" aria-describedby="stack-ayuda" />
                {errores.stack ? (
                  <div className="invalid-feedback">{errores.stack}</div>
                ) : (
                  <div id="stack-ayuda" className="form-text">Separadas por coma.</div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="summary" className="form-label">Resumen *</label>
                <input id="summary" name="summary" className={campo('summary')} value={form.summary} onChange={cambiar} maxLength={LIMITES.resumenMax} aria-describedby="summary-ayuda" />
                {errores.summary && <div className="invalid-feedback">{errores.summary}</div>}
                <div id="summary-ayuda" className="form-text">
                  Se ve en la tarjeta del proyecto · {form.summary.trim().length}/{LIMITES.resumenMax}
                </div>
              </div>

              <div className="col-12">
                <label htmlFor="description" className="form-label">Descripción *</label>
                <textarea id="description" name="description" rows={4} className={campo('description')} value={form.description} onChange={cambiar} maxLength={LIMITES.descMax} aria-describedby="desc-ayuda" />
                {errores.description && <div className="invalid-feedback">{errores.description}</div>}
                <div id="desc-ayuda" className="form-text">
                  {form.description.trim().length}/{LIMITES.descMax} · mínimo {LIMITES.descMin}
                </div>
              </div>

              <div className="col-12">
                <label htmlFor="demoUrl" className="form-label">URL de la demo</label>
                <input id="demoUrl" name="demoUrl" type="url" className={campo('demoUrl')} value={form.demoUrl} onChange={cambiar} placeholder="https://…" />
                {errores.demoUrl && <div className="invalid-feedback">{errores.demoUrl}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="repoUrl" className="form-label">URL del repositorio</label>
                <input id="repoUrl" name="repoUrl" type="url" className={campo('repoUrl')} value={form.repoUrl} onChange={cambiar} placeholder="https://github.com/…" />
                {errores.repoUrl && <div className="invalid-feedback">{errores.repoUrl}</div>}
              </div>

              <div className="col-12">
                <span className="form-label d-block">Imágenes ({totalImagenes}/{LIMITES.imagenesMax})</span>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {existentes.map((url) => (
                    <figure key={url} className="position-relative mb-0">
                      <img src={url} alt="" className="rounded border" style={{ width: 120, height: 80, objectFit: 'cover' }} />
                      <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 py-0 px-2" style={{ minHeight: 0 }} onClick={() => quitarExistente(url)} aria-label="Quitar imagen">×</button>
                    </figure>
                  ))}
                  {nuevas.map(({ url, file }) => (
                    <figure key={url} className="position-relative mb-0">
                      <img src={url} alt={file.name} className="rounded border" style={{ width: 120, height: 80, objectFit: 'cover' }} />
                      <figcaption className="small text-muted text-truncate" style={{ maxWidth: 120 }}>
                        {pesoLegible(file.size)} · nueva
                      </figcaption>
                      <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 py-0 px-2" style={{ minHeight: 0 }} onClick={() => quitarNueva(url)} aria-label={`Quitar ${file.name}`}>×</button>
                    </figure>
                  ))}
                </div>
                <input
                  ref={inputArchivos}
                  id="images"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  className={`form-control ${errores.images ? 'is-invalid' : ''}`}
                  onChange={elegirImagenes}
                  disabled={totalImagenes >= LIMITES.imagenesMax}
                  aria-describedby="images-ayuda"
                />
                {errores.images && <div className="invalid-feedback">{errores.images}</div>}
                <div id="images-ayuda" className="form-text">JPG, PNG o WebP · máximo 2 MB cada una.</div>
              </div>

              <div className="col-12 d-flex flex-wrap gap-4">
                <div className="form-check form-switch">
                  <input id="featured" name="featured" type="checkbox" role="switch" className="form-check-input" checked={form.featured} onChange={cambiar} />
                  <label htmlFor="featured" className="form-check-label">Destacado en el inicio</label>
                </div>
                <div className="form-check form-switch">
                  <input id="visible" name="visible" type="checkbox" role="switch" className="form-check-input" checked={form.visible} onChange={cambiar} />
                  <label htmlFor="visible" className="form-check-label">Visible en el sitio</label>
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-4">
              {Object.keys(errores).some((k) => errores[k]) && <span className="campo-error me-auto">Revisá los campos marcados.</span>}
              <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
          ) : (
            <div className="admin-vacio">
              <strong>Ningún proyecto seleccionado</strong>
              <span>Tocá «Editar» en un proyecto de la tabla o creá uno nuevo.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
