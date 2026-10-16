import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { SoundPlayer } from "./AnimalSounds";
import { animalSounds } from "../lib/animal-sounds";
import { europeanWildlifeBySlug } from "../lib/european-wildlife-discovery";
import { birdDentitionSlugs, dentitionBySlug, dentitionWithheld } from "../lib/wildlife-dentition";
import WildlifeDentition from "./WildlifeDentition";
import WildlifeDepth from "./WildlifeDepth";
import styles from "../styles/LearningExperience.module.css";
import portrait from "../styles/WildlifePortrait.module.css";

export default function WildlifePortraitLayout({ slug, title, subtitle, children }) {
  const species = europeanWildlifeBySlug[slug];
  const hasDentition = dentitionBySlug[slug] || dentitionWithheld.some(record => record.slug === slug) || birdDentitionSlugs.has(slug);
  const sounds = animalSounds.filter(sound => sound.speciesSlug === slug);
  return <LearningToolLayout title={title || `${species?.name} (${species?.scientificName})`} description={subtitle || species?.identification || "Merkmale, Lebensweise und sichere Unterscheidung kennenlernen."} icon="deer" category="wildkunde" className={portrait.page} compact stats={[{ value: species?.group || "Wildart", label: "Artengruppe" }, { value: sounds.length, label: "Originalaufnahmen" }]}>
    <nav className={portrait.quietLinks} aria-label="Artenwissen"><Link href="/wildkunde">Alle Wildarten</Link>{hasDentition && <a href="#gebiss">{birdDentitionSlugs.has(slug) ? "Schnabel & Zähne" : "Gebiss im Detail"}</a>}{sounds.length > 0 && <a href="#portrait-sounds">Stimme dieser Art hören</a>}</nav>
    <div className={portrait.body}>{children}</div>
    <WildlifeDentition slug={slug} name={species?.name || title} />
    <WildlifeDepth slug={slug} name={species?.name || title} />
    <section className={styles.panel} aria-labelledby="portrait-sounds"><h2 id="portrait-sounds">Die Stimme dieser Art</h2>{sounds.length ? sounds.map(sound => <article key={sound.id}><h3>{sound.name}: {sound.call}</h3><SoundPlayer sound={sound} label={`Originalaufnahme ${sound.name}`} /><p>{sound.explanation}</p><p className={styles.muted}>{sound.confusion}</p></article>) : <p>Für diese Art ist noch keine geprüfte Originalaufnahme in der Stimmenbibliothek verfügbar. Ihre Bestimmung erfolgt zusätzlich über sichtbare Merkmale, Verhalten und Lebensraum.</p>}</section>
    <aside className={styles.note}><strong>Artenkenntnis und Jagdstatus</strong><p>Biologische Merkmale gelten unabhängig von Landesgrenzen. Ob eine Art bejagt werden darf, hängt dagegen von den geltenden örtlichen Bestimmungen ab. Die Rechtsübersicht von Jagdlatein behandelt Deutschland, Österreich und die Schweiz.</p><Link href={species?.europeanOnly ? "/jagdrecht/wildarten" : `/jagdrecht/wildarten?art=${slug}`}>{species?.europeanOnly ? "Zur Rechtsübersicht für DACH" : "Rechtsübersicht für diese Art →"}</Link></aside>
  </LearningToolLayout>;
}
