import { TERMS } from "../data/glossary-terms";
import { getLearningModule } from "./learning-curriculum";
import { lessonHash } from "./learning-lesson-navigation";

// Editorial topic connections, never inferred from matching words. A null
// lesson means the course as a whole, rather than a claim about every lesson.
const targets = new Map([
  ["kugelfang", ["wissen-kugelfang", null]],
  ["nachsuche", ["wissen-nachsuche", null]],
  ["nachsuchenfuehrer", ["wissen-nachsuche", null]],
  ["schweiß", ["wissen-nachsuche", "anschuss"]],
  ["zuwarten", ["wissen-nachsuche", "anschuss"]],
  ["pirschzeichen", ["wissen-ausbau-anschussmeldung", "spurenraum"]],
  ["geweih", ["wissen-vertiefung-geweih-horn-gewebe-2026", "gewebe"]],
  ["hoerner", ["wissen-vertiefung-geweih-horn-gewebe-2026", "gewebe"]],
  ["abwurfstange", ["wissen-vertiefung-geweih-horn-gewebe-2026", "erneuerung"]],
  ["fegen", ["wissen-vertiefung-geweih-horn-gewebe-2026", "erneuerung"]],
  ["federwild", ["wissen-ausbau-federaufbau-funktion-2026", null]],
  ["windkante", ["wissen-wetter-wind", "gelände"]],
  ["aesung", ["wissen-rehwild-jahreslauf", "reh-nahrung"]],
  ["blattzeit", ["wissen-rehwild-jahreslauf", "reh-nachwuchs"]],
  ["rudel", ["wissen-rotwild-sozialverhalten", "rot-familien"]],
  ["brunft", ["wissen-rotwild-sozialverhalten", "rot-brunft"]],
  ["pirsch", ["wissen-ausbau-pirschbeobachtung", null]],
]);

function resolve(slug, suppliedModule) {
  if (typeof slug !== "string") return null;
  const entry = TERMS.find(term => term.slug === slug), target = targets.get(slug);
  if (!entry || !target) return null;
  const [moduleId, lessonId] = target;
  const canonical = getLearningModule(moduleId);
  const module = suppliedModule || canonical;
  if (!canonical || module?.id !== moduleId || !Array.isArray(module.lessons) || !module.lessons.length) return null;
  const lessons = lessonId === null ? [] : module.lessons.filter(lesson => lesson?.id === lessonId);
  if (lessonId !== null && lessons.length !== 1) return null;
  return { entry, module: canonical, lessonId, title: lessonId === null ? canonical.title : lessons[0].title };
}

export function getGlossaryCourseLinks(slug) {
  const match = resolve(slug);
  if (!match) return [];
  const { module, lessonId, title } = match;
  return [{ title, href: `/kurse/${module.id}${lessonId === null ? "" : lessonHash(lessonId)}` }];
}

export function getCourseGlossaryLinks(module) {
  if (!module || typeof module.id !== "string") return [];
  return TERMS.flatMap(entry => {
    const match = resolve(entry.slug, module);
    return match ? [{ slug: entry.slug, term: entry.term, href: `/glossar/${encodeURIComponent(entry.slug)}`,
      lessonIds: match.lessonId === null ? null : [match.lessonId] }] : [];
  });
}
