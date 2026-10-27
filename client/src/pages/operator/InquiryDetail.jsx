// 🎨 DUEÑO: Integrante D — Detalle de una consulta: datos, historial, respuesta y estado.
// Semana 1: maqueta con datos de prueba. Si la API responde 501 (pendiente de C),
// usa mockInquiries y simula las respuestas/cambios en memoria; cuando C termine
// los endpoints, toma los datos reales sola.

//OBJETIVO
// 'Leer el id con useParams() e inquiriesApi.get(id)',
// 'Historial de respuestas (replies)',
// 'Formulario de respuesta → inquiriesApi.reply(id, texto)',
// 'Cambiar estado → inquiriesApi.setStatus(id, estado)',

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { inquiriesApi } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { mockInquiries, actualizarMock } from './mockInquiries.js'
import { TIPOS, ESTADOS, formatoFecha } from './inquiryLabels.js'

// Mismo mínimo que replySchema en el modelo; el máximo es para no mandar textos gigantes.
const MIN_RESPUESTA = 10
const MAX_RESPUESTA = 2000

const validarRespuesta = (texto) => {
  const largo = texto.trim().length
  if (!largo) return 'Escribí una respuesta.'
  if (largo < MIN_RESPUESTA) return `La respuesta debe tener al menos ${MIN_RESPUESTA} caracteres.`
  if (largo > MAX_RESPUESTA) return `La respuesta no puede superar ${MAX_RESPUESTA} caracteres.`
  return ''
}

