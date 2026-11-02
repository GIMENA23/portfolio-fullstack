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

const VACIO = { name: '', description: '', icon: '', priceFrom: '', order: '', visible: true }

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

  // --- Render ---
  const largoDesc = form.description.trim().length

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0 me-auto">Servicios</h1>
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

      {/* Formulario crear / editar */}
      {formAbierto && (
        <form className="card mb-4" onSubmit={guardar} noValidate>
          <div className="card-body">
            <h2 className="h5 mb-3">{editandoId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
            {errores.general && <div className="alert alert-danger">{errores.general}</div>}

            <div className="row g-3">
              <div className="col-12 col-md-8">
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

              <div className="col-12 col-md-4">
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

              <div className="col-12 col-md-4 d-flex align-items-end">
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

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary" onClick={cerrarForm} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear servicio'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Listado */}
      {loading && <GuardaLoader texto="Cargando servicios…" />}

      {!loading && !error && servicios.length === 0 && (
        <div className="alert alert-light border">Todavía no hay servicios cargados.</div>
      )}

      {!loading && servicios.length > 0 && (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th className="text-center">#</th>
                <th>Servicio</th>
                <th className="d-none d-md-table-cell">Precio desde</th>
                <th className="d-none d-sm-table-cell">Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s._id} className={editandoId === s._id ? 'table-active' : ''}>
                  <td className="text-center text-muted small">{s.order ?? '—'}</td>
                  <td>
                    <div className="fw-semibold">{s.name}</div>
                    <div className="small text-muted">{s.description}</div>
                    <div className="small d-md-none mt-1">
                      Desde {formatoPrecio(s.priceFrom)}
                      {s.visible === false && <span className="badge text-bg-secondary ms-2 d-sm-none">Oculto</span>}
                    </div>
                  </td>
                  <td className="d-none d-md-table-cell text-nowrap">{formatoPrecio(s.priceFrom)}</td>
                  <td className="d-none d-sm-table-cell">
                    {s.visible === false ? (
                      <span className="badge text-bg-secondary">Oculto</span>
                    ) : (
                      <span className="badge text-bg-success">Visible</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex flex-column flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-1">
                    {confirmarId === s._id ? (
                      <>
                        <span className="small text-nowrap">¿Eliminar?</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminar(s._id)}
                          disabled={eliminando}
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setConfirmarId(null)}
                          disabled={eliminando}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => abrirEditar(s)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setConfirmarId(s._id)}
                        >
                          Eliminar
                        </button>
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
  )
}
