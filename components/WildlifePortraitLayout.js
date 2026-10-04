import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { SoundPlayer } from "./AnimalSounds";
import { animalSounds } from "../lib/animal-sounds";
import { dachWildlifeBySlug } from "../lib/dach-wildlife";
import styles from "../styles/LearningExperience.module.css";
import portrait from "../styles/WildlifePortrait.module.css";

export default function WildlifePortraitLayout({ slug, title, subtitle, children }) {
  const species = dachWildlifeBySlug[slug];
  const sounds = animalSounds.filter(sound => sound.speciesSlug === slug);
  return <LearningToolLayout title={title || `${species?.name} (${species?.scientificName})`} description={subtitle || species?.identification || "Merkmale, Lebensweise und sichere Unterscheidung kennenlernen."} icon="deer" category="wildkunde" stats={[{ value: species?.group || "Wildart", label: "Artengruppe" }, { value: sounds.length, label: "Originalaufnahmen" }]}>
    <div className={styles.actions}><Link className={styles.secondary} href="/wildkunde">Alle Wildarten</Link><Link className={styles.secondary} href={`/jagdrecht/wildarten?art=${slug}`}>Jagdstatus und amtliche Quellen</Link>{sounds.length > 0 && <Link className={styles.primary} href={`/lernen/tierstimmen?stimme=${encodeURIComponent(sounds[0].id)}`}>Stimme hören und üben</Link>}</div>
    <div className={portrait.body}>{children}</div>
    <section className={styles.panel} aria-labelledby="portrait-sounds"><h2 id="portrait-sounds">Die Stimme dieser Art</h2>{sounds.length ? sounds.map(sound => <article key={sound.id}><h3>{sound.name}: {sound.call}</h3><SoundPlayer sound={sound} label={`Originalaufnahme ${sound.name}`} /><p>{sound.explanation}</p><p className={styles.muted}>{sound.confusion}</p></article>) : <p>Für diese Art ist noch keine geprüfte Originalaufnahme in der Stimmenbibliothek verfügbar. Ihre Bestimmung erfolgt zusätzlich über sichtbare Merkmale, Verhalten und Lebensraum.</p>}</section>
    <aside className={styles.note}><strong>Artenkenntnis und Jagdstatus</strong><p>Biologische Merkmale gelten unabhängig von Landesgrenzen. Ob eine Art bejagt werden darf, hängt dagegen von den geltenden örtlichen Bestimmungen ab. Die rechtliche Einordnung findest du im Rechtsbereich.</p><Link className={styles.secondary} href={`/jagdrecht/wildarten?art=${slug}`}>Rechtsübersicht für diese Art</Link></aside>
  </LearningToolLayout>;
}
