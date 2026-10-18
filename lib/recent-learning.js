// Summary records only; this helper must not import lessons or quiz answers.
export function getRecentLearningModules(modules, limit = 3) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 6) return [];
  const seen = new Set();
  const dated = modules.filter(module => {
    const date = module.contentAddedOn;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || seen.has(module.id)) return false;
    seen.add(module.id);
    return true;
  }).sort((a, b) => b.contentAddedOn.localeCompare(a.contentAddedOn));
  const chosen = [], categories = new Set();
  // Keep the newest date first. Within that date, show different subject areas.
  for (const date of [...new Set(dated.map(module => module.contentAddedOn))]) {
    const batch = dated.filter(module => module.contentAddedOn === date);
    for (const module of batch) {
      if (!categories.has(module.category) && chosen.length < limit) {
        chosen.push(module); categories.add(module.category);
      }
    }
    for (const module of batch) {
      if (!chosen.includes(module) && chosen.length < limit) chosen.push(module);
    }
    if (chosen.length === limit) break;
  }
  return chosen;
}
