// These exact groups were read side by side: same prompt and learning point,
// sometimes with differently worded distractors. Preserve all original IDs for
// saved rounds and course progress; offer just one member in a new quiz pool.
export const reviewedQuizDuplicateGroups = [
  ["DE-ws-flintenlaufgeschoss", "AT-ws-flg", "CH-ws-flg", "JL-1024"],
  ["AT-hund-fuehrung", "CH-hund-fuehrung"],
  ["JL-109", "JL-1031"],
  ["JL-1002", "JL-1098", "JL-1220"],
  ["JL-1015", "JL-1232"],
  ["JL-1022", "JL-1116"],
  ["JL-1114", "JL-1213"],
  ["JL-1204", "JL-new-0019"],
  ["JL-1241", "JL-new-0013"],
  ["wissen-jaegersprache-4", "wissen-ausbau-jaegersprache-spur-1"],
];
const groupById = new Map(reviewedQuizDuplicateGroups.flatMap((group, index) => group.map(id => [id, index])));
const prompt = question => String(question.q || question.prompt || "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function variedQuizPool(questions) {
  const seen = new Set();
  return questions.filter(question => {
    const group = groupById.get(question.id);
    if (group === undefined) return true;
    const key = `${group}:${prompt(question)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
