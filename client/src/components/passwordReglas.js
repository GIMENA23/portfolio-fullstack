// 🎨 DUEÑO: Integrante B — reglas de contraseña nueva (Mi cuenta y Recuperar contraseña).
export const REGLAS_PASSWORD = [
  { id: 'largo', texto: 'Al menos 8 caracteres', ok: (p) => p.length >= 8 },
  { id: 'mayuscula', texto: 'Una letra mayúscula', ok: (p) => /\p{Lu}/u.test(p) },
  { id: 'minuscula', texto: 'Una letra minúscula', ok: (p) => /\p{Ll}/u.test(p) },
  { id: 'numero', texto: 'Un número', ok: (p) => /\d/.test(p) },
]

export const passwordValida = (p) => REGLAS_PASSWORD.every((r) => r.ok(p))

/** Valida nueva contraseña + repetición. Devuelve { password?, repetir? } con los mensajes. */
export function validarNuevaPassword(password, repetir) {
  const e = {}
  if (!password) e.password = 'La contraseña es obligatoria.'
  else if (!passwordValida(password)) e.password = 'La contraseña no cumple todas las reglas.'
  if (!repetir) e.repetir = 'Repetí la contraseña.'
  else if (repetir !== password) e.repetir = 'Las contraseñas no coinciden.'
  return e
}
