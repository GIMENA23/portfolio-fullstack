// ⚙️ BASE DEL PROYECTO — única puerta de entrada al backend.
// Todos usan estas funciones en lugar de escribir fetch() a mano.
// Si falta una función, agregala al final de su grupo y avisá en el PR.

const BASE_URL = import.meta.env.VITE_API_URL || '' // vacío en desarrollo: usa el proxy de Vite
const TOKEN_KEY = 'portfolio_token'

export const tokenStorage = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set: (t) => {
    try { localStorage.setItem(TOKEN_KEY, t) } catch { /* sin storage */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* sin storage */ }
  },
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details // errores de validación por campo: [{ field, message }]
  }
}

/**
 * Hace un pedido a la API y devuelve `data`.
 * Si la API responde { ok:false, error }, lanza ApiError con el mensaje.
 */
export async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${BASE_URL}/api${path}`, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }

  const headers = {}
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload = body
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, { method, headers, body: payload })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok === false) {
    throw new ApiError(json.error || `Error ${res.status}`, res.status, json.details)
  }
  return json.data
}

// ---------- Autenticación (C) ----------
export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  google: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  me: () => request('/auth/me'),
}

// ---------- Proyectos y demos ----------
export const projectsApi = {
  list: (query) => request('/projects', { query }),
  get: (id) => request(`/projects/${id}`),
  create: (formData) => request('/projects', { method: 'POST', body: formData }),
  update: (id, formData) => request(`/projects/${id}`, { method: 'PUT', body: formData }),
  remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
}

// ---------- Servicios ----------
export const servicesApi = {
  list: () => request('/services'),
  create: (data) => request('/services', { method: 'POST', body: data }),
  update: (id, data) => request(`/services/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/services/${id}`, { method: 'DELETE' }),
}

// ---------- Consultas ----------
export const inquiriesApi = {
  create: (data) => request('/inquiries', { method: 'POST', body: data }),
  list: (query) => request('/inquiries', { query }), // { tipo, estado, desde, hasta, q, page }
  get: (id) => request(`/inquiries/${id}`),
  reply: (id, text) => request(`/inquiries/${id}/reply`, { method: 'POST', body: { text } }),
  setStatus: (id, status) => request(`/inquiries/${id}`, { method: 'PATCH', body: { status } }),
}

// ---------- Usuarios (admin) ----------
export const usersApi = {
  list: (query) => request('/users', { query }),
  update: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data }), // { role, active }
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
}

// ---------- Visitas y estadísticas ----------
export const statsApi = {
  trackVisit: (path, sessionId) => request('/visits', { method: 'POST', body: { path, sessionId } }),
  summary: () => request('/stats/summary'),
  visits: (query) => request('/stats/visits', { query }), // { desde, hasta, agrupar: 'dia'|'semana' }
  inquiriesByType: (query) => request('/stats/inquiries-by-type', { query }),
  registrations: (query) => request('/stats/registrations', { query }),
}
