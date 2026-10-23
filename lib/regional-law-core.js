export const LEGAL_REGION_STORAGE_KEY = "jl_legal_region_v1";
export const legalCountries = [
  { code: "CH", slug: "ch", name: "Schweiz", regionLabel: "Kanton" },
  { code: "DE", slug: "de", name: "Deutschland", regionLabel: "Bundesland" },
  { code: "AT", slug: "at", name: "Österreich", regionLabel: "Bundesland" },
];
export const legalTopics = [
  { id: "zulassung", title: "Jagdberechtigung und Zulassung" },
  { id: "pruefung", title: "Jagdprüfung und Ausbildung" },
  { id: "jagdausuebung", title: "Rechte und Pflichten bei der Jagd" },
  { id: "wildschutz", title: "Wildschutz und Verantwortung" },
  { id: "zustandigkeit", title: "Gesetze, Jagdsystem und Zuständigkeit" },
];
const text = value => typeof value === "string" && value.trim().length > 0;
const https = value => { try { return new URL(value).protocol === "https:"; } catch { return false; } };
const publisherKey = value => String(value || "").normalize("NFKC").trim().toLowerCase();
export const regionCode = value => typeof value === "string" ? value.trim().toUpperCase() : "";

export function isReadableLegalArticle(article, asOf = new Date().toISOString().slice(0, 10)) {
  return Boolean(article && article.originalVerified === true && text(article.id) && text(article.title) &&
    text(article.lawTitle) && text(article.citation) && text(article.officialText) && legalTopics.some(topic => topic.id === article.topic) &&
    /^\d{4}-\d{2}-\d{2}$/.test(article.reviewedOn || "") && article.reviewedOn <= asOf &&
    (!article.effectiveFrom || article.effectiveFrom <= asOf) && (!article.effectiveUntil || article.effectiveUntil > asOf) &&
    Array.isArray(article.sources) && article.sources.some(source => source.kind === "law" && text(source.title) && text(source.publisher) && https(source.url)));
}

export function isReviewedLegalArticle(article, asOf) {
  return Boolean(isReadableLegalArticle(article, asOf) && article.verified === true && text(article.summary) && article.sources.length >= 2 &&
    article.sources.every(source => text(source.title) && text(source.publisher) && https(source.url)) &&
    new Set(article.sources.map(source => publisherKey(source.publisher))).size >= 2);
}

export function isValidLegalQuestion(question) {
  return Boolean(question && text(question.id) && text(question.prompt) && text(question.explanation) &&
    Array.isArray(question.choices) && question.choices.length >= 3 && question.choices.length <= 5 &&
    question.choices.every(text) && new Set(question.choices.map(value => value.trim())).size === question.choices.length &&
    Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.choices.length);
}

export function legalRegionMetadata(dataset) {
  return dataset.regions.map(region => {
    const articles = (region.articles || []).filter(article => isReadableLegalArticle(article));
    return { code: region.code, name: region.name, lawTitle: region.lawTitle, officialUrl: region.officialUrl,
      articleCount: articles.length,
      reviewedArticleCount: articles.filter(article => isReviewedLegalArticle(article)).length,
      questionCount: articles.reduce((count, article) => count + (isReviewedLegalArticle(article) ? (article.questions || []).filter(isValidLegalQuestion).length : 0), 0) };
  });
}

export function legalSelection(query = {}, regions = []) {
  const requested = regionCode(query.region);
  return {
    region: regions.some(region => region.code === requested) ? requested : "",
    invalidRegion: query.region !== undefined && (!requested || !regions.some(region => region.code === requested)),
    topic: legalTopics.some(topic => topic.id === query.thema) ? query.thema : "all",
    article: typeof query.artikel === "string" ? query.artikel : "",
    view: ["wissen", "fragen", "uebung", "originale"].includes(query.ansicht) ? query.ansicht : "wissen",
    includeFederal: query.bund !== "0",
  };
}

export function legalSelectionHref(country, selection = {}) {
  const target = legalCountries.find(item => item.code === regionCode(country));
  if (!target) return "/jagdrecht";
  const params = new URLSearchParams();
  if (selection.region) params.set("region", regionCode(selection.region));
  if (legalTopics.some(topic => topic.id === selection.topic)) params.set("thema", selection.topic);
  if (text(selection.article)) params.set("artikel", selection.article);
  if (["fragen", "uebung", "originale"].includes(selection.view)) params.set("ansicht", selection.view);
  if (selection.includeFederal === false) params.set("bund", "0");
  return `/jagdrecht/${target.slug}${params.size ? `?${params}` : ""}`;
}

