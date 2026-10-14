// 🎨 DUEÑO: Integrante D
import Placeholder from '../../components/Placeholder.jsx'

export default function Inbox() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="D"
        title="Bandeja de consultas"
        todo={[
          'Tabla con inquiriesApi.list({ tipo, estado, desde, hasta, q, page })',
          'Filtros por tipo, estado y rango de fechas; búsqueda',
          'Click en una fila → /operador/consultas/:id',
        ]}
      />
    </div>
  )
}
