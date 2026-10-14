// 🎨 DUEÑO: Integrante B
import Placeholder from '../components/Placeholder.jsx'

export default function Contact() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="B"
        title="Formulario de contacto"
        todo={[
          'Campos: nombre, email, teléfono (opcional), tipo (general / cotizacion / asesoria), asunto, mensaje',
          'Validación estricta antes de enviar (ver plan de trabajo, sección 9)',
          'Enviar con inquiriesApi.create(datos) y mostrar confirmación',
          'Mostrar errores por campo usando error.details',
        ]}
      />
    </div>
  )
}
