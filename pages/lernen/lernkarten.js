import LearningFlashcards from "../../components/LearningFlashcards";
import useFlashcardDeck from "../../components/useFlashcardDeck";
import { getFlashcardPageData } from "../../lib/flashcard-page-data";
import { getPaidPageProps } from "../../lib/account-access";
import { readFlashcardSelection } from "../../lib/flashcard-selection";

export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context);
  return access.props ? { props: getFlashcardPageData(readFlashcardSelection(context.query)) } : access;
}

export default function LearningFlashcardsPage(props) {
  const data = useFlashcardDeck(props);
  return <LearningFlashcards {...data} />;
}