export default function InquiryDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [consulta, setConsulta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)

  const [texto, setTexto] = useState('')
  const [errorTexto, setErrorTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [aviso, setAviso] = useState(null) // { tipo: 'success' | 'danger', texto }

  useEffect(() => {
    inquiriesApi
      .get(id)
      .then((data) => {
        setConsulta(data)
        setUsandoMock(false)
        setError('')
      })
      .catch((err) => {
        if (err.status === 501) {
          const encontrada = mockInquiries.find((c) => c._id === id)
          // Copia para no modificar el array de prueba al responder.
          setConsulta(encontrada ? { ...encontrada, replies: [...encontrada.replies] } : null)
          setUsandoMock(true)
          setError(encontrada ? '' : 'La consulta no existe.')
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const responder = async (e) => {
    e.preventDefault()
    setAviso(null)
    const problema = validarRespuesta(texto)
    setErrorTexto(problema)
    if (problema) return

    setEnviando(true)
    try {
      await inquiriesApi.reply(id, texto.trim())
      setConsulta(await inquiriesApi.get(id))
      setTexto('')
      setAviso({ tipo: 'success', texto: 'Respuesta enviada por email al cliente.' })
    } catch (err) {
      if (err.status === 501) {
        // Simulamos lo que va a hacer la API: guardar la respuesta y marcarla como respondida.
        const nueva = { _id: `r${Date.now()}`, text: texto.trim(), operator: { name: user?.name }, sentAt: new Date().toISOString() }
        const cambios = { status: 'respondida', replies: [...consulta.replies, nueva] }
        setConsulta({ ...consulta, ...cambios })
        actualizarMock(id, cambios)
        setTexto('')
        setAviso({ tipo: 'success', texto: 'Respuesta guardada (datos de prueba, no se envió email).' })
      } else {
        const campo = err.details?.find((d) => d.field === 'text')
        if (campo) setErrorTexto(campo.message)
        else setAviso({ tipo: 'danger', texto: err.message })
      }
    } finally {
      setEnviando(false)
    }
  }

  const cambiarEstado = async (e) => {
    const estado = e.target.value
    setAviso(null)
    setCambiandoEstado(true)
    try {
      await inquiriesApi.setStatus(id, estado)
      setConsulta({ ...consulta, status: estado })
      setAviso({ tipo: 'success', texto: `Estado cambiado a "${ESTADOS[estado].label}".` })
    } catch (err) {
      if (err.status === 501) {
        setConsulta({ ...consulta, status: estado })
        actualizarMock(id, { status: estado })
        setAviso({ tipo: 'success', texto: `Estado cambiado a "${ESTADOS[estado].label}" (datos de prueba).` })
      } else {
        setAviso({ tipo: 'danger', texto: err.message })
      }
    } finally {
      setCambiandoEstado(false)
    }
  }

  const volver = (
    <Link to="/operador" className="btn btn-link px-0 mb-2">
      ← Volver a la bandeja
    </Link>
  )

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando…</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !consulta) {
    return (
      <div className="container py-4">
        {volver}
        <div className="alert alert-danger">{error || 'No se pudo cargar la consulta.'}</div>
      </div>
    )
  }

  const estado = ESTADOS[consulta.status]
  const cerrada = consulta.status === 'cerrada'
  const largo = texto.trim().length

  return (
    <div className="container py-4">
      {volver}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">{consulta.subject}</h1>
        <span className={`badge text-bg-${estado.color}`}>{estado.label}</span>
        {usandoMock && <span className="badge text-bg-warning">Datos de prueba</span>}
      </div>

      {aviso && (
        <div className={`alert alert-${aviso.tipo} alert-dismissible`} role="alert">
          {aviso.texto}
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setAviso(null)} />
        </div>
      )}

      <div className="row g-3">
        {/* Columna principal: mensaje, historial y respuesta */}
        <div className="col-12 col-lg-8 order-2 order-lg-1">
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between small">
              <span className="fw-semibold">Mensaje de {consulta.name}</span>
              <span className="text-muted">{formatoFecha(consulta.createdAt)}</span>
            </div>
            <div className="card-body">
              <p className="card-text mb-0" style={{ whiteSpace: 'pre-line' }}>{consulta.message}</p>
            </div>
          </div>

          <h2 className="h5">Respuestas ({consulta.replies.length})</h2>
          {consulta.replies.length === 0 ? (
            <div className="alert alert-light border">Todavía no se respondió esta consulta.</div>
          ) : (
            <ul className="list-unstyled mb-3">
              {consulta.replies.map((r) => (
                <li key={r._id} className="card mb-2 border-start border-4 border-primary">
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>{r.operator?.name ?? 'Operador'}</span>
                      <span>{formatoFecha(r.sentAt)}</span>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cerrada ? (
            <div className="alert alert-secondary">
              La consulta está cerrada. Cambiá el estado para volver a responder.
            </div>
          ) : (
            <form onSubmit={responder} noValidate>
              <label htmlFor="respuesta" className="form-label fw-semibold">
                Responder a {consulta.email}
              </label>
              <textarea
                id="respuesta"
                className={`form-control ${errorTexto ? 'is-invalid' : ''}`}
                rows={5}
                maxLength={MAX_RESPUESTA}
                placeholder="Escribí la respuesta que le va a llegar por email…"
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value)
                  if (errorTexto) setErrorTexto(validarRespuesta(e.target.value))
                }}
                disabled={enviando}
              />
              {errorTexto && <div className="invalid-feedback">{errorTexto}</div>}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className={`small ${largo < MIN_RESPUESTA ? 'text-muted' : 'text-success'}`}>
                  {largo}/{MAX_RESPUESTA}
                </span>
                <button type="submit" className="btn btn-primary" disabled={enviando}>
                  {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                  Enviar respuesta
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Columna lateral: datos de contacto y estado */}
        <div className="col-12 col-lg-4 order-1 order-lg-2">
          <div className="card">
            <div className="card-body">
              <h2 className="h6 text-uppercase text-muted">Contacto</h2>
              <dl className="mb-3">
                <dt className="small">Nombre</dt>
                <dd>{consulta.name}</dd>
                <dt className="small">Email</dt>
                <dd className="text-break">
                  <a href={`mailto:${consulta.email}`}>{consulta.email}</a>
                </dd>
                {consulta.phone && (
                  <>
                    <dt className="small">Teléfono</dt>
                    <dd>{consulta.phone}</dd>
                  </>
                )}
                <dt className="small">Tipo</dt>
                <dd className="mb-0">{TIPOS[consulta.type]}</dd>
              </dl>

              <label htmlFor="estado" className="form-label h6 text-uppercase text-muted">
                Estado
              </label>
              <select
                id="estado"
                className="form-select"
                value={consulta.status}
                onChange={cambiarEstado}
                disabled={cambiandoEstado}
              >
                {Object.entries(ESTADOS).map(([valor, { label }]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
