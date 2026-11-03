// 🎨 DUEÑO: Integrante B — 03 Servicios (Main.dc.html): tarjetas numeradas de borde carmín.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { servicesApi } from '../../services/api.js'
import { useReveal, GuardaLoader } from '../../animations'
import EncabezadoSeccion from '../EncabezadoSeccion.jsx'

// Catálogo de respaldo (textos del prototipo) por si la base todavía no tiene servicios.
// TODO (C): se puede quitar cuando haya servicios cargados con `npm run seed`.
const FALLBACK_SERVICES = [
  { _id: 'srv-1', name: 'Desarrollo web a medida', description: 'Sitios y aplicaciones completas, del diseño al despliegue.' },
  { _id: 'srv-2', name: 'APIs REST', description: 'Diseño e implementación de APIs seguras y documentadas.' },
  { _id: 'srv-3', name: 'Bases de datos', description: 'Modelado y optimización de bases SQL y MongoDB.' },
  { _id: 'srv-4', name: 'Asesoría técnica', description: 'Revisión de código, arquitectura y buenas prácticas.' },
]

// Se monta cuando ya llegaron los datos, así useReveal encuentra las tarjetas.
function Tarjetas({ servicios }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="row g-3">
      {servicios.map((s, i) => (
        <div key={s._id} className="col-12 col-sm-6 col-lg-3" data-reveal>
          <article className="tarjeta-servicio">
            <span className="tarjeta-servicio-num">{String(i + 1).padStart(2, '0')}</span>
            <h3>{s.name}</h3>
            <p className="mb-0 small text-secondary">{s.description}</p>
          </article>
        </div>
      ))}
    </div>
  )
}

export default function Services() {
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    servicesApi
      .list()
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data?.items ?? [])
        return lista.length > 0 ? lista : FALLBACK_SERVICES
      })
      .catch(() => FALLBACK_SERVICES)
      .then((lista) => {
        if (!activo) return
        setServicios(lista.filter((s) => s.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 4))
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <section id="servicios" className="sec-clara">
      <div className="sec-inner d-flex flex-column gap-4">
        <div className="sec-cabecera">
          <EncabezadoSeccion num="03" rotulo="SERVICIOS · EN QUÉ TE AYUDO" titulo="Servicios" carmin />
          <Link to="/servicios" className="btn btn-outline-primary">Ver servicios →</Link>
        </div>
        {cargando ? <GuardaLoader texto="Cargando servicios…" /> : <Tarjetas servicios={servicios} />}
      </div>
    </section>
  )
}
