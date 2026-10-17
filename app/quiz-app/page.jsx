import QuizSetup from "../../components/QuizSetup";
import { QUESTIONS, PACK_INFO } from "../../data/questions-full";
import { quizLearningOptions, quizLearningPool } from "../../lib/quiz-learning-scope";

export default async function Page({ searchParams = {} }) {
  searchParams = (await searchParams) || {};
  const { commonOptions, countryOptions } = quizLearningOptions(QUESTIONS);
  const requestedCountry = typeof searchParams.country === "string" ? searchParams.country.toUpperCase() : "DE";
  const initialCountry = countryOptions.some(country => country.code === requestedCountry) ? requestedCountry : "DE";
  const rawTopic = typeof searchParams.topic === "string" ? searchParams.topic : "Alle";
  const requestedTopic = rawTopic === "Jagdrecht" ? "Recht" : rawTopic;
  // Older entry links can select a narrower topic than the shared categories.
  // Keep that exact pool available without adding every legacy topic to the menu.
  if (requestedTopic !== "Alle" && requestedTopic !== "Recht" && PACK_INFO.topics.includes(requestedTopic)
    && !commonOptions.topics.some(topic => topic.name === requestedTopic)) {
    const count = quizLearningPool(QUESTIONS, { topic: requestedTopic }).length;
    if (count > 0) commonOptions.topics.push({ name: requestedTopic, count });
  }
  const initialTopic = requestedTopic === "Recht" || commonOptions.topics.some(topic => topic.name === requestedTopic) ? requestedTopic : "Alle";

  return <QuizSetup commonOptions={commonOptions} countryOptions={countryOptions} initialCountry={initialCountry} initialTopic={initialTopic} />;
}
