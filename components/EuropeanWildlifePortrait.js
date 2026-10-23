import Image from "next/image";
import WildlifePortraitLayout from "./WildlifePortraitLayout";
import { LearningPhotoCredit } from "./LearningPhoto";
import ResearchQuestionRound from "./ResearchQuestionRound";
import styles from "../styles/EuropeanWildlife.module.css";

export default function EuropeanWildlifePortrait({ species }) {
  const portraitSections = [
    ...(species.photo?.src ? [{ id: "portrait-foto", title: "Originalfoto und Überblick", render: () => <figure className={styles.photo}>
      <Image src={species.photo.src} alt={species.photo.alt || `${species.name}: Originalfotografie`} width={species.photo.width} height={species.photo.height} sizes="(max-width: 620px) 92vw, (max-width: 1120px) 86vw, 1120px" />
      <figcaption>{species.photo.caption && <p>{species.photo.caption}</p>}<LearningPhotoCredit media={species.photo} /></figcaption>
    </figure> }] : []),
    ...species.sections.map(section => ({ id: `art-${section.id}`, title: section.title, render: () => <section className={styles.section} id={`art-${section.id}`}>
      <h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <details className={styles.sources}><summary>Fachquellen zu diesem Abschnitt</summary><ul>{section.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.title}</a><p>{Array.isArray(source.supports) ? source.supports.join(" ") : source.supports}</p></li>)}</ul></details>
    </section> })),
    ...(species.questions?.length > 0 ? [{ id: `artencheck-${species.slug}`, title: "Artenwissen mit kurzen Fragen prüfen", render: () => <ResearchQuestionRound key={species.slug} questions={species.questions} sources={species.biologySources} title="Dein Artencheck" sectionId={`artencheck-${species.slug}`} notice="Kurze Lernrunde zum Porträt. Lies nach jeder Antwort die Erklärung und die Fachquellen. Beim Verlassen beginnt die Runde neu." /> }] : []),
    { id: "portrait-geltungsbereich", title: "Geltungsbereich und offene Details", render: () => <section className={styles.section}><h2>Geltungsbereich und offene Details</h2><p className={styles.scope}>Europäische Artenkunde · Biologie. Dieses Porträt enthält keine Jagdfreigabe und keine Aussage zur Bejagbarkeit in einem bestimmten Land.</p>{(Array.isArray(species.limits) ? species.limits : [species.limits]).filter(Boolean).map(limit => <p key={limit}>{limit}</p>)}<details className={styles.sources}><summary>Prüfstand der biologischen Abschnitte</summary><p className={styles.review}>Diese neuen biologischen Abschnitte wurden am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${species.reviewedOn}T00:00:00Z`))} mit den angegebenen Fachquellen abgeglichen.</p></details></section> },
  ];
  return <WildlifePortraitLayout slug={species.slug} title={`${species.name} (${species.scientificName})`} subtitle={species.identification} portraitSections={portraitSections} />;
}
