// ?page=1&limit=20 (límite máximo 100). Devuelve también cuántos documentos saltar.
export function pageParams(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageMeta = ({ page, limit }, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });

export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
