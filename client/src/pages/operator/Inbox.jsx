// 🎨 DUEÑO: Integrante D — Bandeja de consultas del operador (Bandeja.dc.html / BandejaMovil.dc.html).
// Lista a la izquierda y detalle con respuesta a la derecha; en celular, lista → detalle.
// Si la API responde 501 (pendiente de C), usa mockInquiries; cuando C termine el endpoint, toma los datos reales sola.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inquiriesApi } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { GuardaLoader } from '../../animations'
import EstadoConsulta from '../../components/EstadoConsulta.jsx'
import { mockInquiries, actualizarMock } from './mockInquiries.js'
import { TIPOS, ESTADOS, formatoFecha } from './inquiryLabels.js'

// Mínimo de la bandeja (el modelo pide 10; acá pedimos más para que la respuesta sea útil).
const MIN_RESPUESTA = 20
const MAX_RESPUESTA = 2000

const validarRespuesta = (texto) => {
  const largo = texto.trim().length
  if (!largo) return 'Escribí una respuesta.'
  if (largo < MIN_RESPUESTA) return `Mínimo ${MIN_RESPUESTA} caracteres (llevás ${largo}).`
  if (largo > MAX_RESPUESTA) return `La respuesta no puede superar ${MAX_RESPUESTA} caracteres.`
  return ''
}

function Detalle({ consulta, usandoMock, onCambio, onVolver }) {
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [errorTexto, setErrorTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviadaA, setEnviadaA] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')

  const id = consulta._id

  const responder = async () => {
    setEnviadaA('')
    setErrorGeneral('')
    const problema = validarRespuesta(texto)
    setErrorTexto(problema)
    if (problema) return

    setEnviando(true)
    try {
      await inquiriesApi.reply(id, texto.trim())
      onCambio(await inquiriesApi.get(id))
      setTexto('')
      setEnviadaA(consulta.email)
    } catch (err) {
      if (err.status === 501) {
        // Simulamos lo que va a hacer la API: guardar la respuesta y marcarla como respondida.
        const nueva = { _id: `r${Date.now()}`, text: texto.trim(), operator: { name: user?.name }, sentAt: new Date().toISOString() }
        const cambios = { status: 'respondida', replies: [...(consulta.replies ?? []), nueva] }
        actualizarMock(id, cambios)
        onCambio({ ...consulta, ...cambios })
        setTexto('')
        setEnviadaA(consulta.email)
      } else {
        const campo = err.details?.find((d) => d.field === 'text')
        if (campo) setErrorTexto(campo.message)
        else setErrorGeneral(err.message)
      }
    } finally {
      setEnviando(false)
    }
  }

  const cambiarEstado = async (e) => {
    const estado = e.target.value
    setErrorGeneral('')
    try {
      await inquiriesApi.setStatus(id, estado)
      onCambio({ ...consulta, status: estado })
    } catch (err) {
      if (err.status === 501) {
        actualizarMock(id, { status: estado })
        onCambio({ ...consulta, status: estado })
      } else {
        setErrorGeneral(err.message)
      }
    }
  }

  return (
    <section aria-label="Detalle de la consulta" className="bandeja-detalle">
      <button type="button" className="btn btn-link px-0 d-md-none align-self-start" onClick={onVolver}>← Volver a la lista</button>
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div style={{ minWidth: 0 }}>
          <h2 className="h5 mb-0">{consulta.name}</h2>
          <span className="small text-secondary" style={{ overflowWrap: 'anywhere' }}>{consulta.email} · {TIPOS[consulta.type] ?? consulta.type}</span>
        </div>
        <EstadoConsulta status={consulta.status} />
      </div>

      <p className="mb-0 p-3" style={{ background: 'var(--pc-lana-clara)', borderRadius: 'var(--pc-radio)' }}>{consulta.message}</p>

      {consulta.replies?.map((r) => (
        <div key={r._id} className="p-3 border-start border-3" style={{ borderColor: 'var(--pc-carmin)' }}>
          <p className="rotulo mb-1">Respuesta · {formatoFecha(r.sentAt)}</p>
          <p className="mb-0">{r.text}</p>
        </div>
      ))}

      <div>
        <label htmlFor="respuesta" className="form-label fw-semibold">Responder por email</label>
        <textarea
          id="respuesta"
          rows="4"
          maxLength={MAX_RESPUESTA}
          className={`form-control ${errorTexto ? 'is-invalid' : ''}`}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setErrorTexto('')
          }}
          disabled={enviando}
        />
        <div className="d-flex justify-content-between gap-2 mt-1">
          {errorTexto ? <span className="campo-error">⚠ {errorTexto}</span> : <span />}
          <span className="font-mono small text-secondary ms-auto">{texto.length} / {MAX_RESPUESTA}</span>
        </div>
      </div>

      {enviadaA && (
        <div role="status" className="d-flex flex-wrap gap-2 align-items-center p-2 px-3 fw-semibold small" style={{ background: 'var(--pc-fondo-exito)', border: '1.5px solid var(--pc-exito)', color: 'var(--pc-exito)' }}>
          ✓ Respuesta enviada a {enviadaA}
          <a href={`mailto:${enviadaA}`} style={{ color: 'var(--pc-texto)' }}>Ver el email →</a>
        </div>
      )}
      {errorGeneral && <div className="alert alert-danger mb-0" role="alert">⚠ {errorGeneral}</div>}
      {usandoMock && <span className="small text-secondary">Datos de ejemplo: la respuesta no se envía por email.</span>}

      <div className="d-flex flex-wrap align-items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={responder} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar respuesta'}
        </button>
        <label htmlFor="estado" className="d-flex align-items-center gap-2 small">
          Estado
          <select id="estado" className="form-select form-select-sm" value={consulta.status} onChange={cambiarEstado} style={{ width: 'auto', minHeight: 44 }}>
            {Object.entries(ESTADOS).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
        </label>
        <Link to={`/operador/consultas/${id}`} className="small ms-auto">Abrir en pantalla completa</Link>
      </div>
    </section>
  )
}

