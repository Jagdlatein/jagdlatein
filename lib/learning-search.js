import { learningModules } from "./learning-curriculum";
import { miniCourses } from "./course-catalog";
import { learningExperiences } from "./learning-experiences";
import { getLearningCategoryByTitle, learningCategoryDetails } from "./learning-categories";
import { wildlifeCategories } from "./wildlife-catalog";
import { practiceCatalog } from "./practice-catalog";
import { TERMS } from "../data/glossary-terms";
import { natureSearchEntries } from "./nature-search-entries";
import { mediaSearchEntries } from "./media-search-entries";
import { practiceSearchEntries } from "./practice-search-entries";

export const searchTypes = { course: "Kurse", tool: "Lernwerkzeuge", entry: "Einzelne Lerninhalte", species: "Wildarten", practice: "Praxisübungen", glossary: "Fachbegriffe" };
export function normalizeSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
}
function strings(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(strings).join(" ");
  if (value && typeof value === "object") return Object.entries(value).filter(([key]) => !["url", "href", "src", "id", "licenseUrl"].includes(key)).map(([, item]) => strings(item)).join(" ");
  return "";
}
const miniCategory = {
  jaegersprache: "pruefung-sprache", pruefung: "pruefung-sprache", waffen: "waffen-sicherheit", sicherheit: "waffen-sicherheit", "schiessen-basic": "waffen-sicherheit", "schiessen-pro": "waffen-sicherheit", ballistik: "waffen-sicherheit",
  fallenrecht: "jagdrecht", technik: "ausruestung-technik", wildhygiene: "wildbret-gesundheit", revierplanung: "natur-revier", wildschaeden: "natur-revier",
};
const wildMini = new Set(["wildkunde", "schwarzwild", "rehwild", "rotwild", "raubwild", "kleinraubwild", "greifvoegel", "federwild", "wasservoegel", "wildbiologie", "faehrten", "trittsiegel"]);
const categoriesForMini = id => [miniCategory[id] || (wildMini.has(id) ? "wildkunde" : "jagdpraxis")];
const raw = [
  ...learningModules.map(course => ({ id: `course:${course.id}`, title: course.title, description: course.description, href: `/kurse/${course.id}`, type: "course", categories: [getLearningCategoryByTitle(course.category)?.slug].filter(Boolean), countries: course.countries, text: strings(course.lessons) })),
  ...miniCourses.map(course => ({ id: `mini:${course.id}`, title: course.title.replace(/^[^\p{L}\p{N}]+/u, ""), description: course.description, href: course.href, type: "course", categories: categoriesForMini(course.id), text: course.description })),
  ...learningExperiences.map(tool => ({ ...tool, id: `tool:${tool.href}`, type: "tool", text: tool.label })),
  ...[...natureSearchEntries, ...mediaSearchEntries, ...practiceSearchEntries].map(entry => ({ ...entry, id: `entry:${entry.href}:${entry.id}`, type: "entry" })),
  ...wildlifeCategories.flatMap(group => group.items.map(species => ({ id: `species:${species.slug}`, title: species.name, description: `Artenporträt: ${group.title}. Merkmale, Lebensweise und Lernwissen.`, href: `/wildkunde/${species.slug}`, type: "species", categories: ["wildkunde"], text: group.title + (species.slug === "gamswild" ? " Gemse Gämse" : species.slug === "steinwild" ? " Steinbock" : "") }))),
  ...practiceCatalog.map(([id, title]) => ({ id: `practice:${id}`, title, description: "Praxiswissen anwenden und Antworten mit einer Erklärung prüfen.", href: `/jagdpraxis/${id}`, type: "practice", categories: ["jagdpraxis"], text: title })),
  ...TERMS.map(term => ({ id: `glossary:${term.slug}`, title: term.term, description: term.def, href: `/glossar/${term.slug}`, type: "glossary", categories: ["pruefung-sprache"], text: term.def })),
];
const index = raw.map(item => ({ ...item, titleSearch: normalizeSearch(item.title), bodySearch: normalizeSearch([item.title, item.description, item.text, ...item.categories.map(slug => learningCategoryDetails.find(category => category.slug === slug)?.title || "")].join(" ")) }));

export function searchLearning({ query = "", category = "all", type = "all", country = "all", page = 1 } = {}) {
  const terms = normalizeSearch(query.trim().slice(0, 160)).split(/\s+/).filter(Boolean);
  if (category !== "all" && !learningCategoryDetails.some(item => item.slug === category)) throw new Error("Ungültige Kategorie.");
  if (type !== "all" && !searchTypes[type]) throw new Error("Ungültige Angebotsart.");
  if (!["all", "DE", "AT", "CH"].includes(country)) throw new Error("Ungültiges Land.");
  if (!Number.isInteger(page) || page < 1 || page > 1000) throw new Error("Ungültige Ergebnisseite.");
  const matches = index.filter(item => (category === "all" || item.categories.includes(category)) && (type === "all" || item.type === type)
    && (category !== "jagdrecht" || country === "all" || !item.countries || item.countries.includes(country))
    && terms.every(term => item.bodySearch.includes(term))).map(item => ({ item, rank: terms.reduce((score, term) => score + (item.titleSearch === term ? 20 : item.titleSearch.includes(term) ? 5 : 0), 0) }));
  matches.sort((a, b) => b.rank - a.rank || a.item.title.localeCompare(b.item.title, "de"));
  const limit = 30;
  return { total: matches.length, page, pages: Math.ceil(matches.length / limit), results: matches.slice((page - 1) * limit, page * limit).map(({ item }) => ({ id: item.id, title: item.title, description: String(item.description || "").slice(0, 260), href: item.href, type: item.type, categories: item.categories })) };
}
