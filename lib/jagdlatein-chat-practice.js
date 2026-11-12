// Server-only adapter: reuse a question from the exact sourced answer, never
// infer a practice topic from the user's words or ship the corpus to the client.
import { createHash } from "node:crypto";
import { chatPracticeBindings } from "./jagdlatein-chat-bindings";
import { getLearningModule } from "./learning-curriculum";
import { getFlashcardLessonSummary } from "./learning-flashcards";
import { flashcardSelectionQuery } from "./flashcard-selection";
import { lessonHash, lessonIndexFromHash } from "./learning-lesson-navigation";
import { getExamProfileDetails } from "./exam-profile";
import { buildRegionalLawBundle, legalSelectionHref } from "./regional-law-core";
import { getLegalDataset } from "./regional-law-data";

const text = value => typeof value === "string" && value.trim().length > 0;
const cleanId = value => text(value) && value === value.trim() && value.length <= 256 && !/[\u0000-\u0020\u007f]/.test(value);
const dach = countries => Array.isArray(countries) && countries.length === 3 &&
  new Set(countries).size === 3 && ["CH", "DE", "AT"].every(country => countries.includes(country));

function sourceLinks(sources, legal = false) {
  const links = new Map();
  for (const source of sources || []) {
    if (legal && source.kind !== "law") continue;
    const label = legal ? source.title : source.label;
    if (!text(label) || !text(source.url) || /[\u0000-\u001f\u007f]/.test(source.url)) continue;
    try {
      const url = new URL(source.url);
      if (url.protocol === "https:" && !url.username && !url.password) {
        links.set(url.href, { label, href: url.href });
      }
    } catch { /* Only existing, well-formed source destinations are eligible. */ }
  }
  return [...links.values()];
}

function sameSources(reply, expected) {
  const actual = reply.links.filter(link => typeof link?.href === "string" && !link.href.startsWith("/"));
  return expected.length > 0 && actual.length === expected.length && actual.every((link, index) =>
    link.href === expected[index].href && link.label === expected[index].label);
}

function requiresMissingMedia(question) {
  // A diagram in the reading lesson is optional. A question that actually
  // requires an image, recording or marked feature cannot become a text quiz.
  if (["image", "photo", "picture", "figure", "diagram", "audio", "video", "media", "requiredMedia", "questionMedia"]
    .some(key => question[key] !== undefined && question[key] !== null && question[key] !== false && question[key] !== "")) return true;
  const prompt = question.q ?? question.prompt;
  return /\b(?:(?:dies(?:e[smnr]?|er|es)?|d(?:as|ie|er)|folgende[nmrs]?|gezeigte[nmrs]?|vorliegende[nmrs]?)\s+(?:Foto|Bild|Abbildung|Skizze|Tabelle|Diagramm|Video|Film|Ton|Audio|Aufnahme|Geräusch)|abgebildet\w*|vorgespielt\w*)\b/i.test(prompt) ||
    /\b(?:markierte[nmrs]?|hervorgehobene[nmrs]?)\s+(?:Struktur|Bereich|Stelle|Fläche|Punkt|Teil|Merkmal)\b/i.test(prompt) ||
    /\b(?:auf|in|anhand|mit)\s+(?:dem|der|diesem|dieser)\s+(?:Foto|Bild|Abbildung|Skizze|Tabelle|Diagramm|Video|Film|Aufnahme)\b/i.test(prompt) ||
    /\b(?:welche[snr]?|was|wer)\b[^?]*\b(?:zu hören|zu sehen|dargestellt|sichtbar|erkennbar)\b/i.test(prompt);
}

function practiceQuestion(question, { prompt, options, correct, explanation, context, href }) {
  if (!cleanId(question.id) || !text(prompt) || prompt.length > 4000 ||
      !text(explanation) || explanation.length > 12000 || !text(context) || context.length > 3000 ||
      !Array.isArray(options) || options.length !== 4 || !Array.isArray(correct) || correct.length !== 1 ||
      !options.every(option => cleanId(option?.id) && text(option?.text) && option.text.length <= 3000) ||
      new Set(options.map(option => option.id)).size !== 4 ||
      new Set(options.map(option => option.text.normalize("NFKC").trim())).size !== 4 ||
      !options.some(option => option.id === correct[0]) || requiresMissingMedia(question)) return null;
  const practice = {
    id: question.id, prompt, options: options.map(option => ({ id: option.id, text: option.text })),
    correctId: correct[0], explanation, context, href,
  };
  // Skip exceptional payloads intact instead of truncating a question or limit.
  return JSON.stringify(practice).length <= 24000 ? practice : null;
}

