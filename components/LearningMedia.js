import AppIcon from "./AppIcon";
import Image from "next/image";
import { breedPictures } from "../lib/learning-media";
import { LearningPhotoCredit } from "./LearningPhoto";
import styles from "../styles/LearningMedia.module.css";

export { LearningCover, LearningPhotoCredit } from "./LearningPhoto";

export function WildlifeGallery({ pictures }) {
  if (!pictures || pictures.length < 2) return null;
  return <section className={styles.breeds} aria-labelledby="wildlife-gallery-heading">
    <h2 id="wildlife-gallery-heading">Wildarten dieser Lerneinheit im Bild</h2>
    <div className={styles.breedGrid}>{pictures.map(picture => <figure key={picture.src}>
      <Image src={picture.src} alt={picture.alt} width={picture.width} height={picture.height} style={{ maxWidth: picture.width }} sizes="(max-width: 600px) 85vw, 520px" loading="lazy" />
      <figcaption><strong>{picture.name}</strong><LearningPhotoCredit media={picture} /></figcaption>
    </figure>)}</div>
  </section>;
}

export function LearningDiagram({ media, lessonSpecific = false }) {
  if (!media?.diagram) return null;
  return <aside className={`${styles.diagram}${lessonSpecific ? ` ${styles.lessonDiagram}` : ""}`} aria-label={media.diagram.title}>
    <div className={styles.diagramHeading}><AppIcon name={media.icon} size={28} /><h3>{media.diagram.title}</h3></div>
    {media.diagram.note && <p className={styles.diagramNote}>{media.diagram.note}</p>}
    <ol className={styles.steps}>{media.diagram.steps.map((step, index) => <li key={step.title}>
      <span className={styles.stepNumber}>{index + 1}</span>
      <div><h4>{step.title}</h4><p>{step.text}</p></div>
    </li>)}</ol>
  </aside>;
}

export function BreedGallery() {
  return <section className={styles.breeds} aria-labelledby="breed-gallery-heading">
    <h2 id="breed-gallery-heading">Jagdhunderassen im Bild</h2>
    <p>Bildbeispiele zeigen das Erscheinungsbild. Arbeitsleistung, Gesundheit und Eignung eines einzelnen Hundes beurteilst du gesondert; Fell und Körperbau allein genügen dafür nicht.</p>
    <div className={styles.breedGrid}>{breedPictures.map(picture => <figure key={picture.name}>
      <Image src={picture.src} alt={picture.alt} width={picture.width || 800} height={picture.height || 600} sizes="(max-width: 600px) 85vw, 520px" loading="lazy" />
      <figcaption><strong>{picture.name}</strong><small>Foto: {picture.author} · {picture.licenseUrl ? <a href={picture.licenseUrl} target="_blank" rel="noreferrer">{picture.license}</a> : picture.license} · <a href={picture.url} target="_blank" rel="noreferrer">Bildquelle</a></small><small>{picture.modifications || "Unveränderte Originalaufnahme; Anzeige an den Bildrahmen angepasst."}</small></figcaption>
    </figure>)}</div>
  </section>;
}
