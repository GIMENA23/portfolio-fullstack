// 🎨 DUEÑO: Integrante B (estructura) · A (estilo)
// Error amable cuando falla la API: mensaje claro + botón «Reintentar» (en vez de «Error 502»).
//   <ErrorAmable mensaje={error} onReintentar={cargar} />
export default function ErrorAmable({ mensaje, onReintentar }) {
  return (
    <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-3 mb-0" role="alert">
      <span>⚠ {mensaje || 'Algo salió mal. Intentá de nuevo.'}</span>
      {onReintentar && (
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}
