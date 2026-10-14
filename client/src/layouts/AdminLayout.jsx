// ⚙️ BASE DEL PROYECTO — layout del panel de administrador.
import PanelLayout from './PanelLayout.jsx'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/proyectos', label: 'Proyectos y demos' },
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/operador', label: 'Consultas' },
]

export default function AdminLayout() {
  return <PanelLayout title="Panel de administrador" links={links} />
}
