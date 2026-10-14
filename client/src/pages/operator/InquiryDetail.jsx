// 🎨 DUEÑO: Integrante D
import Placeholder from '../../components/Placeholder.jsx'

export default function InquiryDetail() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="D"
        title="Detalle de consulta"
        todo={[
          'Leer el id con useParams() e inquiriesApi.get(id)',
          'Historial de respuestas (replies)',
          'Formulario de respuesta → inquiriesApi.reply(id, texto)',
          'Cambiar estado → inquiriesApi.setStatus(id, estado)',
        ]}
      />
    </div>
  )
}
