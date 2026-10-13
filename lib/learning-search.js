import { learningModules } from "./learning-curriculum";
import { miniCourses } from "./course-catalog";
import { miniCourseDetails } from "./mini-course-details";
import { learningExperiences } from "./learning-experiences";
import { learningToolCatalog } from "./learning-tool-catalog";
import { getLearningCategoryByTitle, learningCategoryDetails } from "./learning-categories";
import { wildlifeCategories } from "./wildlife-catalog";
import { practiceCatalog, practiceCategories } from "./practice-catalog";
import { TERMS } from "../data/glossary-terms";
import { natureSearchEntries } from "./nature-search-entries";
import { mediaSearchEntries } from "./media-search-entries";
import { practiceSearchEntries } from "./practice-search-entries";
import { animalSounds } from "./animal-sounds";
import { dachWildlifeBySlug } from "./dach-wildlife";
import { dogBreeds, dogWorkTasks } from "./dog-compass";
import { wildlifeDepthBySlug } from "./wildlife-depth";
import { knowledgeExpansionSearchEntries } from "./knowledge-expansion-search";

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
// Search the lesson text, never its quiz answers or explanation keys.
const lessonContent = lesson => ({ id: lesson.id, title: lesson.title, paragraphs: lesson.paragraphs, takeaway: lesson.takeaway, exercise: lesson.exercise });
const dogAliases = { teckel: ["Dackel", "Dachshund"], drahthaar: ["Deutscher Drahthaar"], kurzhaar: ["Deutscher Kurzhaar"], hannover: ["Hannoverscher Schweisshund"], bayerischer: ["Bayerischer Gebirgsschweisshund"] };
const categoriesForMini = id => [miniCourseDetails[id]?.category || "jagdpraxis"];
const wildlifeDepthText = slug => {
  const profile = wildlifeDepthBySlug[slug];
  return profile ? [profile.seasonalLife, profile.fieldSigns, profile.comparisons, profile.observation].flat().join(" ") : "";
};
const tools = [...new Map([...learningToolCatalog, ...learningExperiences].map(tool => [tool.href, tool])).values()];
const raw = [
  ...learningModules.map(course => ({ id: `course:${course.id}`, title: course.title, description: course.description, href: `/kurse/${course.id}`, type: "course", categories: [getLearningCategoryByTitle(course.category)?.slug].filter(Boolean), countries: course.countries, lessons: course.lessons.map(lessonContent), text: strings(course.lessons.map(lessonContent)) })),
  ...miniCourses.map(course => ({ id: `mini:${course.id}`, title: miniCourseDetails[course.id]?.title || course.title.replace(/^[^\p{L}\p{N}]+/u, ""), description: course.description, href: course.href, type: "course", categories: categoriesForMini(course.id), text: course.description })),
  ...tools.map(tool => ({ ...tool, id: `tool:${tool.href}`, type: "tool", text: [tool.label || tool.description, ...(tool.aliases || [])].join(" ") })),
  ...[...natureSearchEntries, ...mediaSearchEntries, ...practiceSearchEntries, ...knowledgeExpansionSearchEntries].map(entry => ({ ...entry, id: `entry:${entry.href}:${entry.id}`, type: "entry" })),
  ...animalSounds.map(sound => ({ id: `sound:${sound.id}`, title: `${sound.name} – Tierstimme`, description: `${sound.call}: ${sound.cue}`, href: `/lernen/tierstimmen?stimme=${encodeURIComponent(sound.id)}`, type: "entry", categories: ["wildkunde", "natur-revier"], text: [sound.scientificName, sound.speciesSlug, sound.context, sound.confusion, sound.explanation, "Klangbild Spektrogramm Frequenz Ruflänge Pausen Originalaufnahme"].join(" ") })),
  ...dogBreeds.map(profile => ({ id: `breed:${profile.id}`, title: profile.name, description: profile.summary, href: `/lernen/jagdhund-kompass?rasse=${encodeURIComponent(profile.id)}#dog-${profile.id}`, type: "entry", categories: ["hundewesen"], aliases: [...(profile.aliases || []), ...(dogAliases[profile.id] || [])], text: [profile.group, profile.work, profile.training, profile.everyday, profile.boundary, ...(profile.tasks || []).map(id => dogWorkTasks.find(task => task.id === id)?.title || ""), ...(profile.aliases || []), ...(dogAliases[profile.id] || [])].join(" ") })),
  ...wildlifeCategories.flatMap(group => group.items.map(species => ({ id: `species:${species.slug}`, title: species.name, description: dachWildlifeBySlug[species.slug]?.identification || `Artenporträt: ${group.title}. Merkmale, Lebensweise und Lernwissen.`, href: `/wildkunde/${species.slug}`, type: "species", categories: ["wildkunde"], text: [group.title, wildlifeDepthText(species.slug), dachWildlifeBySlug[species.slug]?.scientificName, dachWildlifeBySlug[species.slug]?.habitat, dachWildlifeBySlug[species.slug]?.aliases?.join(" "), species.slug === "gamswild" ? " Gemse Gämse" : species.slug === "steinwild" ? " Steinbock" : ""].join(" ") }))),
  ...practiceCatalog.map(([id, title]) => ({ id: `practice:${id}`, title, description: "Praxiswissen anwenden und Antworten mit einer Erklärung prüfen.", href: `/jagdpraxis/${id}`, type: "practice", categories: practiceCategories[id] || ["jagdpraxis"], text: title })),
  ...TERMS.map(term => ({ id: `glossary:${term.slug}`, title: term.term, description: term.def, href: `/glossar/${term.slug}`, type: "glossary", categories: ["pruefung-sprache"], text: term.def })),
];
const index = raw.map(item => ({ ...item, titleSearch: normalizeSearch(item.title), aliasesSearch: (item.aliases || []).map(normalizeSearch), bodySearch: normalizeSearch([item.title, item.description, item.text, ...(item.aliases || []), ...item.categories.map(slug => learningCategoryDetails.find(category => category.slug === slug)?.title || "")].join(" ")) }));
const wordParts = value => String(value || "").match(/[\p{L}\p{N}]+/gu) || [];
const commonWords = new Set(["aber", "auch", "beim", "dabei", "dann", "dass", "deine", "dieser", "durch", "eine", "einen", "einer", "eines", "ganz", "hier", "ihren", "immer", "kann", "keine", "mehr", "nach", "nicht", "oder", "ohne", "sein", "seine", "sich", "sind", "soll", "uber", "unter", "viel", "wird", "werden", "wenn", "welche", "wissen", "zum", "zur"]);

