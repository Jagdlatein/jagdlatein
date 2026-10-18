import Image from "next/image";
import Link from "next/link";
import styles from "../styles/LearningMedia.module.css";

// Pure photo rendering: callers supply only the image and attribution they need.
export function LearningCover({ media, compact = false, imageHref }) {
  if (!media) return null;
  const photo = <Image src={media.src} alt={compact ? "" : media.alt} width={media.width} height={media.height} style={{ objectPosition: media.objectPosition || "center", ...(media.fit === "contain" ? { maxWidth: media.width } : {}) }} sizes={compact ? "(max-width: 600px) 90vw, (max-width: 940px) 45vw, 340px" : "(max-width: 1120px) 95vw, 1120px"} loading={compact ? "lazy" : "eager"} />;
  return <figure className={[compact ? styles.compact : styles.cover, media.fit === "contain" ? styles.photoCover : ""].filter(Boolean).join(" ")}>
    {/* The adjacent course title is the keyboard/screen-reader entry; its photo shares the same pointer target. */}
    {imageHref ? <Link href={imageHref} className={styles.photoLink} tabIndex={-1} aria-hidden="true">{photo}</Link> : photo}
    <figcaption className={compact ? styles.compactCaption : undefined}>{!compact && <p>{media.caption}</p>}<LearningPhotoCredit media={media} /></figcaption>
  </figure>;
}

export function LearningPhotoCredit({ media }) {
  if (!media?.credit) return null;
  return <small className={styles.photoCredit}>{media.credit}{media.categoryCover ? <> Bildausschnitt für den einheitlichen Rahmen angepasst.</> : media.modifications && <> Für die Webanzeige proportional verkleinert.</>}{media.creditUrl && <> · <a href={media.creditUrl} target="_blank" rel="noreferrer">Bildquelle</a></>}{media.licenseUrl && <> · <a href={media.licenseUrl} target="_blank" rel="noreferrer">Lizenz</a></>}</small>;
}
