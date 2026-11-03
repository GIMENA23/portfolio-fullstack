// 🎨 DUEÑO: Integrante B — contacto (Contacto.dc.html): título sobre lana, datos 1/3 y formulario 2/3.
import { useState } from 'react'
import { inquiriesApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { EnviadoLottie, GuardaTejida, TituloAnimado } from '../animations'

const TIPOS = [
  { id: 'general', label: 'General' },
  { id: 'cotizacion', label: 'Cotización' },
  { id: 'asesoria', label: 'Asesoría' },
]
const PRESUPUESTOS = [
  { id: 'chico', label: 'Hasta $500.000' },
  { id: 'medio', label: '$500.000 a $1.500.000' },
  { id: 'grande', label: 'Más de $1.500.000' },
]
const ADJUNTO_TIPOS = ['application/pdf', 'image/jpeg', 'image/png']
const ADJUNTO_EXT = /\.(pdf|jpe?g|png)$/i
const ADJUNTO_MAX = 2 * 1024 * 1024
const MAX_MENSAJE = 1000

const INICIAL = { nombre: '', email: '', telefono: '', tipo: 'general', presupuesto: '', asunto: '', mensaje: '' }

function validar(f, adjunto) {
  const e = {}
  const n = f.nombre.trim()
  if (!n) e.nombre = 'Ingresá tu nombre.'
  else if (n.length < 3) e.nombre = 'Mínimo 3 letras.'
  else if (n.length > 60) e.nombre = 'Máximo 60 caracteres.'
  else if (!/^[\p{L}' ]+$/u.test(n)) e.nombre = 'Usá solo letras y espacios.'

  const m = f.email.trim()
  if (!m) e.email = 'Ingresá tu email para poder responderte.'
  else if (!m.includes('@')) e.email = 'Falta la @, por ejemplo martin@correo.com'
  else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(m)) e.email = 'Falta el dominio, por ejemplo martin@correo.com'

  if (f.telefono && !/^\d{10}$/.test(f.telefono)) {
    e.telefono = /\D/.test(f.telefono) ? 'Solo números, sin espacios ni guiones.' : 'Tienen que ser 10 dígitos (código de área + número).'
  }

  if (f.tipo === 'cotizacion' && !f.presupuesto) e.presupuesto = 'Elegí un rango de presupuesto.'

  const a = f.asunto.trim()
  if (!a) e.asunto = 'Escribí un asunto.'
  else if (a.length < 5) e.asunto = 'El asunto es muy corto (mínimo 5 caracteres).'
  else if (a.length > 120) e.asunto = 'Máximo 120 caracteres.'

  const g = f.mensaje.trim()
  if (!g) e.mensaje = 'Contanos qué necesitás.'
  else if (g.length < 20) e.mensaje = `Mínimo 20 caracteres (llevás ${g.length}).`
  else if (g.length > MAX_MENSAJE) e.mensaje = `Máximo ${MAX_MENSAJE} caracteres.`

  if (adjunto?.problema) e.adjunto = adjunto.problema
  return e
}

export default function Contact() {
  const { user } = useAuth()

  const [form, setForm] = useState(() => ({ ...INICIAL, nombre: user?.name ?? '', email: user?.email ?? '' }))
  const [adjunto, setAdjunto] = useState(null)
  const [tocados, setTocados] = useState({})
  const [intentado, setIntentado] = useState(false)
  const [apiErrors, setApiErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const errores = validar(form, adjunto)
  const cantidad = Object.keys(errores).length
  const mostrar = (k) => apiErrors[k] || ((k === 'adjunto' || tocados[k] || intentado) && errores[k]) || ''

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'telefono' ? value.replace(/\s/g, '') : value }))
    setApiErrors((er) => ({ ...er, [name]: undefined }))
    setGeneralError('')
  }
  const tocar = (e) => setTocados((t) => ({ ...t, [e.target.name]: true }))
  const elegirTipo = (id) => setForm((f) => ({ ...f, tipo: id, presupuesto: id === 'cotizacion' ? f.presupuesto : '' }))

  const elegirAdjunto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return setAdjunto(null)
    let problema = ''
    if (!ADJUNTO_TIPOS.includes(file.type) || !ADJUNTO_EXT.test(file.name)) problema = `"${file.name}" no es válido: solo PDF, JPG o PNG.`
    else if (file.size > ADJUNTO_MAX) problema = `"${file.name}" pesa más de 2 MB.`
    setAdjunto({ file, problema })
  }

  const enviar = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setIntentado(true)
    if (cantidad > 0) return

    setEnviando(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        tipo: form.tipo,
        asunto: form.asunto.trim(),
        mensaje: form.mensaje.trim(),
      }
      if (form.telefono) payload.telefono = form.telefono
      if (form.tipo === 'cotizacion') payload.presupuesto = form.presupuesto
      let cuerpo = payload
      if (adjunto?.file) {
        // Con archivo va multipart: los mismos campos y el archivo en «adjunto».
        cuerpo = new FormData()
        Object.entries(payload).forEach(([k, v]) => cuerpo.append(k, v))
        cuerpo.append('adjunto', adjunto.file)
      }
      await inquiriesApi.create(cuerpo)
      setEnviado(true)
    } catch (err) {
      if (Array.isArray(err.details) && err.details.length > 0) {
        const delBack = {}
        err.details.forEach((d) => {
          const k = d.field || d.path || d.param
          if (k && !delBack[k]) delBack[k] = d.message || d.msg
        })
        setApiErrors(delBack)
      }
      setGeneralError(err.message || 'No se pudo enviar la consulta. Intentá nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  const reiniciar = () => {
    setForm({ ...INICIAL, nombre: user?.name ?? '', email: user?.email ?? '' })
    setAdjunto(null)
    setTocados({})
    setIntentado(false)
    setApiErrors({})
    setEnviado(false)
  }

  const campo = (name, label, extra = {}, ayuda) => (
    <div className="min-w-0" style={{ minWidth: 0 }}>
      <label htmlFor={name} className="form-label fw-semibold">
        {label} {ayuda && <span className="fw-normal text-secondary small">{ayuda}</span>}
      </label>
      <input
        id={name}
        name={name}
        className={`form-control ${mostrar(name) ? 'is-invalid' : ''}`}
        value={form[name]}
        onChange={cambiar}
        onBlur={tocar}
        disabled={enviando}
        {...extra}
      />
      {mostrar(name) && <div className="invalid-feedback">{mostrar(name)}</div>}
    </div>
  )

  return (
    <>
      <section className="sec-inner d-flex flex-column gap-3" style={{ paddingBottom: 0 }}>
        <span className="rotulo">CONTACTO</span>
        <TituloAnimado texto="Contame tu proyecto." className="pagina-titulo titulo-contacto" />
        <div style={{ maxWidth: 360 }}><GuardaTejida fina alCargar delay={300} /></div>
      </section>

      <section className="sec-inner contacto-grid" style={{ paddingTop: '2.5rem' }}>
        <div className="d-flex flex-column gap-4" style={{ minWidth: 0 }}>
          <p className="mb-0 text-secondary">Contame qué necesitás y te respondo por email en menos de 48 horas hábiles.</p>
          <dl className="contacto-datos mb-0">
            <div><dt>EMAIL</dt><dd>hola@arce.dev</dd></div>
            <div><dt>BASE</dt><dd>Salta, Argentina · remoto</dd></div>
            <div><dt>RESPUESTA</dt><dd>Menos de 48 h hábiles</dd></div>
          </dl>
        </div>

        {enviado ? (
          <div role="status" className="bg-negro p-4 p-md-5 d-flex flex-column align-items-start gap-3" style={{ minWidth: 0 }}>
            <EnviadoLottie />
            <h2 className="sec-titulo mb-0" style={{ color: 'inherit' }}>¡Consulta enviada!</h2>
            <p className="mb-0" style={{ color: 'var(--pc-noche-suave)' }}>
              Recibimos tu consulta. Te respondemos por email en menos de 48 h hábiles.
            </p>
            <div className="align-self-stretch"><GuardaTejida fina alCargar delay={200} /></div>
            <button type="button" className="btn btn-outline-light" onClick={reiniciar}>Enviar otra consulta</button>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate className="contacto-form d-flex flex-column gap-3" style={{ minWidth: 0 }}>
            <fieldset className="border-0 p-0 m-0" style={{ minWidth: 0 }}>
              <legend className="fw-semibold fs-6 mb-2">Tipo de consulta</legend>
              <div className="selector-tipo" role="group" aria-label="Tipo de consulta">
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={form.tipo === t.id}
                    className={form.tipo === t.id ? 'on' : ''}
                    onClick={() => elegirTipo(t.id)}
                    disabled={enviando}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="contacto-par">
              {campo('nombre', 'Nombre y apellido', { autoComplete: 'name', maxLength: 60 })}
              {campo('email', 'Email', { type: 'email', autoComplete: 'email' })}
            </div>

            <div className="contacto-par">
              {campo('telefono', 'Teléfono', { inputMode: 'numeric', placeholder: '3874000000', maxLength: 10 }, 'Opcional · 10 dígitos, solo números')}
              {form.tipo === 'cotizacion' && (
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="presupuesto" className="form-label fw-semibold">
                    Presupuesto estimado <span className="fw-normal text-secondary small">Obligatorio en cotizaciones</span>
                  </label>
                  <select
                    id="presupuesto"
                    name="presupuesto"
                    className={`form-select ${mostrar('presupuesto') ? 'is-invalid' : ''}`}
                    value={form.presupuesto}
                    onChange={cambiar}
                    onBlur={tocar}
                    disabled={enviando}
                  >
                    <option value="">Elegí un rango</option>
                    {PRESUPUESTOS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  {mostrar('presupuesto') && <div className="invalid-feedback">{mostrar('presupuesto')}</div>}
                </div>
              )}
            </div>

            {campo('asunto', 'Asunto', { maxLength: 120 })}

            <div>
              <label htmlFor="mensaje" className="form-label fw-semibold">Mensaje</label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows="5"
                maxLength={MAX_MENSAJE}
                className={`form-control ${mostrar('mensaje') ? 'is-invalid' : ''}`}
                value={form.mensaje}
                onChange={cambiar}
                onBlur={tocar}
                disabled={enviando}
              />
              <div className="d-flex justify-content-between gap-3">
                {mostrar('mensaje') ? <div className="campo-error d-block mt-1">⚠ {mostrar('mensaje')}</div> : <span />}
                <span className="font-mono small text-secondary ms-auto">{form.mensaje.length} / {MAX_MENSAJE}</span>
              </div>
            </div>

            <div>
              <label htmlFor="adjunto" className="form-label fw-semibold">
                Adjunto <span className="fw-normal text-secondary small">Opcional · PDF, JPG o PNG de hasta 2 MB</span>
              </label>
              <input
                id="adjunto"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className={`form-control ${mostrar('adjunto') ? 'is-invalid' : ''}`}
                onChange={elegirAdjunto}
                disabled={enviando}
              />
              {mostrar('adjunto') && <div className="invalid-feedback">{mostrar('adjunto')}</div>}
              {adjunto && !adjunto.problema && <span className="campo-ok">✓ {adjunto.file.name} listo para enviar</span>}
            </div>

            {generalError && <div className="alert alert-danger mb-0 fw-semibold" role="alert">⚠ {generalError}</div>}
            {intentado && cantidad > 0 && (
              <div className="alert alert-danger mb-0 fw-semibold" role="alert">⚠ No se envió: revisá {cantidad} campo(s) marcados en rojo.</div>
            )}

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <span className="small text-secondary">Al enviar aceptás que usemos tu email solo para responderte.</span>
              <button type="submit" className="btn btn-primary px-4" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar consulta'}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  )
}
