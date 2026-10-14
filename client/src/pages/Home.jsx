// 🎨 DUEÑO: Integrante B — arma la página de inicio con las secciones.
// Cada sección está en su propio archivo (components/home/) para no pisarse.
import Hero from '../components/home/Hero.jsx'
import About from '../components/home/About.jsx'
import Stack from '../components/home/Stack.jsx'
import Services from '../components/home/Services.jsx'
import Experience from '../components/home/Experience.jsx'

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Stack />
      <Services />
      <Experience />
    </>
  )
}
