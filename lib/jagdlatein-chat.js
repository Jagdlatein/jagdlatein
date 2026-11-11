import { answerJagdlateinLawQuestion } from "./jagdlatein-chat-law";
import { answerJagdlateinLearningQuestion } from "./jagdlatein-chat-learning";
import { normalizeSearch } from "./learning-search";

const legalTerms = /\b(?:\w*jagdrecht\w*|\w*jagdgesetz\w*|bjagdg|bayjg|jsg|jsv|njagdg|waffg|awaffv|tierschg|tierschutzgesetz\w*|\w*jagdschein\w*|\w*jagdkarte\w*|jagdgastkarte\w*|gastkarte\w*|jagdpass\w*|jagdpatent\w*|jagdzeit\w*|schonzeit\w*|jagdsystem\w*|revierpacht\w*|revierjagd\w*|patentjagd\w*|treffsicherheitsnachweis\w*|jagdregal\w*|jagdberechtig\w*|jagderlaubnis\w*|jagdhaftpflicht\w*|jagdschutz\w*|abschussplan\w*|jagdbare\w*|eigenjagd\w*|gemeinschaftsjagd\w*|wildfolge\w*|\w*leine[n]?pflicht\w*|landesrecht\w*|bundesrecht\w*|waffenrecht\w*|waffenbesitzkarte\w*|gesetz\w*|verordnung\w*|vorschrift\w*|rechtslage|rechtlich\w*|meldepflicht\w*|paragraf\w*)\b/;
const permission = /\b(?:erlaub\w*|verbot\w*|pflicht\w*|darf(?:st)?|durfen|zulassig\w*)\b/;
const huntingContext = /\b(?:jag\w*|wild\w*|revier\w*|schiess\w*|schuss\w*|waffe\w*|hund\w*|wald\w*|\w*jagd|\w*jager)\b/;
const legalDuties = /\b(?:mitfuhr\w*|vorzeig\w*|anlein\w*|aufbewahr\w*|zustandig\w*|verantwortlich\w*)\b/;
const examTerms = /\b(?:jagdprufung\w*|jagerprufung\w*)\b/;
const examRules = /\b(?:zulass\w*|mindestalter|alter|anmeld\w*|voraussetzung\w*|unterlagen|anerkenn\w*|gebuhr\w*|bestehensgrenze|wiederhol\w*|prufungsteile|wie viele fragen)\b/;
const dogLeash = /\b(?:hundeleine\w*|anleinen|leine)\b/;
const training = /\b(?:ub(?:e|en|t)|trainier\w*|training|lein(en)?fuhrigkeit|beibringen|apportier\w*)\b/;
const leashScope = /\b(?:wald\w*|kanton\w*|bundesland\w*|brutzeit|setzzeit|april|mai|juni|juli|august)\b/;
const safetyTerms = /\b(?:waffe\w*|gewehr\w*|repetier\w*|munition\w*|abzug\w*|schuss\w*|kugelfang\w*|schiess\w*|geschoss\w*|fallenfang\w*|erleg\w*|toten|totet|totung\w*|laser\w*)\b/;
const healthTerms = /\b(?:krank\w*|erkrankt\w*|verletz\w*|behandlung\w*|behandeln|medikament\w*|dosier\w*|symptom\w*|diagnos\w*|therap\w*|impf\w*|vergift\w*|verdorben\w*|trichin\w*|tierarzt\w*)\b/;
const foodQuestion = /\b(?:essen|verzehr\w*|verkauf\w*|abgeben|einfrieren|aufbewahr\w*|entsorg\w*|uberpruf\w*)\b/;
const foodSubject = /\b(?:wildbret\w*|fleisch\w*|wildfleisch\w*)\b/;

const guidance = (text, label, href) => ({ kind: "clarify", text, links: [{ label, href }] });

export function answerJagdlateinQuestion(question, profile) {
  const normalized = normalizeSearch(question);
  if (healthTerms.test(normalized) || foodSubject.test(normalized) && foodQuestion.test(normalized)) {
    return guidance("Für konkrete Gesundheits- oder Verzehrfragen brauchst du eine fachkundige Beurteilung. Hier findest du den Lernstoff zu Hygiene und Tiergesundheit.", "Wildbret & Gesundheit", "/lernen/wildbret-gesundheit");
  }
  const legal = legalTerms.test(normalized) || /\bnachweis\b.*\btreffsicherheit\b|\btreffsicherheit\b.*\bnachweis\b/.test(normalized) ||
    /§|\b(?:art\.?|artikel|absatz)\s+\d/.test(normalized) ||
    permission.test(normalized) && huntingContext.test(normalized) && !training.test(normalized) ||
    legalDuties.test(normalized) && /\b(?:muss|mussen|nachsuche|jagdausub\w*)\b/.test(normalized) ||
    examTerms.test(normalized) && examRules.test(normalized) ||
    dogLeash.test(normalized) && leashScope.test(normalized) && !training.test(normalized);
  if (legal) return answerJagdlateinLawQuestion(question, profile);
  if (safetyTerms.test(normalized)) {
    return guidance("Für Handhabung und Sicherheit findest du die Grundlagen im entsprechenden Lernbereich. Konkrete Handgriffe übst du mit einer qualifizierten Anleitung.", "Waffen & Sicherheit", "/lernen/waffen-sicherheit");
  }
  return answerJagdlateinLearningQuestion(question);
}
