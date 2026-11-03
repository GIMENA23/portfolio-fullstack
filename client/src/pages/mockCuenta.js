// 🎨 DUEÑO: Integrante B
// TODO (C): quitar mock cuando esté el backend (GET /api/inquiries/mine, PATCH y DELETE /api/auth/me).
// Datos de prueba de «Mi cuenta». Misma forma que server/src/models/Inquiry.js.

const haceDias = (d, hora = 12) => {
  const f = new Date()
  f.setDate(f.getDate() - d)
  f.setHours(hora, 0, 0, 0)
  return f.toISOString()
}

export const mockMisConsultas = [
  {
    _id: 'mock-mia-1',
    type: 'cotizacion',
    subject: 'Presupuesto para una tienda online',
    message: 'Hola, necesito una tienda online para mi emprendimiento. ¿Me pasás una cotización?',
    status: 'respondida',
    createdAt: haceDias(6),
    replies: [
      {
        _id: 'mock-r-1',
        text: 'Hola, gracias por escribir. Te mando una propuesta por email con los pasos y el presupuesto estimado.',
        sentAt: haceDias(5, 16),
      },
    ],
  },
  {
    _id: 'mock-mia-2',
    type: 'asesoria',
    subject: 'Cómo migrar mi sistema a la nube',
    message: 'Tenemos un sistema en un servidor propio y queremos pasarlo a la nube. ¿Podés asesorarnos?',
    status: 'en_proceso',
    createdAt: haceDias(2),
    replies: [],
  },
  {
    _id: 'mock-mia-3',
    type: 'general',
    subject: 'Consulta sobre disponibilidad',
    message: 'Quería saber si tenés disponibilidad para empezar un proyecto el mes que viene.',
    status: 'nueva',
    createdAt: haceDias(0, 9),
    replies: [],
  },
]
