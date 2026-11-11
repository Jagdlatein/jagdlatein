import { examCountries, getExamProfileDetails } from "./exam-profile";
import { buildRegionalLawBundle, legalSelectionHref } from "./regional-law-core";
import { getLegalDataset } from "./regional-law-data";

const words = value => (String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u")
  .match(/[a-z0-9]+/g) || []);
const jurisdictionAliases = {
  CH: ["schweiz", "schweizer", "schweizerisch", "eidgenossenschaft", "eidgenossisch"],
  DE: ["deutschland", "deutsch", "bundesrepublik"],
  AT: ["osterreich", "osterreichisch"],
  "CH/ZH": ["zurcher"], "CH/GR": ["graubundner", "grischun"], "CH/FR": ["fribourg"],
  "CH/BL": ["baselland"], "CH/BS": ["baselstadt"], "CH/GE": ["genfer", "geneve", "geneva"],
  "CH/NE": ["neuchatel"], "CH/TI": ["ticino"], "CH/VD": ["vaud"], "CH/VS": ["valais"],
  "DE/BY": ["bayerisch", "bayrisch", "bayjg"], "DE/NI": ["niedersachsisch", "njagdg"],
  "DE/HE": ["hessisch"], "DE/HB": ["bremisch"], "DE/SN": ["sachsisch"], "DE/NW": ["nrw", "nordrhein westfalisch"],
  "DE/SH": ["schleswig holsteinisch"], "DE/RP": ["rheinland pfalzisch"], "DE/MV": ["mecklenburg vorpommersch"],
  "AT/NOE": ["nö", "noe"], "AT/OOE": ["oö", "ooe"], "AT/K": ["karntner"], "AT/ST": ["steirisch"],
};
const suffixes = ["", "e", "en", "er", "es", "em", "n", "s", "isch", "ische", "ischen", "ischer", "isches", "ischem"];

const jurisdictions = examCountries.flatMap(country => [
  { country: country.code, code: country.code, name: country.name, key: country.code },
  ...country.regions.map(region => ({ country: country.code, region: region.code, code: region.code, name: region.name, key: country.code + "/" + region.code })),
]);
const namedJurisdictions = jurisdictions.flatMap(place =>
  [place.name, ...(jurisdictionAliases[place.key] || [])].map(name => ({ place, tokens: words(name) })),
);

function scopeOf(question, selection) {
  const tokens = words(question);
  const mentions = [];
  const selectedPlace = item => item.country === selection.country && (!item.region || item.region === selection.region);
  const localPlaces = new Set();
  for (let index = 0; index < tokens.length;) {
    const matches = namedJurisdictions.filter(({ tokens: name }) => name.every((part, offset) => {
      const actual = tokens[index + offset];
      return offset === name.length - 1 ? suffixes.some(suffix => actual === part + suffix) : actual === part;
    }));
    const span = Math.max(0, ...matches.map(match => match.tokens.length));
    if (!span) { index++; continue; }
    const places = matches.filter(match => match.tokens.length === span).map(match => match.place);
    mentions.push(places);
    if (places.some(selectedPlace)) places.filter(selectedPlace).forEach(place => localPlaces.add(place.key));
    tokens.splice(index, span);
  }
  const codes = question.match(/(?<![\p{L}\p{N}])[A-Z]{2,3}(?![\p{L}\p{N}])/gu) || [];
  for (const code of codes) {
    const places = jurisdictions.filter(place => place.code === code);
    if (!places.length) continue;
    // A code such as BE has different meanings across countries. A named
    // selected country or named selected region can disambiguate the code.
    if (places.length > 1 && !localPlaces.has(selection.country) && !localPlaces.has(selection.country + "/" + selection.region)) return { conflict: true };
    mentions.push(places);
    places.filter(selectedPlace).forEach(place => localPlaces.add(place.key));
    const index = tokens.indexOf(code.toLowerCase());
    if (index >= 0) tokens.splice(index, 1);
  }
  return {
    conflict: mentions.some(places => !places.some(selectedPlace)), tokens,
    namedCountry: localPlaces.has(selection.country), namedRegion: localPlaces.has(selection.country + "/" + selection.region),
  };
}

