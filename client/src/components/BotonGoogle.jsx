// Botón de Google (Google Identity Services). Entrega el `credential` (ID token) a `onCredential`.
// Sin VITE_GOOGLE_CLIENT_ID queda deshabilitado con «Disponible pronto» y no carga nada.
import { useEffect, useRef, useState } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GSI_SRC = 'https://accounts.google.com/gsi/client'

let cargaGsi = null
const cargarGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve()
  cargaGsi ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.onload = resolve
    s.onerror = () => {
      cargaGsi = null
      reject(new Error('gsi'))
    }
    document.head.appendChild(s)
  })
  return cargaGsi
}

export default function BotonGoogle({ texto = 'signin_with', onCredential, onError, disabled }) {
  const contenedor = useRef(null)
  const alCredencial = useRef(onCredential)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    alCredencial.current = onCredential
  })

  useEffect(() => {
    if (!CLIENT_ID) return
    let activo = true
    cargarGsi()
      .then(() => {
        if (!activo || !contenedor.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => r?.credential && alCredencial.current?.(r.credential),
        })
        window.google.accounts.id.renderButton(contenedor.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: texto,
          shape: 'rectangular',
          width: Math.min(contenedor.current.clientWidth || 320, 400),
        })
      })
      .catch(() => {
        if (!activo) return
        setFallo(true)
        onError?.('No pudimos cargar el acceso con Google. Probá con tu email.')
      })
    return () => {
      activo = false
    }
  }, [texto, onError])

  if (!CLIENT_ID || fallo) {
    return (
      <button type="button" className="btn btn-google" disabled>
        {fallo ? 'Google no disponible' : 'Continuar con Google · Disponible pronto'}
      </button>
    )
  }

  return (
    <div
      ref={contenedor}
      className="d-flex justify-content-center"
      style={disabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
      aria-label="Continuar con Google"
    />
  )
}
