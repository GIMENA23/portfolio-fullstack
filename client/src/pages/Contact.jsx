// 🎨 DUEÑO: Integrante B
import { useState, useEffect } from 'react'
import { inquiriesApi } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { EnviadoLottie } from '../animations'

const INITIAL_FORM = {
  nombre: '',
  email: '',
  telefono: '',
  tipo: 'general',
  asunto: '',
  mensaje: '',
}

export default function Contact() {
  const { user } = useAuth()

  const [form, setForm] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  // Si el usuario está logueado, autocompletamos nombre y email
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        nombre: prev.nombre || user.nombre || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  // Validación estricta en el frontend antes de enviar
  const validate = () => {
    const errors = {}
    const nombre = form.nombre.trim()
    const email = form.email.trim()
    const telefono = form.telefono.trim()
    const asunto = form.asunto.trim()
    const mensaje = form.mensaje.trim()

    if (!nombre) {
      errors.nombre = 'El nombre es obligatorio.'
    } else if (nombre.length < 2 || nombre.length > 80) {
      errors.nombre = 'El nombre debe tener entre 2 y 80 caracteres.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      errors.email = 'El email es obligatorio.'
    } else if (!emailRegex.test(email)) {
      errors.email = 'Ingresá un email válido.'
    }

    if (telefono) {
      const phoneRegex = /^[+\d\s()-]{6,25}$/
      if (!phoneRegex.test(telefono)) {
        errors.telefono = 'Ingresá un teléfono válido (solo números, espacios, + o guiones).'
      }
    }

    if (!['general', 'cotizacion', 'asesoria'].includes(form.tipo)) {
      errors.tipo = 'Seleccioná un tipo de consulta válido.'
    }

    if (!asunto) {
      errors.asunto = 'El asunto es obligatorio.'
    } else if (asunto.length < 4 || asunto.length > 120) {
      errors.asunto = 'El asunto debe tener entre 4 y 120 caracteres.'
    }

    if (!mensaje) {
      errors.mensaje = 'El mensaje es obligatorio.'
    } else if (mensaje.length < 10 || mensaje.length > 2000) {
      errors.mensaje = 'El mensaje debe tener entre 10 y 2000 caracteres.'
    }

    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    // Limpiar el error del campo a medida que el usuario corrige
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    // 1. Validar en frontend
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})

    try {
      const payload = {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        tipo: form.tipo,
        asunto: form.asunto.trim(),
        mensaje: form.mensaje.trim(),
      }

      if (form.telefono.trim()) {
        payload.telefono = form.telefono.trim()
      }

      // 2. Enviar a la API usando el servicio base
      await inquiriesApi.create(payload)
      setIsSent(true)
    } catch (err) {
      // 3. Mapear errores por campo si vienen en err.details
      if (Array.isArray(err.details) && err.details.length > 0) {
        const apiFieldErrors = {}
        err.details.forEach((d) => {
          const fieldName = d.field || d.path || d.param
          if (fieldName && !apiFieldErrors[fieldName]) {
            apiFieldErrors[fieldName] = d.message || d.msg
          }
        })
        setFieldErrors(apiFieldErrors)
      }
      setGeneralError(err.message || 'No se pudo enviar la consulta. Intentá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm({
      ...INITIAL_FORM,
      nombre: user?.nombre || '',
      email: user?.email || '',
    })
    setFieldErrors({})
    setGeneralError('')
    setIsSent(false)
  }

  // Vista de confirmación con la animación de Gimena
  if (isSent) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 text-center">
            <div className="card border-0 shadow-sm p-4 p-md-5">
              <div className="d-flex justify-content-center mb-3">
                <EnviadoLottie />
              </div>
              <h2 className="h3 fw-bold mb-2">¡Consulta enviada con éxito!</h2>
              <p className="text-secondary mb-4">
                Gracias por escribirnos. Recibimos tu mensaje y te vamos a responder a la brevedad al correo <strong>{form.email}</strong>.
              </p>
              <div>
                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={handleReset}
                >
                  Enviar otra consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="mb-4 text-center text-lg-start">
            <h1 className="fw-bold mb-2">Contacto</h1>
            <p className="text-secondary mb-0">
              Completá el formulario para consultas generales, solicitar una cotización o pedir asesoría técnica.
            </p>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              {generalError && (
                <div className="alert alert-danger" role="alert">
                  {generalError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  {/* Nombre */}
                  <div className="col-md-6">
                    <label htmlFor="nombre" className="form-label fw-medium">
                      Nombre completo <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      className={`form-control ${fieldErrors.nombre ? 'is-invalid' : ''}`}
                      placeholder="Ej: Juan Pérez"
                      value={form.nombre}
                      onChange={handleChange}
                      maxLength={80}
                      disabled={isSubmitting}
                      required
                    />
                    {fieldErrors.nombre && (
                      <div className="invalid-feedback">{fieldErrors.nombre}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label fw-medium">
                      Correo electrónico <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                      placeholder="nombre@ejemplo.com"
                      value={form.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                    />
                    {fieldErrors.email && (
                      <div className="invalid-feedback">{fieldErrors.email}</div>
                    )}
                  </div>

                  {/* Teléfono (opcional) */}
                  <div className="col-md-6">
                    <label htmlFor="telefono" className="form-label fw-medium">
                      Teléfono <span className="text-muted fw-normal">(opcional)</span>
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      className={`form-control ${fieldErrors.telefono ? 'is-invalid' : ''}`}
                      placeholder="Ej: +54 387 555-1234"
                      value={form.telefono}
                      onChange={handleChange}
                      maxLength={25}
                      disabled={isSubmitting}
                    />
                    {fieldErrors.telefono && (
                      <div className="invalid-feedback">{fieldErrors.telefono}</div>
                    )}
                  </div>

                  {/* Tipo de consulta */}
                  <div className="col-md-6">
                    <label htmlFor="tipo" className="form-label fw-medium">
                      Tipo de consulta <span className="text-danger">*</span>
                    </label>
                    <select
                      id="tipo"
                      name="tipo"
                      className={`form-select ${fieldErrors.tipo ? 'is-invalid' : ''}`}
                      value={form.tipo}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="general">Consulta general</option>
                      <option value="cotizacion">Solicitar cotización</option>
                      <option value="asesoria">Asesoría técnica</option>
                    </select>
                    {fieldErrors.tipo && (
                      <div className="invalid-feedback">{fieldErrors.tipo}</div>
                    )}
                  </div>

                  {/* Asunto */}
                  <div className="col-12">
                    <label htmlFor="asunto" className="form-label fw-medium">
                      Asunto <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="asunto"
                      name="asunto"
                      className={`form-control ${fieldErrors.asunto ? 'is-invalid' : ''}`}
                      placeholder="Breve resumen del motivo de tu contacto"
                      value={form.asunto}
                      onChange={handleChange}
                      maxLength={120}
                      disabled={isSubmitting}
                      required
                    />
                    {fieldErrors.asunto && (
                      <div className="invalid-feedback">{fieldErrors.asunto}</div>
                    )}
                  </div>

                  {/* Mensaje */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between">
                      <label htmlFor="mensaje" className="form-label fw-medium">
                        Mensaje <span className="text-danger">*</span>
                      </label>
                      <small className="text-muted">
                        {form.mensaje.length}/2000
                      </small>
                    </div>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      rows="5"
                      className={`form-control ${fieldErrors.mensaje ? 'is-invalid' : ''}`}
                      placeholder="Contanos en detalle sobre tu proyecto, duda o requerimiento..."
                      value={form.mensaje}
                      onChange={handleChange}
                      maxLength={2000}
                      disabled={isSubmitting}
                      required
                    />
                    {fieldErrors.mensaje && (
                      <div className="invalid-feedback">{fieldErrors.mensaje}</div>
                    )}
                  </div>

                  {/* Botón de envío */}
                  <div className="col-12 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Enviando consulta...
                        </>
                      ) : (
                        'Enviar mensaje'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}