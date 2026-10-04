import AppIcon from "./AppIcon";
import Image from "next/image";
import { breedPictures } from "../lib/learning-media";
import styles from "../styles/LearningMedia.module.css";

export function LearningCover({ media, compact = false }) {
  if (!media) return null;
  return <figure className={compact ? styles.compact : styles.cover}>
    <Image src={media.src} alt={compact ? "" : media.alt} width={media.width} height={media.height} sizes={compact ? "(max-width: 600px) 90vw, (max-width: 940px) 45vw, 340px" : "(max-width: 1120px) 95vw, 1120px"} loading={compact ? "lazy" : "eager"} />
    {!compact && <figcaption><p>{media.caption}</p><small>{media.credit}</small></figcaption>}
  </figure>;
}

export function LearningDiagram({ media }) {
  if (!media?.diagram) return null;
  return <aside className={styles.diagram} aria-label={media.diagram.title}>
    <div className={styles.diagramHeading}><AppIcon name={media.icon} size={28} /><h3>{media.diagram.title}</h3></div>
    <ol className={styles.steps}>{media.diagram.steps.map((step, index) => <li key={step.title}>
      <span className={styles.stepNumber}>{index + 1}</span>
      <div><h4>{step.title}</h4><p>{step.text}</p></div>
    </li>)}</ol>
  </aside>;
}

export function BreedGallery() {
  return <section className={styles.breeds} aria-labelledby="breed-gallery-heading">
    <h2 id="breed-gallery-heading">Vier Jagdhunderassen im Bild</h2>
    <p>Bildbeispiele zeigen das Erscheinungsbild. Arbeitsleistung, Gesundheit und Eignung eines einzelnen Hundes beurteilst du gesondert; Fell und Körperbau allein genügen dafür nicht.</p>
    <div className={styles.breedGrid}>{breedPictures.map(picture => <figure key={picture.name}>
      <Image src={picture.src} alt={picture.alt} width={800} height={600} sizes="(max-width: 600px) 85vw, 520px" loading="lazy" />
      <figcaption><strong>{picture.name}</strong><small>Foto: {picture.author} · {picture.licenseUrl ? <a href={picture.licenseUrl} target="_blank" rel="noreferrer">{picture.license}</a> : picture.license} · <a href={picture.url} target="_blank" rel="noreferrer">Bildquelle</a></small><small>Unveränderte Originalaufnahme; Anzeige an den Bildrahmen angepasst.</small></figcaption>
    </figure>)}</div>
  </section>;
}
