// 🎨 DUEÑO: Integrante A (Animaciones)
import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import enviado from '../lottie/enviado.json'
import { reduceMovimiento } from '../movimiento.js'

/**
 * Tilde animado de «enviado» (Lottie). Mostrarlo cuando la API confirma el envío:
 *
 *   {enviado && <EnviadoLottie />}
 */
export default function EnviadoLottie({ tamano = 96, etiqueta = 'Enviado correctamente' }) {
  const caja = useRef(null)

  useEffect(() => {
    if (!caja.current) return undefined
    const quieto = reduceMovimiento()
    const anim = lottie.loadAnimation({
      container: caja.current,
      renderer: 'svg',
      loop: false,
      autoplay: !quieto,
      animationData: enviado,
    })
    if (quieto) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(anim.totalFrames - 1, true))
    return () => anim.destroy()
  }, [])

  return <div ref={caja} role="img" aria-label={etiqueta} style={{ width: tamano, height: tamano }} />
}
