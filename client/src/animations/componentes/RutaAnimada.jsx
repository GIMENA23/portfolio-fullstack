// 🎨 DUEÑO: Integrante A (Animaciones)
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DURACION, EASE, reduceMovimiento } from '../movimiento.js'
import '../animaciones.css'

/**
 * Reemplaza al <Outlet /> de un layout: anima el cambio de página (fundido + subida corta)
 * y lleva el scroll arriba. No anima el primer render.
 *
 *   <main><RutaAnimada /></main>
 *
 * La animación no deja estilos: si se cancela, el contenido queda visible.
 */
export default function RutaAnimada({ scroll = true }) {
  const { pathname } = useLocation()
  const ref = useRef(null)
  const anterior = useRef(pathname)

  useEffect(() => {
    if (anterior.current === pathname) return undefined // primer render
    anterior.current = pathname

    if (scroll) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const el = ref.current
    if (!el || reduceMovimiento() || typeof el.animate !== 'function') return undefined

    const anim = el.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: DURACION.normal + 100, easing: EASE }, // sin fill: al terminar o cancelarse vuelve a lo normal
    )
    return () => anim.cancel()
  }, [pathname, scroll])

  return (
    <div key={pathname} ref={ref} className="ruta-animada">
      <Outlet />
    </div>
  )
}