function editDistance(left, right, bound) {
  if (Math.abs(left.length - right.length) > bound) return bound + 1;
  const rows = [Array.from({ length: right.length + 1 }, (_, i) => i)];
  for (let i = 1; i <= left.length; i++) {
    const row = [i];
    for (let j = 1; j <= right.length; j++) {
      row[j] = Math.min(row[j - 1] + 1, rows[i - 1][j] + 1, rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) row[j] = Math.min(row[j], rows[i - 2][j - 2] + 1);
    }
    rows.push(row);
  }
  return rows[left.length][right.length];
}

function correctedQuery(query, eligible) {
  const tokens = wordParts(query);
  // Long prose and very short words should not be silently reinterpreted.
  if (!tokens.length || tokens.length > 6) return null;
  const vocabulary = new Map();
  eligible.forEach(item => [item.title, item.description, ...(item.aliases || []), ...(item.lessons || []).flatMap(lesson => [lesson.title, lesson.takeaway])].forEach(text => wordParts(text).forEach(word => {
    const normalized = normalizeSearch(word);
    if (normalized.length >= 4 && normalized.length <= 36 && !commonWords.has(normalized) && !vocabulary.has(normalized)) vocabulary.set(normalized, word);
  })));
  let changed = false;
  const corrected = tokens.map(word => {
    const normalized = normalizeSearch(word);
    if (normalized.length < 4 || normalized.length > 36 || commonWords.has(normalized) || eligible.some(item => item.bodySearch.includes(normalized))) return word;
    const bound = normalized.length >= 8 ? 2 : 1;
    let best = bound + 1, candidate = null, tied = false;
    for (const [known, display] of vocabulary) {
      if (known[0] !== normalized[0] || Math.abs(known.length - normalized.length) > bound) continue;
      const distance = editDistance(normalized, known, bound);
      if (distance < best) { best = distance; candidate = display; tied = false; }
      else if (distance === best) tied = true;
    }
    if (!candidate || tied || best > bound) return word;
    changed = true;
    return candidate;
  });
  return changed ? corrected.join(" ") : null;
}

