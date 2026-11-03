// ⚙️ BASE DEL PROYECTO — layout del panel de operador (menú de Bandeja.dc.html).
import PanelLayout from './PanelLayout.jsx'

const links = [{ to: '/operador', label: 'Consultas', end: true, icono: 'consultas' }]

export default function OperatorLayout() {
  return <PanelLayout variante="operador" links={links} />
}
