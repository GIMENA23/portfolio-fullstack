// 🎨 DUEÑO: Integrante A (Animaciones)
// Números que cuentan hasta su valor (KPIs del dashboard) con anime.js.
import { animate, utils } from 'animejs'
import { reduceMovimiento } from './movimiento.js'

const formato = new Intl.NumberFormat('es-AR')

/**
 * Hace contar el texto de `el` desde 0 hasta `valor`.
 * Devuelve una función para limpiar.
 */
export function animarNumero(el, valor, { duracion = 1200, delay = 0 } = {}) {
  if (!el) return () => {}
  const final = Number(valor) || 0
  if (reduceMovimiento()) {
    el.textContent = formato.format(final)
    return () => {}
  }
  const estado = { n: 0 }
  el.textContent = '0'
  const anim = animate(estado, {
    n: final,
    duration: duracion,
    delay,
    ease: 'outExpo',
    modifier: utils.round(0),
    onUpdate: () => { el.textContent = formato.format(estado.n) },
    onComplete: () => { el.textContent = formato.format(final) },
  })
  return () => {
    anim.pause?.()
    el.textContent = formato.format(final)
  }
}
