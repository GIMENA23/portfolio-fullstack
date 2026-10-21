// 🎨 DUEÑO: Integrante D
// Datos de prueba para el panel de operador mientras la API responde 501.
// Tienen la misma forma que el modelo server/src/models/Inquiry.js.
// Cuando C termine los endpoints, las páginas dejan de usarlos solas.

export const mockInquiries = [
  {
    _id: 'mock1',
    name: 'Said Arrieta',
    email: 'said@example.com',
    phone: '3875123456',
    type: 'cotizacion',
    subject: 'Presupuesto para tienda online',
    message: 'Hola, necesito una tienda online para mi emprendimiento de ropa. ¿Cuánto saldría?',
    status: 'nueva',
    createdAt: '2026-10-20T14:32:00Z',
    replies: [],
  },
  {
    _id: 'mock2',
    name: 'Luciano Mormina',
    email: 'luciano@example.com',
    type: 'asesoria',
    subject: 'Migrar sistema a la nube',
    message: 'Tenemos un sistema en PHP en un servidor propio y queremos pasarlo a la nube.',
    status: 'en_proceso',
    createdAt: '2026-10-19T10:05:00Z',
    replies: [],
  },
  {
    _id: 'mock3',
    name: 'Carlos Wagner',
    email: 'carlos@example.com',
    type: 'general',
    subject: 'Consulta sobre disponibilidad',
    message: '¿Tenés disponibilidad para un proyecto que empieza en diciembre?',
    status: 'respondida',
    createdAt: '2026-10-17T18:47:00Z',
    replies: [
      {
        _id: 'r1',
        text: 'Hola Sofía, sí, tengo disponibilidad desde el 1 de diciembre. ¿Coordinamos una llamada?',
        operator: 'operador',
        sentAt: '2026-10-18T09:15:00Z',
      },
    ],
  },
  {
    _id: 'mock4',
    name: 'Diego Paz',
    email: 'diego@example.com',
    phone: '3874987654',
    type: 'cotizacion',
    subject: 'App para turnos de consultorio',
    message: 'Quisiera cotizar una app web para que mis pacientes saquen turno online.',
    status: 'cerrada',
    createdAt: '2026-10-12T16:20:00Z',
    replies: [],
  },
  {
    _id: 'mock5',
    name: 'Valentin Lopez',
    email: 'valen@example.com',
    type: 'asesoria',
    subject: 'Qué stack elegir para un MVP',
    message: 'Estoy arrancando una startup y no sé si usar React o Vue para el primer prototipo.',
    status: 'nueva',
    createdAt: '2026-10-21T08:10:00Z',
    replies: [],
  },
]