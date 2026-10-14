// ⚙️ BASE DEL PROYECTO — registra una visita por cada cambio de página.
// Alimenta el contador de visitas del panel de administrador.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { statsApi } from '../services/api.js'

function getSessionId() {
  try {
    let id = sessionStorage.getItem('portfolio_session')
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem('portfolio_session', id)
    }
    return id
  } catch {
    return 'sin-sesion'
  }
}

export default function useTrackVisits() {
  const { pathname } = useLocation()

  useEffect(() => {
    // No contamos las visitas a los paneles internos.
    if (pathname.startsWith('/admin') || pathname.startsWith('/operador')) return
    statsApi.trackVisit(pathname, getSessionId()).catch(() => {
      /* si el backend todavía no lo implementa, no rompe nada */
    })
  }, [pathname])
}
