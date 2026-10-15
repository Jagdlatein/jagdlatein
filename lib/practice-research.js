import cameras from "../data/practice-research/wildkameras.json";
import disturbance from "../data/practice-research/wild-und-stoerung.json";
import spring from "../data/practice-research/rehwild-fruehling.json";

// Source-reviewed dossiers. Publication dates describe the studies, not an
// automatic freshness promise. Search uses this text only on the server.
export const practiceResearchTopics = [cameras, disturbance, spring];
export const practiceResearchSearchEntries = practiceResearchTopics.map(topic => ({
  id: `praxisforschung-${topic.id}`, title: topic.title, description: topic.summary,
  href: `/lernen/wissen-fuers-revier?thema=${encodeURIComponent(topic.id)}#revierwissen-inhalt`,
  categories: topic.categories,
  text: [topic.question, ...topic.findings.map(item => `${item.title} ${item.text}`), ...topic.practice.steps, ...topic.limits].join(" "),
}));
