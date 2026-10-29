// 🎨 DUEÑO: Integrante B — arma la página de inicio con las secciones.
// Cada sección está en su propio archivo (components/home/) para no pisarse.
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/home/Hero.jsx'
import About from '../components/home/About.jsx'
import Stack from '../components/home/Stack.jsx'
import Services from '../components/home/Services.jsx'
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
      <Experience />

      {/* Banner final de llamada a la acción (CTA) */}
      <section className="container py-5 my-4">
        <div
          className="card border-0 shadow-sm p-4 p-md-5 text-center"
          style={{ backgroundColor: 'var(--color-surface, #f8f9fa)' }}
        >
          <div className="card-body">
            <h2 className="fw-bold mb-3">¿Tenés un proyecto en mente?</h2>
            <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '600px' }}>
              Contame tu idea para armar una propuesta a medida o revisá en detalle los sistemas que ya están en producción.
            </p>
            <div className="d-flex flex-wrap gap-3 justify-content-center">
              <Link to="/contacto" className="btn btn-primary btn-lg px-4">
                Solicitar cotización
              </Link>
              <Link to="/proyectos" className="btn btn-outline-secondary btn-lg px-4">
                Explorar portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}