function lessonPractice(reply) {
  const href = reply.links[0]?.href;
  const match = typeof href === "string" && href.match(/^\/kurse\/([a-z][a-z0-9-]{1,159})(#lesson-.+)$/);
  if (!match) return null;
  const course = getLearningModule(match[1]);
  if (!course || !dach(course.countries) || ["Jagdrecht", "Waffen & Sicherheit"].includes(course.category)) return null;
  const lesson = course.lessons[lessonIndexFromHash(course.lessons, match[2])];
  if (!lesson || href !== `/kurse/${course.id}${lessonHash(lesson.id)}`) return null;
  const evidence = (lesson.evidence || []).find(item => text(item.claim) && item.claim === reply.text &&
    sourceLinks(item.sources).length >= 2 && sameSources(reply, sourceLinks(item.sources)));
  if (!evidence) return null;

  let practice = null;
  const questions = course.questions.filter(question => question.lessonId === lesson.id);
  const binding = chatPracticeBindings.find(item => item.courseId === course.id &&
    item.lessonId === lesson.id && item.claim === evidence.claim);
  // Multipart lessons need an explicit reviewed claim/question pair. A changed
  // prompt, answer, explanation, context or source must not silently reuse it.
  let question = binding ? questions.find(item => item.id === binding.questionId) :
    lesson.evidence.length === 1 && questions.length === 1 ? questions[0] : null;
  if (binding && question) {
    const signature = createHash("sha256").update(JSON.stringify([
      question.id, question.lessonId, question.q, question.answers, question.correct,
      question.explain, question.context || "", question.countries, question.topic,
    ])).digest("hex");
    if (signature !== binding.questionSha256 ||
        JSON.stringify(sourceLinks(evidence.sources).map(source => source.href)) !== JSON.stringify(binding.sourceUrls)) question = null;
  }
  if (question && question.topic !== "Recht" && dach(question.countries)) {
    const context = `${course.title} · ${lesson.title}${text(question.context) ? `\n\n${question.context}` : ""}`;
    practice = practiceQuestion(question, {
      prompt: question.q, options: question.answers, correct: question.correct,
      explanation: question.explain, context, href,
    });
  }
  const cards = getFlashcardLessonSummary(course.id);
  const count = cards?.lessons?.[lesson.id];
  const cardLink = Number.isInteger(count) && count > 0 ? {
    label: "Lernkarten zur Lektion",
    href: `/lernen/lernkarten?${new URLSearchParams(flashcardSelectionQuery({ courseId: course.id, lessonId: lesson.id }))}`,
  } : null;
  return { practice, cardLink };
}

function lawPractice(reply, profile) {
  const selected = getExamProfileDetails(profile);
  const href = reply.links[0]?.href;
  if (!selected || !reply.law || typeof href !== "string") return null;
  const dataset = getLegalDataset(selected.country.code);
  if (!dataset || dataset.country !== selected.country.code) return null;
  // The shared bundle applies the current effective date, original-text gate
  // and independent-review gate before any question can be considered.
  const bundle = buildRegionalLawBundle(dataset, selected.region.code, { includeFederal: true });
  const article = bundle?.articles.find(item => item.learningReviewed &&
    href === legalSelectionHref(selected.country.code, {
      region: selected.region.code, topic: item.topic, article: item.id, includeFederal: item.regionCode === "BUND",
    }));
  if (!article || (article.regionCode !== selected.region.code && article.regionCode !== "BUND")) return null;
  const jurisdiction = article.regionCode === "BUND" ? `Bundesrecht · ${selected.country.name}` :
    `${selected.country.regionLabel} ${selected.region.name} · ${selected.country.name}`;
  if (reply.law.jurisdiction !== jurisdiction || reply.law.lawTitle !== article.lawTitle ||
      reply.law.citation !== article.citation || reply.law.reviewedOn !== article.reviewedOn ||
      !sameSources(reply, sourceLinks(article.sources, true))) return null;
  // A resolved exact-question answer includes its complete original answer,
  // explanation and article summary; a general article reply is the summary.
  if (reply.text !== article.summary && !article.questions.some(question => reply.text ===
    `${question.choices[question.correctIndex]}\n\n${question.explanation}\n\n${article.summary}`)) return null;
  for (const question of bundle.questions) {
    if (question.articleId !== article.id || question.regionCode !== article.regionCode ||
        question.country !== selected.country.code || question.format !== "single") continue;
    const practice = practiceQuestion(question, {
      prompt: question.prompt, options: question.options, correct: question.correctIds,
      explanation: question.explanation, context: question.context, href,
    });
    if (practice) return { practice };
  }
  return null;
}

export function withChatPractice(reply, profile) {
  if (!reply || !text(reply.text) || !Array.isArray(reply.links)) return reply;
  const attachment = reply.kind === "lesson" ? lessonPractice(reply) :
    reply.kind === "region" ? lawPractice(reply, profile) : null;
  if (!attachment) return reply;
  const { practice, cardLink } = attachment;
  const insertCard = cardLink && !reply.links.some(link => link?.href === cardLink.href);
  if (!practice && !insertCard) return reply;
  const links = [...reply.links];
  if (insertCard) {
    const sourceIndex = links.findIndex(link => typeof link?.href === "string" && !link.href.startsWith("/"));
    links.splice(sourceIndex < 0 ? links.length : sourceIndex, 0, cardLink);
  }
  if (!insertCard && JSON.stringify(reply.practice) === JSON.stringify(practice)) return reply;
  return { ...reply, ...(insertCard ? { links } : {}), ...(practice ? { practice } : {}) };
}
