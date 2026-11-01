export const videoLibraryGroups = [
  { id: "wild", title: "Wildkunde" },
  { id: "hund", title: "Hundewesen" },
];

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
}

export function filterLearningVideos(items, query = "", group = "all") {
  const terms = normalize(query).trim().slice(0, 160).split(/\s+/).filter(Boolean);
  return items.filter(item => (group === "all" || item.group === group)
    && terms.every(term => normalize([item.title, item.subject, item.focus, ...(item.tags || []), ...(item.concepts || []), ...(item.courses || []).map(course => course.title)].join(" ")).includes(term)));
}

export function resolveVideoLibrarySelection(query = {}) {
  const group = query.bereich === undefined ? "all" : query.bereich;
  if (typeof group !== "string" || !["all", ...videoLibraryGroups.map(item => item.id)].includes(group)) {
    return { valid: false, group: "all", query: "", error: "Dieser Videobereich ist ungültig. Wähle unten im Menü Alle Videos, Wildkunde oder Hundewesen." };
  }
  const search = query.q === undefined ? "" : query.q;
  if (typeof search !== "string" || (query.q !== undefined && (!search.trim() || search.length > 160))) {
    return { valid: false, group, query: "", error: "Diese Videosuche ist ungültig. Gib unten im Menü einen Suchbegriff mit höchstens 160 Zeichen ein oder zeige alle Videos an." };
  }
  return { valid: true, group, query: search.trim(), error: "" };
}
