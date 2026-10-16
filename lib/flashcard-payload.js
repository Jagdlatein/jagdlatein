// Transport only: no catalog imports, browser state, content edits or new claims.
// Preserve each card's source label even when a URL is shared with other cards.
const FORMAT = "jagdlatein-flashcards-v1";

export function packFlashcards(deck) {
  const { cards, categories, ...header } = deck;
  const sourceTable = [], contextTable = [];
  const sourceIds = new Map(), contextIds = new Map();
  const packedCards = cards.map(card => {
    const { id, question, answer, explanation, image, sources, ...metadata } = card;
    const sourceRefs = sources.map(source => {
      let index = sourceIds.get(source.url);
      if (index === undefined) {
        index = sourceTable.length;
        sourceIds.set(source.url, index);
        sourceTable.push({ ...source });
      }
      return source.label === sourceTable[index].label ? index : [index, source.label];
    });
    // Both addresses currently refer to the same course/lesson. Retain a real
    // second address if a future card supplies a distinct one.
    const sameHref = typeof metadata.courseHref === "string" && metadata.learningHref === metadata.courseHref;
    if (sameHref) delete metadata.learningHref;
    const context = { metadata, sources: sourceRefs, ...(sameHref ? { sameHref: true } : {}) };
    const key = JSON.stringify(context);
    let index = contextIds.get(key);
    if (index === undefined) {
      index = contextTable.length;
      contextIds.set(key, index);
      contextTable.push(context);
    }
    return { id, q: question, a: answer, e: explanation, context: index, ...(image ? { image: { ...image } } : {}) };
  });
  return { ...header, format: FORMAT, categories, sourceTable, contextTable, cards: packedCards };
}

export function unpackFlashcards(packed) {
  if (!packed || packed.format !== FORMAT || !Array.isArray(packed.cards) || !Array.isArray(packed.categories)
    || !Array.isArray(packed.sourceTable) || !Array.isArray(packed.contextTable)) throw new TypeError("Ungültige Lernkarten-Daten.");
  const { format, sourceTable, contextTable, cards, ...header } = packed;
  function resolveSource(ref) {
    const index = Array.isArray(ref) ? ref[0] : ref;
    if (!Number.isInteger(index) || index < 0 || !sourceTable[index]) throw new TypeError("Ungültiger Lernkarten-Quellenverweis.");
    return { ...sourceTable[index], ...(Array.isArray(ref) ? { label: ref[1] } : {}) };
  }
  return { ...header, cards: cards.map(card => {
    if (!Number.isInteger(card.context) || card.context < 0 || !contextTable[card.context]) throw new TypeError("Ungültiger Lernkarten-Kontextverweis.");
    const { metadata, sources, sameHref } = contextTable[card.context];
    return {
      ...metadata, ...(sameHref ? { learningHref: metadata.courseHref } : {}),
      id: card.id, question: card.q, answer: card.a, explanation: card.e,
      sources: sources.map(resolveSource), ...(card.image ? { image: { ...card.image } } : {}),
    };
  }) };
}
