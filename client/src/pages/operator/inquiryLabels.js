// 🎨 DUEÑO: Integrante D
// Textos y colores de tipos/estados de consulta, compartidos por Inbox e InquiryDetail.
// Las claves coinciden con INQUIRY_TYPES e INQUIRY_STATUS de server/src/models/Inquiry.js.

export const TIPOS = { general: 'General', cotizacion: 'Cotización', asesoria: 'Asesoría' }

export const ESTADOS = {
  nueva: { label: 'Nueva', color: 'primary', clase: 'estado-nueva', icono: '●' },
  en_proceso: { label: 'En proceso', color: 'warning', clase: 'estado-en-proceso', icono: '◐' },
  respondida: { label: 'Respondida', color: 'success', clase: 'estado-respondida', icono: '✓' },
  cerrada: { label: 'Cerrada', color: 'secondary', clase: 'estado-cerrada', icono: '–' },
}

export const formatoFecha = (iso) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
