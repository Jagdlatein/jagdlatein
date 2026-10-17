// Server only: keep the first render small as the checked card bank grows.
import { getFlashcardExport } from "./learning-flashcards";
import { packFlashcards } from "./flashcard-payload";
import { getFlashcardSnapshot } from "./flashcard-snapshot";

export function getFlashcardPageData(selection = null) {
  const data = getFlashcardExport(selection);
  const seed = data.cards.slice(0, 24);
  const remote = data.cards.length > seed.length;
  return { deck: packFlashcards({ ...data, cards: seed, ...(remote ? { paging: getFlashcardSnapshot(data).manifest } : {}) }), remote, totalCount: data.cards.length };
}
