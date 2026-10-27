// 🎨 DUEÑO: Integrante A (Animaciones)
import { useEffect, useRef } from 'react'
import { reduceMovimiento } from '../movimiento.js'
import '../animaciones.css'

/**
 * Barra de carga con la guarda que se teje (Web Animations API).
 * Mostrarla mientras se espera una respuesta de la API:
 *
 *   {cargando ? <GuardaLoader texto="Cargando proyectos…" /> : <Lista />}
 */
export default function GuardaLoader({ texto = 'Cargando…', mostrarTexto = true }) {
  const barra = useRef(null)

  useEffect(() => {
    const el = barra.current
    if (!el || reduceMovimiento()) return undefined
    const anim = el.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }],
      { duration: 1600, iterations: Infinity, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' },
    )
    return () => anim.cancel()
  }, [])

  return (
    <div className="anim-loader" role="status" aria-live="polite">
      <div ref={barra} className="anim-loader-barra" aria-hidden="true" />
      <span className={mostrarTexto ? 'anim-loader-texto' : 'visually-hidden'}>{texto}</span>
    </div>
  )
}
