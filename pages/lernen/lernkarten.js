import LearningFlashcards from "../../components/LearningFlashcards";
import useFlashcardDeck from "../../components/useFlashcardDeck";
import { getFlashcardPageData } from "../../lib/flashcard-page-data";

export function getStaticProps() {
  return { props: getFlashcardPageData() };
}

export default function LearningFlashcardsPage(props) {
  const data = useFlashcardDeck(props);
  return <LearningFlashcards {...data} />;
}