export default function Inbox() {
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', q: '' })
  const [selId, setSelId] = useState(null) // en celular, null = se ve la lista
  const [reintento, setReintento] = useState(0)

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
          setError(err.status === 0 || err.status >= 500 ? 'No pudimos cargar las consultas. Revisá tu conexión e intentá de nuevo.' : err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [filtros, reintento])

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

  const nuevas = consultas.filter((c) => c.status === 'nueva').length
  const seleccionada = visibles.find((c) => c._id === selId) ?? visibles[0]

  const cambiarFiltro = (campo, valor) => {
    setLoading(true)
    setFiltros((f) => ({ ...f, [campo]: valor }))
  }
  const actualizar = (c) => setConsultas((lista) => lista.map((x) => (x._id === c._id ? { ...x, ...c } : x)))

  return (
    <div className="d-flex flex-column gap-3">
      <div className={`${selId ? 'd-none d-md-flex' : 'd-flex'} flex-wrap justify-content-between align-items-end gap-3`}>
        <div>
          <span className="rotulo">{nuevas} NUEVAS · {consultas.length} EN TOTAL</span>
          <h1 className="h2 mb-0">Consultas</h1>
        </div>
        <label htmlFor="buscar" className="small fw-semibold d-flex flex-column gap-1">
          Buscar
          <input
            id="buscar"
            type="search"
            className="form-control"
            placeholder="Nombre, email o asunto"
            value={filtros.q}
            onChange={(e) => cambiarFiltro('q', e.target.value)}
            style={{ width: 'min(100%, 260px)' }}
          />
        </label>
      </div>

      <div className={`${selId ? 'd-none d-md-flex' : 'd-flex'} flex-wrap align-items-center gap-2`} role="group" aria-label="Filtrar por tipo">
        <span className="small fw-semibold me-1">Tipo</span>
        {[['', 'Todas'], ...Object.entries(TIPOS)].map(([valor, label]) => (
          <button
            key={valor || 'todas'}
            type="button"
            aria-pressed={filtros.tipo === valor}
            className={`filtro ${filtros.tipo === valor ? 'on' : ''}`}
            onClick={() => cambiarFiltro('tipo', valor)}
          >
            {label}
          </button>
        ))}
        {usandoMock && <span className="badge text-bg-warning ms-2">Datos de prueba</span>}
      </div>

      {loading && <GuardaLoader texto="Cargando consultas…" />}

      {!loading && error && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <span>⚠ {error}</span>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => { setLoading(true); setReintento((n) => n + 1) }}>Reintentar</button>
        </div>
      )}

      {!loading && !error && (
        <div className={`bandeja ${selId ? 'con-detalle' : ''}`}>
          <div className="bandeja-lista">
            <div className="bandeja-fila bandeja-cabecera" aria-hidden="true">
              <span>CLIENTE</span><span className="col-tipo">TIPO</span><span>ASUNTO</span><span className="col-fecha">FECHA</span><span>ESTADO</span>
            </div>
            {visibles.map((c) => (
              <button
                key={c._id}
                type="button"
                className={`bandeja-fila ${seleccionada?._id === c._id ? 'activa' : ''}`}
                onClick={() => setSelId(c._id)}
                aria-current={seleccionada?._id === c._id}
              >
                <strong>{c.name}</strong>
                <span className="col-tipo">{TIPOS[c.type] ?? c.type}</span>
                <span className="text-secondary text-truncate">{c.subject}</span>
                <span className="col-fecha text-secondary">{formatoFecha(c.createdAt).split(',')[0]}</span>
                <EstadoConsulta status={c.status} />
              </button>
            ))}
            {visibles.length === 0 && (
              <div className="p-4 text-center text-secondary">
                No hay consultas que coincidan.{' '}
                <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => { setLoading(true); setFiltros({ tipo: '', estado: '', q: '' }) }}>Limpiar filtros</button>
              </div>
            )}
          </div>

          {seleccionada && (
            <Detalle
              key={seleccionada._id}
              consulta={seleccionada}
              usandoMock={usandoMock}
              onCambio={actualizar}
              onVolver={() => setSelId(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
