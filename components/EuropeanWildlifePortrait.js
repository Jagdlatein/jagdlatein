import Image from "next/image";
import WildlifePortraitLayout from "./WildlifePortraitLayout";
import { LearningPhotoCredit } from "./LearningPhoto";
import styles from "../styles/EuropeanWildlife.module.css";

export default function EuropeanWildlifePortrait({ species }) {
  return <WildlifePortraitLayout slug={species.slug} title={`${species.name} (${species.scientificName})`} subtitle={species.identification}>
    {species.photo?.src && <figure className={styles.photo}>
      <Image src={species.photo.src} alt={species.photo.alt || `${species.name}: Originalfotografie`} width={species.photo.width} height={species.photo.height} sizes="(max-width: 620px) 92vw, (max-width: 1120px) 86vw, 1120px" />
      <figcaption>{species.photo.caption && <p>{species.photo.caption}</p>}<LearningPhotoCredit media={species.photo} /></figcaption>
    </figure>}
    <p className={styles.scope}>Europäische Artenkunde · Biologie. Dieses Porträt enthält keine Jagdfreigabe und keine Aussage zur Bejagbarkeit in einem bestimmten Land.</p>
    {species.sections.map(section => <section className={styles.section} key={section.id} id={`art-${section.id}`}>
      <h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <details className={styles.sources}><summary>Fachquellen zu diesem Abschnitt</summary><ul>{section.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}: {source.title}</a><p>{Array.isArray(source.supports) ? source.supports.join(" ") : source.supports}</p></li>)}</ul></details>
    </section>)}
    <section className={styles.section}><h2>Geltungsbereich und offene Details</h2>{(Array.isArray(species.limits) ? species.limits : [species.limits]).filter(Boolean).map(limit => <p key={limit}>{limit}</p>)}<p className={styles.review}>Diese neuen biologischen Abschnitte wurden am {new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${species.reviewedOn}T00:00:00Z`))} mit den angegebenen Fachquellen abgeglichen.</p></section>
  </WildlifePortraitLayout>;
}
