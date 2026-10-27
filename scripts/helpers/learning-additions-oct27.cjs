// Only these two independently reviewed October-27 additions are projected out
// of older preservation snapshots. Unknown lessons, questions, sources and
// other course fields remain visible and therefore still fail the old goldens.
const additions = new Map([
  ['wissen-ausbau-biologie-verdauungsvergleich-2026', {
    lessonId: 'kropfmilch',
    questionIds: ['kropfmilch-zellherkunft', 'kropfmilch-beide-eltern'],
    sourceUrls: [
      'https://link.springer.com/article/10.1186/1471-2164-12-452',
      'https://funaab.edu.ng/funaab-ocw/LectureByWeek/LectureByWeek/VBA%20301/Lecture%201.pdf',
      'https://www.wald.rlp.de/wald/voegel/ringeltaube',
      'https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/ringeltaube-columba-palumbus',
    ],
  }],
  ['wissen-ausbau-hund-ruhe-schlaf-2026', {
    lessonId: 'lernen-behalten',
    questionIds: ['lernen-behalten-q1'],
    sourceUrls: [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC5292958/',
      'https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2021.646022/full',
    ],
  }],
]);

function stripOctober27Additions(course) {
  const addition = additions.get(course.id);
  if (!addition) return course;
  const questionIds = new Set(addition.questionIds.flatMap(id => [id, `${course.id}-${id}`]));
  return {
    ...course,
    sources: course.sources.filter(source => !addition.sourceUrls.includes(source.url)),
    lessons: course.lessons.filter(lesson => lesson.id !== addition.lessonId),
    questions: course.questions.filter(question => !questionIds.has(question.id)),
  };
}

function isOctober27Evidence(record) {
  return additions.get(record.moduleId)?.lessonId === record.lessonId;
}

function isOctober27Card(card) {
  const addition = additions.get(card.moduleId);
  return !!addition && addition.questionIds.some(id => card.id === `flash-${card.moduleId}-${id}`);
}

function stripOctober27GuideTargets(slug, targets) {
  // The existing vogelmagen target shares this module and MUST remain. Only
  // Ringeltaube's exact additional lesson/topic target is a later addition.
  if (slug !== 'ringeltaube') return targets;
  return targets.filter(target => !(target.moduleId === 'wissen-ausbau-biologie-verdauungsvergleich-2026'
    && target.lessonId === 'kropfmilch'
    && target.topicId === 'art-lerntext-wissen-ausbau-biologie-verdauungsvergleich-2026-kropfmilch'));
}

module.exports = { stripOctober27Additions, isOctober27Evidence, isOctober27Card, stripOctober27GuideTargets };
