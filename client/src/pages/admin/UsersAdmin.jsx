import { useEffect, useState } from 'react'
import { usersApi } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { GuardaLoader } from '../../animations'
import { mockUsers } from './mockAdmin.js'

const ROLES = { user: 'Usuario', operator: 'Operador', admin: 'Administrador' }
const POR_PAGINA = 8

const formatoFecha = (iso) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca'

export default function UsersAdmin() {
  const { user: yo } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)
  const [aviso, setAviso] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState({ q: '', role: '', page: 1 })
  const [ocupadoId, setOcupadoId] = useState(null)
  const [confirmarId, setConfirmarId] = useState(null)

  const pedir = (nuevos) => {
    if (!usandoMock) setLoading(true)
    setFiltros(nuevos)
  }

  useEffect(() => {
    const q = busqueda.trim()
    if (q === filtros.q) return undefined
    const t = setTimeout(() => {
      if (!usandoMock) setLoading(true)
      setFiltros((f) => ({ ...f, q, page: 1 }))
    }, 300)
    return () => clearTimeout(t)
  }, [busqueda, filtros.q, usandoMock])

  useEffect(() => {
    if (usandoMock) return
    usersApi
      .list(filtros)
      .then((data) => { // datos reales
        setUsuarios(data.items ?? data)
        setTotalPaginas(data.pages ?? 1)
        setError('')
      })
      .catch((err) => {
        if (err.status === 501) { // datos de prueba
          setUsuarios(mockUsers)
          setUsandoMock(true)
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [filtros, usandoMock])

  let visibles = usuarios
  let paginas = totalPaginas
  if (usandoMock) { // datos de prueba
    const q = filtros.q.toLowerCase()
    const filtrados = usuarios.filter(
      (u) =>
        (!filtros.role || u.role === filtros.role) &&
        (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)),
    )
    paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
    const pagina = Math.min(filtros.page, paginas)
    visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  }

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(''), 3500)
  }

  const esYo = (u) => yo && (u._id === yo._id || u.email === yo.email)

  const actualizar = async (u, cambios, mensaje) => {
    setOcupadoId(u._id)
    setError('')
    try {
      const data = await usersApi.update(u._id, cambios)
      setUsuarios((lista) => lista.map((x) => (x._id === u._id ? (data?._id ? data : { ...x, ...cambios }) : x)))
      mostrarAviso(mensaje)
    } catch (err) {
      if (err.status === 501) { // datos de prueba
        setUsuarios((lista) => lista.map((x) => (x._id === u._id ? { ...x, ...cambios } : x)))
        mostrarAviso(`${mensaje} (solo en pantalla)`)
      } else {
        setError(err.message)
      }
    } finally {
      setOcupadoId(null)
    }
  }

  const eliminar = async (u) => {
    setOcupadoId(u._id)
    setError('')
    try {
      await usersApi.remove(u._id)
      mostrarAviso(`Se eliminó a ${u.name}.`)
    } catch (err) {
      if (err.status !== 501) {
        setError(err.message)
        setOcupadoId(null)
        setConfirmarId(null)
        return
      }
      mostrarAviso(`Se eliminó a ${u.name} (solo en pantalla).`)
    }
    setUsuarios((lista) => lista.filter((x) => x._id !== u._id))
    setOcupadoId(null)
    setConfirmarId(null)
  }

  const irAPagina = (page) => pedir({ ...filtros, page })

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">Usuarios</h1>
        {usandoMock && <span className="badge text-bg-warning">Datos de prueba</span>}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-8">
          <input
            type="search"
            className="form-control"
            placeholder="Buscar por nombre o email"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            maxLength={60}
            aria-label="Buscar usuarios"
          />
        </div>
        <div className="col-12 col-md-4">
          <select
            className="form-select"
            value={filtros.role}
            onChange={(e) => pedir({ ...filtros, role: e.target.value, page: 1 })}
            aria-label="Filtrar por rol"
          >
            <option value="">Todos los roles</option>
            {Object.entries(ROLES).map(([valor, label]) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading && <GuardaLoader texto="Cargando usuarios…" />}

      {!loading && visibles.length === 0 && !error && (
        <div className="alert alert-light border">No hay usuarios con esos filtros.</div>
      )}

      {!loading && visibles.length > 0 && (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Activo</th>
                <th className="d-none d-lg-table-cell">Alta</th>
                <th className="d-none d-md-table-cell">Último acceso</th>
                <th className="d-none d-md-table-cell text-end">Accesos</th>
                <th className="text-end"><span className="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => {
                const propio = esYo(u)
                const ocupado = ocupadoId === u._id
                return (
                  <tr key={u._id} className={u.active ? '' : 'opacity-75'}>
                    <td style={{ minWidth: '12rem' }}>
                      <div className="small text-muted text-break">{u.email}</div>
                      {u.provider === 'google' && <div className="small text-muted">Cuenta de Google</div>}
                      <div className="small text-muted d-md-none">
                        {u.loginCount ?? 0} accesos · último: {formatoFecha(u.lastLogin)}
                      </div>
                    </td>
                    <td style={{ minWidth: '9.5rem' }}>
                      <select
                        className="form-select form-select-sm"
                        value={u.role}
                        disabled={propio || ocupado}
                        title={propio ? 'No podés cambiar tu propio rol' : undefined}
                        onChange={(e) =>
                          actualizar(u, { role: e.target.value }, `${u.name} ahora es ${ROLES[e.target.value]}.`)
                        }
                        aria-label={`Rol de ${u.name}`}
                      >
                        {Object.entries(ROLES).map(([valor, label]) => (
                          <option key={valor} value={valor}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="form-check form-switch mb-0">
                        <input
                          type="checkbox"
                          role="switch"
                          className="form-check-input"
                          checked={u.active}
                          disabled={propio || ocupado}
                          onChange={(e) =>
                            actualizar(
                              u,
                              { active: e.target.checked },
                              `${u.name} quedó ${e.target.checked ? 'activo' : 'desactivado'}.`,
                            )
                          }
                          aria-label={`${u.name} activo`}
                        />
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell small text-nowrap">{formatoFecha(u.createdAt)}</td>
                    <td className="d-none d-md-table-cell small text-nowrap">{formatoFecha(u.lastLogin)}</td>
                    <td className="d-none d-md-table-cell text-end">{u.loginCount ?? 0}</td>
                    <td className="text-end text-nowrap">
                      {propio ? null : confirmarId === u._id ? (
                        <div className="d-flex flex-column flex-sm-row gap-1 justify-content-end">
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => eliminar(u)} disabled={ocupado}>
                            Eliminar
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmarId(null)} disabled={ocupado}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setConfirmarId(u._id)}
                          aria-label={`Eliminar a ${u.name}`}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && paginas > 1 && (
        <nav aria-label="Páginas de usuarios" className="d-flex justify-content-center">
          <ul className="pagination mb-0">
            <li className={`page-item ${filtros.page === 1 ? 'disabled' : ''}`}>
              <button type="button" className="page-link" onClick={() => irAPagina(filtros.page - 1)}>Anterior</button>
            </li>
            {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
              <li key={n} className={`page-item ${n === filtros.page ? 'active' : ''}`}>
                <button type="button" className="page-link" onClick={() => irAPagina(n)}>{n}</button>
              </li>
            ))}
            <li className={`page-item ${filtros.page === paginas ? 'disabled' : ''}`}>
              <button type="button" className="page-link" onClick={() => irAPagina(filtros.page + 1)}>Siguiente</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
