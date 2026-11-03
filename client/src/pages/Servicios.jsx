// 🎨 DUEÑO: Integrante B — página pública /servicios.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { servicesApi } from '../services/api.js'
import { GuardaLoader, useReveal } from '../animations'
import { mockServicios } from './mockServicios.js'

const PREGUNTAS = [
  {
    q: '¿Cómo pido una cotización?',
    a: 'Escribime desde la página de contacto contando qué necesitás. Te respondo por email con una propuesta a medida.',
  },
  {
    q: '¿Con qué tecnologías trabajás?',
    a: 'React en el frontend, Node.js y Express en el backend y MongoDB como base de datos. Los estilos van con Bootstrap 5.',
  },
  {
    q: '¿Trabajás también el diseño y las animaciones?',
    a: 'Sí. Cuido que cada pantalla se vea bien en el celular y en la compu, con modo noche y animaciones suaves.',
  },
  {
    q: '¿Puedo pedir solo una parte del proyecto?',
    a: 'Sí, podés pedir solo el frontend, solo la API o una asesoría técnica puntual.',
  },
  {
    q: '¿Cómo me responden las consultas?',
    a: 'Por email, al correo que dejes en el formulario. Si tenés cuenta, también ves la respuesta en Mi cuenta.',
  },
]

// En la base el ícono es un nombre (ej.: 'code'); se muestra como emoji. Si ya es un emoji, se usa tal cual.
const ICONOS = { code: '💻', server: '⚙️', database: '🗄️', chat: '💬', phone: '📱', palette: '🎨', shield: '🔒' }
const iconoDe = (icon) => (!icon ? '💻' : /^[a-z-]+$/i.test(icon) ? (ICONOS[icon.toLowerCase()] ?? '✦') : icon)

const precio = (n) =>
  typeof n === 'number' && n > 0 ? `Desde $${n.toLocaleString('es-AR')}` : 'Precio a convenir'

// Se monta recién cuando llegaron los datos, así useReveal encuentra las tarjetas.
function ListaServicios({ servicios }) {
  const ref = useReveal()
  return (
    <div ref={ref} className="row g-4">
      {servicios.map((s) => (
        <div className="col-12 col-md-6 col-lg-4" key={s._id} data-reveal>
          <article className="card tarjeta-proyecto h-100">
            <div className="card-body d-flex flex-column p-4">
              <span className="fs-2 mb-2" aria-hidden="true">{iconoDe(s.icon)}</span>
              <h2 className="h5 mb-2">{s.name}</h2>
              <p className="text-secondary flex-grow-1">{s.description}</p>
              <p className="rotulo mb-3">{precio(s.priceFrom)}</p>
              <Link to="/contacto" className="btn btn-outline-primary align-self-start">
                Pedir cotización
              </Link>
            </div>
          </article>
        </div>
      ))}
    </div>
  )
}

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierta, setAbierta] = useState(0)

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
    <div className="container py-5">
      <header className="mb-5 text-center text-lg-start">
        <p className="rotulo mb-2">Servicios</p>
        <h1 className="mb-3">Qué puedo hacer por tu proyecto</h1>
        <p className="lead text-secondary mb-4">
          Productos web de punta a punta, desde la interfaz hasta la base de datos.
        </p>
        <Link to="/contacto" className="btn btn-primary btn-lg">
          Pedir cotización
        </Link>
      </header>

      {cargando ? <GuardaLoader texto="Cargando servicios…" /> : <ListaServicios servicios={servicios} />}

      <section className="mt-5 pt-4" aria-labelledby="faq-titulo">
        <h2 id="faq-titulo" className="h3 mb-4">Preguntas frecuentes</h2>
        <div className="accordion">
          {PREGUNTAS.map((p, i) => {
            const abierto = abierta === i
            return (
              <div className="accordion-item" key={p.q}>
                <h3 className="accordion-header">
                  <button
                    type="button"
                    className={`accordion-button ${abierto ? '' : 'collapsed'}`}
                    aria-expanded={abierto}
                    aria-controls={`faq-${i}`}
                    onClick={() => setAbierta(abierto ? -1 : i)}
                  >
                    {p.q}
                  </button>
                </h3>
                <div id={`faq-${i}`} className={`accordion-collapse collapse ${abierto ? 'show' : ''}`}>
                  <div className="accordion-body text-secondary">{p.a}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="text-center mt-5">
        <p className="text-secondary">¿Tenés una idea en mente?</p>
        <Link to="/contacto" className="btn btn-primary btn-lg">
          Pedir cotización
        </Link>
      </div>
    </div>
  )
}
