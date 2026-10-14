import Link from "next/link";
import AppIcon from "./AppIcon";
import Image from "next/image";
import { learningCategoryDetails } from "../lib/learning-categories";
import { LearningPhotoCredit } from "./LearningPhoto";
import styles from "../styles/LearningCategoryMenu.module.css";

export default function LearningCategoryMenu({ counts, covers, categoryCovers }) {
  return (
    <section className={styles.section} aria-labelledby="learning-categories-heading">
      <h2 id="learning-categories-heading">Kategorien</h2>
      <div className={styles.grid}>
        {learningCategoryDetails.map((category, index) => {
          const media = covers[categoryCovers[category.slug]];
          return <article key={category.slug} className={styles.card}>
          <Link href={`/lernen/${category.slug}`} className={styles.cardLink}>
            <Image className={styles.photo} src={media.src} alt="" width={media.width} height={media.height} style={{ objectFit: "cover", objectPosition: media.objectPosition || "center" }} sizes="(max-width: 580px) 90vw, (max-width: 900px) 45vw, 340px" priority={index < 3} loading={index < 3 ? undefined : "lazy"} />
            <span className={styles.cardBody}>
            <span className={styles.icon}><AppIcon name={category.slug} size={30} /></span>
            <span className={styles.content}>
              <strong>{category.title}</strong>
              <span>{category.description}</span>
              {counts?.[category.title] && <span className={styles.count}>{counts[category.title]} Lerneinheiten</span>}
            </span>
            <AppIcon name="arrow-right" size={18} className={styles.arrow} />
            </span>
          </Link>
          <div className={styles.photoCredit}><LearningPhotoCredit media={media} /></div>
          </article>;
        })}
      </div>
    </section>
  );
}
