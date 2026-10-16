import { useMemo } from "react";
import LearningFlashcards from "../../components/LearningFlashcards";
import { getFlashcardExport } from "../../lib/learning-flashcards";
import { packFlashcards, unpackFlashcards } from "../../lib/flashcard-payload";

const EMPTY_LIST = Object.freeze([]);

export function getStaticProps() {
  return { props: { deck: packFlashcards(getFlashcardExport()) } };
}

export default function LearningFlashcardsPage({ deck, cards = EMPTY_LIST, categories = EMPTY_LIST }) {
  const data = useMemo(() => deck ? unpackFlashcards(deck) : { cards, categories }, [deck, cards, categories]);
  return <LearningFlashcards cards={data.cards} categories={data.categories} />;
}
