// 🎨 DUEÑO: Integrante A (Animaciones)
import { useLayoutEffect, useRef } from 'react'
import { animarPalabras } from '../titulo.js'
import { reduceMovimiento } from '../movimiento.js'
import '../animaciones.css'

/**
 * Título que entra palabra por palabra (anime.js).
 *
 *   <TituloAnimado texto="Productos web" resaltado="de punta a punta." />
 *
 * - texto: parte normal (negro)
 * - resaltado: parte opcional en carmín
 * - as: etiqueta HTML (h1 por defecto)
 */
export default function TituloAnimado({ texto = '', resaltado = '', as: Etiqueta = 'h1', className = '', delay = 0 }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const palabras = ref.current?.querySelectorAll('.anim-palabra')
    if (!palabras) return undefined
    if (!reduceMovimiento()) palabras.forEach((p) => { p.style.opacity = '0' })
    return animarPalabras(palabras, { delay })
  }, [texto, resaltado, delay])

  const partir = (frase, extra) =>
    frase.split(/\s+/).filter(Boolean).map((p, i) => (
      <span key={`${extra}-${i}`}>
        <span className={`anim-palabra ${extra}`}>{p}</span>{' '}
      </span>
    ))

  return (
    <Etiqueta ref={ref} className={className}>
      {partir(texto, '')}
      {resaltado && partir(resaltado, 'text-carmin')}
    </Etiqueta>
  )
}
