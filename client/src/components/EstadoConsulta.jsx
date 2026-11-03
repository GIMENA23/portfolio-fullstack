// 🎨 DUEÑO: Integrante A (estilo) — estado de una consulta: SIEMPRE ícono + texto (clases .estado-* de theme.css).
//   <EstadoConsulta status="en_proceso" />  →  ◐ En proceso
import { ESTADOS } from '../pages/operator/inquiryLabels.js'

export default function EstadoConsulta({ status }) {
  const e = ESTADOS[status] ?? ESTADOS.nueva
  return (
    <span className={`estado ${e.clase}`}>
      <span aria-hidden="true">{e.icono}</span> {e.label}
    </span>
  )
}
