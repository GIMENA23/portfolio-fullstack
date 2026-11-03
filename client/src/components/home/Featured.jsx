// 🎨 DUEÑO: Integrante B — 04 Proyectos destacados (Main.dc.html): 3 proyectos + «Ver todos».
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../../services/api.js'
import { useReveal, GuardaLoader } from '../../animations'
import EncabezadoSeccion from '../EncabezadoSeccion.jsx'

const TONOS = ['tono-carmin', 'tono-negro', 'tono-vicuna']

// Respaldo con los textos del prototipo, por si la API todavía no devuelve proyectos.
// TODO (C): se puede quitar cuando haya proyectos cargados con `npm run seed`.
const FALLBACK = [
  { _id: 'p1', title: 'Gestor de turnos', summary: 'Reservas online con roles y avisos por email.', stack: ['React', 'Node', 'MongoDB'] },
  { _id: 'p2', title: 'Dashboard de ventas', summary: 'Métricas con filtros por fecha y gráficos interactivos.', stack: ['React', 'Chart.js'] },
  { _id: 'p3', title: 'Tienda online', summary: 'Carrito, pagos y control de stock.', stack: ['Express', 'MongoDB'] },
]

function Tarjetas({ proyectos, conLink }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="row g-4">
      {proyectos.map((p, i) => {
        const contenido = (
          <>
            <div className={`foto-proyecto ${TONOS[i % TONOS.length]}`}>
              {p.images?.[0] && <img src={p.images[0]} alt="" loading="lazy" />}
              <span>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="p-4 d-flex flex-column gap-2">
              <span className="rotulo">{(p.stack ?? []).slice(0, 3).join(' · ')}</span>
              <h3 className="h5 mb-0">{p.title}</h3>
              <p className="mb-0 small text-secondary">{p.summary}</p>
            </div>
          </>
        )
        return (
          <div key={p._id} className="col-12 col-md-6 col-lg-4" data-reveal>
            <Link to={conLink ? `/proyectos/${p._id}` : '/proyectos'} className="proyecto-link tarjeta-proyecto h-100">
              {contenido}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export default function Featured() {
  const [proyectos, setProyectos] = useState([])
  const [reales, setReales] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    projectsApi
      .list()
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data?.items ?? [])
        if (!activo) return
        const destacados = [...lista].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, 3)
        setReales(destacados.length > 0)
        setProyectos(destacados.length > 0 ? destacados : FALLBACK)
      })
      .catch(() => {
        if (activo) setProyectos(FALLBACK)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <section id="proyectos">
      <div className="sec-inner d-flex flex-column gap-4">
        <div className="sec-cabecera">
          <EncabezadoSeccion num="04" rotulo="PROYECTOS · LO QUE CONSTRUÍ" titulo="Proyectos destacados" />
          <Link to="/proyectos" className="btn btn-primary">Ver todos →</Link>
        </div>
        {cargando ? <GuardaLoader texto="Cargando proyectos…" /> : <Tarjetas proyectos={proyectos} conLink={reales} />}
      </div>
    </section>
  )
}
