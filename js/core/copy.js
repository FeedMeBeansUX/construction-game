// Dutch copy lookup. All in-game text goes through t(id). Placeholders: {boss}, {a}, {c}, …

export function createCopy(dict, { warn = console.warn } = {}) {
  const vars = { boss: dict['char.boss.name'] };
  return function t(id, params = {}) {
    const raw = dict[id];
    if (typeof raw !== 'string') { warn(`Missing copy id: ${id}`); return `[${id}]`; }
    return raw.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : k in vars ? vars[k] : m));
  };
}
