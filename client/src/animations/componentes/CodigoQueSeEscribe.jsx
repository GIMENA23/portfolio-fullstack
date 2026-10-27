// 🎨 DUEÑO: Integrante A (Animaciones)
import { useEffect, useRef, useState } from 'react'
import { reduceMovimiento } from '../movimiento.js'
import '../animaciones.css'

const CODIGO_INICIAL = `const martina = {
  rol: 'Desarrolladora Fullstack',
  stack: ['React', 'Node.js', 'MongoDB'],
  base: 'Salta, Argentina',
  disponible: true,
};`

/**
 * Bloque de código que se escribe solo cuando aparece en pantalla.
 *
 *   <CodigoQueSeEscribe />                      // usa el ejemplo de Martina
 *   <CodigoQueSeEscribe codigo={miTexto} velocidad={30} />
 */
export default function CodigoQueSeEscribe({ codigo = CODIGO_INICIAL, velocidad = 28, archivo = 'martina.js' }) {
  const [n, setN] = useState(() => (reduceMovimiento() ? codigo.length : 0))
  const caja = useRef(null)

  useEffect(() => {
    if (reduceMovimiento()) return undefined
    let timer = null
    let i = 0
    const escribir = () => {
      i += 1
      setN(i)
      if (i < codigo.length) {
        const pausa = codigo[i - 1] === '\n' ? velocidad * 6 : velocidad
        timer = setTimeout(escribir, pausa)
      }
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { obs.disconnect(); timer = setTimeout(escribir, 300) }
    }, { threshold: 0.4 })
    if (caja.current) obs.observe(caja.current)
    return () => { obs.disconnect(); clearTimeout(timer) }
  }, [codigo, velocidad])

  const terminado = n >= codigo.length

  return (
    <figure ref={caja} className="anim-codigo">
      <figcaption className="anim-codigo-barra">
        <span aria-hidden="true">● ● ●</span>
        <span>{archivo}</span>
      </figcaption>
      {/* El texto completo queda disponible para lectores de pantalla */}
      <pre aria-label={codigo}>
        <code aria-hidden="true">{codigo.slice(0, n)}</code>
        <span className={`anim-cursor ${terminado ? 'anim-cursor-parpadea' : ''}`} aria-hidden="true" />
      </pre>
    </figure>
  )
}
