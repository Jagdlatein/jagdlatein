export const videoLibraryGroups = [
  { id: "wild", title: "Wildtiere beobachten" },
  { id: "hund", title: "Hunde: Bewegung und Verhalten" },
];

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
}

export function filterLearningVideos(items, query = "", group = "all") {
  const terms = normalize(query).trim().slice(0, 160).split(/\s+/).filter(Boolean);
  return items.filter(item => (group === "all" || item.group === group)
    && terms.every(term => normalize([item.title, item.subject, ...(item.tags || [])].join(" ")).includes(term)));
}
