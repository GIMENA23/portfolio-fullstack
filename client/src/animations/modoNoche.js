// 🎨 DUEÑO: Integrante A (Animaciones)
// Modo noche: pone data-bs-theme="dark|light" en <html> y lo recuerda en localStorage.
// Avisa el cambio con el evento «pc-tema» (lo escuchan los gráficos y el botón).
import { useSyncExternalStore } from 'react'
import { esNoche } from '../styles/tokens.js'

const CLAVE = 'pc-tema'
const EVENTO = 'pc-tema'

function leerGuardado() {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null // sin storage (ventana privada, bloqueado…)
  }
}

/** Aplica 'dark' o 'light'. Con guardar=true lo recuerda para la próxima visita. */
export function aplicarTema(tema, { guardar = true } = {}) {
  const t = tema === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-bs-theme', t)
  if (guardar) {
    try { localStorage.setItem(CLAVE, t) } catch { /* sin storage */ }
  }
  window.dispatchEvent(new Event(EVENTO))
}

/** Llamar una vez al arrancar: usa lo guardado o, si no hay, la preferencia del sistema. */
export function aplicarModoGuardado() {
  const guardado = leerGuardado()
  const sistema = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  aplicarTema(guardado ?? sistema, { guardar: false })
}

export function alternarTema() {
  aplicarTema(esNoche() ? 'light' : 'dark')
}

function suscribir(aviso) {
  window.addEventListener(EVENTO, aviso)
  return () => window.removeEventListener(EVENTO, aviso)
}

/** [noche, alternar] — se vuelve a renderizar cuando cambia el modo. */
export function useModoNoche() {
  const noche = useSyncExternalStore(suscribir, esNoche, () => false)
  return [noche, alternarTema]
}
