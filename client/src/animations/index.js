// 🎨 DUEÑO: Integrante A (Animaciones)
// Funciones de animación reutilizables. Los demás las IMPORTAN desde acá:
//   import { fadeInOnScroll } from '../animations'
//
// Herramientas vistas en clase: Web Animations API (MDN) y anime.js (npm i animejs).

/**
 * Hace aparecer los elementos cuando entran en pantalla.
 * Usa Intersection Observer + Web Animations API.
 * Devuelve una función para limpiar (usar en el return de useEffect).
 */
export function fadeInOnScroll(elements, { delay = 0 } = {}) {
  const list = Array.from(elements || []).filter(Boolean)
  if (!('IntersectionObserver' in window) || list.length === 0) return () => {}

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return
        entry.target.animate(
          [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 600, delay: delay + i * 80, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' },
        )
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.15 },
  )
  list.forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}

// TODO (A): entrada del hero con anime.js
// TODO (A): contadores animados para el dashboard (D los usa)
// TODO (A): Lottie para el hero o la confirmación del formulario
