// ⚙️ BASE DEL PROYECTO — layout del panel de operador.
import PanelLayout from './PanelLayout.jsx'

const links = [{ to: '/operador', label: 'Bandeja de consultas', end: true }]

export default function OperatorLayout() {
  return <PanelLayout title="Panel de operador" links={links} />
}
