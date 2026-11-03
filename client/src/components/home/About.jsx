// 🎨 DUEÑO: Integrante B — 01 Perfil (Main.dc.html).
import { useState } from 'react'
import { useReveal } from '../../animations'
import EncabezadoSeccion from '../EncabezadoSeccion.jsx'

const EMAIL = 'hola@arce.dev'

export default function About() {
  const ref = useReveal()
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      /* sin permiso de portapapeles: igual mostramos el email en pantalla */
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <section id="perfil" ref={ref}>
      <div className="sec-inner d-flex flex-wrap gap-5" style={{ paddingBottom: '4.5rem' }}>
        <div data-reveal style={{ flex: '1 1 380px', minWidth: 0 }}>
          <EncabezadoSeccion num="01" rotulo="PERFIL · QUIÉN SOY" titulo="Del modelo de datos a la última pantalla." />
        </div>
        <div data-reveal className="perfil-cita d-flex flex-column gap-3" style={{ flex: '1 1 480px', minWidth: 0 }}>
          <p className="mb-0">
            Trabajo con pymes, startups y estudios que necesitan un sistema web completo: el backend que guarda y protege los datos, la API que los ordena y la interfaz que la gente usa todos los días.
          </p>
          <p className="mb-0 text-secondary">
            Me ocupo de todo el recorrido, de la primera reunión al despliegue, con documentación para que el sistema pueda crecer.
          </p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span className="chip-email">{EMAIL}</span>
            <button type="button" className={`btn ${copiado ? 'btn-success' : 'btn-outline-primary'}`} onClick={copiar} aria-live="polite">
              {copiado ? '✓ Copiado' : 'Copiar email'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
