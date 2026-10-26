// 🎨 DUEÑO: Integrante A (Diseño)
// Colores de la marca para usar desde JavaScript (Chart.js, anime.js, canvas).
// En CSS usar siempre las variables de theme.css.
//
// Uso con Chart.js:
//   import { chartColors } from '../styles/tokens.js'
//   const c = chartColors()            // lee el modo actual (claro o noche)
//   dataset.backgroundColor = c.serie   // barras históricas
//   dataset.backgroundColor = c.actual  // barra del período actual / dato destacado

export const marca = {
  carmin: '#9B1B22',
  negro: '#160F10',
  lana: '#EFE9E1',
  lanaClara: '#F8F4EE',
  dorado: '#E3B04B',
  oroViejo: '#7A5A12',
  textoSuave: '#5E5550',
  linea: '#D8CEC2',
  exito: '#4F6B3E',
  error: '#B93A0C',
  vicuna: '#8A5A35',
}

export const noche = {
  fondo: '#160F10',
  superficie: '#211819',
  texto: '#EFE9E1',
  carminLuz: '#E5545B',
  textoSuave: '#B3A79F',
  exito: '#9DBB86',
  error: '#F07A4A',
  linea: '#3A2E2E',
}

export const fuentes = {
  titulo: "'Syne', 'Arial Black', sans-serif",
  texto: "'Instrument Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
}

/** true si el sitio está en modo noche */
export function esNoche() {
  const el = document.documentElement
  return el.getAttribute('data-bs-theme') === 'dark' || el.getAttribute('data-theme') === 'dark'
}

/** Colores para gráficos según el modo actual */
export function chartColors() {
  const n = esNoche()
  return {
    serie: marca.vicuna,                       // datos históricos
    actual: n ? noche.carminLuz : marca.carmin, // dato destacado
    tipos: [marca.carmin, marca.vicuna, n ? noche.exito : marca.exito, marca.dorado], // general, cotización, asesoría, otro
    texto: n ? noche.texto : marca.negro,
    textoSuave: n ? noche.textoSuave : marca.textoSuave,
    grilla: n ? noche.linea : marca.linea,
    fuente: fuentes.texto,
  }
}
