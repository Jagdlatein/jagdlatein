import { miniCourses } from "./course-catalog";
import { getLearningModule } from "./learning-curriculum";
import { getLearningCategory } from "./learning-categories";
import { getLearningMedia } from "./learning-media";
import { categoryPhotographs } from "./learning-category-photos";

// Related lessons provide additional learning, not an explanation of every legacy question.
export const miniCourseDetails = {
  wildkunde: { category: "wildkunde", modules: ["wissen-rehwild-jahreslauf", "wissen-schwarzwild-lebensweise", "wissen-rotwild-sozialverhalten"] },
  jaegersprache: { category: "pruefung-sprache", title: "Jägersprache kompakt", modules: ["wissen-jaegersprache", "wissen-ausbau-jaegersprache"] },
  schwarzwild: { category: "wildkunde", modules: ["wissen-schwarzwild-lebensweise"] },
  faehrten: { category: "natur-revier", modules: ["wissen-spuren-systematisch"] },
  waffen: { category: "waffen-sicherheit", modules: ["wissen-waffensicherheit", "wissen-ausbau-waffenorganisation"] },
  anschuss: { category: "jagdpraxis", modules: ["wissen-ausbau-anschussmeldung", "wissen-nachsuche"] },
  rehwild: { category: "wildkunde", modules: ["wissen-rehwild-jahreslauf", "wissen-ausbau-jaegersprache"] },
  rotwild: { category: "wildkunde", modules: ["wissen-rotwild-sozialverhalten"] },
  fallenjagd: { category: "jagdpraxis", modules: ["wissen-ausbau-jagdverantwortung", "wissen-ausbau-rechtsquellen", "wissen-ausbau-verantwortungsentscheidungen"] },
  sicherheit: { category: "waffen-sicherheit", modules: ["wissen-waffensicherheit", "wissen-kugelfang", "wissen-ausbau-sicherheitskommunikation"] },
  pirsch: { category: "jagdpraxis", modules: ["wissen-ausbau-pirschbeobachtung", "wissen-ansitzplanung"] },
  pruefung: { category: "pruefung-sprache", modules: ["wissen-pruefungslernen", "wissen-vertiefung-pruefung-lernwerkstatt"] },
  raubwild: { category: "wildkunde", modules: ["wissen-ausbau-raubwildoekologie"] },
  kleinraubwild: { category: "wildkunde", modules: ["wissen-ausbau-raubwildoekologie", "wissen-spuren-systematisch"] },
  greifvoegel: { category: "wildkunde", modules: ["wissen-federwild-beobachtung", "wissen-ausbau-artenschutz"] },
  federwild: { category: "wildkunde", modules: ["wissen-federwild-beobachtung"] },
  wasservoegel: { category: "wildkunde", modules: ["wissen-federwild-beobachtung", "wissen-ausbau-gewaesser-feuchtgebiete"] },
  orientierung: { category: "natur-revier", modules: ["wissen-orientierung", "wissen-ausbau-karten-gps"] },
  trittsiegel: { category: "natur-revier", modules: ["wissen-spuren-systematisch"] },
  nachtjagd: { category: "jagdpraxis", modules: ["wissen-optik", "wissen-ansitzplanung", "wissen-kugelfang"] },
  technik: { category: "ausruestung-technik", modules: ["wissen-optik", "wissen-vertiefung-outdoor-reserven"] },
  "schiessen-basic": { category: "waffen-sicherheit", modules: ["wissen-ausbau-schiessstandtraining", "wissen-vertiefung-sicherheitsroutine-stand"] },
  "schiessen-pro": { category: "waffen-sicherheit", modules: ["wissen-ausbau-schiessstandtraining", "wissen-kugelfang"] },
  lockjagd: { category: "jagdpraxis", modules: ["wissen-ausbau-pirschbeobachtung", "wissen-rehwild-jahreslauf", "wissen-ausbau-raubwildoekologie"] },
  wildschaeden: { category: "natur-revier", modules: ["wissen-wald-wild", "wissen-ausbau-waldverjuengung-verbiss"] },
  wildbiologie: { category: "wildkunde", modules: ["wissen-vertiefung-populationsoekologie", "wissen-rotwild-sozialverhalten"] },
  tarnung: { category: "jagdpraxis", modules: ["wissen-ausbau-pirschbeobachtung", "wissen-ansitzplanung", "wissen-wetter-wind"] },
  fallenrecht: { category: "jagdrecht", modules: ["wissen-ausbau-rechtsquellen", "wissen-vertiefung-recht-pruefmethode"] },
  "nachtjagd-pro": { category: "jagdpraxis", modules: ["wissen-optik", "wissen-vertiefung-outdoor-reserven", "wissen-kugelfang"] },
  wetter: { category: "natur-revier", modules: ["wissen-wetter-wind"] },
  ballistik: { category: "waffen-sicherheit", modules: ["wissen-kugelfang", "wissen-ausbau-schiessstandtraining"] },
  wildhygiene: { category: "wildbret-gesundheit", modules: ["wissen-wildbrethygiene", "wissen-vertiefung-wildbret-hygienekette"] },
  revierplanung: { category: "natur-revier", modules: ["wissen-vertiefung-revier-jahresplanung", "wissen-lebensraeume-biotopverbund"] },
  "orientierung-pro": { category: "ausruestung-technik", modules: ["wissen-ausbau-karten-gps", "wissen-orientierung", "wissen-vertiefung-outdoor-reserven"] },
};

export function getMiniCourseDetails(courseId) {
  const course = miniCourses.find(item => item.id === courseId);
  const details = miniCourseDetails[courseId];
  if (!course || !details) return null;
  const category = getLearningCategory(details.category);
  const fullModules = details.modules.map(getLearningModule).filter(Boolean);
  const media = getLearningMedia(fullModules[0] || { category: category.title }) || categoryPhotographs[category.slug];
  const photo = media && Object.fromEntries(Object.entries(media).filter(([key, value]) => ["src", "path", "width", "height", "alt", "caption", "credit", "creditUrl", "licenseUrl", "fit", "categoryCover", "objectPosition"].includes(key) && value !== undefined));
  return {
    ...course,
    ...details,
    title: details.title || course.title.replace(/^[^\p{L}\p{N}]+/u, ""),
    category: { slug: category.slug, title: category.title },
    modules: fullModules.map(module => ({ id: module.id, title: module.title })),
    photo,
  };
}