const filler = new Set(words(
  "ab als an auf aus bei beim bestimmt betreffend bin bitte das dass dein dem den der des die dies du durch ein eine einem einer eines " +
  "erkläre erzähle es für generell genau gilt gelten grundsätzlich hat haben heißt ich ihr im in ist ja kann kannst kommen kommt können betracht " +
  "land kanton kantonal bundesland landesrecht laut man mein meine mir muss müssen nach nachlesen noch ob oder " +
  "regelt sag sagt sei sich sind steht und uns unter vom von vor was welche welchem welchen welcher welches wenn wer wie wird wo wozu " +
  "zu zum zur viele viel reicht gibt benötigt brauche braucht bekomme bekommen erhalte erhalten bedeutet dürfen darf vorgesehen bundesweit bundesrecht bundesebene eidgenössisch "
));
const technical = new Set(words("art artikel abs absatz satz sätze z ziffer lit buchstabe nr nummer"));
const federalStatutes = {
  CH: ["jsg", "jsv"],
  DE: ["bjagdg", "bundesjagdgesetz", "waffg", "awaffv", "tierschg", "tierschutzgesetz"],
  AT: ["waffg", "bundestierschutzgesetz"],
};
const federalNames = new Set(Object.values(federalStatutes).flat());
const federalMarkers = new Set(words("bundesrecht bundesweit bundesebene bundesgebiet bund eidgenössisch eidgenössisches eidgenössischen"));
const standAloneTopics = new Set(["jagdsystem", "revierpacht"].map(concept));
const legalGeneric = new Set(words("jagd jagdgesetz gesetz verordnung regel recht voraussetzung vorschrift"));
const asWordSet = value => new Set(words(value).map(concept));
function concept(word) {
  if (/^(?:eigenjagd|gemeinschaftsjagd)revier(?:e|en|s)?$/.test(word)) return word.split("revier")[0];
  if (/^(?:mindestalter|alter|alt|lebensjahr(?:e|en|es|s)?|altersgrenze)$/.test(word)) return "alter";
  if (/^verantwort(?:ung|lich|liche|lichen|et|en)$/.test(word)) return "verantwortung";
  if (/^(?:mindestgro[s]+(?:se|e|sen|en)|mindestflach(?:e|en)|flachengrenz(?:e|en))$/.test(word)) return "mindestgrosse";
  if (/^(?:gultig(?:e|en|er|es|em)?|gultigkeit|gultigkeitsdauer|geltungsdauer|laufzeit)$/.test(word)) return "gultigkeit";
  if (/^treffsicherheitsnachweis(?:e|en|es)?$/.test(word)) return concept("treffsicherheit");
  return word.length >= 6 ? word.replace(/(?:ungen|ung|en|er|es|em|e|n|s)$/, "") : word;
}

const notice = (text, links) => ({ kind: "region", text, links });
const chooseRegion = (conflict = false) => notice(
  (conflict ? "Die Frage nennt eine andere oder mehrdeutige Region. " : "") +
    "Wähle das Land und den zuständigen Kanton oder das Bundesland für diese Rechtsfrage. Dort findest du die amtlichen Fundstellen.",
  [{ label: "Prüfungsregion wählen", href: "/jagdrecht" }],
);

function legalLinks(article, country, region) {
  const links = new Map();
  for (const source of article.sources) {
    if (source.kind !== "law") continue;
    try {
      const url = new URL(source.url);
      if (url.protocol === "https:" && !url.username && !url.password) links.set(url.href, { label: source.title, href: url.href });
    } catch { /* Do not return invalid source links. */ }
  }
  if (!links.size) return [];
  return [
    { label: "Rechtslektion und Gesetzesauszug", href: legalSelectionHref(country, {
      region, topic: article.topic, article: article.id, includeFederal: article.regionCode === "BUND",
    }) },
    ...links.values(),
  ];
}

