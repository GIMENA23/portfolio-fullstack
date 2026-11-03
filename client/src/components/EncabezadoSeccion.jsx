// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
// Cabecera de sección del inicio: número grande 01–05 + rótulo + título (como en el prototipo).
//   <EncabezadoSeccion num="01" rotulo="PERFIL · QUIÉN SOY" titulo="…" />
export default function EncabezadoSeccion({ num, rotulo, titulo, dorado = false, carmin = false }) {
  return (
    <div className="d-flex flex-column gap-2">
      <div className="sec-head">
        <span className={`sec-num ${dorado ? 'sec-num-dorado' : ''}`} aria-hidden="true">{num}</span>
        <span className="rotulo">{rotulo}</span>
      </div>
      <h2 className={`sec-titulo ${carmin ? 'sec-titulo-carmin' : ''}`}>{titulo}</h2>
    </div>
  )
}
