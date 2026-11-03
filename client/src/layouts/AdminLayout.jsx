// ⚙️ BASE DEL PROYECTO — layout del panel de administrador (menú de Dashboard.dc.html).
import PanelLayout from './PanelLayout.jsx'

const grupos = [
  {
    titulo: 'CONTENIDO Y MÉTRICAS',
    items: [
      { to: '/admin', label: 'Dashboard', end: true, icono: 'dashboard' },
      { to: '/admin/proyectos', label: 'Proyectos y demos', icono: 'proyectos' },
      { to: '/admin/servicios', label: 'Servicios', icono: 'servicios' },
    ],
  },
  {
    titulo: 'CUENTAS',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios', icono: 'usuarios' },
      { to: '/admin/perfil', label: 'Mi perfil', icono: 'perfil' },
    ],
  },
]

export default function AdminLayout() {
  return <PanelLayout variante="admin" grupos={grupos} />
}
