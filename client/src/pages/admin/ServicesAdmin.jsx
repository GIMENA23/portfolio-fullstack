// 🎨 DUEÑO: Integrante D
import Placeholder from '../../components/Placeholder.jsx'

export default function ServicesAdmin() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="D"
        title="CRUD de servicios"
        todo={[
          'Listado, crear, editar, eliminar con servicesApi',
          'Validar nombre, descripción y precio',
        ]}
      />
    </div>
  )
}
