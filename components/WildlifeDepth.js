import { wildlifeDepthBySlug } from "../lib/wildlife-depth";
import styles from "../styles/WildlifePortrait.module.css";

export const wildlifeDepthFields = [["seasonalLife", "Jahreslauf & Verhalten"], ["fieldSigns", "Spuren & Merkmale"], ["comparisons", "Ähnliche Arten unterscheiden"], ["observation", "Beobachten & Zusammenhänge verstehen"]];

export default function WildlifeDepth({ slug, name, section }) {
  const profile = wildlifeDepthBySlug[slug];
  if (!profile) return null;
  const fields = section ? wildlifeDepthFields.filter(([key]) => key === section) : wildlifeDepthFields;
  if (section && !fields.length && section !== "questions") return null;
  const sectionId = section ? `wildlife-depth-${section}` : "wildlife-depth";
  const claims = (profile.verifiedClaims || []).filter(claim => !section || claim.section === section);
  return <section id={sectionId} className={styles.depth} aria-labelledby={`${sectionId}-heading`}>
    <h2 id={`${sectionId}-heading`}>{name}: {section ? (fields[0]?.[1] || "Kurze Wissensfragen") : "Wissen vertiefen"}</h2>
    {fields.length > 0 && <div className={section ? undefined : styles.depthGrid}>{fields.map(([key, title]) => <div key={key}>{!section && <h3>{title}</h3>}<ul>{profile[key].map(text => <li key={text}>{text}</li>)}</ul></div>)}</div>}
    {(!section || section === "questions") && profile.learningQuestions.map(check => <details className={styles.depthQuestion} key={check.q}><summary>{check.q}</summary><p><strong>{check.answer}</strong></p><p>{check.explain}</p></details>)}
    <details className={styles.depthSources}><summary>Quellen dieser Vertiefung</summary><ul>{profile.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>{claims.length > 0 && <><h3>Gezielt gegengeprüfte Aussagen</h3><p>Diese Angaben wurden am 12. Oktober 2026 mit den jeweils genannten Quellen abgeglichen. Das ist keine vollständige neue Prüfung aller Abschnitte.</p><ul>{claims.map(claim => <li key={`${claim.section}-${claim.index}`}>{claim.verifiedAspect}<ul>{claim.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></li>)}</ul></>}<p>Eigene Lernzusammenfassung, Stand 12. Oktober 2026.</p></details>
  </section>;
}
