// 🎨 DUEÑO: Integrante B (pantalla) · C (Google)
import Placeholder from '../components/Placeholder.jsx'

export default function Register() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="B (pantalla) · C (Google)"
        title="Registro"
        todo={[
          'Campos: nombre, email, contraseña, confirmar contraseña',
          'Validar y llamar a register({ name, email, password }) de useAuth()',
          'Botón "Registrarme con Google" (C)',
          'Después de registrarse, redirigir a /proyectos',
        ]}
      />
    </div>
  )
}
