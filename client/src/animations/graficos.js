// 🎨 DUEÑO: Integrante A (Animaciones)
// Opciones de gráficos (Chart.js) con la marca: colores de chartColors(), fuente y animación
// de entrada. NO importa chart.js: devuelve objetos para pasar a <Bar>, <Line> o <Doughnut>.
//
//   import { useColoresGrafico, opcionesGrafico, estiloDataset } from '../../animations'
//   const c = useColoresGrafico()            // se actualiza al cambiar de modo
//   <Bar options={opcionesGrafico('barras', c)}
//        data={{ labels, datasets: [{ data, ...estiloDataset('barras', c) }] }} />
import { useMemo } from 'react'
import { chartColors } from '../styles/tokens.js'
import { useModoNoche } from './modoNoche.js'
import { reduceMovimiento } from './movimiento.js'

/** Colores actuales para gráficos; cambia solo cuando cambia el modo claro/noche. */
export function useColoresGrafico() {
  const [noche] = useModoNoche()
  return useMemo(() => ({ noche, ...chartColors() }), [noche])
}

/** Animación de entrada: crecen escalonados. Sin animación si piden reducir movimiento. */
function animacion(tipo) {
  if (reduceMovimiento()) return false
  return {
    duration: 900,
    easing: 'easeOutQuart',
    delay: (ctx) => (ctx.type === 'data' && ctx.mode === 'default' ? ctx.dataIndex * (tipo === 'dona' ? 120 : 60) : 0),
  }
}

/** tipo: 'barras' | 'linea' | 'dona' */
export function opcionesGrafico(tipo = 'barras', c = chartColors()) {
  const opciones = {
    responsive: true,
    maintainAspectRatio: false, // el alto lo da el contenedor (ej.: .grafico)
    animation: animacion(tipo),
    font: { family: c.fuente },
    plugins: {
      legend: { position: 'bottom', labels: { color: c.texto, font: { family: c.fuente } } },
      tooltip: { titleFont: { family: c.fuente }, bodyFont: { family: c.fuente } },
    },
  }
  if (tipo !== 'dona') {
    opciones.plugins.legend.display = false
    opciones.scales = {
      x: { grid: { display: false }, ticks: { color: c.textoSuave } },
      y: { beginAtZero: true, ticks: { precision: 0, color: c.textoSuave }, grid: { color: c.grilla } },
    }
  }
  return opciones
}

/** Estilo del dataset según el tipo (reemplaza a color('--pc-…') a mano). */
export function estiloDataset(tipo = 'barras', c = chartColors()) {
  if (tipo === 'linea') {
    return { borderColor: c.actual, backgroundColor: `${c.actual}22`, fill: true, tension: 0.3, pointBackgroundColor: c.actual }
  }
  if (tipo === 'dona') return { backgroundColor: c.tipos, borderColor: c.grilla, borderWidth: 2 }
  return { backgroundColor: c.serie }
}
