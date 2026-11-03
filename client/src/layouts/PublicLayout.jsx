// ⚙️ BASE DEL PROYECTO — layout del sitio público (clase 7: Layout + Outlet).
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// Lleva el scroll arriba en cada cambio de página (salvo que la URL traiga un #ancla).
function ScrollAlCambiarRuta() {
  const { pathname, search, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash])
  return null
}

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <ScrollAlCambiarRuta />
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
