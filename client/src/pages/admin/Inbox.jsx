import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inquiriesApi } from '../../services/api.js'
import { mockInquiries } from './mockInquiries.js'
import { TIPOS, ESTADOS, formatoFecha } from './inquiryLabels.js'

const POR_PAGINA = 8
const hoy = () => new Date().toISOString().slice(0, 10)

export default function Inbox() {
  const navigate = useNavigate()
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', q: '', desde: '', hasta: '', page: 1 })
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [errorFechas, setErrorFechas] = useState('')

  useEffect(() => {
    if (errorFechas || usandoMock) return
    inquiriesApi
      .list(filtros)
      .then((data) => { // datos reales
        setConsultas(data.items ?? data)
        setTotalPaginas(data.pages ?? 1)
        setUsandoMock(false)
        setError('')
      })
      .catch((err) => {
        if (err.status === 501) { // datos de prueba
          setConsultas(mockInquiries)
          setUsandoMock(true)
          setError('')
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [filtros, errorFechas, usandoMock])

  const texto = filtros.q.toLowerCase()
  let visibles = consultas
  let paginas = totalPaginas
  let pagina = filtros.page
  if (usandoMock) { // datos de prueba
    const filtradas = consultas
      .filter((c) => {
        const fecha = c.createdAt.slice(0, 10)
        return (
          (!filtros.tipo || c.type === filtros.tipo) &&
          (!filtros.estado || c.status === filtros.estado) &&
          (!filtros.desde || fecha >= filtros.desde) &&
          (!filtros.hasta || fecha <= filtros.hasta) &&
          (!texto || `${c.name} ${c.email} ${c.subject}`.toLowerCase().includes(texto))
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
    pagina = Math.min(filtros.page, paginas)
    visibles = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  }

  const validarFechas = ({ desde, hasta }) => {
    if (desde && desde > hoy()) return 'La fecha "desde" no puede ser futura.'
    if (desde && hasta && desde > hasta) return 'La fecha "desde" no puede ser posterior a "hasta".'
    return ''
  }

  const cambiarFiltro = (e) => {
    const nuevos = { ...filtros, [e.target.name]: e.target.value, page: 1 }
    const problema = validarFechas(nuevos)
    setErrorFechas(problema)
    if (!problema && !usandoMock) setLoading(true)
    setFiltros(nuevos)
  }

  const limpiarFechas = () => {
    setErrorFechas('')
    if (!usandoMock) setLoading(true)
    setFiltros({ ...filtros, desde: '', hasta: '', page: 1 })
  }

  const irAPagina = (page) => {
    if (!usandoMock) setLoading(true)
    setFiltros({ ...filtros, page })
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">Bandeja de consultas</h1>
        {usandoMock && <span className="badge text-bg-warning">Datos de prueba</span>}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5">
          <input
            type="search"
            name="q"
            className="form-control"
            placeholder="Buscar por nombre, email o asunto"
            value={filtros.q}
            onChange={cambiarFiltro}
          />
        </div>
        <div className="col-6 col-md-3">
          <select name="tipo" className="form-select" value={filtros.tipo} onChange={cambiarFiltro}>
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS).map(([valor, label]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select name="estado" className="form-select" value={filtros.estado} onChange={cambiarFiltro}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS).map(([valor, { label }]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor="desde" className="form-label small mb-1">Desde</label>
          <input
            id="desde"
            type="date"
            name="desde"
            max={filtros.hasta || hoy()}
            className={`form-control ${errorFechas ? 'is-invalid' : ''}`}
            value={filtros.desde}
            onChange={cambiarFiltro}
          />
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor="hasta" className="form-label small mb-1">Hasta</label>
          <input
            id="hasta"
            type="date"
            name="hasta"
            min={filtros.desde || undefined}
            className={`form-control ${errorFechas ? 'is-invalid' : ''}`}
            value={filtros.hasta}
            onChange={cambiarFiltro}
          />
        </div>
        {(filtros.desde || filtros.hasta) && (
          <div className="col-12 col-md-3 d-flex align-items-end">
            <button type="button" className="btn btn-link px-0" onClick={limpiarFechas}>
              Quitar fechas
            </button>
          </div>
        )}
        {errorFechas && <div className="col-12 text-danger small fw-semibold">{errorFechas}</div>}
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando…</span>
          </div>
        </div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}
      {errorFechas && !error && (
        <div className="alert alert-light border">Corregí el rango de fechas para ver las consultas.</div>
      )}

      {!loading && !error && !errorFechas && visibles.length === 0 && (
        <div className="alert alert-light border">No hay consultas con esos filtros.</div>
      )}

      {!loading && !error && !errorFechas && visibles.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Asunto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <tr
                  key={c._id}
                  role="button"
                  onClick={() => navigate(`/operador/consultas/${c._id}`)}
                >
                  <td className="text-nowrap small">{formatoFecha(c.createdAt)}</td>
                  <td>
                    <div className="fw-semibold">{c.name}</div>
                    <div className="small text-muted">{c.email}</div>
                  </td>
                  <td>{TIPOS[c.type]}</td>
                  <td>{c.subject}</td>
                  <td>
                    <span className={`badge text-bg-${ESTADOS[c.status].color}`}>
                      {ESTADOS[c.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && !errorFechas && paginas > 1 && (
        <nav aria-label="Páginas de consultas" className="d-flex justify-content-center">
          <ul className="pagination mb-0">
            <li className={`page-item ${pagina === 1 ? 'disabled' : ''}`}>
              <button type="button" className="page-link" onClick={() => irAPagina(pagina - 1)}>Anterior</button>
            </li>
            {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
              <li key={n} className={`page-item ${n === pagina ? 'active' : ''}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => irAPagina(n)}
                  aria-current={n === pagina ? 'page' : undefined}
                >
                  {n}
                </button>
              </li>
            ))}
            <li className={`page-item ${pagina === paginas ? 'disabled' : ''}`}>
              <button type="button" className="page-link" onClick={() => irAPagina(pagina + 1)}>Siguiente</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
