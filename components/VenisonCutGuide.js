import { useEffect, useState } from "react";
import LearningToolLayout from "./LearningToolLayout";
import { findVenisonCuts, venisonCuts, venisonCutPhoto, venisonCutSources, venisonCookingMethods, venisonKitchenSafety } from "../lib/venison-cut-guide";
import styles from "../styles/DogCutLearning.module.css";

function SourceLinks({ ids }) {
  const unique = [...new Map(ids.map(id => [venisonCutSources[id].organization, venisonCutSources[id]])).values()];
  return <p className={styles.sources}>Quellen: {unique.map((source, index) => <span key={source.url}>{index > 0 ? " · " : ""}<a href={source.url} target="_blank" rel="noopener noreferrer" title={source.label}>{source.organization}</a></span>)}</p>;
}

export default function VenisonCutGuide() {
  const [query, setQuery] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const matches = findVenisonCuts(query);
  const matchIds = new Set(matches.map(item => item.id));
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eintrag");
    const cut = venisonCuts.find(item => item.id === id);
    if (cut) setQuery(cut.title);
  }, []);
  return <LearningToolLayout title="Wildbret: Stücke erkennen" description="Schulter, Rippen, Keule, Rücken und Hals auf einer echten Rehaufnahme – mit passenden Zubereitungsarten und klaren Begriffen." icon="wildbret-gesundheit" category="wildbret-gesundheit" compact hideCommunity>
    <label className={styles.searchLabel} htmlFor="wildbret-stueck-suche">Stück oder Zubereitung suchen</label>
    <input className={styles.search} id="wildbret-stueck-suche" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Schulter, Rücken oder Gulasch" autoComplete="off" />
    <figure className={styles.overview}>
      <div className={styles.photoMap}>
        {!imageFailed ? <img src={venisonCutPhoto.src} width="1920" height="1080" alt={venisonCutPhoto.alt} onError={() => setImageFailed(true)} /> : <p className={styles.imageFallback}>Die Aufnahme ist gerade nicht verfügbar. Die Stücke sind in der Bildlegende und darunter beschrieben.</p>}
        {!imageFailed && <div className={styles.markers} aria-hidden="true">{venisonCuts.map(item => <span key={item.id} className={`${styles.marker}${matchIds.has(item.id) ? ` ${styles.markerActive}` : ""}`} style={{ left: `${item.marker.x}%`, top: `${item.marker.y}%` }}>{item.number}</span>)}</div>}
      </div>
      <figcaption><strong>Ein Reh, fünf eindeutig zugeordnete Teilstücke.</strong><ol className={styles.legend}>{venisonCuts.map(item => <li key={item.id}><span>{item.number}</span>{item.title}</li>)}</ol><p>{venisonCutPhoto.author} · {venisonCutPhoto.location} · {venisonCutPhoto.date} · <a href={venisonCutPhoto.source} target="_blank" rel="noopener noreferrer">Originalaufnahme</a> · <a href={venisonCutPhoto.licenseUrl} target="_blank" rel="noopener noreferrer">{venisonCutPhoto.license}</a></p></figcaption>
    </figure>
    <p className={styles.results} role="status" aria-live="polite">{query.trim() ? `${matches.length} passende${matches.length === 1 ? "s Stück" : " Stücke"}` : "Alle fünf Stücke"}</p>
    {matches.length === 0 && <p className={styles.feedback}>Kein passendes Stück gefunden. Suche zum Beispiel nach „Hals“, „Schlegel“ oder „Schmoren“.</p>}
    <section className={styles.cutGrid} aria-label="Teilstücke und Zubereitung">{matches.map(cut => <article key={cut.id} id={`wildbret-${cut.id}`} className={styles.cutCard}>
      <figure><img src={cut.photo} width="640" height="480" alt={cut.photoAlt} loading="lazy" /><figcaption>Ausschnitt derselben Rehaufnahme · Hans J. Klaiber · CC BY 3.0</figcaption></figure>
      <div className={styles.cutBody}><h2><span>{cut.number}</span>{cut.title}</h2><p>{cut.location}</p><ul className={styles.methods} aria-label="Geeignete Zubereitungsarten">{cut.methods.map(method => <li key={method}>{method}</li>)}</ul><p>{cut.cooking}</p><details className={styles.details}><summary>Erkennungsmerkmale und Begriffe</summary><p>{cut.recognition}</p><p>{cut.distinction}</p></details><SourceLinks ids={cut.sources} /></div>
    </article>)}</section>
    <section className={styles.kitchen} aria-label="Garmethoden verstehen"><h2>Stück und Garmethode gehören zusammen</h2><div className={styles.methodGrid}>{venisonCookingMethods.map(method => <div key={method.title}><h3>{method.title}</h3><p>{method.text}</p><SourceLinks ids={method.sources} /></div>)}</div><div className={styles.safety}><h3>{venisonKitchenSafety.title}</h3><p>{venisonKitchenSafety.text}</p><SourceLinks ids={venisonKitchenSafety.sources} /></div></section>
    <details className={styles.details}><summary>Foto, Zuordnung und vollständige Fachquellen</summary><p>{venisonCutPhoto.changes}</p><p>{venisonCutPhoto.provenance}</p><p>Begriffe und Zubereitungsprinzipien gelten als Orientierung für die genannten Stücke. Zuschnitt, Tierart und tatsächliche Beschaffenheit müssen bei einer konkreten Portion bekannt sein. Die Aufnahme zeigt Reh und kein Wildschwein. Inhalt geprüft am 12. Oktober 2026.</p><ul>{Object.values(venisonCutSources).map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.label}</a></li>)}</ul></details>
  </LearningToolLayout>;
}
