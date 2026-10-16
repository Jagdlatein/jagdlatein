// Public metadata only. Adjacent IDs share a prefix; categories are sent once.
// A row is [characters reused from the previous ID, remaining suffix, category index].
// This module is also used in the browser and must not import the question pool.
const ID = /^[a-z][a-z0-9-]{1,159}$/;
const CATEGORY = /^[a-z][a-z0-9-]{1,79}$/;

export function packDailyReviewCatalog(items) {
  if (!Array.isArray(items)) throw new Error("Ungültiger Wiederholungskatalog.");
  const categories = [], categoryIndexes = new Map(), rows = [];
  let previous = "";
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !ID.test(item.id) || typeof item.category !== "string" || !CATEGORY.test(item.category)) {
      throw new Error("Ungültiger Wiederholungskatalog.");
    }
    if (!categoryIndexes.has(item.category)) {
      categoryIndexes.set(item.category, categories.length);
      categories.push(item.category);
    }
    let shared = 0;
    while (shared < previous.length && shared < item.id.length && previous[shared] === item.id[shared]) shared++;
    rows.push([shared, item.id.slice(shared), categoryIndexes.get(item.category)]);
    previous = item.id;
  }
  return { version: 1, categories, rows };
}

export function unpackDailyReviewCatalog(catalog) {
  if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.categories) || !Array.isArray(catalog.rows) ||
      catalog.categories.some(category => typeof category !== "string" || !CATEGORY.test(category)) ||
      new Set(catalog.categories).size !== catalog.categories.length) return [];
  const items = [];
  let previous = "";
  for (const row of catalog.rows) {
    if (!Array.isArray(row) || row.length !== 3 || !Number.isSafeInteger(row[0]) || row[0] < 0 || row[0] > previous.length ||
        typeof row[1] !== "string" || row[1].length > 160 || !Number.isSafeInteger(row[2]) || row[2] < 0 || row[2] >= catalog.categories.length) return [];
    const id = previous.slice(0, row[0]) + row[1];
    if (!ID.test(id)) return [];
    items.push({ id, category: catalog.categories[row[2]] });
    previous = id;
  }
  return items;
}
