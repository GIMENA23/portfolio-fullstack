export const ok = (res, data, meta) => res.json(meta ? { ok: true, data, meta } : { ok: true, data });

export const created = (res, data) => res.status(201).json({ ok: true, data });
