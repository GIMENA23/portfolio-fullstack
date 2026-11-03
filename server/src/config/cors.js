// CLIENT_URL admite varias URLs separadas por coma. Se les saca la barra final: el navegador manda el
// Origin sin ella, y "https://app.vercel.app/" nunca coincidiría con "https://app.vercel.app".
export const parseClientUrls = (value) =>
  value
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const escapeRegex = (text) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

// Cada URL puede llevar un * que reemplaza UNA parte del nombre de host (letras, números y guiones, sin puntos).
// Sirve para las previsualizaciones de Vercel: "https://portfolio-*-equipo.vercel.app".
// Devuelve una función que dice si un Origin está permitido.
export function originMatcher(patterns) {
  const regexes = patterns.map((pattern) => new RegExp(`^${escapeRegex(pattern).replace(/\*/g, '[a-z0-9-]+')}$`, 'i'));
  return (origin) => regexes.some((regex) => regex.test(origin));
}
