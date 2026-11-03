// ⚙️ BASE DEL PROYECTO — todas las rutas ya están creadas.
// No hace falta tocar este archivo para trabajar: cada uno edita SU página.
// Si necesitás una ruta nueva, avisá en el grupo y la agrega una sola persona.
import { Routes, Route } from 'react-router-dom'

import PublicLayout from './layouts/PublicLayout.jsx'
import OperatorLayout from './layouts/OperatorLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import useTrackVisits from './hooks/useTrackVisits.js'

// Público (B)
import Home from './pages/Home.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Servicios from './pages/Servicios.jsx'
import Cuenta from './pages/Cuenta.jsx'
import Recuperar from './pages/Recuperar.jsx'
import NotFound from './pages/NotFound.jsx'

// Operador (D)
import Inbox from './pages/operator/Inbox.jsx'
import InquiryDetail from './pages/operator/InquiryDetail.jsx'

// Administrador (D)
import Dashboard from './pages/admin/Dashboard.jsx'
import ProjectsAdmin from './pages/admin/ProjectsAdmin.jsx'
import ServicesAdmin from './pages/admin/ServicesAdmin.jsx'
import UsersAdmin from './pages/admin/UsersAdmin.jsx'
import ProfileAdmin from './pages/admin/ProfileAdmin.jsx'

export default function App() {
  useTrackVisits()

  return (
    <Routes>
      {/* Sitio público */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="proyectos" element={<Projects />} />
        <Route
          path="proyectos/:id"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route path="servicios" element={<Servicios />} />
        <Route path="contacto" element={<Contact />} />
        <Route
          path="cuenta"
          element={
            <ProtectedRoute>
              <Cuenta />
            </ProtectedRoute>
          }
        />
        <Route path="recuperar" element={<Recuperar />} />
      </Route>

      {/* Acceso: pantalla dividida, sin navbar ni pie (Login.dc.html / Registro.dc.html) */}
      <Route path="login" element={<Login />} />
      <Route path="registro" element={<Register />} />

      {/* Panel de operador (solo operadores; el admin tiene su propio panel) */}
      <Route
        path="operador"
        element={
          <ProtectedRoute roles={['operator']}>
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Inbox />} />
        <Route path="consultas/:id" element={<InquiryDetail />} />
      </Route>

      {/* Panel de administrador */}
      <Route
        path="admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="proyectos" element={<ProjectsAdmin />} />
        <Route path="servicios" element={<ServicesAdmin />} />
        <Route path="usuarios" element={<UsersAdmin />} />
        <Route path="perfil" element={<ProfileAdmin />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
