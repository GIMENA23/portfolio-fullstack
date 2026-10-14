// 🎨 DUEÑO: Integrante A (diseño y animación) · B (contenido)
import Placeholder from '../Placeholder.jsx'

export default function Hero() {
  return (
    <section id="hero" className="container py-5">
      <Placeholder
        owner="A (diseño y animación) · B (contenido)"
        title="Hero"
        todo={["Nombre, rol y frase de presentación", 'Botones: "Ver proyectos" y "Contactar"', "Animación de entrada con anime.js (A)"]}
      />
    </section>
  )
}
