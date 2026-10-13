import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import { LearningPhotoCredit } from "./LearningMedia";
import { wildlifePhotographs } from "../lib/wildlife-photographs";
import { getWildYearProfile, wildYearMonths, wildYearSources, wildYearSpecies } from "../lib/wild-year";
import styles from "../styles/WildYear.module.css";

export default function WildYear() {
  const router = useRouter();
  const [slug, setSlug] = useState("gamswild");
  const [month, setMonth] = useState(1);
  useEffect(() => {
    if (typeof router.query.art === "string" && wildYearSpecies.some(item => item.slug === router.query.art)) setSlug(router.query.art);
    const requested = Number(router.query.monat);
    if (Number.isInteger(requested) && requested >= 1 && requested <= 12) setMonth(requested);
  }, [router.query.art, router.query.monat]);
  const view = getWildYearProfile(slug, month);
  const photograph = wildlifePhotographs[view.species.slug];
  return <LearningToolLayout title="Das biologische Wildjahr" description="Art und Monat wählen. Merkmale, Fortpflanzung und Verhalten im Jahreslauf erscheinen direkt darunter." icon="wildkunde" category="wildkunde" compact hideCommunity>
    <section className={styles.controls} aria-label="Wildjahr auswählen">
      <label className={styles.species}>Wildart<select value={slug} onChange={event => setSlug(event.target.value)}>{wildYearSpecies.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <div className={styles.month}><label htmlFor="wildjahr-month">Monat <output htmlFor="wildjahr-month">{view.monthName}</output></label><input id="wildjahr-month" type="range" min="1" max="12" step="1" value={month} aria-valuetext={view.monthName} onChange={event => setMonth(Number(event.target.value))} /><div className={styles.monthNames} aria-hidden="true">{wildYearMonths.map(item => <span key={item}>{item.slice(0, 3)}</span>)}</div></div>
    </section>
    <section className={styles.result} aria-labelledby="wildjahr-current">
      <div className={styles.bio}>
        <h2 id="wildjahr-current">{view.species.name} im {view.monthName}</h2>
        <p className={styles.orientation}>Typische Phasen in Mitteleuropa. Wetter, Höhenlage, Alter und Individuum verschieben die Übergänge. Die Monatsbänder sind eine Orientierung.</p>
        <div className={styles.cards}>{view.sections.map(section => <article key={section.key} className={styles.card}><p className={styles.label}>{section.label}</p><h3>{section.claim.title}</h3><p>{section.claim.text}</p><details><summary>Belege zu dieser Aussage</summary><ul>{section.claim.sourceIds.map(id => <li key={id}><a href={wildYearSources[id].url} target="_blank" rel="noreferrer">{wildYearSources[id].label}</a></li>)}</ul><small>Inhaltlich gegengeprüft: {view.species.reviewedOn}</small></details></article>)}</div>
      </div>
      <figure className={styles.portrait}><Image src={photograph.src} alt={`${photograph.name}: dokumentarisches Artporträt, unabhängig vom ausgewählten Monat`} width={photograph.width} height={photograph.height} sizes="(max-width: 850px) 90vw, 350px" priority /><figcaption><strong>{photograph.name}</strong><p>Artporträt zur Orientierung. Dieses Foto belegt weder den gewählten Monat noch eine Fortpflanzungsphase.</p><LearningPhotoCredit media={photograph} /></figcaption></figure>
    </section>
    <aside className={styles.note}><strong>Genau hinschauen</strong><p>{view.species.uncertainty}</p><p>Ein Tier zeigt nicht immer alle Merkmale der typischen Jahresphase. Beobachtungen am besten mit Datum, Ort und erkennbaren Merkmalen festhalten.</p></aside>
  </LearningToolLayout>;
}
