// 🎨 DUEÑO: Integrante B — resumen de errores al enviar un formulario.
//   <ResumenErrores errores={errores} etiquetas={{ nombre: 'Nombre' }} />
export default function ResumenErrores({ errores, etiquetas = {} }) {
  const campos = Object.keys(errores).filter((k) => k !== 'general' && errores[k])
  if (campos.length === 0) return null
  return (
    <div className="alert alert-danger" role="alert">
      <p className="fw-semibold mb-1">⚠ Revisá {campos.length === 1 ? 'este campo' : `estos ${campos.length} campos`}:</p>
      <ul className="mb-0 ps-3">
        {campos.map((c) => (
          <li key={c}>
            <strong>{etiquetas[c] ?? c}:</strong> {errores[c]}
          </li>
        ))}
      </ul>
    </div>
  )
}
