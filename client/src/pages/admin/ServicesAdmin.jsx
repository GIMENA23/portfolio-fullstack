// 🎨 DUEÑO: Integrante D — CRUD de servicios (panel de administrador).
// El listado ya viene de la API real (GET /services).
// Crear, editar y eliminar están pendientes de C (responden 501): mientras tanto
// los cambios se aplican solo en pantalla y se avisa con un cartel.
// Cuando C termine los endpoints, la página guarda de verdad sin tocar nada.

import { useEffect, useState } from 'react'
import { servicesApi } from '../../services/api.js'
import { GuardaLoader } from '../../animations/index.js'

// Límites iguales (o más estrictos) que server/src/models/Service.js
const LIMITES = {
  nombreMin: 3,
  nombreMax: 60,
  descMin: 10,
  descMax: 300,
  precioMax: 100_000_000,
  ordenMax: 999,
}

// Íconos que usa el sitio público (ver seed.js)
const ICONOS = {
  code: 'Código',
  server: 'Servidor',
  database: 'Base de datos',
  chat: 'Chat',
}

const TONOS = [['carmin', 'Carmín'], ['negro', 'Negro'], ['vicuna', 'Vicuña'], ['exito', 'Cardón']]

const VACIO = { name: '', description: '', icon: '', priceFrom: '', order: '', visible: true, color: '' }

const formatoPrecio = (n) =>
  n == null || n === ''
    ? '—'
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const ordenar = (lista) =>
  [...lista].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'es'))

