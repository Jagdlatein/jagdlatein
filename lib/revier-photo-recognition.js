import { PHOTO_GUIDE_CANDIDATES } from "./revier-photo-guide";
import { learningCategoryDetails } from "./learning-categories";

// A recognition result is a model hypothesis, never a confirmed determination.
// This small catalogue intentionally copies only public names/route slugs from
// wildlife-photographs, not its full photograph descriptions and provenance.
// The accompanying test checks the list against that existing source metadata.
const wildlifeNames = [
  ["auerhuhn", "Auerhuhn"], ["baummarder", "Baummarder"],
  ["biber", "Europäischer Biber"], ["birkhuhn", "Birkhuhn"],
  ["bisam", "Bisamratte"], ["dachs", "Europäischer Dachs"],
  ["damwild", "Damhirsch"], ["eichelhaeher", "Eichelhäher"],
  ["eichhoernchen", "Eurasisches Eichhörnchen"], ["elster", "Elster"],
  ["fasan", "Fasan"], ["feldhase", "Feldhase"], ["fuchs", "Rotfuchs"],
  ["gamswild", "Gämse"], ["graugans", "Graugans"], ["hermelin", "Hermelin"],
  ["rotwild", "Rothirsch"], ["hohltaube", "Hohltaube"],
  ["iltis", "Europäischer Iltis"], ["kanadagans", "Kanadagans"],
  ["krickente", "Krickente"], ["luchs", "Eurasischer Luchs"],
  ["marderhund", "Marderhund"], ["mauswiesel", "Mauswiesel"],
  ["muffelwild", "Europäischer Mufflon"], ["nebelkraehe", "Nebelkrähe"],
  ["nilgans", "Nilgans"], ["nutria", "Nutria"], ["pfeifente", "Pfeifente"],
  ["rabenkraehe", "Rabenkrähe"], ["rebhuhn", "Rebhuhn"], ["rehwild", "Reh"],
  ["reiherente", "Reiherente"], ["ringeltaube", "Ringeltaube"],
  ["schneehase", "Schneehase"], ["schneehuhn", "Alpenschneehuhn"],
  ["schwarzwild", "Wildschwein"], ["sikawild", "Sikahirsch"],
  ["spiessente", "Spießente"], ["steinmarder", "Steinmarder"],
  ["steinwild", "Alpensteinbock"], ["stockente", "Stockente"],
  ["tafelente", "Tafelente"], ["tuerkentaube", "Türkentaube"],
  ["waschbaer", "Waschbär"], ["wildkaninchen", "Wildkaninchen"],
  ["wildkatze", "Europäische Wildkatze"],
];

const reviewedSpecies = new Map(PHOTO_GUIDE_CANDIDATES
  .filter(item => item.group !== "tracks").map(item => [item.id, item]));
const categoryIds = ["wildkunde", "hundewesen", "wald-pflanzen", "natur-revier", "ausruestung-technik"];

export const PHOTO_RECOGNITION_CATEGORIES = Object.freeze(categoryIds.map(id => {
  const category = learningCategoryDetails.find(item => item.slug === id);
  return Object.freeze({ id, title: category.title, href: `/lernen/${id}` });
}));

const specificLabels = {
  rehwild: ["a photograph of a roe deer"],
  rotwild: ["a photograph of a red deer"],
  damwild: ["a photograph of a fallow deer"],
  gamswild: ["a photograph of an Alpine chamois"],
  steinwild: ["a photograph of an Alpine ibex"],
  schwarzwild: ["a photograph of a wild boar"],
  feldhase: ["a photograph of a European brown hare"],
  wildkaninchen: ["a photograph of a European wild rabbit"],
};

function entry(id, kind, title, labels, href, categoryId, guideId = "") {
  return Object.freeze({
    id, kind, title, labels: Object.freeze(labels), href, categoryId, guideId,
    scientificName: reviewedSpecies.get(id)?.scientificName || "",
  });
}

export const PHOTO_RECOGNITION_CANDIDATES = Object.freeze([
  ...wildlifeNames.map(([id, name]) => entry(id, "species", reviewedSpecies.get(id)?.title || name,
    specificLabels[id] || [], `/wildkunde/${id}`, "wildkunde", reviewedSpecies.has(id) ? id : "")),
  ...PHOTO_GUIDE_CANDIDATES.filter(item => item.group === "tracks").map(item => entry(
    item.id, "track", item.title,
    item.id === "split-hoof-track" ? ["an animal hoof print in mud or snow"]
      : item.id === "four-toe-track" ? ["an animal paw print with four visible toes"]
        : ["an animal paw print with five visible toes"],
    "/lernen/spurenwerkstatt", "natur-revier", item.id)),
  entry("dog", "motif", "Hund", ["a photograph of a domestic dog"], "/lernen/hundewesen", "hundewesen"),
  entry("tree", "motif", "Baum", ["a photograph of a tree, tree bark or leaves"], "/lernen/wald-pflanzen", "wald-pflanzen"),
  entry("plant", "motif", "Pflanze", ["a photograph of a plant or flower"], "/lernen/wald-pflanzen", "wald-pflanzen"),
  entry("optic", "motif", "Beobachtungsoptik", ["a photograph of binoculars or a spotting scope"], "/lernen/ausruestung-technik", "ausruestung-technik"),
]);

