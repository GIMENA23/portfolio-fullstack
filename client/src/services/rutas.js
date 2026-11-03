// ⚙️ BASE DEL PROYECTO — a dónde va cada rol y qué rutas puede ver.
export const inicioPorRol = (role) => (role === 'admin' ? '/admin' : role === 'operator' ? '/operador' : '/')

export const rutaPermitida = (role, ruta) => {
  if (!ruta || ruta === '/login' || ruta === '/registro') return false
  if (ruta.startsWith('/admin')) return role === 'admin'
  if (ruta.startsWith('/operador')) return role === 'operator'
  return true
}
