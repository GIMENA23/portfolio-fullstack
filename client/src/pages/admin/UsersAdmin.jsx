// 🎨 DUEÑO: Integrante D
import Placeholder from '../../components/Placeholder.jsx'

export default function UsersAdmin() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="D"
        title="Gestión de usuarios"
        todo={[
          'Listado con usersApi.list({ q, role })',
          'Cambiar rol, activar/desactivar, eliminar',
          'Mostrar fecha de alta, último acceso y cantidad de accesos',
        ]}
      />
    </div>
  )
}
