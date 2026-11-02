// 🎨 DUEÑO: Integrante B — sección «Sobre mí» del inicio.
import { useReveal } from '../../animations'

export default function About() {
  const revealRef = useReveal()

  return (
    <section id="sobre-mi" ref={revealRef} className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 text-center text-lg-start">
          <p className="rotulo mb-2">Sobre mí</p>
          <h2 className="mb-3">Martina Arce</h2>
          <p className="lead text-secondary mb-3">
            Soy desarrolladora fullstack y vivo en Salta, Argentina. Construyo productos web de punta a punta: desde el diseño de la interfaz hasta la API y la base de datos.
          </p>
          <p className="text-secondary mb-4">
            Trabajo con React, Node.js y MongoDB, cuidando que cada pantalla se vea bien en el celular y en la compu, y que sea fácil de usar.
          </p>
          <a href="mailto:hola@arce.dev" className="btn btn-outline-primary">
            hola@arce.dev
          </a>
        </div>
      </div>
    </section>
  )
}
