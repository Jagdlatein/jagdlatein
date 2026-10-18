import { wildlifeKnowledgeBySlug } from "../lib/wildlife-knowledge";
import styles from "../styles/WildlifeKnowledge.module.css";

export default function WildlifeKnowledgeExpansion({ slug, name }) {
  const profile = wildlifeKnowledgeBySlug[slug];
  if (!profile) return null;
  return <section id="artenwissen-vertiefung" className={styles.knowledge} aria-labelledby="artenwissen-vertiefung-title">
    <h2 id="artenwissen-vertiefung-title">{name} genauer verstehen</h2>
    {profile.sections.map(section => <section key={section.id} id={`art-wissen-${section.id}`} className={styles.section}>
      <h3>{section.title}</h3>
      <p>{section.text}</p>
      {section.observationNote && <p className={styles.observation}><strong>Beim Beobachten:</strong> {section.observationNote}</p>}
      <details className={styles.sources}>
        <summary>Fachquellen zu diesem Abschnitt</summary>
        <ul>{section.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.title}</a></li>)}</ul>
      </details>
    </section>)}
    <p className={styles.review}>Diese Vertiefung wurde am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${profile.reviewedOn}T00:00:00Z`))} mit den angegebenen Fachquellen abgeglichen.</p>
  </section>;
}
