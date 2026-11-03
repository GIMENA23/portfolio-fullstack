// 🎨 DUEÑO: Integrante D — Dashboard de métricas (panel de administrador).
// Si la API responde 501 (pendiente de C), usa mockStats y filtra las fechas acá.
//
// Gráficos con Chart.js + react-chartjs-2 (se registran solo las piezas que usamos).
// Los colores salen de las variables del tema (styles/theme.css).
//
// Formato que esperamos de C:
//   summary          → { visits, users, logins, inquiries }
//   visits           → [{ fecha: 'AAAA-MM-DD', total }]      (?desde&hasta&agrupar=dia|semana)
//   inquiries-by-type→ [{ tipo, total }]                      (?desde&hasta)
//   registrations    → [{ semana: 'AAAA-MM-DD', total }]     (?desde&hasta)

import { useEffect, useState } from 'react'
import { statsApi, inquiriesApi } from '../../services/api.js'
import EstadoConsulta from '../../components/EstadoConsulta.jsx'
import { mockInquiries } from '../operator/mockInquiries.js'
import { NumeroAnimado, GuardaLoader, opcionesGrafico, estiloDataset, useColoresGrafico } from '../../animations'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { mockStats } from './mockStats.js'

// Chart.js solo incluye lo que se registra (así el bundle pesa menos)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

const TIPOS = { general: 'General', cotizacion: 'Cotización', asesoria: 'Asesoría' }

const KPIS = [
  { clave: 'visits', label: 'Visitas al sitio', nota: 'Contador general del sitio' },
  { clave: 'users', label: 'Usuarios registrados', nota: 'Cuentas creadas en el sitio' },
  { clave: 'logins', label: 'Accesos autenticados', nota: 'Ingresos con cuenta' },
  { clave: 'inquiries', label: 'Consultas recibidas', nota: 'En el período elegido' },
]

const hoy = () => new Date().toISOString().slice(0, 10)
const haceDias = (d) => {
  const f = new Date()
  f.setDate(f.getDate() - d)
  return f.toISOString().slice(0, 10)
}

const fechaCorta = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

// Agrupa una serie diaria por semana (lunes) — solo para los datos de prueba
const porSemana = (serie) => {
  const semanas = {}
  serie.forEach(({ fecha, total }) => {
    const d = new Date(`${fecha}T12:00:00`)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const clave = d.toISOString().slice(0, 10)
    semanas[clave] = (semanas[clave] ?? 0) + total
  })
  return Object.entries(semanas).map(([fecha, total]) => ({ fecha, total }))
}

