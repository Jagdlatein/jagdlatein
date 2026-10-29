import Image from "next/image";
import Link from "next/link";
import styles from "../styles/LearningMedia.module.css";

// Pure photo rendering: callers supply only the image and attribution they need.
export function LearningCover({ media, compact = false, imageHref, deferCredits = false }) {
  if (!media) return null;
  const photo = <Image src={media.src} alt={compact ? "" : media.alt} width={media.width} height={media.height} style={{ objectPosition: media.objectPosition || "center", ...(media.fit === "contain" ? { maxWidth: media.width } : {}) }} sizes={compact ? "(max-width: 600px) 90vw, (max-width: 940px) 45vw, 340px" : "(max-width: 1120px) 95vw, 1120px"} loading={compact ? "lazy" : "eager"} />;
  return <figure className={[compact ? styles.compact : styles.cover, media.fit === "contain" ? styles.photoCover : ""].filter(Boolean).join(" ")}>
    {/* The adjacent course title is the keyboard/screen-reader entry; its photo shares the same pointer target. */}
    {imageHref ? <Link href={imageHref} className={styles.photoLink} tabIndex={-1} aria-hidden="true">{photo}</Link> : photo}
    <figcaption className={compact ? styles.compactCaption : undefined}>{!compact && <p>{media.caption}</p>}<LearningPhotoCredit media={media} plain={deferCredits} /></figcaption>
  </figure>;
}

function plainCredit(media) {
  const license = media.license || media.credit?.match(/CC BY(?:-SA)? \d+(?:\.\d+)?/)?.[0];
  if (media.author === "Giles Laurent" || media.credit?.includes("Giles Laurent")) {
    return `© Giles Laurent, gileslaurent.com${license ? ` · License ${license}` : ""}`;
  }
  return media.author && media.license ? `Foto: ${media.author} · ${media.license}` : media.credit?.split(/\.\s/)[0];
}

export function LearningPhotoCredit({ media, plain = false, full = false }) {
  if (!media) return null;
  if (plain) return plainCredit(media) ? <small className={styles.photoCredit}>{plainCredit(media)}</small> : null;
  if (full) return <small className={styles.photoCredit}>{media.credit || plainCredit(media)}{(media.author === "Giles Laurent" || media.credit?.includes("Giles Laurent")) && <> · {plainCredit(media)}</>}{media.modifications && <> {media.modifications}</>}{(media.creditUrl || media.url || media.sourceUrl) && <> · <a href={media.creditUrl || media.url || media.sourceUrl} target="_blank" rel="noreferrer">Bildquelle</a></>}{media.licenseUrl && <> · <a href={media.licenseUrl} target="_blank" rel="noreferrer">Lizenz</a></>}{media.originalUrl && <> · <a href={media.originalUrl} target="_blank" rel="noreferrer">Originaldatei</a></>}</small>;
  if (!media.credit) return null;
  return <small className={styles.photoCredit}>{media.credit}{media.categoryCover ? <> Bildausschnitt für den einheitlichen Rahmen angepasst.</> : media.modifications && <> Für die Webanzeige proportional verkleinert.</>}{media.creditUrl && <> · <a href={media.creditUrl} target="_blank" rel="noreferrer">Bildquelle</a></>}{media.licenseUrl && <> · <a href={media.licenseUrl} target="_blank" rel="noreferrer">Lizenz</a></>}</small>;
}
