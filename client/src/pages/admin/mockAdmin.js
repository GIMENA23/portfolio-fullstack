// 🎨 DUEÑO: Integrante D
// Datos de prueba para el panel de administrador mientras la API responde 501.
// Tienen la misma forma que los modelos de server/src/models (User.toPublic, Project).
// Cuando C termine los endpoints, las páginas dejan de usarlos solas.

const haceDias = (d, hora = 12) => {
  const f = new Date()
  f.setDate(f.getDate() - d)
  f.setHours(hora, 0, 0, 0)
  return f.toISOString()
}

export const mockUsers = [
  { _id: 'u1', name: 'Admin Portfolio', email: 'admin@portfolio.test', role: 'admin', provider: 'local', active: true, createdAt: haceDias(40), lastLogin: haceDias(0, 9), loginCount: 58 },
  { _id: 'u2', name: 'Operador Portfolio', email: 'operador@portfolio.test', role: 'operator', provider: 'local', active: true, createdAt: haceDias(40), lastLogin: haceDias(1, 18), loginCount: 31 },
  { _id: 'u3', name: 'Usuario Prueba', email: 'usuario@portfolio.test', role: 'user', provider: 'local', active: true, createdAt: haceDias(38), lastLogin: haceDias(3, 21), loginCount: 7 },
  { _id: 'u4', name: 'Said Arrieta', email: 'said@example.com', role: 'user', provider: 'google', active: true, createdAt: haceDias(20), lastLogin: haceDias(2, 15), loginCount: 4 },
  { _id: 'u5', name: 'Luciano Mormina', email: 'luciano@example.com', role: 'user', provider: 'local', active: false, createdAt: haceDias(18), lastLogin: haceDias(15, 11), loginCount: 2 },
  { _id: 'u6', name: 'Carlos Wagner', email: 'carlos@example.com', role: 'user', provider: 'google', active: true, createdAt: haceDias(12), lastLogin: haceDias(5, 10), loginCount: 3 },
  { _id: 'u7', name: 'Diego Paz', email: 'diego@example.com', role: 'user', provider: 'local', active: true, createdAt: haceDias(9), lastLogin: null, loginCount: 0 },
  { _id: 'u8', name: 'Valentin Lopez', email: 'valen@example.com', role: 'user', provider: 'local', active: true, createdAt: haceDias(6), lastLogin: haceDias(6, 20), loginCount: 1 },
  { _id: 'u9', name: 'Martina Ríos', email: 'martina@example.com', role: 'user', provider: 'google', active: true, createdAt: haceDias(4), lastLogin: haceDias(1, 8), loginCount: 5 },
  { _id: 'u10', name: 'Julián Torres', email: 'julian@example.com', role: 'user', provider: 'local', active: true, createdAt: haceDias(3), lastLogin: haceDias(3, 13), loginCount: 1 },
  { _id: 'u11', name: 'Camila Soria', email: 'camila@example.com', role: 'user', provider: 'local', active: true, createdAt: haceDias(1), lastLogin: haceDias(1, 22), loginCount: 2 },
  { _id: 'u12', name: 'Tomás Guzmán', email: 'tomas@example.com', role: 'user', provider: 'google', active: true, createdAt: haceDias(0, 10), lastLogin: haceDias(0, 10), loginCount: 1 },
]

// Respuestas de prueba para statsApi (forma que proponemos a C)
const dia = (d) => haceDias(d).slice(0, 10)

export const mockStats = {
  summary: { visits: 779, users: mockUsers.length, logins: 113, inquiries: 30 },
  // GET /stats/visits?agrupar=dia → [{ fecha, total }]
  visits: Array.from({ length: 14 }, (_, i) => ({
    fecha: dia(13 - i),
    total: [42, 51, 38, 60, 55, 71, 48, 39, 66, 74, 58, 63, 80, 34][i],
  })),
  // GET /stats/inquiries-by-type → [{ tipo, total }]
  inquiriesByType: [
    { tipo: 'general', total: 12 },
    { tipo: 'cotizacion', total: 11 },
    { tipo: 'asesoria', total: 7 },
  ],
  // GET /stats/registrations?agrupar=semana → [{ semana, total }]
  registrations: [
    { semana: dia(35), total: 3 },
    { semana: dia(28), total: 1 },
    { semana: dia(21), total: 2 },
    { semana: dia(14), total: 1 },
    { semana: dia(7), total: 2 },
    { semana: dia(0), total: 3 },
  ],
}
