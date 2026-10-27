// 🎨 DUEÑO: Integrante D — Bandeja de consultas del operador.
// Semana 1: maqueta con datos de prueba. Si la API responde 501 (pendiente de C),
// usa mockInquiries; cuando C termine el endpoint, toma los datos reales sola.

//OBJETIVO
// 'Tabla con inquiriesApi.list({ tipo, estado, desde, hasta, q, page })',
// 'Filtros por tipo, estado y rango de fechas; búsqueda',
// 'Click en una fila → /operador/consultas/:id',

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inquiriesApi } from '../../services/api.js'
import { mockInquiries } from './mockInquiries.js'
import { TIPOS, ESTADOS, formatoFecha } from './inquiryLabels.js'

export default function Inbox() {
  const navigate = useNavigate()
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', q: '' })
  useEffect(() => {
    inquiriesApi
      .list(filtros)
      .then((data) => {
        setConsultas(data.items ?? data)
        setUsandoMock(false)
        setError('')
      })
      .catch((err) => {
        if (err.status === 501) {
          setConsultas(mockInquiries)
          setUsandoMock(true)
          setError('')
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [filtros])

  // Con datos reales filtra la API; con datos de prueba filtramos acá.
  const texto = filtros.q.toLowerCase()
  const visibles = usandoMock
    ? consultas.filter(
        (c) =>
          (!filtros.tipo || c.type === filtros.tipo) &&
          (!filtros.estado || c.status === filtros.estado) &&
          (!texto || `${c.name} ${c.email} ${c.subject}`.toLowerCase().includes(texto)),
      )
    : consultas

  // Al cambiar un filtro mostramos el spinner; el useEffect de arriba vuelve a pedir los datos.
  const cambiarFiltro = (e) => {
    setLoading(true)
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">Bandeja de consultas</h1>
        {usandoMock && <span className="badge text-bg-warning">Datos de prueba</span>}
      </div>

      {/* Filtros */}
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
      </div>

      {/* Estados: cargando, error, vacío, tabla */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando…</span>
          </div>
        </div>
      )}

      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && visibles.length === 0 && (
        <div className="alert alert-light border">No hay consultas con esos filtros.</div>
      )}

      {!loading && !error && visibles.length > 0 && (
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
    </div>
  )
}
