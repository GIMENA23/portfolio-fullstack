// 🎨 DUEÑO: Integrante B — 05 Experiencia (Main.dc.html): línea de tiempo con rombos
// + actividad real del repositorio desde la API pública de GitHub.
import { useEffect, useState } from 'react'
import { useReveal, GuardaLoader, GuardaTejida } from '../../animations'
import EncabezadoSeccion from '../EncabezadoSeccion.jsx'

const REPO = 'GIMENA23/portfolio-fullstack'
const REPO_URL = `https://github.com/${REPO}`

// Años y empresas: placeholders hasta tener los datos reales.
const TIMELINE = [
  {
    periodo: '[AÑO] — HOY',
    rol: 'Desarrolladora fullstack independiente',
    texto: 'Sistemas a medida para pymes de Salta y Jujuy.',
  },
  {
    periodo: '[AÑO] — [AÑO]',
    rol: 'Desarrolladora backend · [EMPRESA]',
    texto: 'APIs REST y bases de datos para un equipo de producto.',
  },
  {
    periodo: '[AÑO] — [AÑO]',
    rol: 'Ingeniería en Informática · UCASAL',
    texto: 'Formación en desarrollo de software y sistemas.',
  },
]

const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function useRepoGithub() {
  const [estado, setEstado] = useState({ cargando: true, error: '', repo: null, lenguajes: [], commits: [] })

  useEffect(() => {
    let activo = true
    const pedir = (ruta) =>
      fetch(`https://api.github.com/repos/${REPO}${ruta}`).then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'GitHub limitó las consultas por un rato' : `GitHub respondió ${res.status}`)
        return res.json()
      })

    Promise.all([pedir(''), pedir('/languages'), pedir('/commits?per_page=5')])
      .then(([repo, langs, commits]) => {
        if (!activo) return
        const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1
        const lenguajes = Object.entries(langs).map(([nombre, bytes]) => ({ nombre, pct: Math.round((bytes / total) * 100) }))
        setEstado({ cargando: false, error: '', repo, lenguajes, commits })
      })
      .catch((err) => {
        if (activo) setEstado({ cargando: false, error: err.message || 'No se pudo conectar con GitHub', repo: null, lenguajes: [], commits: [] })
      })
    return () => {
      activo = false
    }
  }, [])

  return estado
}

function ActividadGithub() {
  const { cargando, error, repo, lenguajes, commits } = useRepoGithub()

  if (cargando) return <GuardaLoader texto="Consultando GitHub…" />

  if (error) {
    return (
      <div className="alert alert-light mb-0" role="alert">
        ⚠ No pudimos cargar la actividad de GitHub ({error}).{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="alert-link">Ver el repositorio en GitHub ↗</a>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-body p-4 d-flex flex-column gap-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="fw-bold">{repo.full_name} ↗</a>
            {repo.description && <p className="small text-secondary mb-0">{repo.description}</p>}
          </div>
          <span className="rotulo">★ {repo.stargazers_count} · ⑂ {repo.forks_count}</span>
        </div>

        {lenguajes.length > 0 && (
          <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0" aria-label="Lenguajes del repositorio">
            {lenguajes.map((l) => (
              <li key={l.nombre} className="chip-email small">{l.nombre} · {l.pct}%</li>
            ))}
          </ul>
        )}

        <div>
          <p className="rotulo mb-2">Últimos commits</p>
          <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
            {commits.map((c) => (
              <li key={c.sha} className="small d-flex flex-wrap justify-content-between gap-2">
                <a href={c.html_url} target="_blank" rel="noreferrer" className="text-decoration-none">
                  {c.commit.message.split('\n')[0]}
                </a>
                <span className="text-secondary">{fechaCorta(c.commit.author.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function Experience() {
  const ref = useReveal()

  return (
    <>
      <GuardaTejida fina />
      <section id="experiencia" ref={ref} className="sec-clara">
        <div className="sec-inner d-flex flex-column gap-5">
          <div className="d-flex flex-wrap gap-5">
            <div data-reveal className="d-flex flex-column gap-3" style={{ flex: '1 1 280px', minWidth: 0 }}>
              <EncabezadoSeccion num="05" rotulo="EXPERIENCIA · RECORRIDO" titulo="Experiencia" />
              <p className="mb-0 text-secondary small">Trabajo independiente, equipos de producto y formación en la UCASAL.</p>
            </div>
            <ol data-reveal className="linea-tiempo" style={{ flex: '2 1 480px', minWidth: 0 }}>
              {TIMELINE.map((t) => (
                <li key={t.rol}>
                  <span className="hito" aria-hidden="true" />
                  <span className="linea-fecha">{t.periodo}</span>
                  <strong className="linea-rol">{t.rol}</strong>
                  <p className="mb-0 small text-secondary">{t.texto}</p>
                </li>
              ))}
            </ol>
          </div>

          <div data-reveal>
            <p className="rotulo mb-3">ACTIVIDAD EN GITHUB</p>
            <ActividadGithub />
          </div>
        </div>
      </section>
    </>
  )
}