const normPattern = /(?:§|art(?:ikel)?\.?|paragraf)\s*(\d+(?:\s*(?:bis|ter|quater|quinquies|[a-z])\b)?)(?:\s+abs(?:atz)?\.?\s*(\d+))?(?:\s+(?:z(?:iffer)?|satz|nr|nummer)\.?\s*\d+)?/gi;
const normParts = value => Array.from(value.matchAll(normPattern), match => ({
  label: words(match[0]).filter(word => !["art", "artikel", "paragraf"].includes(word)).join(" "),
  section: match[1].replace(/\s/g, "").toLowerCase(),
  type: /^art/i.test(match[0]) ? "article" : "paragraph",
}));

function hasExplicitLawName(article, exactPrompt, namedRegion) {
  const prompt = " " + exactPrompt + " ";
  const names = Array.from(article.lawTitle.matchAll(/(([A-Z][A-Za-z0-9]{2,12}))/g), match => words(match[1]).join(" "));
  const fullTitle = words(article.lawTitle.split(/[,(]/)[0]).join(" ");
  if (fullTitle.split(" ").length > 1) names.push(fullTitle);
  if (namedRegion) {
    const genericNames = new Set(["jagdgesetz", "jagdverordnung"]);
    names.push(...words(article.lawTitle).filter(word => genericNames.has(word)));
  }
  return names.some(name => prompt.includes(" " + name + " "));
}

function candidateFor(article, tokens, norms, statutes, exactPrompt, namedRegion) {
  const lawName = words(article.lawTitle + " " + article.citation);
  if (!statutes.every(statute => lawName.includes(statute))) return null;
  const articleNorms = normParts(article.citation);
  if (norms.length && !norms.every(norm => articleNorms.some(candidate =>
    candidate.type === norm.type && candidate.section === norm.section && (norm.label === words(norm.section).join(" ") ||
      candidate.label === norm.label || candidate.label.startsWith(norm.label + " "))))) return null;

  const exactQuestion = article.questions.find(question => words(question.prompt).join(" ") === exactPrompt);
  if (exactQuestion) return { article, score: 100, exactQuestion };

  const title = asWordSet(article.title);
  if (!tokens.length) return norms.length && (statutes.length || hasExplicitLawName(article, exactPrompt, namedRegion)) ? { article, score: 10 } : null;
  const summary = asWordSet(article.summary);
  if (tokens.includes("alter") && !title.has("alter") &&
      !/\b\d{1,2}\.?\s+(?:lebensjahr|jahre?n?)\b/.test(words(article.summary).join(" "))) return null;
  if (words(article.title + " " + article.summary).some(word => /^(?:revierpacht|reviersystem|jagdpachtsystem|patentjagd|patentsystem)$/.test(word))) title.add(concept("jagdsystem"));
  if (/\bbundesweit\b/.test(article.summary) && title.has(concept("gultigkeit"))) title.add("geltungsgebiet");
  if (!tokens.every(token => title.has(token) || summary.has(token))) return null;
  const titleMatches = tokens.filter(token => title.has(token)).length;
  if (!titleMatches || (tokens.length < 2 && !norms.length && !standAloneTopics.has(tokens[0]))) return null;
  return { article, score: 4 * titleMatches + tokens.length + 8 * norms.length };
}

export function answerJagdlateinLawQuestion(question, profile, { asOf } = {}) {
  const selected = getExamProfileDetails(profile);
  if (!selected) return chooseRegion();
  const country = selected.country.code;
  const region = selected.region.code;
  const { conflict, tokens: scopedTokens, namedCountry, namedRegion } = scopeOf(question, { country, region });
  if (conflict) return chooseRegion(true);
  const wordsInQuestion = words(question);
  const statutes = wordsInQuestion.filter(word => federalNames.has(word));
  if (statutes.some(word => !federalStatutes[country].includes(word))) return chooseRegion(true);
  const exactPrompt = wordsInQuestion.join(" ");
  const asksValidity = /\bwie lang(?:e)?\b|\b(?:gultigkeitsdauer|geltungsdauer|laufzeit)\b/.test(exactPrompt) ||
    /\bwie alt darf (?:mein(?:e|en)?|der|die|das|ein(?:e|en)?) \w*(?:nachweis|ausweis|karte)\b/.test(exactPrompt);
  const asksSystemChoice = /\b(?:revierjagd oder patentjagd|patentjagd oder revierjagd)\b/.test(exactPrompt);
  const asksPermitArea = /\bwo\b.*\bgilt\b|\bgilt\b.*\bwo\b/.test(exactPrompt) && wordsInQuestion.includes("jagdschein");
  const federal = statutes.length > 0 || wordsInQuestion.some(word => federalMarkers.has(word)) ||
    (country === "DE" && namedCountry && !namedRegion && asksPermitArea);
  if (namedCountry && !namedRegion && !federal) return notice(
    "Wähle den Kanton oder das Bundesland, auf das sich die Rechtsfrage bezieht. Dann kann ich gezielt in den regionalen Lerninhalten nachsehen.",
    [{ label: "Jagdrecht · " + selected.country.name, href: legalSelectionHref(country) }],
  );
  const fallback = () => notice(
    "Für diese konkrete Frage finde ich in den geprüften Lerninhalten keine eindeutige Antwort für " +
      (federal ? "das Bundesrecht (" + selected.country.name + ")" : selected.region.name) +
      ". Frag nach der genauen Vorschrift oder öffne das Jagdrecht mit den amtlichen Fundstellen.",
    [{ label: "Jagdrecht · " + selected.region.name, href: legalSelectionHref(country, { region }) }],
  );
  // The stored review dates cannot establish a rule at a future or historical
  // date, or settle a live incident, an exception or a hypothetical permission.
  if (/\b(?:1[89]\d{2}|20\d{2}|heute|morgen|gestern|derzeit|aktuell|momentan|einzelfall|vorjahr|nachste[nrms]?|historisch)\b/.test(wordsInQuestion.join(" "))) return fallback();

  const dataset = getLegalDataset(country);
  const bundle = dataset && buildRegionalLawBundle(dataset, federal ? "BUND" : region, { includeFederal: false, asOf });
  if (!bundle) return fallback();
  const norms = normParts(question);
  const withoutNorms = scopedTokens.filter(word => !technical.has(word) &&
    !norms.some(norm => words(norm.label).includes(word)));
  const tokens = [...new Set(withoutNorms.filter(word => !filler.has(word) && !federalMarkers.has(word) &&
    !federalNames.has(word) && !legalGeneric.has(word) && !(asksValidity && ["lange", "lang", "alt", "sein"].includes(word)))
    .map(word => asksSystemChoice && ["revierjagd", "patentjagd"].includes(word) ? concept("jagdsystem") : concept(word)))];
  if (asksValidity && !tokens.includes("gultigkeit")) tokens.push("gultigkeit");
  if (asksPermitArea) tokens.push("geltungsgebiet");
  const reviewedPrompt = federal ? exactPrompt.replace(/^bundesrecht /, "") : exactPrompt;
  const candidates = bundle.articles.map(article => candidateFor(article, tokens, norms, statutes, reviewedPrompt, namedRegion)).filter(Boolean)
    .sort((left, right) => right.score - left.score);
  const [best, next] = candidates;
  if (!best || !best.article.learningReviewed || (next && best.score < next.score + 4)) return fallback();
  const { article, exactQuestion } = best;
  const links = legalLinks(article, country, region);
  if (!links.length) return fallback();
  return {
    kind: "region",
    text: exactQuestion
      ? exactQuestion.choices[exactQuestion.correctIndex] + "\n\n" + exactQuestion.explanation + "\n\n" + article.summary
      : article.summary,
    links,
    law: {
      jurisdiction: federal ? "Bundesrecht · " + selected.country.name : selected.country.regionLabel + " " + selected.region.name + " · " + selected.country.name,
      lawTitle: article.lawTitle,
      citation: article.citation,
      reviewedOn: article.reviewedOn,
    },
  };
}
