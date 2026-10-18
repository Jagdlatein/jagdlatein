import { useState } from "react";
import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { filterLearningVideos, videoLibraryGroups } from "../lib/video-library-search";
import styles from "../styles/LearningVideoLibrary.module.css";

export default function LearningVideoLibrary({ videos }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const matches = filterLearningVideos(videos, query, group);
  return <LearningToolLayout title="Jagdvideos zum Lernen" description="Originalaufnahmen zu Wildtieren und Hunden mit Beobachtungsfragen, Erklärungen und Quellen." icon="video" headingOnly searchHref="#video-suche">
    <p className={styles.intro}>Eine Szene auswählen und direkt ansehen. Die Erklärungen trennen sichtbare Beobachtung und fachlichen Hintergrund. Alle Aufnahmen haben einen Herkunfts- und Lizenznachweis; sie starten erst, wenn du sie abspielst.</p>
    <section className={styles.filters} aria-label="Video finden" id="video-suche">
      <label>Videos durchsuchen<input type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Reh, Fuchs oder Retriever" /></label>
      <label>Bereich<select value={group} onChange={event => setGroup(event.target.value)}><option value="all">Alle Videos</option>{videoLibraryGroups.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    </section>
    <p className={styles.count} role="status">{matches.length} {matches.length === 1 ? "Aufnahme" : "Aufnahmen"}</p>
    {videoLibraryGroups.map(section => {
      const items = matches.filter(item => item.group === section.id);
      return items.length > 0 && <section className={styles.group} key={section.id} aria-labelledby={`video-group-${section.id}`}>
        <h2 id={`video-group-${section.id}`}>{section.title}</h2>
        <ul>{items.map(item => <li key={item.id}><Link href={item.href} prefetch={false}>
          <AppIcon name="video" size={24} /><span><strong>{item.title}</strong><span>{item.subject} · ca. {Math.ceil(item.duration)} Sekunden</span></span><AppIcon name="arrow-right" size={19} />
        </Link></li>)}</ul>
      </section>;
    })}
    {matches.length === 0 && <p className={styles.empty}>Keine Aufnahme passt zu dieser Suche. Kürze den Suchbegriff oder wähle „Alle Videos“.</p>}
  </LearningToolLayout>;
}
