// Las fechas del panel se cuentan en hora de Salta (UTC−3), no en UTC, para que "hasta el 15/10"
// incluya lo que pasó hasta las 23:59 de allá.
export const SALTA_OFFSET_MS = 3 * 3_600_000;
export const DAY_MS = 86_400_000;

// '2026-10-15' → milisegundos de la medianoche de Salta de ese día, o null si no es una fecha real.
export function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return null;
  return utc.getTime() + SALTA_OFFSET_MS;
}

// Aritmética con días en texto ('2026-10-15'), siempre en el calendario de Salta.
const atMidnight = (day) => new Date(`${day}T00:00:00Z`);

export const todaySalta = (now = new Date()) => new Date(now.getTime() - SALTA_OFFSET_MS).toISOString().slice(0, 10);

export const addDays = (day, days) => new Date(atMidnight(day).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export const dayDiff = (from, to) => Math.round((atMidnight(to) - atMidnight(from)) / DAY_MS);

export const listDays = (from, to) => Array.from({ length: dayDiff(from, to) + 1 }, (_, i) => addDays(from, i));

// El lunes de la semana de ese día (las semanas del dashboard empiezan en lunes).
export const mondayOf = (day) => addDays(day, -((atMidnight(day).getUTCDay() + 6) % 7));

const parts = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Salta',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// → '15/10/2026 · 23:12'
export function formatSalta(date) {
  const p = Object.fromEntries(parts.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${p.day}/${p.month}/${p.year} · ${p.hour}:${p.minute}`;
}
