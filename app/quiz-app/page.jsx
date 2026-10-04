import QuizSetup from "../../components/QuizSetup";
import { QUESTIONS } from "../../data/questions-full";
import { quizLearningOptions } from "../../lib/quiz-learning-scope";

export default async function Page({ searchParams = {} }) {
  searchParams = (await searchParams) || {};
  const { commonOptions, countryOptions } = quizLearningOptions(QUESTIONS);
  const requestedCountry = typeof searchParams.country === "string" ? searchParams.country.toUpperCase() : "DE";
  const initialCountry = countryOptions.some(country => country.code === requestedCountry) ? requestedCountry : "DE";
  const requestedTopic = typeof searchParams.topic === "string" ? searchParams.topic : "Alle";
  const initialTopic = requestedTopic === "Recht" || commonOptions.topics.some(topic => topic.name === requestedTopic) ? requestedTopic : "Alle";

  return <QuizSetup commonOptions={commonOptions} countryOptions={countryOptions} initialCountry={initialCountry} initialTopic={initialTopic} />;
}
