// Build-time projection only: keep source research, full lessons and answers
// out of the plan payload. The account's confirmed profile selects the row.
import ch from "../data/exam-alignment/ch-2026-11-01.json";
import at from "../data/exam-alignment/at-2026-11-01.json";
import de from "../data/exam-alignment/de-2026-11-01.json";
import { examCountries } from "./exam-profile";
import { getLearningModule } from "./learning-curriculum";
import { learningCategoryDetails } from "./learning-categories";
import { getLearningNavigationLabel } from "./learning-navigation-labels";
import { oralExamQuestions } from "./oral-exam-trainer";
import { examReviewHref } from "./exam-review-progress";
import { isLearningReviewDate } from "./learning-review-date";

const kinds = new Set(["norm", "norm-copy", "independent-explanation", "official-explanation", "context"]);
const fail = message => { throw new Error(`Ungültiger Prüfungsrahmen: ${message}`); };
function sourceProjection(source) {
  let url;
  try { url = new URL(source.url); } catch { fail("Quellenadresse"); }
  if (url.protocol !== "https:" || url.username || url.password || !source.id || !source.title || !source.publisher || !source.section || !kinds.has(source.kind) || !isLearningReviewDate(source.reviewedOn)) fail("Quellennachweis");
  return { id: source.id, title: source.title, url: source.url, publisher: source.publisher, section: source.section, kind: source.kind, reviewedOn: source.reviewedOn };
}
function checkedIds(value, available) {
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some(id => !available.has(id))) fail("Quellenzuordnung");
  return [...value];
}

export function getExamAlignmentData() {
  const raw = [ch, at, de].flatMap(item => item.regions);
  const expected = examCountries.flatMap(country => country.regions.map(region => `${country.code}:${region.code}`));
  const ids = raw.map(region => `${region.country}:${region.region}`);
  if (new Set(ids).size !== ids.length || ids.length !== expected.length || ids.some(id => !expected.includes(id))) fail("Prüfungsregionen");
  const learningCatalog = {};
  const regions = raw.map(region => {
    if (!["confirmed", "partial", "special"].includes(region.status) || !region.summary || !Array.isArray(region.limits) || !region.limits.length || region.limits.some(item => typeof item !== "string" || !item)) fail("Geltungsgrenzen");
    const sources = region.sources.map(sourceProjection);
    const bySource = new Map(sources.map(source => [source.id, source]));
    if (sources.length !== bySource.size) fail("doppelte Quelle");
    const formats = region.formats.map(format => {
      const sourceIds = checkedIds(format.sourceIds, bySource);
      const evidence = sourceIds.map(id => bySource.get(id));
      if (region.status !== "confirmed" || !format.label || !evidence.some(source => ["norm", "norm-copy"].includes(source.kind)) || !evidence.some(source => source.kind === "independent-explanation") || new Set(evidence.map(source => source.publisher)).size < 2) fail("Prüfungsform ohne konkreten Doppelbeleg");
      return { label: format.label, sourceIds };
    });
    function moduleIds(values) {
      if (!Array.isArray(values) || new Set(values).size !== values.length) fail("Lernstartliste");
      for (const id of values) {
        const course = getLearningModule(id);
        const category = learningCategoryDetails.find(item => item.title === course?.category);
        if (!course || !course.countries.includes(region.country) || !category || !course.lessons.length || !course.questions.length) fail(`Lernstart ${id}`);
        // Regional law uses the exact profile reader directly below this block.
        // Do not offer a generic country course as a regional legal substitute.
        if (category.slug === "jagdrecht") fail("unbestimmter regionaler Rechtsstart");
        const oral = oralExamQuestions.find(question => question.course === id && question.categorySlug === category.slug);
        if (!learningCatalog[id]) learningCatalog[id] = {
          id, title: getLearningNavigationLabel(course),
          href: `/kurse/${id}#lesson-${course.lessons[0].id}`,
          quizHref: `/kurse/${id}#wissenscheck`,
          categorySlug: category.slug, categoryTitle: category.title,
          oralHref: oral ? `/lernen/pruefungsgespraech?kategorie=${category.slug}&eintrag=${oral.id}` : null,
          reviewHref: examReviewHref("gemischt", category.slug),
        };
      }
      return [...values];
    }
    const focus = region.focus.map(item => {
      if (!item.label || !item.detail || item.kind !== "own-practice") fail("Lernauftrag");
      return { label: item.label, detail: item.detail, moduleIds: moduleIds(item.moduleIds), sourceIds: checkedIds(item.sourceIds, bySource) };
    });
    if (!focus.length) fail("fehlender Lernauftrag");
    return { country: region.country, region: region.region, status: region.status, summary: region.summary, formats, focus, moduleIds: moduleIds(region.moduleIds), limits: [...region.limits], sources };
  });
  // Canonical order, rather than a fallback to the first region in a file.
  regions.sort((a, b) => expected.indexOf(`${a.country}:${a.region}`) - expected.indexOf(`${b.country}:${b.region}`));
  return { regions, learningCatalog };
}
