// 🎨 DUEÑO: Integrante B — página pública /servicios (Servicios.dc.html).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { servicesApi } from '../services/api.js'
import { GuardaLoader, GuardaTejida, TituloAnimado, useReveal } from '../animations'
import { mockServicios } from './mockServicios.js'

// Lo que no guarda la base (viñetas y texto del botón) sale del prototipo, por nombre de servicio.
const EXTRAS = {
  'desarrollo web a medida': {
    cta: 'Cotizar desarrollo',
    items: ['Frontend en React, adaptado a celular', 'Backend y base de datos', 'Publicación en la nube'],
  },
  'apis rest': {
    cta: 'Cotizar API',
    items: ['Endpoints con validación estricta', 'Autenticación con roles', 'Documentación para tu equipo'],
  },
  'bases de datos': {
    cta: 'Cotizar base de datos',
    items: ['Diseño del modelo de datos', 'Migraciones y respaldos', 'Consultas más rápidas'],
  },
  'asesoría técnica': {
    cta: 'Pedir asesoría',
    items: ['Revisión de código existente', 'Plan para mejorar el rendimiento', 'Acompañamiento a equipos'],
  },
}

const TONOS = ['tono-carmin', 'tono-negro', 'tono-vicuna', 'tono-exito']

// Trazos del ícono (SVG) según el nombre que guarda la base.
const ICONOS = {
  code: 'M3 5h18v14H3zM3 9h18M7 13h4',
  server: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  database: 'M4 6c0-2 16-2 16 0v12c0 2-16 2-16 0zM4 6c0 2 16 2 16 0M4 12c0 2 16 2 16 0',
  chat: 'M4 5h16v11H8l-4 4z',
}

const PASOS = [
  ['Charla inicial', 'Entendemos el problema y qué tiene que resolver el sistema.'],
  ['Propuesta', 'Te envío alcance, tiempos y costo por escrito.'],
  ['Desarrollo', 'Entregas parciales cada semana para que lo vayas probando.'],
  ['Publicación', 'Lo dejo online, documentado y con un mes de soporte.'],
]

const PREGUNTAS = [
  ['¿Cuánto tarda un proyecto?', 'Un sitio a medida suele llevar entre [X] y [Y] semanas. En la propuesta te paso un calendario con entregas semanales.'],
  ['¿Cómo se paga?', 'En partes: un adelanto al empezar y el resto contra entregas. Todo queda por escrito en la propuesta.'],
  ['¿Qué pasa después de la entrega?', 'Incluyo un mes de soporte para corregir errores. Después podés contratar mantenimiento mensual.'],
  ['¿Trabajás con equipos que ya tienen un sistema?', 'Sí. Puedo sumarme a un proyecto existente, revisar el código y proponer mejoras.'],
]

const precio = (s) => {
  if (typeof s.priceFrom === 'number' && s.priceFrom > 0) return `Desde $${s.priceFrom.toLocaleString('es-AR')}`
  return /asesor/i.test(s.name) ? 'Por hora · [$ PRECIO]' : 'Desde [$ PRECIO]'
}

// Se monta cuando llegaron los datos, así useReveal encuentra las tarjetas.
function ListaServicios({ servicios }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="row g-4">
      {servicios.map((s, i) => {
        const extra = EXTRAS[s.name?.toLowerCase()] ?? { cta: 'Pedir cotización', items: [] }
        const trazo = ICONOS[s.icon] ?? ICONOS.code
        return (
          <div className="col-12 col-lg-6" key={s._id} data-reveal>
            <article className="tarjeta-proyecto h-100 p-4 d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <span className={`servicio-icono ${TONOS[i % TONOS.length]}`} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={trazo} />
                  </svg>
                </span>
                <span className="servicio-precio">{precio(s)}</span>
              </div>
              <h2 className="h4 mb-0">{s.name}</h2>
              <p className="mb-0 text-secondary">{s.description}</p>
              {extra.items.length > 0 && (
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                  {extra.items.map((it) => (
                    <li key={it} className="d-flex gap-2">
                      <span className="text-carmin" aria-hidden="true">◆</span>
                      {it}
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/contacto" className="fw-semibold mt-auto">{extra.cta} →</Link>
            </article>
          </div>
        )
      })}
    </div>
  )
}

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierta, setAbierta] = useState(0)
  const refPasos = useReveal()
  const refFaq = useReveal()

  useEffect(() => {
    let activo = true
    servicesApi
      .list()
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data?.items ?? [])
        // TODO (C): quitar el mock cuando esté el backend con servicios cargados
        return lista.length > 0 ? lista : mockServicios
      })
      .catch(() => mockServicios)
      .then((lista) => {
        if (!activo) return
        setServicios(lista.filter((s) => s.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <section className="banda">
        <div className="sec-inner d-flex flex-wrap align-items-end justify-content-between gap-4 py-5">
          <div className="d-flex flex-column gap-3" style={{ flex: '1 1 480px', minWidth: 0 }}>
            <span className="rotulo">SERVICIOS</span>
            <TituloAnimado texto="Qué puedo hacer por tu proyecto." className="pagina-titulo" />
          </div>
          <p className="hero-texto" style={{ flex: '0 1 380px' }}>
            Cada servicio incluye reuniones de avance, documentación y una entrega publicada en la nube.
          </p>
        </div>
      </section>
      <GuardaTejida alCargar />

      <div className="sec-inner" style={{ paddingBottom: '2rem' }}>
        {cargando ? <GuardaLoader texto="Cargando servicios…" /> : <ListaServicios servicios={servicios} />}
      </div>

      <section ref={refPasos} className="sec-inner d-flex flex-column gap-4" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <h2 className="h3" data-reveal>Cómo trabajo</h2>
        <ol className="pasos" data-reveal>
          {PASOS.map(([titulo, texto], i) => (
            <li key={titulo}>
              <span className="n">{i + 1}</span>
              <strong>{titulo}</strong>
              <span className="small text-secondary">{texto}</span>
            </li>
          ))}
        </ol>
      </section>

      <section ref={refFaq} className="sec-inner d-flex flex-column gap-2" style={{ paddingTop: '3rem' }} aria-labelledby="faq-titulo">
        <h2 id="faq-titulo" className="h3 mb-2" data-reveal>Preguntas frecuentes</h2>
        {PREGUNTAS.map(([q, a], i) => {
          const abierto = abierta === i
          return (
            <div className="faq-item" key={q} data-reveal>
              <h3 className="h6 mb-0">
                <button
                  type="button"
                  className="faq-btn"
                  aria-expanded={abierto}
                  aria-controls={`faq-${i}`}
                  onClick={() => setAbierta(abierto ? -1 : i)}
                >
                  {q}
                  <span className="faq-signo" aria-hidden="true">{abierto ? '−' : '+'}</span>
                </button>
              </h3>
              <div id={`faq-${i}`} hidden={!abierto}>
                <p className="text-secondary pb-3 mb-0" style={{ maxWidth: '60ch' }}>{a}</p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="banda mt-5">
        <div className="cierre-inner">
          <h2 className="sec-titulo mb-0">Pedí tu cotización</h2>
          <Link to="/contacto" className="btn btn-primary px-4">Contame tu proyecto →</Link>
        </div>
      </section>
    </>
  )
}
