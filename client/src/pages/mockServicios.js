// 🎨 DUEÑO: Integrante B
// TODO (C): quitar mock cuando esté el backend (GET /api/services con datos cargados).
// Datos de prueba de /servicios. Misma forma que server/src/models/Service.js.

export const mockServicios = [
  {
    _id: 'mock-srv-1',
    name: 'Desarrollo web fullstack',
    description: 'Aplicaciones web completas de punta a punta: interfaz en React, API en Node.js y Express, y base de datos en MongoDB.',
    icon: '💻',
    priceFrom: 0,
    order: 1,
    visible: true,
  },
  {
    _id: 'mock-srv-2',
    name: 'APIs e integraciones',
    description: 'APIs REST seguras, autenticación con JWT y Google, paneles de administración y conexión con servicios externos.',
    icon: '⚙️',
    priceFrom: 0,
    order: 2,
    visible: true,
  },
  {
    _id: 'mock-srv-3',
    name: 'Diseño de interfaces y animación',
    description: 'Interfaces responsivas con Bootstrap 5, animaciones fluidas y cuidado de la accesibilidad.',
    icon: '✨',
    priceFrom: 0,
    order: 3,
    visible: true,
  },
  {
    _id: 'mock-srv-4',
    name: 'Asesoría técnica',
    description: 'Revisión de tu proyecto, elección de tecnologías y acompañamiento para llevarlo a producción.',
    icon: '🧭',
    priceFrom: 0,
    order: 4,
    visible: true,
  },
]