export function readLegalRegionPreference(storage) {
  try {
    const value = JSON.parse(storage?.getItem(LEGAL_REGION_STORAGE_KEY) || "null");
    if (!value || !legalCountries.some(country => country.code === value.country) ||
      typeof value.region !== "string" || !/^[A-Z]{1,5}$/.test(value.region)) return null;
    return { country: value.country, region: value.region };
  } catch { return null; }
}

export function saveLegalRegionPreference(storage, country, region, regions) {
  if (!legalCountries.some(item => item.code === country) || !regions.some(item => item.code === region)) return false;
  try { storage?.setItem(LEGAL_REGION_STORAGE_KEY, JSON.stringify({ country, region })); return Boolean(storage); }
  catch { return false; }
}

export function buildRegionalLawBundle(dataset, code, { includeFederal = true, asOf } = {}) {
  const selected = dataset.regions.find(region => region.code === regionCode(code));
  if (!selected) return null;
  const common = selected.code !== "BUND" && includeFederal ? dataset.regions.find(region => region.code === "BUND") : null;
  const articles = [selected, common].filter(Boolean).flatMap(region => (region.articles || [])
    .filter(article => isReadableLegalArticle(article, asOf)).map(article => ({
      id: article.id, topic: article.topic, title: article.title, lawTitle: article.lawTitle, citation: article.citation,
      officialText: article.officialText, officialTextCitation: article.officialTextCitation || article.citation,
      officialLanguage: article.officialLanguage || "de", reviewedOn: article.reviewedOn,
      ...(article.effectiveFrom ? { effectiveFrom: article.effectiveFrom } : {}),
      ...(article.effectiveUntil ? { effectiveUntil: article.effectiveUntil } : {}),
      learningReviewed: isReviewedLegalArticle(article, asOf),
      summary: isReviewedLegalArticle(article, asOf) ? article.summary : "",
      sources: isReviewedLegalArticle(article, asOf) ? article.sources : article.sources.filter(source => source.kind === "law" && text(source.title) && text(source.publisher) && https(source.url)),
      regionCode: region.code, regionName: region.name, country: dataset.country,
      questions: isReviewedLegalArticle(article, asOf) ? (article.questions || []).filter(isValidLegalQuestion) : [] })));
  const sources = articles.flatMap(article => article.sources.map((source, index) => ({ ...source,
    id: `${article.id}-source-${index}`, title: `${article.citation} · ${source.title}` })));
  const questions = articles.flatMap(article => article.questions.map(question => ({
    id: question.id, articleId: article.id, topic: article.topic, regionCode: article.regionCode, country: dataset.country,
    prompt: question.prompt, format: "single", skill: article.citation,
    context: `${article.regionName} · ${article.lawTitle} · ${article.citation}`,
    options: question.choices.map((choice, index) => ({ id: `${question.id}-option-${index}`, text: choice })),
    correctIds: [`${question.id}-option-${question.correctIndex}`], explanation: question.explanation,
    sourceIds: article.sources.map((_, index) => `${article.id}-source-${index}`),
  })));
  return { country: dataset.country,
    region: { code: selected.code, name: selected.name, lawTitle: selected.lawTitle, officialUrl: selected.officialUrl, notes: selected.notes || "",
      examNotes: selected.examNotes || "",
      examResources: (selected.examResources || []).filter(resource => ["official-catalog", "official-sample", "association-catalog", "exam-rules"].includes(resource.kind) &&
        text(resource.title) && text(resource.publisher) && https(resource.url) && /^\d{4}-\d{2}-\d{2}$/.test(resource.reviewedOn || "") &&
        resource.reviewedOn <= (asOf || new Date().toISOString().slice(0, 10))).map(resource => ({
          title: resource.title, url: resource.url, publisher: resource.publisher, kind: resource.kind,
          reviewedOn: resource.reviewedOn, notes: typeof resource.notes === "string" ? resource.notes : "",
        })) },
    includesFederal: Boolean(common), articles, questions, sources };
}