function matchRank(item, terms) {
  return terms.reduce((score, term) => score + (item.titleSearch === term || item.aliasesSearch.includes(term) ? 20 : item.titleSearch.includes(term) ? 5 : 0), 0);
}

function excerpt(text, terms) {
  const original = String(text || "").replace(/\s+/g, " ").trim();
  if (original.length <= 260) return original;
  const normalized = normalizeSearch(original);
  const positions = terms.map(term => normalized.indexOf(term)).filter(position => position >= 0);
  const first = positions.length ? Math.min(...positions) : 0;
  let start = Math.max(0, first - 75);
  if (start > 0) {
    const boundary = original.indexOf(" ", start);
    if (boundary >= 0 && boundary < first) start = boundary + 1;
  }
  let end = Math.min(original.length, start + 250);
  if (end < original.length) { const boundary = original.lastIndexOf(" ", end); if (boundary > start) end = boundary; }
  return `${start > 0 ? "… " : ""}${original.slice(start, end)}${end < original.length ? " …" : ""}`;
}

function lessonMatch(item, terms) {
  if (!terms.length || !item.lessons?.length) return null;
  const lessons = item.lessons.map(lesson => {
    const title = normalizeSearch(lesson.title);
    const passages = [...(lesson.paragraphs || []), lesson.takeaway, lesson.exercise].filter(Boolean);
    const candidates = passages.map(text => ({ text, rank: terms.reduce((score, term) => score + (normalizeSearch(text).includes(term) ? 1 : 0), 0) })).sort((a, b) => b.rank - a.rank);
    return { lesson, passage: candidates[0], rank: terms.reduce((score, term) => score + (title.includes(term) ? 3 : 0), 0) + (candidates[0]?.rank || 0) };
  }).sort((a, b) => b.rank - a.rank);
  const best = lessons[0];
  if (!best?.rank) return null;
  return { lessonTitle: best.lesson.title, href: `${item.href}#lesson-${encodeURIComponent(best.lesson.id)}`, description: excerpt(best.passage?.rank ? best.passage.text : best.lesson.paragraphs?.[0] || item.description, terms) };
}

export function searchLearning({ query = "", category = "all", type = "all", country = "all", page = 1 } = {}) {
  const cleanQuery = String(query || "").trim().slice(0, 160);
  let terms = wordParts(normalizeSearch(cleanQuery));
  if (category !== "all" && !learningCategoryDetails.some(item => item.slug === category)) throw new Error("Ungültige Kategorie.");
  if (type !== "all" && !Object.prototype.hasOwnProperty.call(searchTypes, type)) throw new Error("Ungültige Angebotsart.");
  if (!["all", "DE", "AT", "CH"].includes(country)) throw new Error("Ungültiges Land.");
  if (!Number.isInteger(page) || page < 1 || page > 1000) throw new Error("Ungültige Ergebnisseite.");
  const eligible = index.filter(item => (category === "all" || item.categories.includes(category)) && (type === "all" || item.type === type)
    && (category !== "jagdrecht" || country === "all" || !item.countries || item.countries.includes(country)));
  let matches = eligible.filter(item => terms.every(term => item.bodySearch.includes(term)));
  let suggestion = null;
  if (!matches.length && terms.length) {
    const candidate = correctedQuery(cleanQuery, eligible);
    if (candidate) {
      const candidateTerms = wordParts(normalizeSearch(candidate));
      const candidateMatches = eligible.filter(item => candidateTerms.every(term => item.bodySearch.includes(term)));
      if (candidateMatches.length) { suggestion = candidate; terms = candidateTerms; matches = candidateMatches; }
    }
  }
  matches = matches.map(item => ({ item, rank: matchRank(item, terms) }));
  matches.sort((a, b) => b.rank - a.rank || a.item.title.localeCompare(b.item.title, "de"));
  const limit = 30;
  return { total: matches.length, page, pages: Math.ceil(matches.length / limit), ...(suggestion ? { suggestion } : {}), results: matches.slice((page - 1) * limit, page * limit).map(({ item }) => ({ id: item.id, title: item.title, description: String(item.description || "").slice(0, 260), href: item.href, type: item.type, categories: item.categories, ...lessonMatch(item, terms) })) };
}
