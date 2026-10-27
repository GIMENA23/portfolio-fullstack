// 🎨 DUEÑO: Integrante A (Animaciones)
// Utilidades comunes a todas las animaciones.

/** true si la persona pidió «reducir movimiento» en su sistema operativo. */
export function reduceMovimiento() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Curva y duraciones de la marca (iguales a las variables --pc-* de theme.css). */
export const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
export const DURACION = { rapida: 150, normal: 250, lenta: 600 }
