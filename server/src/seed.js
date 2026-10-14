// ⚙️ BASE DEL PROYECTO — carga datos de prueba.
//   npm run seed
// ⚠️ BORRA los datos actuales de todas las colecciones y los vuelve a crear.
import mongoose from 'mongoose'
import { env } from './config/env.js'
import User from './models/User.js'
import Project from './models/Project.js'
import Service from './models/Service.js'
import Inquiry from './models/Inquiry.js'
import Visit from './models/Visit.js'

const PASSWORD = 'Portfolio2026'
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

await mongoose.connect(env.MONGODB_URI)
console.log('Conectado. Borrando datos anteriores…')
await Promise.all([User, Project, Service, Inquiry, Visit].map((M) => M.deleteMany({})))

// Usuarios: uno por rol + usuarios registrados de ejemplo
const base = [
  { name: 'Admin Portfolio', email: 'admin@portfolio.test', role: 'admin' },
  { name: 'Operador Portfolio', email: 'operador@portfolio.test', role: 'operator' },
  { name: 'Usuario Prueba', email: 'usuario@portfolio.test', role: 'user' },
]
const nombres = ['Lucía', 'Martín', 'Sofía', 'Juan', 'Valentina', 'Mateo', 'Camila', 'Tomás', 'Julieta', 'Nicolás']
const apellidos = ['Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'Romero', 'Sosa']
for (let i = 0; i < 37; i++) {
  base.push({ name: `${pick(nombres)} ${pick(apellidos)}`, email: `usuario${i + 1}@ejemplo.test`, role: 'user', createdAt: daysAgo(Math.floor(Math.random() * 60)) })
}
const users = []
for (const u of base) {
  const user = new User({ ...u, loginCount: Math.floor(Math.random() * 15) + 1, lastLogin: daysAgo(Math.floor(Math.random() * 10)) })
  await user.setPassword(PASSWORD)
  users.push(await user.save())
}
const operador = users[1]

await Service.insertMany([
  { name: 'Desarrollo web a medida', description: 'Sitios y aplicaciones web completas, del diseño al despliegue.', icon: 'code', priceFrom: 300000, order: 1 },
  { name: 'APIs REST', description: 'Diseño e implementación de APIs seguras y documentadas.', icon: 'server', priceFrom: 200000, order: 2 },
  { name: 'Bases de datos', description: 'Modelado y optimización de bases SQL y MongoDB.', icon: 'database', priceFrom: 150000, order: 3 },
  { name: 'Asesoría técnica', description: 'Revisión de código, arquitectura y buenas prácticas.', icon: 'chat', priceFrom: 50000, order: 4 },
])

await Project.insertMany([
  { title: 'Tienda online', summary: 'E-commerce con carrito, pagos y panel de stock.', description: 'Aplicación completa de comercio electrónico con React, Express y MongoDB.', stack: ['React', 'Express', 'MongoDB'], demoUrl: 'https://example.com', repoUrl: 'https://github.com', featured: true },
  { title: 'Clima en vivo', summary: 'Pronóstico con API externa y gráficos.', description: 'Consumo de una API meteorológica con Fetch y visualización de datos.', stack: ['JavaScript', 'Fetch API', 'Chart.js'], demoUrl: 'https://example.com', repoUrl: 'https://github.com', featured: true },
  { title: 'Gestor de turnos', summary: 'Reservas online para consultorios.', description: 'Sistema de turnos con roles, notificaciones por email y calendario.', stack: ['React', 'Node', 'MongoDB'], demoUrl: 'https://example.com', repoUrl: 'https://github.com' },
  { title: 'Blog con CMS', summary: 'Blog con editor y comentarios.', description: 'CMS liviano con autenticación y panel de publicación.', stack: ['React', 'Express'], demoUrl: 'https://example.com', repoUrl: 'https://github.com' },
  { title: 'Dashboard de ventas', summary: 'Métricas y reportes interactivos.', description: 'Panel con filtros por fecha y gráficos interactivos.', stack: ['React', 'Chart.js', 'MongoDB'], demoUrl: 'https://example.com', repoUrl: 'https://github.com' },
  { title: 'Landing animada', summary: 'Landing con animaciones al hacer scroll.', description: 'Animaciones con Web Animations API y anime.js.', stack: ['HTML', 'CSS', 'anime.js'], demoUrl: 'https://example.com', repoUrl: 'https://github.com' },
])

const tipos = ['general', 'cotizacion', 'cotizacion', 'asesoria', 'general']
const estados = ['nueva', 'nueva', 'en_proceso', 'respondida', 'cerrada']
const asuntos = { general: 'Consulta sobre tus servicios', cotizacion: 'Cotización para un sitio web', asesoria: 'Asesoría sobre arquitectura' }
const inquiries = []
for (let i = 0; i < 30; i++) {
  const type = pick(tipos)
  const status = pick(estados)
  const createdAt = daysAgo(Math.floor(Math.random() * 30))
  inquiries.push({
    name: `${pick(nombres)} ${pick(apellidos)}`,
    email: `cliente${i + 1}@ejemplo.test`,
    type,
    subject: asuntos[type],
    message: 'Hola, me gustaría recibir más información sobre este tema. ¡Gracias!',
    status,
    createdAt,
    replies: ['respondida', 'cerrada'].includes(status)
      ? [{ text: 'Hola, gracias por escribir. Te envío la información solicitada.', operator: operador._id, sentAt: createdAt }]
      : [],
  })
}
await Inquiry.insertMany(inquiries)

const paginas = ['/', '/', '/', '/proyectos', '/proyectos', '/contacto', '/login', '/registro']
const visits = []
for (let d = 0; d < 30; d++) {
  const cantidad = 20 + Math.floor(Math.random() * 40)
  for (let i = 0; i < cantidad; i++) {
    visits.push({ path: pick(paginas), sessionId: `seed-${d}-${i}`, user: Math.random() < 0.3 ? pick(users)._id : null, createdAt: daysAgo(d) })
  }
}
await Visit.insertMany(visits)

console.log(`✅ Listo: ${users.length} usuarios, 6 proyectos, 4 servicios, 30 consultas, ${visits.length} visitas.`)
console.log(`   Usuarios de prueba (contraseña: ${PASSWORD}):`)
console.log('   admin@portfolio.test · operador@portfolio.test · usuario@portfolio.test')
await mongoose.disconnect()
