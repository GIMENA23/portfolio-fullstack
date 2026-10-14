// 🎨 DUEÑO: Integrante D
import Placeholder from '../../components/Placeholder.jsx'

export default function ProjectsAdmin() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="D"
        title="CRUD de proyectos y demos"
        todo={[
          'Listado con projectsApi.list({ all: true })',
          'Formulario crear/editar con imágenes (FormData), vista previa',
          'Validar tipo (JPG/PNG/WebP) y peso (máx. 2 MB) antes de subir',
          'Confirmar antes de eliminar',
        ]}
      />
    </div>
  )
}
