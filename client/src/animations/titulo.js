// 🎨 DUEÑO: Integrante A (Animaciones)
// Entrada de títulos palabra por palabra con anime.js.
import { animate, stagger } from 'animejs'
import { reduceMovimiento } from './movimiento.js'

/**
 * Anima una lista de elementos (las palabras) entrando de abajo hacia arriba.
 * Devuelve una función para limpiar (usar en el return de useEffect).
 */
export function animarPalabras(palabras, { delay = 0, paso = 90 } = {}) {
  const lista = Array.from(palabras || []).filter(Boolean)
  if (lista.length === 0) return () => {}
  if (reduceMovimiento()) {
    lista.forEach((el) => { el.style.opacity = '1' })
    return () => {}
  }
  const anim = animate(lista, {
    opacity: [0, 1],
    translateY: ['0.6em', '0em'],
    duration: 800,
    delay: stagger(paso, { start: delay }),
    ease: 'outExpo',
  })
  return () => {
    anim.revert?.()
  }
}
