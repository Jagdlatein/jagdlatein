import Image from "next/image";
import styles from "../styles/LessonPhotos.module.css";

function originalTitle(sourceUrl) {
  try {
    const title = new URL(sourceUrl).pathname.split("/wiki/File:")[1];
    return title ? decodeURIComponent(title).replaceAll("_", " ") : "";
  } catch { return ""; }
}

export function LessonPhotos({ photos = [], context = "lesson" }) {
  if (!photos.length) return null;
  return <div className={styles.photos} data-lesson-photos={context}>
    {photos.map(photo => <figure className={styles.photo} key={photo.id} data-lesson-photo={photo.id}>
      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} style={{ maxWidth: photo.width }} unoptimized loading="lazy" sizes="(max-width: 680px) 90vw, 600px" />
      <figcaption><p>{photo.caption}</p><p className={styles.limit}>{photo.limit}</p><small>Foto: {photo.author} · License {photo.license}</small></figcaption>
    </figure>)}
  </div>;
}

export function LessonPhotoSources({ photoMap = {} }) {
  const photos = [...new Map(Object.values(photoMap).flat().map(photo => [photo.src, photo])).values()];
  if (!photos.length) return null;
  return <section className={styles.sources} aria-label="Bildnachweise zu den Erklärungen">
    <h3>Fotos bei den Erklärungen</h3>
    <ul>{photos.map(photo => <li key={photo.src}>
      <p>{photo.caption}</p>{originalTitle(photo.sourceUrl) && <p>Dateititel der Originalquelle: {originalTitle(photo.sourceUrl)}</p>}<p>Foto: {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> · <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">Originalquelle</a></p>
      <p>{photo.modifications}</p>
    </li>)}</ul>
  </section>;
}
