import { birdDentition, birdDentitionSlugs, dentalCount, dentalNotationSources, dentitionBySlug, dentitionWithheld, toothTypes } from "../lib/wildlife-dentition";
import styles from "../styles/WildlifeDentition.module.css";

function Formula({ formula, label }) {
  const count = dentalCount(formula);
  if (!count) return null;
  return <div className={styles.formulaBlock}>
    {label && <h3>{label}</h3>}
    <div className={styles.formula} aria-label={`Zahnformel, je eine Seite von Ober- und Unterkiefer: ${toothTypes.map(type => `${type.id} ${formula[type.id][0]} oben und ${formula[type.id][1]} unten`).join(", ")}`}>
      {toothTypes.map(type => <div className={styles.tooth} key={type.id}><strong>{type.id}</strong><span className={styles.fraction}><span>{formula[type.id][0]}</span><span>{formula[type.id][1]}</span></span></div>)}
      <span className={styles.multiply}>× 2</span><strong className={styles.total}>= {count.total}</strong>
    </div>
    <table className={styles.table}>
      <caption>Zähne je Kieferseite</caption>
      <thead><tr><th scope="col">Zahnart</th><th scope="col">Oben</th><th scope="col">Unten</th></tr></thead>
      <tbody>{toothTypes.map(type => <tr key={type.id}><th scope="row"><b>{type.id}</b> · {type.name}{type.scientific && <small>{type.scientific}</small>}</th><td>{formula[type.id][0]}</td><td>{formula[type.id][1]}</td></tr>)}</tbody>
      <tfoot><tr><th scope="row">Eine Seite</th><td>{count.upper}</td><td>{count.lower}</td></tr></tfoot>
    </table>
    <p className={styles.math}>Beide Seiten zusammen: 2 × ({count.upper} oben + {count.lower} unten) = <strong>{count.total} Zähne</strong>.</p>
  </div>;
}

export default function WildlifeDentition({ slug, name }) {
  if (birdDentitionSlugs.has(slug)) return <section id="gebiss" className={styles.panel} aria-labelledby="gebiss-title">
    <p className={styles.eyebrow}>Biologie im Detail</p><h2 id="gebiss-title">Schnabel · keine echten Zähne</h2><p>{birdDentition.text}</p>
    <details className={styles.details}><summary>Belege und Geltungsbereich</summary><p>{birdDentition.scope} Inhaltlich abgeglichen am 16. Oktober 2026; das Datum gilt für diesen Abschnitt.</p><ul>{birdDentition.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.title}</a><p>{source.supports}</p></li>)}</ul></details>
  </section>;
  const profile = dentitionBySlug[slug];
  const withheld = dentitionWithheld.find(record => record.slug === slug);
  if (!profile && !withheld) return null;
  return <section id="gebiss" className={styles.panel} aria-labelledby="gebiss-title">
    <p className={styles.eyebrow}>Biologie im Detail</p><h2 id="gebiss-title">Gebiss{profile ? ` · Vollformel: ${profile.total} Zähne` : ` von ${name}`}</h2>
    {profile ? <>
      <p className={styles.scope}>{profile.scope}</p>
      <Formula formula={profile.formula} />
      {profile.note && <p className={styles.note}>{profile.note}</p>}
      {profile.variants?.map(variant => <Formula key={variant.label} {...variant} />)}
      <details className={styles.details}><summary>Zahnformeln richtig lesen</summary>
        <p>Die Zahlen beschreiben jeweils <strong>eine</strong> Kieferseite. Oben steht die Zahl im Oberkiefer, darunter die im Unterkiefer. Für die linke und rechte Seite zusammen wird die Summe verdoppelt.</p>
        <p>I bezeichnet Schneidezähne, C Eckzähne, P Prämolaren und M Molaren. Die Formel hier beschreibt das bleibende Gebiss. Milchgebiss und Zahnwechsel sind davon getrennt zu betrachten; dafür wird hier keine ungeprüfte Formel angegeben.</p>
        <p>Das ist eine Zählübersicht, keine Zeichnung der Zahnform oder ihrer räumlichen Lage. Die artspezifischen Einschränkungen stehen direkt bei der Formel.</p>
        <ul>{dentalNotationSources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.title}</a></li>)}</ul>
      </details>
      <details className={styles.details}><summary>Belege zur Zahnformel</summary><p>Dieser Gebissabschnitt wurde am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${profile.reviewedOn}T00:00:00Z`))} inhaltlich abgeglichen. Das Datum gilt für diesen Abschnitt.</p>
        <ul>{profile.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.title}</a><p>{Array.isArray(source.supports) ? source.supports.join(" ") : source.supports}</p></li>)}</ul>
      </details>
    </> : <p>Für diese Art veröffentlichen wir hier noch keine neue Zahnformel. Die genaue Formel einschließlich ihrer möglichen Abweichungen ist noch nicht ausreichend durch unabhängige Fachquellen abgeglichen.</p>}
  </section>;
}
