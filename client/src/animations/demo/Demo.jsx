// 🎨 DUEÑO: Integrante A — Página de prueba de las animaciones (no forma parte del sitio).
import { useEffect, useRef, useState } from 'react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  BotonModoNoche,
  CodigoQueSeEscribe,
  EnviadoLottie,
  GuardaLoader,
  NumeroAnimado,
  RutaAnimada,
  TituloAnimado,
  opcionesGrafico,
  tejerAlVer,
  useColoresGrafico,
  useReveal,
} from '../index.js'

function Bloque({ n, titulo, uso, children }) {
  return (
    <section className="py-5 border-bottom">
      <p className="rotulo mb-2">{String(n).padStart(2, '0')} · {titulo}</p>
      <p className="small text-muted mb-4"><code>{uso}</code></p>
      {children}
    </section>
  )
}

export default function Demo() {
  const [clave, setClave] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [enviado, setEnviado] = useState(false)
  const colores = useColoresGrafico()
  const reveal = useReveal()
  const guarda = useRef(null)

  useEffect(() => tejerAlVer(guarda.current), [])
  useEffect(() => {
    if (!cargando) return undefined
    const t = setTimeout(() => setCargando(false), 2500)
    return () => clearTimeout(t)
  }, [cargando])

  return (
    <main className="container py-5" style={{ maxWidth: 960 }}>
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="rotulo mb-1">arce.dev · Grupo 3</p>
          <h2 className="mb-0">Animaciones</h2>
        </div>
        <div className="d-flex gap-2">
          <BotonModoNoche />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setClave(clave + 1); setCargando(true); setEnviado(false) }}>
            ↻ Repetir todo
          </button>
        </div>
      </header>
      <div className="guarda" />

      <div key={clave}>
        <Bloque n={1} titulo="Título del inicio · anime.js" uso={'<TituloAnimado texto="Productos web" resaltado="de punta a punta." />'}>
          <TituloAnimado texto="Productos web" resaltado="de punta a punta." />
        </Bloque>

        <Bloque n={2} titulo="Código que se escribe" uso="<CodigoQueSeEscribe />">
          <div style={{ maxWidth: 520 }}><CodigoQueSeEscribe /></div>
        </Bloque>

        <Bloque n={3} titulo="Cargando · Web Animations API" uso={'{cargando ? <GuardaLoader texto="Cargando proyectos…" /> : <Lista />}'}>
          {cargando ? (
            <GuardaLoader texto="Cargando proyectos…" />
          ) : (
            <div className="alert alert-success">✓ Proyectos cargados. <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => setCargando(true)}>Cargar de nuevo</button></div>
          )}
        </Bloque>

        <Bloque n={4} titulo="Enviado · Lottie" uso="{enviado && <EnviadoLottie />}">
          {enviado ? (
            <div className="d-flex align-items-center gap-3">
              <EnviadoLottie />
              <div>
                <h3 className="mb-1">¡Consulta enviada!</h3>
                <button type="button" className="btn btn-link p-0" onClick={() => setEnviado(false)}>Volver</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setEnviado(true)}>Enviar consulta</button>
          )}
        </Bloque>

        <Bloque n={5} titulo="KPIs que cuentan · anime.js" uso="<NumeroAnimado valor={779} />">
          <div className="row g-3">
            {[['Visitas · 14 días', 779, false], ['Usuarios registrados', 40, false], ['Consultas nuevas', 7, true]].map(([l, v, a], i) => (
              <div className="col-12 col-md-4" key={l}>
                <div className={`kpi ${a ? 'kpi-atencion' : ''}`}>
                  <div className="kpi-label">{l}</div>
                  <div className="kpi-valor"><NumeroAnimado valor={v} delay={i * 150} /></div>
                </div>
              </div>
            ))}
          </div>
        </Bloque>

        <Bloque n={6} titulo="Aparecer al hacer scroll · Intersection Observer" uso="const ref = useReveal()  →  <section ref={ref}> con data-reveal en cada hijo">
          <div ref={guarda} className="guarda-fina mb-4" />
          <div ref={reveal} className="row g-3">
            {['Tienda online', 'Gestor de turnos', 'Panel de métricas'].map((t) => (
              <div className="col-12 col-md-4" key={t} data-reveal>
                <article className="tarjeta-proyecto p-3 h-100">
                  <p className="rotulo mb-2">Proyecto</p>
                  <h3 className="mb-2">{t}</h3>
                  <p className="small text-muted mb-0">Pasá el mouse: la tarjeta se eleva y toma el borde carmín.</p>
                </article>
              </div>
            ))}
          </div>
        </Bloque>

        <Bloque n={7} titulo="Modo noche · data-bs-theme + localStorage" uso="<BotonModoNoche />  (botón de arriba; recarga la página y se acuerda)">
          <p className="mb-0">El botón ☀/☾ cambia <code>data-bs-theme</code> en <code>&lt;html&gt;</code> y guarda la elección.</p>
        </Bloque>

        <Bloque n={8} titulo="Transición entre rutas · Web Animations API" uso="<main><RutaAnimada /></main>  (en vez de <Outlet />)">
          <MemoryRouter>
            <nav className="d-flex gap-3 mb-3">
              <Link to="/">Inicio</Link>
              <Link to="/proyectos">Proyectos</Link>
              <Link to="/usuarios">Usuarios</Link>
            </nav>
            <Routes>
              <Route element={<RutaAnimada scroll={false} />}>
                <Route index element={<div className="kpi">Pantalla de inicio</div>} />
                <Route path="proyectos" element={<div className="kpi kpi-atencion">Pantalla de proyectos</div>} />
                <Route path="usuarios" element={<div className="kpi">Pantalla de usuarios</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </Bloque>

        <Bloque n={9} titulo="Gráficos que crecen · colores del modo" uso="const c = useColoresGrafico();  <Bar options={opcionesGrafico('barras', c)} />">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {[['serie', colores.serie], ['actual', colores.actual], ...colores.tipos.map((t, i) => [`tipo ${i + 1}`, t])].map(([n, col]) => (
              <span key={n} className="small d-inline-flex align-items-center gap-2">
                <span style={{ width: 18, height: 18, background: col, display: 'inline-block' }} /> {n}
              </span>
            ))}
          </div>
          <pre className="small mb-0 p-3 border" style={{ overflow: 'auto' }}>{JSON.stringify(opcionesGrafico('barras', colores).scales.y, null, 2)}</pre>
        </Bloque>
      </div>

      <p className="small text-muted mt-4">Si activás «reducir movimiento» en tu sistema, todo aparece sin animación.</p>
    </main>
  )
}
