// 🎨 DUEÑO: Integrante B
// TODO (C): quitar mock cuando esté el backend (POST /api/auth/forgot y POST /api/auth/reset).
// Mientras los endpoints no existan, los pasos «funcionan» solo en pantalla.

/** Link de prueba para el paso 3 (no es un token real). */
export const TOKEN_DE_PRUEBA = 'token-de-prueba-0123456789'

export const simularEnvio = () => new Promise((resolver) => setTimeout(resolver, 600))
