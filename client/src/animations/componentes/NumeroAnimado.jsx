// 🎨 DUEÑO: Integrante A (Animaciones)
import { useEffect, useRef } from 'react'
import { animarNumero } from '../contador.js'

/**
 * Número que cuenta hasta su valor. Para los KPIs del dashboard:
 *
 *   <div className="kpi"><span className="kpi-valor"><NumeroAnimado valor={779} /></span>…</div>
 */
export default function NumeroAnimado({ valor = 0, duracion = 1200, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => animarNumero(ref.current, valor, { duracion, delay }), [valor, duracion, delay])
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{valor}</span>
}
