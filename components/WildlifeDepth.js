import { wildlifeDepthBySlug } from "../lib/wildlife-depth";
import styles from "../styles/WildlifePortrait.module.css";

const fields = [["seasonalLife", "Jahreslauf & Verhalten"], ["fieldSigns", "Spuren & Merkmale"], ["comparisons", "Ähnliche Arten unterscheiden"], ["observation", "Beobachten & Zusammenhänge verstehen"]];

export default function WildlifeDepth({ slug, name }) {
  const profile = wildlifeDepthBySlug[slug];
  if (!profile) return null;
  return <section id="wildlife-depth" className={styles.depth} aria-labelledby="wildlife-depth-heading">
    <h2 id="wildlife-depth-heading">{name}: Wissen vertiefen</h2>
    <div className={styles.depthGrid}>{fields.map(([key, title]) => <div key={key}><h3>{title}</h3><ul>{profile[key].map(text => <li key={text}>{text}</li>)}</ul></div>)}</div>
    {profile.learningQuestions.map(check => <details className={styles.depthQuestion} key={check.q}><summary>{check.q}</summary><p><strong>{check.answer}</strong></p><p>{check.explain}</p></details>)}
    <details className={styles.depthSources}><summary>Quellen dieser Vertiefung</summary><ul>{profile.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>{profile.verifiedClaims?.length > 0 && <><h3>Gezielt gegengeprüfte Aussagen</h3><p>Diese Angaben wurden am 12. Oktober 2026 mit den jeweils genannten Quellen abgeglichen. Das ist keine vollständige neue Prüfung aller Abschnitte.</p><ul>{profile.verifiedClaims.map(claim => <li key={`${claim.section}-${claim.index}`}>{claim.verifiedAspect}<ul>{claim.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></li>)}</ul></>}<p>Eigene Lernzusammenfassung, Stand 12. Oktober 2026.</p></details>
  </section>;
}
