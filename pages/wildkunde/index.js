import { useMemo, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import AppIcon from "../../components/AppIcon";
import { dachWildlife, dachWildlifeGroups, filterDachWildlife } from "../../lib/dach-wildlife";
import { animalSounds } from "../../lib/animal-sounds";
import styles from "../../styles/LearningExperience.module.css";

const pageSize = 18;

export default function WildkundeIndex() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [media, setMedia] = useState("all");
  const [page, setPage] = useState(0);
  const soundsBySpecies = useMemo(() => Object.fromEntries(dachWildlife.map(species => [species.slug, animalSounds.filter(sound => sound.speciesSlug === species.slug)])), []);
  const matches = useMemo(() => filterDachWildlife({query, group}).filter(species => media === "all" || (media === "sound" ? soundsBySpecies[species.slug].length > 0 : soundsBySpecies[species.slug].length === 0)), [query, group, media, soundsBySpecies]);
  const safePage = Math.min(page, Math.max(0, Math.ceil(matches.length / pageSize) - 1));
  const visible = matches.slice(safePage * pageSize, (safePage + 1) * pageSize);
  function reset() { setQuery(""); setGroup("all"); setMedia("all"); setPage(0); }
  return <LearningToolLayout title="Wildarten entdecken" description="Wildtiere im deutschsprachigen Raum erkennen: Merkmale, Lebensraum, ähnliche Arten und echte Tierstimmen. Jagdstatus und Länderunterschiede stehen in der eigenen Rechtsübersicht." icon="deer" category="wildkunde" stats={[{value: dachWildlife.length,label: "Arten und Vergleichsformen"},{value: dachWildlifeGroups.length,label:"Artengruppen"},{value: animalSounds.length,label:"Originalaufnahmen"}]}>
    <div className={styles.actions}><Link className={styles.primary} href="/lernen/tierstimmen"><AppIcon name="sound" size={20} />Tierstimmen hören und üben</Link><Link className={styles.secondary} href="/jagdrecht/wildarten">Jagdstatus in DACH vergleichen</Link></div>
    <section className={styles.panel} aria-labelledby="wildlife-search"><h2 id="wildlife-search">Die passende Wildart finden</h2>
      <label className={styles.field}>Art, Merkmal oder wissenschaftlicher Name<input type="search" maxLength={160} value={query} placeholder="Zum Beispiel Murmeltier, Enten oder weißer Flügelspiegel" onChange={event => {setQuery(event.target.value); setPage(0);}} /></label>
      <div className={styles.toolbar}><label className={styles.field}>Artengruppe<select value={group} onChange={event => {setGroup(event.target.value); setPage(0);}}><option value="all">Alle Gruppen</option>{dachWildlifeGroups.map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.field}>Stimmenbibliothek<select value={media} onChange={event => {setMedia(event.target.value);setPage(0);}}><option value="all">Alle Arten</option><option value="sound">Mit geprüfter Originalaufnahme</option><option value="missing">Noch ohne Originalaufnahme</option></select></label><button className={styles.secondary} onClick={reset}>Filter zurücksetzen</button></div>
      <p className={styles.muted} role="status">{matches.length} Treffer · Seite {safePage + 1} von {Math.max(1, Math.ceil(matches.length / pageSize))}</p>
    </section>
    <div className={styles.gridThree}>{visible.map(species => {const sounds = soundsBySpecies[species.slug]; return <article key={species.slug} className={styles.card}>
      <p className={styles.eyebrow}>{species.group}</p><h2>{species.name}</h2><p className={styles.muted}><i>{species.scientificName}</i>{species.slug === "rackelwild" ? " · Hybrid, keine eigene Art" : ""}</p><p>{species.identification}</p>
      <div className={styles.tags}><span>{sounds.length > 0 ? `${sounds.length} Originalaufnahme${sounds.length === 1 ? "" : "n"}` : "Noch keine geprüfte Originalaufnahme"}</span></div>
      <div className={styles.actions}><Link className={styles.primary} href={`/wildkunde/${species.slug}`}>Art kennenlernen<AppIcon name="arrow-right" size={18} /></Link>{sounds.length > 0 && <Link className={styles.secondary} href={`/lernen/tierstimmen?stimme=${encodeURIComponent(sounds[0].id)}`}><AppIcon name="sound" size={18} />Stimme hören</Link>}</div>
    </article>;})}</div>
    {matches.length === 0 && <p className={styles.empty}>Keine Wildart passt zu diesen Filtern. Versuche einen kürzeren Suchbegriff oder setze die Filter zurück.</p>}
    {matches.length > pageSize && <nav className={styles.actions} aria-label="Artenübersicht Seiten"><button className={styles.secondary} disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Zurück</button><span>Seite {safePage + 1} von {Math.ceil(matches.length / pageSize)}</span><button className={styles.primary} disabled={(safePage + 1) * pageSize >= matches.length} onClick={() => setPage(safePage + 1)}>Weitere Arten</button></nav>}
    <aside className={styles.note}><strong>Artenkenntnis vor Freigabe</strong><p>Der Atlas enthält auch geschützte Vergleichsarten, seltene Gäste, gebietsfremde Arten und Rackelwild als Hybrid. Die Aufnahme einer Art in diesen Lernatlas bedeutet keine Jagdfreigabe. Eine Tonaufnahme ersetzt keine sichere Beobachtung; fehlende Aufnahmen werden offen gekennzeichnet.</p><Link className={styles.secondary} href="/jagdrecht/wildarten">Zur Quellenübersicht und rechtlichen Einordnung</Link></aside>
  </LearningToolLayout>;
}
