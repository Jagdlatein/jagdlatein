import Link from "next/link";
import AppIcon from "./AppIcon";
import { getWildlifeLearningGuide, getWildlifeStudyLinks } from "../lib/wildlife-learning-guide";
import styles from "../styles/WildlifeLearningGuide.module.css";

export default function WildlifeLearningGuide({ slug, name }) {
  const links = getWildlifeLearningGuide(slug);
  if (!links.length) return null;
  return <section id="art-weiterlernen" className={styles.guide} aria-labelledby="art-weiterlernen-heading">
    <h2 id="art-weiterlernen-heading">{name}: weiterlernen</h2>
    <nav className={styles.studyLinks} aria-label={`${name}: direkt üben und vergleichen`}><Link href={`/lernen/wildjahr?art=${encodeURIComponent(slug)}`} prefetch={false} scroll>Wildjahr</Link>{getWildlifeStudyLinks(slug).map(link => <Link key={link.kind} href={link.kind === "model" ? "#kiefer-3d" : link.href} title={link.context} aria-label={`${name}: ${link.title} – ${link.context}`}>{link.title}</Link>)}</nav>
    <ul className={styles.list}>{links.map(link => <li key={link.href}>
      <a href={`#${link.topicId || `art-lerntext-${link.moduleId}`}`} className={styles.link}>
        <span className={styles.label}>{link.label}</span>
        <strong>{link.title}<AppIcon name="arrow-right" size={19} /></strong>
        <span className={styles.description}>{link.description}</span>
        {link.modelNote && <small className={styles.model}>{link.modelNote}</small>}
      </a>
    </li>)}</ul>
  </section>;
}
