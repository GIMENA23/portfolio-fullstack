// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
// Franja de título de las páginas internas (carmín en modo claro) + guarda que se teje debajo.
//   <HeroPagina rotulo="CONTACTO" titulo="Contame tu proyecto." />
import { TituloAnimado, GuardaTejida } from '../animations'

export default function HeroPagina({ rotulo, titulo, children }) {
  return (
    <>
      <section className="banda">
        <div className="sec-inner d-flex flex-wrap align-items-end justify-content-between gap-4 py-5">
          <div className="d-flex flex-column gap-3" style={{ flex: '1 1 480px', minWidth: 0 }}>
            <span className="rotulo">{rotulo}</span>
            <TituloAnimado texto={titulo} className="pagina-titulo" />
          </div>
          {children}
        </div>
      </section>
      <GuardaTejida alCargar delay={200} />
    </>
  )
}
