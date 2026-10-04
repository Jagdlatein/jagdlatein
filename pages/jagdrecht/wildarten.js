import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import { dachCountries, dachWildlife, dachWildlifeBySlug, dachWildlifeGroups, filterDachWildlife, legalSources, legalStatusLabels, wildlifeResearchDate } from "../../lib/dach-wildlife";
import styles from "../../styles/LearningExperience.module.css";

const pageSize = 18;
const countryNotes = {
  DE:"Bundesrecht und Landesrecht zusammen lesen. Eine Art kann dem Jagdrecht unterliegen und trotzdem keine Jagdzeit haben. Die Bundes-Jagdzeitenverordnung gilt nicht unverändert in allen Bundesländern.",
  AT:"Es gibt neun Landesjagdrechte. Ein Beispiel aus Niederösterreich, Kärnten oder einem anderen Bundesland darf nicht auf ganz Österreich übertragen werden. Schonzeit, Geschlecht und besondere Freigaben können entscheidend sein.",
  CH:"Jagdgesetz und Jagdverordnung zusammen lesen: Die Verordnung schützt unter anderem Rebhuhn und Moorente und ergänzt die Saatkrähe. Zusätzlich können Kantone die Artenliste und Jagdzeiten einschränken. Steinbockregulierung ist eine besondere Regelung.",
};

export default function WildartenRecht() {
  const router = useRouter();
  const [country, setCountry] = useState("DE");
  const [query, setQuery] = useState("");
  const [selectedArt, setSelectedArt] = useState(null);
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  useEffect(() => {
    if(!router.isReady) return;
    const art = typeof router.query.art === "string" ? dachWildlifeBySlug[router.query.art] : null;
    setSelectedArt(art?.slug || null); setQuery(art?.name || ""); setGroup("all"); setStatus("all"); setPage(0);
    const land = typeof router.query.land === "string" ? router.query.land.toUpperCase() : "";
    if(dachCountries.some(value => value.id === land)) setCountry(land);
  }, [router.isReady, router.query.art, router.query.land]);
  const matches = useMemo(() => selectedArt ? dachWildlife.filter(species => species.slug === selectedArt && (group === "all" || species.group === group) && (status === "all" || species.legal[country].status === status)) : filterDachWildlife({query,group,country,status}), [selectedArt,query,group,country,status]);
  const safePage = Math.min(page, Math.max(0,Math.ceil(matches.length / pageSize) - 1));
  const countryName = dachCountries.find(value => value.id === country).name;
  function reset() {setSelectedArt(null);setQuery("");setGroup("all");setStatus("all");setPage(0);}
  return <LearningToolLayout title="Wildarten und Jagdstatus in DACH" description="Jagdzeit, Schutz und regionale Regelungen mit amtlichen Quellen einordnen." icon="jagdrecht" category="jagdrecht" stats={[{value:dachWildlife.length,label:"Arten und Vergleichsformen"},{value:3,label:"Länder"},{value:"4.10.2026",label:"Quellenprüfung"}]}>
    <div className={styles.actions}><Link className={styles.secondary} href="/wildkunde">Wildarten erkennen</Link><Link className={styles.secondary} href="/lernen/tierstimmen">Echte Tierstimmen</Link></div>
    <section className={styles.panel} aria-labelledby="legal-filter"><h2 id="legal-filter">Land und Wildart auswählen</h2>
      <label className={styles.field}>Land<select value={country} onChange={event => {setCountry(event.target.value);setPage(0);}}>{dachCountries.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
      <p className={styles.note}>{countryNotes[country]}</p>
      <label className={styles.field}>Wildart suchen<input type="search" maxLength={160} value={query} placeholder="Zum Beispiel Rebhuhn, Steinbock oder Wolf" onChange={event => {setSelectedArt(null);setQuery(event.target.value);setPage(0);}} /></label>
      <div className={styles.toolbar}><label className={styles.field}>Artengruppe<select value={group} onChange={event => {setGroup(event.target.value);setPage(0);}}><option value="all">Alle Gruppen</option>{dachWildlifeGroups.map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.field}>Rechtliche Einordnung<select value={status} onChange={event => {setStatus(event.target.value);setPage(0);}}><option value="all">Alle Einordnungen</option>{Object.entries(legalStatusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className={styles.secondary} onClick={reset}>Alle Wildarten anzeigen</button></div>
      <p className={styles.muted} role="status">{matches.length} Treffer für {countryName} · Quellenprüfung {new Date(`${wildlifeResearchDate}T12:00:00`).toLocaleDateString("de-CH")} · {selectedArt ? "Gezielt verlinkte Art" : "Gefilterte Artenübersicht"}</p>
    </section>
    <div className={styles.grid}>{matches.slice(safePage * pageSize,(safePage + 1) * pageSize).map(species => {const law = species.legal[country]; return <article key={species.slug} className={styles.card}>
      <p className={styles.eyebrow}>{species.group}</p><h2>{species.name}</h2><p className={styles.muted}><i>{species.scientificName}</i></p><strong>{legalStatusLabels[law.status]}</strong><p>{law.note}</p>
      <details className={styles.sources}><summary>Amtliche Quellen für diese Einordnung</summary><ul>{law.sources.map(key => <li key={key}><a href={legalSources[key].url} target="_blank" rel="noopener noreferrer">{legalSources[key].title}</a></li>)}</ul></details>
      <Link className={styles.secondary} href={`/wildkunde/${species.slug}`}>Merkmale und Lebensraum kennenlernen</Link>
    </article>;})}</div>
    {matches.length === 0 && <p className={styles.empty}>Keine Art passt zu dieser Kombination. Land oder Einordnung ändern oder alle Wildarten anzeigen.</p>}
    {matches.length > pageSize && <nav className={styles.actions} aria-label="Rechtsübersicht Seiten"><button className={styles.secondary} disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Zurück</button><span>Seite {safePage + 1} von {Math.ceil(matches.length / pageSize)}</span><button className={styles.primary} disabled={(safePage + 1) * pageSize >= matches.length} onClick={() => setPage(safePage + 1)}>Weitere Wildarten</button></nav>}
    <section className={styles.panel}><h2>So liest du die Übersicht</h2><p><strong>Jagdzeit vorgesehen</strong> bedeutet, dass eine geprüfte Rechtsquelle eine reguläre Jagdmöglichkeit enthält. Es bedeutet nicht, dass heute an deinem Ort eine Freigabe besteht. <strong>Regionale Regelung</strong> verweist auf Unterschiede zwischen Ländern oder Kantonen. <strong>Sonderregelung</strong> betrifft etwa genehmigte Bestandsregulierung oder angeordnete Konfliktmaßnahmen.</p><p>Der Lernatlas umfasst regulär bejagte Wildarten, regionale und seltene Rechtsfälle sowie wichtige geschützte Vergleichsarten. Die geprüften Beispiele ersetzen keine vollständige aktuelle Tabelle sämtlicher Bundesländer und Kantone. Vor der Jagd gehören geltende Artenschutzregeln, Jagdzeit, Revierfreigabe, Abschussplan und gegebenenfalls behördliche Verfügung zusammen.</p>
      <details className={styles.sources}><summary>Alle geprüften Rechtsquellen</summary><ul>{Object.entries(legalSources).map(([key,source]) => <li key={key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></details>
    </section>
  </LearningToolLayout>;
}
