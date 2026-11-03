// 🎨 DUEÑO: Integrante B — arma la página de inicio con las secciones del prototipo (Main.dc.html).
// Orden: hero · 01 Perfil · 02 Stack · 03 Servicios · 04 Proyectos · 05 Experiencia · cierre.
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/home/Hero.jsx'
import About from '../components/home/About.jsx'
import Stack from '../components/home/Stack.jsx'
import Services from '../components/home/Services.jsx'
import Featured from '../components/home/Featured.jsx'
import Experience from '../components/home/Experience.jsx'
import * as apiModule from '../services/api.js'

export default function Home() {
  // Registramos la visita al entrar a la portada (si el endpoint ya está implementado por C)
  useEffect(() => {
    const visitsApi = apiModule.visitsApi
    if (visitsApi && typeof visitsApi.register === 'function') {
      visitsApi.register({ page: '/' }).catch(() => {})
    } else if (visitsApi && typeof visitsApi.create === 'function') {
      visitsApi.create({ page: '/' }).catch(() => {})
    }
  }, [])

  return (
    <>
      <Hero />
      <About />
      <Stack />
      <Services />
      <Featured />
      <Experience />

      {/* Cierre */}
      <section className="sec-negra">
        <div className="cierre-inner">
          <h2 className="sec-titulo mb-0">¿Tenés un proyecto?</h2>
          <Link to="/contacto" className="btn btn-cierre px-4">Contame →</Link>
        </div>
      </section>
    </>
  )
}
