import AppIcon from "./AppIcon";
import Image from "next/image";
import { breedPictures } from "../lib/learning-media";
import { LearningPhotoCredit } from "./LearningPhoto";
import styles from "../styles/LearningMedia.module.css";

export { LearningCover, LearningPhotoCredit } from "./LearningPhoto";

const excludedPhotoSources = value => new Set(Array.isArray(value) ? value.filter(source => typeof source === "string") : []);

export function WildlifeGallery({ pictures, deferCredits = false, excludeSources = [] }) {
  if (!pictures || pictures.length < 2) return null;
  const excluded = excludedPhotoSources(excludeSources);
  const visible = pictures.filter(picture => !excluded.has(picture.src));
  if (!visible.length) return null;
  return <section className={styles.breeds} aria-labelledby="wildlife-gallery-heading">
    <h2 id="wildlife-gallery-heading">Wildarten dieser Lerneinheit im Bild</h2>
    <div className={styles.breedGrid}>{visible.map(picture => <figure key={picture.src}>
      <Image src={picture.src} alt={picture.alt} width={picture.width} height={picture.height} style={{ maxWidth: picture.width }} sizes="(max-width: 600px) 85vw, 520px" loading="lazy" />
      <figcaption><strong>{picture.name}</strong><LearningPhotoCredit media={picture} plain={deferCredits} /></figcaption>
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

export function BreedGallery({ deferCredits = false, excludeSources = [] } = {}) {
  const excluded = excludedPhotoSources(excludeSources);
  const visible = breedPictures.filter(picture => !excluded.has(picture.src));
  if (!visible.length) return null;
  return <section className={styles.breeds} aria-labelledby="breed-gallery-heading">
    <h2 id="breed-gallery-heading">Jagdhunderassen im Bild</h2>
    <p>Bildbeispiele zeigen das Erscheinungsbild. Arbeitsleistung, Gesundheit und Eignung eines einzelnen Hundes beurteilst du gesondert; Fell und Körperbau allein genügen dafür nicht.</p>
    <div className={styles.breedGrid}>{visible.map(picture => <figure key={picture.name}>
      <Image src={picture.src} alt={picture.alt} width={picture.width || 800} height={picture.height || 600} sizes="(max-width: 600px) 85vw, 520px" loading="lazy" />
      <figcaption><strong>{picture.name}</strong>{deferCredits ? <LearningPhotoCredit media={picture} plain /> : <><small>Foto: {picture.author} · {picture.licenseUrl ? <a href={picture.licenseUrl} target="_blank" rel="noreferrer">{picture.license}</a> : picture.license} · <a href={picture.url} target="_blank" rel="noreferrer">Bildquelle</a></small><small>{picture.modifications || "Unveränderte Originalaufnahme; Anzeige an den Bildrahmen angepasst."}</small></>}</figcaption>
    </figure>)}</div>
  </section>;
}

function originalPhotoTitle(photo) {
  if (photo.file) return photo.file;
  try {
    const pathname = new URL(photo.creditUrl || photo.url || photo.sourceUrl).pathname;
    const title = pathname.split("/wiki/File:")[1];
    return title ? decodeURIComponent(title).replaceAll("_", " ") : "";
  } catch { return ""; }
}

export function CoursePhotoSources({ media, breeds = false, excludeSources = [] }) {
  const excluded = excludedPhotoSources(excludeSources);
  const candidates = [];
  if (media?.coursePhotoUse && (!media.pictures || media.pictures.length < 2)) candidates.push(media);
  if (media?.pictures?.length > 1) candidates.push(...media.pictures);
  if (breeds) candidates.push(...breedPictures.map(picture => ({ ...picture,
    credit: picture.credit || `Foto: ${picture.author} · ${picture.license}`,
    creditUrl: picture.creditUrl || picture.url || picture.sourceUrl,
    modifications: picture.modifications || "Unveränderte Originalaufnahme; Anzeige an den Bildrahmen angepasst.",
  })));
  const seen = new Set();
  const photos = candidates.filter(photo => {
    if (!photo?.src || excluded.has(photo.src) || seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
  if (!photos.length) return null;
  return <section aria-label="Bildnachweise zu weiteren Kursfotos">
    <h3>Weitere Kursfotos</h3>
    <ul>{photos.map(photo => <li key={photo.src}>
      <p><strong>{photo.name || photo.title || photo.alt}</strong></p>
      {originalPhotoTitle(photo) && <p>Dateititel der Originalquelle: {originalPhotoTitle(photo)}</p>}
      <LearningPhotoCredit media={photo} full />
    </li>)}</ul>
  </section>;
}
