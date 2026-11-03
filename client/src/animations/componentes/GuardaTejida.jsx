// 🎨 DUEÑO: Integrante A (Animaciones)
import { useEffect, useRef } from 'react'
import { tejerAlVer } from '../useReveal.js'
import { reduceMovimiento } from '../movimiento.js'

/**
 * Guarda separadora que se teje.
 *   <GuardaTejida />                 → se teje al aparecer en pantalla (separadores entre secciones)
 *   <GuardaTejida fina />            → versión fina (8 px)
 *   <GuardaTejida alCargar />        → se teje apenas carga la página (debajo del hero)
 */
export default function GuardaTejida({ fina = false, alCargar = false, delay = 400 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (!alCargar) return tejerAlVer(el)
    if (reduceMovimiento()) return undefined
    const anim = el.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 1400, delay, easing: 'cubic-bezier(0.6, 0, 0.2, 1)', fill: 'backwards' },
    )
    return () => anim.cancel()
  }, [alCargar, delay])

  return <div ref={ref} aria-hidden="true" className={fina ? 'guarda-fina' : 'guarda'} />
}
