// Server only: keep the first render small as the checked card bank grows.
import { getFlashcardExport } from "./learning-flashcards";
import { packFlashcards } from "./flashcard-payload";

export function getFlashcardPageData(selection = null) {
  const data = getFlashcardExport(selection);
  const seed = data.cards.slice(0, 24);
  return { deck: packFlashcards({ ...data, cards: seed }), remote: data.cards.length > seed.length, totalCount: data.cards.length };
}
