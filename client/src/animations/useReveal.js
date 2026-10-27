// 🎨 DUEÑO: Integrante A (Animaciones)
// Aparición al hacer scroll: Intersection Observer + Web Animations API.
import { useEffect, useRef } from 'react'
import { DURACION, EASE, reduceMovimiento } from './movimiento.js'

/**
 * Hook: devuelve una ref para poner en una sección.
 * - Si dentro hay elementos con el atributo data-reveal, aparecen uno tras otro.
 * - Si no hay ninguno, aparece la sección entera.
 *
 *   const ref = useReveal()
 *   <section ref={ref}>
 *     <h2 data-reveal>Servicios</h2>
 *     <div data-reveal>…</div>
 *   </section>
 */
export function useReveal({ paso = 90, umbral = 0.15, distancia = 24 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const raiz = ref.current
    if (!raiz) return undefined
    const hijos = raiz.querySelectorAll('[data-reveal]')
    const lista = hijos.length ? Array.from(hijos) : [raiz]
    if (reduceMovimiento() || !('IntersectionObserver' in window)) return undefined

    lista.forEach((el) => { el.style.opacity = '0' })
    let orden = 0
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return
          const el = entrada.target
          el.animate(
            [
              { opacity: 0, transform: `translateY(${distancia}px)` },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: DURACION.lenta, delay: (orden++ % 6) * paso, easing: EASE, fill: 'forwards' },
          )
          observador.unobserve(el)
        })
      },
      { threshold: umbral },
    )
    lista.forEach((el) => observador.observe(el))

    return () => {
      observador.disconnect()
      lista.forEach((el) => {
        el.getAnimations().forEach((a) => a.cancel())
        el.style.opacity = ''
      })
    }
  }, [paso, umbral, distancia])

  return ref
}

/**
 * Teje una guarda (separador) de izquierda a derecha una sola vez, cuando entra en pantalla.
 *   useEffect(() => tejerAlVer(guardaRef.current), [])
 */
export function tejerAlVer(el, { duracion = 1200 } = {}) {
  if (!el || reduceMovimiento() || !('IntersectionObserver' in window)) return () => {}
  el.style.clipPath = 'inset(0 100% 0 0)'
  const observador = new IntersectionObserver(
    ([entrada]) => {
      if (!entrada.isIntersecting) return
      el.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
        duration: duracion,
        easing: 'cubic-bezier(0.6, 0, 0.2, 1)',
        fill: 'forwards',
      })
      observador.disconnect()
    },
    { threshold: 0.5 },
  )
  observador.observe(el)
  return () => {
    observador.disconnect()
    el.getAnimations().forEach((a) => a.cancel())
    el.style.clipPath = ''
  }
}
