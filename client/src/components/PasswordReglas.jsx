// 🎨 DUEÑO: Integrante B — lista de reglas que se tildan en vivo (ícono + texto, no solo color).
import { REGLAS_PASSWORD } from './passwordReglas.js'

export default function PasswordReglas({ password, id, grilla = false }) {
  if (grilla) {
    return (
      <ul id={id} className="reglas-grid" aria-live="polite">
        {REGLAS_PASSWORD.map((r) => {
          const ok = r.ok(password)
          return (
            <li key={r.id} className={ok ? 'ok' : 'mal'}>
              <span aria-hidden="true">{ok ? '✓' : '✕'}</span> {r.texto}
              <span className="visually-hidden">{ok ? ' (cumplida)' : ' (pendiente)'}</span>
            </li>
          )
        })}
      </ul>
    )
  }
  return (
    <ul id={id} className="list-unstyled small mb-0 mt-2" aria-live="polite">
      {REGLAS_PASSWORD.map((r) => {
        const ok = r.ok(password)
        return (
          <li key={r.id} className={ok ? 'text-success' : 'text-muted'}>
            <span aria-hidden="true">{ok ? '✓' : '○'}</span> {r.texto}
            <span className="visually-hidden">{ok ? ' (cumplida)' : ' (pendiente)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
