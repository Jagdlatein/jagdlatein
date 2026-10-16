import Link from "next/link";
import AppIcon from "./AppIcon";
import styles from "../styles/RevierMoment.module.css";

// The public preview deliberately contains no options, answers or explanations.
export default function RevierMomentEntry({ preview }) {
  if (!preview) return null;
  return <section className={styles.entry} aria-labelledby="home-reviermoment-title">
    <div className={styles.entryHeading}><span className={styles.icon}><AppIcon name="binoculars" size={30} /></span><div><p className={styles.kicker}>Auch nach der Jägerprüfung</p><h2 id="home-reviermoment-title">Dein Reviermoment</h2></div></div>
    <p className={styles.date}><time dateTime={preview.dateKey}>{preview.displayDate}</time> · Ein Fall, eine Erklärung</p>
    <p className={styles.topic}>{preview.topicTitle}</p>
    <h3 className={styles.prompt}>{preview.prompt}</h3>
    <p className={styles.lead}>Was würdest du daraus schließen? Löse den Fall und vergleiche deine Einordnung mit der belegten Erklärung.</p>
    <Link href="/tagesquiz" className={styles.primary}>Heutigen Fall lösen<AppIcon name="arrow-right" size={20} /></Link>
    <p className={styles.small}>Täglich ein anderer Fall aus dem geprüften Fragenvorrat. In deinem Tempo, ohne Zeitlimit.</p>
  </section>;
}
