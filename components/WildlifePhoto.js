import Image from "next/image";
import { wildlifePhotographs } from "../lib/wildlife-photographs";
import { LearningPhotoCredit } from "./LearningMedia";
import styles from "../styles/LearningExperience.module.css";

export default function WildlifePhoto({ slug }) {
  const photo = wildlifePhotographs[slug];
  if (!photo) return null;
  return <figure className={styles.figure}>
    <Image src={photo.src} alt={`${photo.name}: Originalfotografie`} width={photo.width} height={photo.height}
      sizes="(max-width: 620px) 92vw, (max-width: 1120px) 86vw, 960px" style={{ maxHeight: 480, objectFit: "contain" }} />
    <figcaption><LearningPhotoCredit media={photo} /></figcaption>
  </figure>;
}
