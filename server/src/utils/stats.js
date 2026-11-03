import { validationError } from './AppError.js';
import { DAY_MS, addDays, dayDiff, listDays, mondayOf, parseDay, todaySalta } from './dates.js';
import { asString } from './validators.js';

const MAX_DAYS = 366;
const BAD_DATE = 'Fecha no válida. Usá AAAA-MM-DD.';

// Lee ?desde=&hasta= (AAAA-MM-DD, ambos incluidos, hora de Salta). Sin `hasta` es hoy; sin `desde` son los
// últimos `defaultDays` días hasta `hasta`, o lo que calcule `defaultFrom(hasta)`.
// `errors` trae los errores que ya encontró el endpoint, para devolver todos juntos.
export function resolveRange(query, { defaultDays = 14, defaultFrom, errors = {} } = {}) {
  const desde = asString(query.desde);
  const hasta = asString(query.hasta);
  if (desde && parseDay(desde) === null) errors.desde = BAD_DATE;
  if (hasta && parseDay(hasta) === null) errors.hasta = BAD_DATE;

  if (!errors.desde && !errors.hasta) {
    const to = hasta || todaySalta();
    const from = desde || (defaultFrom ? defaultFrom(to) : addDays(to, -(defaultDays - 1)));
    if (dayDiff(from, to) < 0) errors.hasta = 'La fecha final tiene que ser igual o posterior a la inicial.';
    else if (dayDiff(from, to) + 1 > MAX_DAYS) errors.hasta = `El rango máximo es de ${MAX_DAYS} días.`;
    else if (!Object.keys(errors).length) return { from, to, fromMs: parseDay(from), toMs: parseDay(to) + DAY_MS };
  }
  throw validationError(errors);
}

export function resolveGrouping(query, fallback, errors = {}) {
  const value = asString(query.agrupar) || fallback;
  if (!['dia', 'semana'].includes(value)) errors.agrupar = 'Agrupar tiene que ser dia o semana.';
  return value;
}

export const inRange = (field, { fromMs, toMs }) => ({ [field]: { $gte: new Date(fromMs), $lt: new Date(toMs) } });

// Cuántos documentos hay por día (hora de Salta), con todos los días del rango: los que no tienen datos valen 0.
async function dailyCounts(model, field, range, match) {
  const rows = await model.aggregate([
    { $match: { ...match, ...inRange(field, range) } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: 'America/Argentina/Salta' } }, count: { $sum: 1 } } },
  ]);
  const byDay = new Map(rows.map((row) => [row._id, row.count]));
  return listDays(range.from, range.to).map((date) => ({ date, count: byDay.get(date) ?? 0 }));
}

// Suma los días de cada semana; `date` es el lunes. Si el rango corta una semana, cuenta solo los días incluidos.
function weekly(days, range) {
  const byWeek = new Map();
  for (const { date, count } of days) byWeek.set(mondayOf(date), (byWeek.get(mondayOf(date)) ?? 0) + count);
  const weeks = [];
  for (let monday = mondayOf(range.from); dayDiff(monday, range.to) >= 0; monday = addDays(monday, 7)) {
    weeks.push({ date: monday, count: byWeek.get(monday) ?? 0 });
  }
  return weeks;
}

export async function series(model, field, range, grouping, match = {}) {
  const days = await dailyCounts(model, field, range, match);
  return grouping === 'semana' ? weekly(days, range) : days;
}