// Contenedor de cada gráfico: título, alto fijo y texto alternativo para lectores de pantalla
function Grafico({ titulo, extra, alto = 260, descripcion, vacio, children }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h2 className="h6 mb-0">{titulo}</h2>
          {extra && <span className="small text-muted">{extra}</span>}
        </div>
        {vacio ? (
          <p className="text-muted small mb-0">Sin datos en este período.</p>
        ) : (
          <div className="grafico" style={{ height: alto }} role="img" aria-label={descripcion}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const c = useColoresGrafico() // colores de la marca según claro/noche
  const [rango, setRango] = useState({ desde: haceDias(13), hasta: hoy(), agrupar: 'dia' })
  const [errorRango, setErrorRango] = useState('')
  const [resumen, setResumen] = useState(null)
  const [visitas, setVisitas] = useState([])
  const [porTipo, setPorTipo] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)
  const [tipo, setTipo] = useState('') // filtro de consultas (en el navegador)
  const [ultimas, setUltimas] = useState([])

  // Últimas consultas (las responde el operador)
  useEffect(() => {
    inquiriesApi
      .list({ page: 1 })
      .then((d) => setUltimas((d.items ?? d).slice(0, 4)))
      .catch(() => setUltimas(mockInquiries.slice(0, 4))) // datos de prueba si la API todavía no responde
  }, [])

  // Totales (no dependen del rango)
  useEffect(() => {
    statsApi
      .summary()
      .then(setResumen)
      .catch((err) => {
        if (err.status === 501) {
          setResumen(mockStats.summary)
          setUsandoMock(true)
        } else setError(err.message)
      })
  }, [])

  // Series: se vuelven a pedir al cambiar el rango
  useEffect(() => {
    if (errorRango) return
    const query = { desde: rango.desde, hasta: rango.hasta }
    Promise.all([
      statsApi.visits({ ...query, agrupar: rango.agrupar }),
      statsApi.inquiriesByType(query),
      statsApi.registrations(query),
    ])
      .then(([v, t, r]) => {
        setVisitas(v)
        setPorTipo(t)
        setRegistros(r)
      })
      .catch((err) => {
        if (err.status !== 501) {
          setError(err.message)
          return
        }
        setUsandoMock(true)
        const enRango = (f) => f >= rango.desde && f <= rango.hasta
        const diarias = mockStats.visits.filter((v) => enRango(v.fecha))
        setVisitas(rango.agrupar === 'semana' ? porSemana(diarias) : diarias)
        setPorTipo(mockStats.inquiriesByType)
        setRegistros(mockStats.registrations.filter((r) => enRango(r.semana)))
      })
      .finally(() => setLoading(false))
  }, [rango, errorRango])

  const cambiarRango = (e) => {
    const nuevo = { ...rango, [e.target.name]: e.target.value }
    if (!nuevo.desde || !nuevo.hasta) setErrorRango('Elegí las dos fechas.')
    else if (nuevo.desde > nuevo.hasta) setErrorRango('La fecha "desde" no puede ser posterior a "hasta".')
    else if (nuevo.hasta > hoy()) setErrorRango('La fecha "hasta" no puede ser futura.')
    else {
      setErrorRango('')
      setLoading(true) // el useEffect de las series vuelve a pedir los datos
    }
    setRango(nuevo)
  }

  const dias = Math.max(1, Math.round((new Date(`${rango.hasta}T12:00:00`) - new Date(`${rango.desde}T12:00:00`)) / 86400000) + 1)
  const totalVisitas = visitas.reduce((s, v) => s + v.total, 0)
  const datosVisitas = visitas.map((v) => ({
    etiqueta: rango.agrupar === 'semana' ? `Sem. ${fechaCorta(v.fecha)}` : fechaCorta(v.fecha),
    total: v.total,
  }))
  const datosTipo = porTipo.filter((t) => !tipo || t.tipo === tipo).map((t) => ({ etiqueta: TIPOS[t.tipo] ?? t.tipo, total: t.total }))
  const datosRegistros = registros.map((r) => ({ etiqueta: `Sem. ${fechaCorta(r.semana)}`, total: r.total }))

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <div>
          <span className="rotulo">MÉTRICAS DEL SITIO</span>
          <h1 className="h2 mb-0">Dashboard</h1>
        </div>
        {usandoMock && <span className="badge text-bg-warning">Datos de prueba</span>}
      </div>

      {error && <div className="alert alert-danger">⚠ {error}</div>}

      {/* Tarjetas KPI */}
      <div className="row g-3 mb-4">
        {KPIS.map((k, i) => (
          <div key={k.clave} className="col-6 col-lg-3">
            <div className={`kpi h-100 ${k.clave === 'inquiries' ? 'kpi-atencion' : ''}`}>
              <div className="kpi-valor">
                {resumen ? <NumeroAnimado valor={k.clave === 'inquiries' && tipo ? (porTipo.find((t) => t.tipo === tipo)?.total ?? 0) : (resumen[k.clave] ?? 0)} delay={i * 120} /> : '—'}
              </div>
              <div className="kpi-label mt-2">{k.clave === 'visits' ? `Visitas · ${dias} días` : k.clave === 'inquiries' && tipo ? `Consultas · ${TIPOS[tipo]}` : k.label}</div>
              <div className="kpi-nota">{k.nota}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Consulta parametrizada (como en Dashboard.dc.html) */}
      <section className="card mb-4" aria-label="Consulta parametrizada">
        <div className="card-body d-flex flex-column gap-3">
          <div className="filtros-dashboard">
            <div>
              <label htmlFor="desde" className="form-label">Desde</label>
              <input id="desde" name="desde" type="date" max={rango.hasta < hoy() ? rango.hasta : hoy()} className={`form-control ${errorRango ? 'is-invalid' : ''}`} value={rango.desde} onChange={cambiarRango} />
            </div>
            <div>
              <label htmlFor="hasta" className="form-label">Hasta</label>
              <input id="hasta" name="hasta" type="date" min={rango.desde} max={hoy()} className={`form-control ${errorRango ? 'is-invalid' : ''}`} value={rango.hasta} onChange={cambiarRango} />
            </div>
            <div>
              <label htmlFor="tipo" className="form-label">Tipo de consulta</label>
              <select id="tipo" className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todas</option>
                {Object.entries(TIPOS).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
            <div role="group" aria-label="Agrupar por">
              <span className="form-label d-block">Agrupar por</span>
              <div className="segmentado">
                {[['dia', 'Día'], ['semana', 'Semana']].map(([valor, label]) => (
                  <button key={valor} type="button" aria-pressed={rango.agrupar === valor} className={rango.agrupar === valor ? 'on' : ''} onClick={() => cambiarRango({ target: { name: 'agrupar', value: valor } })}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="align-self-end">
              <button type="button" className="btn btn-outline-primary" onClick={() => { setTipo(''); setErrorRango(''); setRango({ desde: haceDias(13), hasta: hoy(), agrupar: 'dia' }) }}>
                Limpiar filtros
              </button>
            </div>
          </div>
          {errorRango && <div className="campo-error">⚠ {errorRango}</div>}
          <code className="small text-secondary" style={{ overflowWrap: 'anywhere' }}>
            GET /api/stats/visits?desde={rango.desde}&amp;hasta={rango.hasta}&amp;agrupar={rango.agrupar} · GET /api/stats/inquiries-by-type?desde={rango.desde}&amp;hasta={rango.hasta}&amp;tipo={tipo || 'todas'}
          </code>
        </div>
      </section>

      {/* Gráficos */}
      {loading ? (
        <GuardaLoader texto="Cargando métricas…" />
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <Grafico
              titulo={`Visitas por ${rango.agrupar === 'semana' ? 'semana' : 'día'}`}
              extra={`Total: ${totalVisitas}`}
              alto={300}
              vacio={!visitas.length}
              descripcion={`Visitas: ${datosVisitas.map((d) => `${d.etiqueta} ${d.total}`).join(', ')}`}
            >
              <Line
                options={opcionesGrafico('linea', c)}
                data={{
                  labels: datosVisitas.map((d) => d.etiqueta),
                  datasets: [
                    {
                      label: 'Visitas',
                      data: datosVisitas.map((d) => d.total),
                      ...estiloDataset('linea', c),
                      pointRadius: 3,
                    },
                  ],
                }}
              />
            </Grafico>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <Grafico
              titulo="Consultas por tipo"
              alto={300}
              vacio={!porTipo.length}
              descripcion={`Consultas: ${datosTipo.map((d) => `${d.etiqueta} ${d.total}`).join(', ')}`}
            >
              <Doughnut
                options={opcionesGrafico('dona', c)}
                data={{
                  labels: datosTipo.map((d) => d.etiqueta),
                  datasets: [
                    {
                      data: datosTipo.map((d) => d.total),
                      ...estiloDataset('dona', c),
                    },
                  ],
                }}
              />
            </Grafico>
          </div>

          <div className="col-12 col-md-6 col-lg-12">
            <Grafico
              titulo="Registros por semana"
              alto={220}
              vacio={!registros.length}
              descripcion={`Registros: ${datosRegistros.map((d) => `${d.etiqueta} ${d.total}`).join(', ')}`}
            >
              <Bar
                options={opcionesGrafico('barras', c)}
                data={{
                  labels: datosRegistros.map((d) => d.etiqueta),
                  datasets: [
                    {
                      label: 'Registros',
                      data: datosRegistros.map((d) => d.total),
                      ...estiloDataset('barras', c),
                      borderRadius: 4,
                      maxBarThickness: 48,
                    },
                  ],
                }}
              />
            </Grafico>
          </div>

          <div className="col-12 col-md-6 col-lg-12">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-baseline mb-3">
                  <h2 className="h6 mb-0">Últimas consultas</h2>
                  <span className="small text-muted">Las responde el operador</span>
                </div>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  {ultimas.map((q) => (
                    <li key={q._id} className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <strong>{q.name}</strong>
                      <span className="text-muted">{TIPOS[q.type] ?? q.type}</span>
                      <EstadoConsulta status={q.status} />
                    </li>
                  ))}
                  {ultimas.length === 0 && <li className="text-muted">Todavía no hay consultas.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
