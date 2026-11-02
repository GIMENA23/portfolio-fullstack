// 🎨 DUEÑO: Integrante A (Animaciones)
// Todo lo animado del sitio se importa desde acá:
//
//   import { TituloAnimado, useReveal, GuardaLoader } from '../animations'
//
// Qué hay y dónde va:
//   <TituloAnimado texto="…" resaltado="…" />  → título del inicio (anime.js)
//   useReveal()                                → secciones que aparecen al hacer scroll (Intersection Observer + Web Animations API)
//   tejerAlVer(el)                             → guarda separadora que se teje al aparecer
//   <GuardaLoader texto="Cargando…" />         → barra de carga mientras llega la API (Web Animations API)
//   <CodigoQueSeEscribe />                     → bloque de código del inicio que se escribe solo
//   <EnviadoLottie />                          → tilde animado al enviar un formulario (Lottie)
//   <NumeroAnimado valor={779} />              → KPIs del dashboard que cuentan (anime.js)
//   <BotonModoNoche />                         → botón ☀/☾ (data-bs-theme en <html> + localStorage)
//   aplicarModoGuardado(), useModoNoche()      → arrancar con el modo recordado / leerlo en un componente
//   <RutaAnimada />                            → reemplaza al <Outlet /> de un layout: anima el cambio de página
//   opcionesGrafico(), estiloDataset(), useColoresGrafico() → opciones de Chart.js con la marca (no importa chart.js)
//   reduceMovimiento()                       → true si el sistema pide menos movimiento
//
// Todas respetan «reducir movimiento» del sistema operativo.
// Demo: con `npm run dev` abrir http://localhost:5173/demo-animaciones.html

import { DURACION, EASE, reduceMovimiento } from './movimiento.js'

export { reduceMovimiento, EASE, DURACION }
export { useReveal, tejerAlVer } from './useReveal.js'
export { animarPalabras } from './titulo.js'
export { animarNumero } from './contador.js'
export { default as TituloAnimado } from './componentes/TituloAnimado.jsx'
export { default as GuardaLoader } from './componentes/GuardaLoader.jsx'
export { default as CodigoQueSeEscribe } from './componentes/CodigoQueSeEscribe.jsx'
export { default as EnviadoLottie } from './componentes/EnviadoLottie.jsx'
export { default as NumeroAnimado } from './componentes/NumeroAnimado.jsx'
export { default as BotonModoNoche } from './componentes/BotonModoNoche.jsx'
export { default as RutaAnimada } from './componentes/RutaAnimada.jsx'
export { aplicarModoGuardado, aplicarTema, alternarTema, useModoNoche } from './modoNoche.js'
export { opcionesGrafico, estiloDataset, useColoresGrafico } from './graficos.js'

/**
 * (De la base) Hace aparecer una lista de elementos al entrar en pantalla.
 * Se mantiene por compatibilidad; para componentes nuevos usar useReveal().
 */
export function fadeInOnScroll(elements, { delay = 0 } = {}) {
  const list = Array.from(elements || []).filter(Boolean)
  if (!('IntersectionObserver' in window) || list.length === 0 || reduceMovimiento()) return () => {}

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return
        entry.target.animate(
          [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: DURACION.lenta, delay: delay + i * 80, easing: EASE, fill: 'both' },
        )
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.15 },
  )
  list.forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}
