import QuizSetup from "../../components/QuizSetup";
import { QUESTIONS } from "../../data/questions-full";

const countries = [
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "CH", name: "Schweiz" },
];

export default function Page({ searchParams = {} }) {
  const countryOptions = countries.map(country => {
    const counts = new Map();
    const questions = QUESTIONS.filter(question => question.countries.includes(country.code));
    questions.forEach(question => counts.set(question.topic, (counts.get(question.topic) || 0) + 1));
    return {
      ...country,
      total: questions.length,
      topics: [...counts].map(([name, count]) => ({ name, count }))
        .sort((left, right) => left.name.localeCompare(right.name, "de")),
    };
  });
  const requestedCountry = typeof searchParams.country === "string" ? searchParams.country.toUpperCase() : "DE";
  const initialCountry = countryOptions.some(country => country.code === requestedCountry) ? requestedCountry : "DE";
  const selectedCountry = countryOptions.find(country => country.code === initialCountry);
  const requestedTopic = typeof searchParams.topic === "string" ? searchParams.topic : "Alle";
  const initialTopic = selectedCountry.topics.some(topic => topic.name === requestedTopic) ? requestedTopic : "Alle";

  return <QuizSetup countryOptions={countryOptions} initialCountry={initialCountry} initialTopic={initialTopic} />;
}
