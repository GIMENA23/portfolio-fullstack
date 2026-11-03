// 🎨 DUEÑO: Integrante B — página 404 (NoEncontrada.dc.html).
import { Link } from 'react-router-dom'
import { TituloAnimado, GuardaTejida } from '../animations'

export default function NotFound() {
  return (
    <>
      <section className="banda">
        <div className="sec-inner d-flex flex-wrap align-items-center gap-5" style={{ paddingTop: '2.5rem', paddingBottom: '4.5rem' }}>
          <span aria-hidden="true" className="numero-404" style={{ flex: '1 1 300px' }}>404</span>
          <div className="d-flex flex-column gap-3" style={{ flex: '1 1 440px', minWidth: 0 }}>
            <span className="rotulo">ERROR 404</span>
            <TituloAnimado texto="Esta página se destejió." className="pagina-titulo" />
            <p className="mb-0" style={{ opacity: 0.94 }}>
              La dirección que buscás no existe o cambió de lugar. Volvé al inicio o mirá los proyectos.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/" className="btn btn-primary">Volver al inicio</Link>
              <Link to="/proyectos" className="btn btn-outline-light">Ver proyectos</Link>
            </div>
          </div>
        </div>
      </section>
      <div style={{ maxWidth: '62%' }}><GuardaTejida alCargar /></div>
    </>
  )
}
