// 🎨 DUEÑO: Integrante D
// Datos de prueba del Dashboard mientras /api/stats responde 501 (pendiente de C).
// Cuando C termine los endpoints, el Dashboard deja de usarlos solo.

const dia = (d) => {
  const f = new Date()
  f.setDate(f.getDate() - d)
  return f.toISOString().slice(0, 10)
}

export const mockStats = {
  // GET /stats/summary
  summary: { visits: 779, users: 12, logins: 113, inquiries: 30 },
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
  // GET /stats/registrations → [{ semana, total }]
  registrations: [
    { semana: dia(35), total: 3 },
    { semana: dia(28), total: 1 },
    { semana: dia(21), total: 2 },
    { semana: dia(14), total: 1 },
    { semana: dia(7), total: 2 },
    { semana: dia(0), total: 3 },
  ],
}