const candidatesById = new Map(PHOTO_RECOGNITION_CANDIDATES.map(item => [item.id, item]));
const categoriesById = new Map(PHOTO_RECOGNITION_CATEGORIES.map(item => [item.id, item]));
const inputKeys = ["status", "candidateIds", "categoryId", "observations"];
export const PHOTO_RECOGNITION_NOTICE = "Bildvorschläge stammen aus einer automatischen Analyse und können falsch sein. Sie bestätigen keine Art, kein Alter, Geschlecht oder Gesundheitsmerkmal und sind keine Grundlage für jagdliche Entscheidungen.";
export const PHOTO_RECOGNITION_OBSERVATIONS_LABEL = "Sichtbare Hinweise laut Modell – nicht fachlich bestätigt";

function unknown(reason = "unknown") {
  return {
    status: "unknown", title: "Keine zuverlässige Zuordnung verfügbar", answer: "Für dieses Foto gibt es im vorhandenen Lernkatalog keine verlässliche Zuordnung. Nutze die manuellen Merkmalsvergleiche oder wähle ein anderes Foto mit einem klar sichtbaren Hauptmotiv.",
    candidate: null, alternatives: [], comparison: null, category: null, observations: [],
    observationsLabel: PHOTO_RECOGNITION_OBSERVATIONS_LABEL,
    notice: PHOTO_RECOGNITION_NOTICE, reason,
  };
}

function safeObservation(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > 180 || /[\u0000-\u001f\u007f-\u009f<>]/u.test(text)
    || /(?:https?:|www\.|javascript:|data:|file:|\[[^\]]*\]\(|\b(?:ignore|system|assistant|password|passwort|token|api[- ]?key|anweisung|anweisungen)\b)/iu.test(text)) return null;
  return text;
}

/**
 * Accept only the narrow provider-neutral structured response. Scores, generated
 * explanations, URLs and arbitrary class names never cross into app knowledge.
 * An explicit unknown is never promoted to a species by candidate suggestions.
 * No inference outcome writes or derives the journal's own candidate fields.
 */
export function normalizePhotoRecognitionResponse(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)
    || Object.keys(data).length !== inputKeys.length
    || inputKeys.some(key => !Object.hasOwn(data, key))
    || Object.keys(data).some(key => !inputKeys.includes(key))
    || !["suggestion", "uncertain", "unknown"].includes(data.status)
    || !Array.isArray(data.candidateIds) || data.candidateIds.length > 3
    || data.candidateIds.some(id => typeof id !== "string" || !candidatesById.has(id))
    || (data.categoryId !== null && (typeof data.categoryId !== "string" || !categoriesById.has(data.categoryId)))
    || !Array.isArray(data.observations) || data.observations.length > 3
    || data.observations.some(value => safeObservation(value) === null)) return unknown("invalid-response");

  if (data.status === "unknown") return unknown();
  const candidates = [...new Set(data.candidateIds)].map(id => candidatesById.get(id));
  const suppliedCategory = data.categoryId === null ? null : categoriesById.get(data.categoryId);
  if (suppliedCategory && candidates.some(candidate => candidate.categoryId !== suppliedCategory.id)) return unknown("inconsistent-category");
  if (!candidates.length && !suppliedCategory) return unknown();

  const status = data.status === "suggestion" && candidates.length <= 1 ? "suggestion" : "uncertain";
  const candidate = status === "suggestion" ? candidates[0] || null : null;
  const comparison = candidate?.kind === "species" ? reviewedSpecies.get(candidate.id) || null : null;
  const category = suppliedCategory || (candidate ? categoriesById.get(candidate.categoryId) : null);
  const answer = comparison ? comparison.facts.map(fact => fact.text).join(" ")
    : status === "uncertain" ? "Die Analyse lässt mehrere Möglichkeiten offen. Vergleiche die Vorschläge mit den vorhandenen Lerninhalten; eine Bestimmung ist damit nicht bestätigt."
      : `Zum Vorschlag findest du im Bereich „${category.title}“ die vorhandenen Lerninhalte. Eine genauere Bestimmung wird daraus nicht abgeleitet.`;
  return {
    status,
    title: status === "uncertain" ? "Nicht eindeutig eingegrenzt" : candidate ? `Bildvorschlag: ${candidate.title}` : `Lernbereich: ${category.title}`,
    answer, candidate, alternatives: status === "uncertain" ? candidates : [], comparison, category,
    observations: [...new Set(data.observations.map(safeObservation))],
    observationsLabel: PHOTO_RECOGNITION_OBSERVATIONS_LABEL,
    notice: PHOTO_RECOGNITION_NOTICE, reason: status,
  };
}