export default function ServicesAdmin() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soloPantalla, setSoloPantalla] = useState(false) // true cuando la API respondió 501
  const [aviso, setAviso] = useState('')

  // Formulario: editandoId = null → crear; un id → editar; formAbierto controla si se ve
  const [formAbierto, setFormAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const [confirmarId, setConfirmarId] = useState(null) // fila con "¿Eliminar?" abierto
  const [eliminando, setEliminando] = useState(false)

  // 1. Traer servicios
  useEffect(() => {
    servicesApi
      .list()
      .then((data) => setServicios(ordenar(data.items ?? data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(''), 3500)
  }

  // 2. Validación (front). El back valida igual; sus errores se muestran en el campo.
  const validar = (f) => {
    const e = {}
    const nombre = f.name.trim()
    const desc = f.description.trim()

    if (!nombre) e.name = 'El nombre es obligatorio.'
    else if (nombre.length < LIMITES.nombreMin) e.name = `Mínimo ${LIMITES.nombreMin} caracteres.`
    else if (nombre.length > LIMITES.nombreMax) e.name = `Máximo ${LIMITES.nombreMax} caracteres.`
    else if (
      servicios.some((s) => s._id !== editandoId && s.name.trim().toLowerCase() === nombre.toLowerCase())
    )
      e.name = 'Ya existe un servicio con ese nombre.'

    if (!desc) e.description = 'La descripción es obligatoria.'
    else if (desc.length < LIMITES.descMin) e.description = `Mínimo ${LIMITES.descMin} caracteres.`
    else if (desc.length > LIMITES.descMax) e.description = `Máximo ${LIMITES.descMax} caracteres.`

    if (f.icon && !ICONOS[f.icon]) e.icon = 'Ícono no válido.'

    if (f.priceFrom !== '') {
      const p = Number(f.priceFrom)
      if (!Number.isInteger(p)) e.priceFrom = 'Ingresá un número entero, sin puntos ni comas.'
      else if (p < 0) e.priceFrom = 'El precio no puede ser negativo.'
      else if (p > LIMITES.precioMax) e.priceFrom = 'El precio es demasiado alto.'
    }

    if (f.order !== '') {
      const o = Number(f.order)
      if (!Number.isInteger(o) || o < 0 || o > LIMITES.ordenMax)
        e.order = `Debe ser un número entero entre 0 y ${LIMITES.ordenMax}.`
    }
    return e
  }

  // Convierte el formulario (todo texto) al formato del modelo
  const aDatos = (f) => {
    const datos = {
      name: f.name.trim(),
      description: f.description.trim(),
      visible: f.visible,
      order: f.order === '' ? 0 : Number(f.order),
    }
    if (f.icon) datos.icon = f.icon
    if (f.color) datos.color = f.color // TODO (C): guardar el color del ícono en el modelo Service
    if (f.priceFrom !== '') datos.priceFrom = Number(f.priceFrom)
    return datos
  }

  // 3. Abrir / cerrar formulario
  const abrirNuevo = () => {
    setEditandoId(null)
    setForm({ ...VACIO, order: String(servicios.length + 1) })
    setErrores({})
    setFormAbierto(true)
  }

  const abrirEditar = (s) => {
    setEditandoId(s._id)
    setForm({
      name: s.name,
      description: s.description,
      icon: s.icon ?? '',
      priceFrom: s.priceFrom ?? '',
      order: s.order ?? '',
      visible: s.visible ?? true,
      color: s.color ?? '',
    })
    setErrores({})
    setConfirmarId(null)
    setFormAbierto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cerrarForm = () => {
    setFormAbierto(false)
    setEditandoId(null)
    setErrores({})
  }

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target
    const nuevo = { ...form, [name]: type === 'checkbox' ? checked : value }
    setForm(nuevo)
    // Si el campo ya tenía error, revalidamos mientras escribe
    if (errores[name]) setErrores({ ...errores, [name]: validar(nuevo)[name] })
  }

  // 4. Guardar (crear o editar)
  const guardar = async (e) => {
    e.preventDefault()
    const problemas = validar(form)
    setErrores(problemas)
    if (Object.keys(problemas).length > 0) return

    const datos = aDatos(form)
    setGuardando(true)
    try {
      if (editandoId) {
        const actualizado = await servicesApi.update(editandoId, datos)
        setServicios(
          ordenar(servicios.map((s) => (s._id === editandoId ? (actualizado?._id ? actualizado : { ...s, ...datos }) : s))),
        )
        mostrarAviso('Servicio actualizado.')
      } else {
        const creado = await servicesApi.create(datos)
        if (creado?._id) setServicios(ordenar([...servicios, creado]))
        else setServicios(await servicesApi.list().then((d) => ordenar(d.items ?? d)))
        mostrarAviso('Servicio creado.')
      }
      cerrarForm()
    } catch (err) {
      if (err.status === 501) {
        // Endpoint pendiente de C: aplicamos el cambio solo en pantalla
        setSoloPantalla(true)
        if (editandoId) {
          setServicios(ordenar(servicios.map((s) => (s._id === editandoId ? { ...s, ...datos } : s))))
        } else {
          setServicios(ordenar([...servicios, { _id: `local-${Date.now()}`, ...datos }]))
        }
        mostrarAviso('Cambio aplicado solo en pantalla (la API todavía no guarda).')
        cerrarForm()
      } else if (err.details?.length) {
        // Errores de validación del back → al campo correspondiente
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

  // 5. Eliminar (con confirmación en la misma fila)
  const eliminar = async (id) => {
    setEliminando(true)
    try {
      await servicesApi.remove(id)
      mostrarAviso('Servicio eliminado.')
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
    setServicios(servicios.filter((s) => s._id !== id))
    if (editandoId === id) cerrarForm()
    setConfirmarId(null)
    setEliminando(false)
  }

  // 6. Reordenar: intercambia el campo `order` de dos servicios vecinos y guarda ambos
  const mover = async (s, dir) => {
    const i = servicios.findIndex((x) => x._id === s._id)
    const otro = servicios[i + dir]
    if (!otro) return
    const ordenS = i + dir + 1
    const ordenOtro = i + 1
    const cuerpo = (x, order) => {
      const d = { name: x.name, description: x.description, order, visible: x.visible ?? true }
      if (x.icon) d.icon = x.icon
      if (x.priceFrom != null && x.priceFrom !== '') d.priceFrom = x.priceFrom
      return d
    }
    const aplicar = () =>
      setServicios(ordenar(servicios.map((x) => (x._id === s._id ? { ...x, order: ordenS } : x._id === otro._id ? { ...x, order: ordenOtro } : x))))
    try {
      await Promise.all([servicesApi.update(s._id, cuerpo(s, ordenS)), servicesApi.update(otro._id, cuerpo(otro, ordenOtro))])
      aplicar()
      mostrarAviso('Orden actualizado.')
    } catch (err) {
      if (err.status === 501) {
        setSoloPantalla(true)
        aplicar()
        mostrarAviso('Orden cambiado solo en pantalla (la API todavía no guarda).')
      } else {
        setError(err.message)
      }
    }
  }

  // --- Render ---
  const largoDesc = form.description.trim().length

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <div className="me-auto">
          <span className="rotulo">{servicios.length} SERVICIOS · EL ORDEN ES EL DEL SITIO</span>
          <h1 className="h2 mb-0">Servicios</h1>
        </div>
        <a href="/servicios" className="small fw-semibold">Ver en el sitio ↗</a>
        {!formAbierto && (
          <button type="button" className="btn btn-primary" onClick={abrirNuevo} disabled={loading}>
            + Nuevo servicio
          </button>
        )}
      </div>

      {soloPantalla && (
        <div className="alert alert-warning">
          La API todavía no guarda servicios (pendiente de C). Los cambios se ven acá pero se
          pierden al recargar.
        </div>
      )}
      {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-split">
        <div className="admin-split-main">
          {loading && <GuardaLoader texto="Cargando servicios…" />}

          {!loading && !error && servicios.length === 0 && (
            <div className="alert alert-light border">Todavía no hay servicios cargados.</div>
          )}
          {!loading && servicios.length > 0 && (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Orden</th>
                    <th>Servicio</th>
                    <th className="d-none d-lg-table-cell">Precio desde</th>
                    <th>Visible</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.map((s, idx) => (
                    <tr key={s._id} className={editandoId === s._id ? 'table-active' : ''}>
                      <td>
                        <div className="d-flex gap-1">
                          <button type="button" className="btn btn-sm btn-outline-secondary px-2" onClick={() => mover(s, -1)} disabled={idx === 0} aria-label={`Subir ${s.name}`}>▲</button>
                          <button type="button" className="btn btn-sm btn-outline-secondary px-2" onClick={() => mover(s, 1)} disabled={idx === servicios.length - 1} aria-label={`Bajar ${s.name}`}>▼</button>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-start gap-2">
                          <span className={`servicio-icono tono-${s.color || TONOS[idx % TONOS.length][0]}`} style={{ width: 32, height: 32 }} aria-hidden="true" />
                          <div>
                            <div className="fw-semibold">{s.name}</div>
                            <div className="small text-muted">{s.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell text-nowrap">{formatoPrecio(s.priceFrom)}</td>
                      <td>
                        <span className={`estado ${s.visible === false ? 'estado-cerrada' : 'estado-respondida'}`}>
                          <span aria-hidden="true">{s.visible === false ? '–' : '✓'}</span> {s.visible === false ? 'Oculto' : 'Visible'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap justify-content-end align-items-center gap-1">
                          {confirmarId === s._id ? (
                            <>
                              <span className="small text-nowrap">¿Eliminar «{s.name}»?</span>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => eliminar(s._id)} disabled={eliminando}>Eliminar</button>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmarId(null)} disabled={eliminando}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEditar(s)}>Editar</button>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setConfirmarId(s._id)} aria-label={`Eliminar ${s.name}`}>Eliminar</button>
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
        <form className={`card admin-form ${editandoId ? 'modo-editando' : 'modo-nuevo'}`} onSubmit={guardar} noValidate aria-label={editandoId ? 'Editar servicio' : 'Nuevo servicio'}>
          <div className="admin-modo d-flex justify-content-between align-items-start gap-2">
            <div style={{ minWidth: 0 }}>
              <span className="admin-modo-badge">{editandoId ? 'EDITANDO' : 'NUEVO'}</span>
              <h2 className="mb-0 text-truncate">{editandoId ? `Editando: ${form.name || '…'}` : 'Nuevo servicio'}</h2>
            </div>
            <button type="button" className="btn-close" onClick={cerrarForm} aria-label="Cerrar formulario" disabled={guardando} />
          </div>
          <div className="card-body">
            {errores.general && <div className="alert alert-danger">{errores.general}</div>}

            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="name" className="form-label">Nombre *</label>
                <input
                  id="name"
                  name="name"
                  className={`form-control ${errores.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={cambiar}
                  maxLength={LIMITES.nombreMax}
                  autoFocus
                />
                {errores.name && <div className="invalid-feedback">{errores.name}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="icon" className="form-label">Ícono</label>
                <select
                  id="icon"
                  name="icon"
                  className={`form-select ${errores.icon ? 'is-invalid' : ''}`}
                  value={form.icon}
                  onChange={cambiar}
                >
                  <option value="">Sin ícono</option>
                  {Object.entries(ICONOS).map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
                {errores.icon && <div className="invalid-feedback">{errores.icon}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="description" className="form-label">Descripción *</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className={`form-control ${errores.description ? 'is-invalid' : ''}`}
                  value={form.description}
                  onChange={cambiar}
                  maxLength={LIMITES.descMax}
                  aria-describedby="desc-ayuda"
                />
                {errores.description && <div className="invalid-feedback">{errores.description}</div>}
                <div id="desc-ayuda" className="form-text">
                  {largoDesc}/{LIMITES.descMax} · mínimo {LIMITES.descMin}
                </div>
              </div>

              <div className="col-6 col-md-4">
                <label htmlFor="priceFrom" className="form-label">Precio desde (ARS)</label>
                <input
                  id="priceFrom"
                  name="priceFrom"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className={`form-control ${errores.priceFrom ? 'is-invalid' : ''}`}
                  value={form.priceFrom}
                  onChange={cambiar}
                  placeholder="Opcional"
                />
                {errores.priceFrom && <div className="invalid-feedback">{errores.priceFrom}</div>}
              </div>

              <div className="col-6 col-md-4">
                <label htmlFor="order" className="form-label">Orden</label>
                <input
                  id="order"
                  name="order"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={LIMITES.ordenMax}
                  step="1"
                  className={`form-control ${errores.order ? 'is-invalid' : ''}`}
                  value={form.order}
                  onChange={cambiar}
                />
                {errores.order && <div className="invalid-feedback">{errores.order}</div>}
              </div>

              <fieldset className="col-12 border-0 p-0 m-0">
                <legend className="form-label fs-6">Color del ícono</legend>
                <div className="d-flex gap-2">
                  {TONOS.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`muestra-tono tono-${id} ${form.color === id ? 'on' : ''}`}
                      aria-label={label}
                      aria-pressed={form.color === id}
                      onClick={() => setForm({ ...form, color: id })}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="col-12 d-flex align-items-end">
                <div className="form-check form-switch mb-2">
                  <input
                    id="visible"
                    name="visible"
                    type="checkbox"
                    role="switch"
                    className="form-check-input"
                    checked={form.visible}
                    onChange={cambiar}
                  />
                  <label htmlFor="visible" className="form-check-label">Visible en el sitio</label>
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-4">
              {Object.keys(errores).some((k) => errores[k]) && <span className="campo-error me-auto">Revisá los campos marcados.</span>}
              <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
          ) : (
            <div className="admin-vacio">
              <strong>Ningún servicio seleccionado</strong>
              <span>Tocá «Editar» en un servicio o creá uno nuevo.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
