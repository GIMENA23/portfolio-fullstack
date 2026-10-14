// 🎨 DUEÑO: Integrante D
import Placeholder from '../../components/Placeholder.jsx'

export default function Dashboard() {
  return (
    <div className="container py-4">
      <Placeholder
        owner="D"
        title="Dashboard de métricas"
        todo={[
          'Tarjetas con statsApi.summary(): visitas, usuarios, accesos, consultas',
          'Gráficos con Chart.js (npm i chart.js react-chartjs-2)',
          'Visitas por día, consultas por tipo, registros por semana',
          'Filtro por rango de fechas',
        ]}
      />
    </div>
  )
}
