// 🎨 DUEÑO: Integrante A (Animaciones)
import { useModoNoche } from '../modoNoche.js'
import '../animaciones.css'

/**
 * Botón ☀/☾ que alterna modo claro y noche.
 *   <BotonModoNoche />                       (en la navbar o en el panel)
 *   <BotonModoNoche className="ms-2" />
 */
export default function BotonModoNoche({ className = '' }) {
  const [noche, alternar] = useModoNoche()
  return (
    <button
      type="button"
      className={`btn btn-outline-secondary btn-sm boton-noche ${className}`.trim()}
      onClick={alternar}
      aria-pressed={noche}
      aria-label={noche ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
      title={noche ? 'Modo claro' : 'Modo noche'}
    >
      <span aria-hidden="true">{noche ? '☀' : '☾'}</span>
    </button>
  )
}
