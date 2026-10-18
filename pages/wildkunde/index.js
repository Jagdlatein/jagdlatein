import { useMemo, useRef } from "react";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import AppIcon from "../../components/AppIcon";
import { europeanWildlife, europeanWildlifeGroups, filterEuropeanWildlife } from "../../lib/european-wildlife-discovery";
import { dentitionBySlug } from "../../lib/wildlife-dentition";
import { matchWildlifeSection } from "../../lib/wildlife-section-match";
import { getWildlifeStudyLinks } from "../../lib/wildlife-learning-guide";
import { animalSounds } from "../../lib/animal-sounds";
import useWildlifeListState from "../../lib/use-wildlife-list-state";
import styles from "../../styles/WildlifeIndex.module.css";

export default function WildkundeIndex() {
  const { query, group, urlReady, change, reset, openPortrait } = useWildlifeListState();
  const resultsRef = useRef(null);
  const soundCounts = useMemo(() => animalSounds.reduce((counts, sound) => {
    counts[sound.speciesSlug] = (counts[sound.speciesSlug] || 0) + 1;
    return counts;
  }, {}), []);
  const matches = useMemo(() => [...filterEuropeanWildlife({ query, group })]
    .sort((left, right) => left.name.localeCompare(right.name, "de")), [query, group]);

  function showResults(event) {
    event.preventDefault();
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }

  return <LearningToolLayout title="Alle Wildarten" description="Alle Arten und Vergleichsformen in einer Liste. Merkmale und Lebensraum direkt lesen, das vollständige Artenwissen mit einem Tippen öffnen." icon="deer" category="wildkunde" headingOnly searchHref="#wildlife-search">
    <section className={styles.search} aria-labelledby="wildlife-search">
      <h2 id="wildlife-search">Wildart finden</h2>
      <form className={styles.filters} role="search" aria-label="Wildarten durchsuchen" onSubmit={showResults}>
        <label className={styles.query}>Art, Merkmal oder wissenschaftlicher Name<input type="search" maxLength={160} disabled={!urlReady} value={query} placeholder="Zum Beispiel Gams, Zahnformel oder 3D" enterKeyHint="search" aria-controls="wildlife-results" onChange={event => change("query", event.target.value)} /></label>
        <label>Artengruppe<select disabled={!urlReady} value={group} aria-controls="wildlife-results" onChange={event => change("group", event.target.value)}><option value="all">Alle Gruppen</option>{europeanWildlifeGroups.map(value => <option key={value}>{value}</option>)}</select></label>
      </form>
      <div className={styles.searchStatus}><p role="status">{matches.length} von {europeanWildlife.length} Einträgen{query.trim() || group !== "all" ? " gefunden" : " · A–Z"}</p>{(query || group !== "all") && <button type="button" onClick={reset}>Suche leeren</button>}</div>
    </section>
    <section id="wildlife-results" className={styles.results} ref={resultsRef} tabIndex={-1} aria-label="Wildarten und Vergleichsformen">
      {matches.length > 0 ? <ul className={styles.list}>{matches.map(species => {
        const sounds = soundCounts[species.slug] || 0;
        const destination = matchWildlifeSection(species, query);
        return <li key={species.slug} data-wildlife-slug={species.slug}>
          <Link href={destination?.href || `/wildkunde/${species.slug}`} className={styles.speciesLink} aria-labelledby={`wildlife-${species.slug}`} onClick={event => openPortrait(event, destination?.href || `/wildkunde/${species.slug}`)} onAuxClick={event => openPortrait(event, destination?.href || `/wildkunde/${species.slug}`)}>
            <div className={styles.rowHeading}><div><h2 id={`wildlife-${species.slug}`}>{species.name}</h2><p className={styles.scientific}><i>{species.scientificName}</i>{species.slug === "rackelwild" ? " · Hybrid, keine eigene Art" : ""}</p></div><AppIcon name="arrow-right" size={22} /></div>
            <p className={styles.meta}>{species.group}{sounds > 0 && <> · {sounds} Originalaufnahme{sounds === 1 ? "" : "n"}</>}{dentitionBySlug[species.slug] && " · Gebiss erklärt"}{species.europeanOnly && " · Europa"}</p>
            <dl className={styles.knowledge}><div><dt>Erkennen</dt><dd>{species.identification}</dd></div><div><dt>Lebensraum & Lebensweise</dt><dd>{species.habitat}</dd></div></dl>
            {destination && <p className={styles.destination}>Direkt zu: {destination.sectionTitle}</p>}
          </Link>
          <div className={styles.studyLinks} role="group" aria-label={`${species.name}: direkt weiterlernen`}>{getWildlifeStudyLinks(species.slug).map(link => <Link key={link.kind} href={link.href} title={link.context} aria-label={`${species.name}: ${link.title} – ${link.context}`} onClick={event => openPortrait(event, link.href)} onAuxClick={event => openPortrait(event, link.href)}>{link.title}</Link>)}</div>
        </li>;
      })}</ul> : <p className={styles.empty}>Keine Wildart passt zu dieser Suche. Versuche einen kürzeren Begriff oder wähle „Alle Gruppen“.</p>}
    </section>
    <nav className={styles.more} aria-label="Wildwissen ergänzen"><Link href="/lernen/kiefer-3d">Kiefer & Schädel in 3D vergleichen<AppIcon name="arrow-right" size={17} /></Link><Link href="/lernen/tierstimmen">Tierstimmen hören und üben<AppIcon name="arrow-right" size={17} /></Link><Link href="/jagdrecht/wildarten">Jagdstatus in DACH vergleichen<AppIcon name="arrow-right" size={17} /></Link></nav>
    <aside className={styles.scope}><strong>Artenkenntnis und Jagdstatus getrennt betrachten</strong><p>Der Atlas enthält auch geschützte Vergleichsarten, seltene Gäste, gebietsfremde Arten und Rackelwild als Hybrid. Die Aufnahme eines Eintrags bedeutet keine Jagdfreigabe. Ob eine Art bejagt werden darf, muss nach den geltenden örtlichen Bestimmungen geprüft werden.</p></aside>
  </LearningToolLayout>;
}
