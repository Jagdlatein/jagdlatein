import Link from "next/link";
import AppIcon from "./AppIcon";
import styles from "../styles/RevierMoment.module.css";

// The public preview deliberately contains no options, answers or explanations.
export default function RevierMomentEntry({ preview }) {
  if (!preview) return null;
  return <section className={styles.entry} aria-labelledby="home-reviermoment-title">
    <div className={styles.entryHeading}><span className={styles.icon}><AppIcon name="binoculars" size={30} /></span><div><p className={styles.kicker}>Jeden Tag etwas dazulernen</p><h2 id="home-reviermoment-title">Dein Reviermoment</h2></div></div>
    <p className={styles.date}><time dateTime={preview.dateKey}>{preview.displayDate}</time> · Eine Frage, eine Erklärung</p>
    <p className={styles.topic}>{preview.topicTitle}</p>
    <h3 className={styles.prompt}>{preview.prompt}</h3>
    <p className={styles.lead}>Wähle eine der vier Antworten. Die Erklärung hilft dir beim Lernen.</p>
    <Link href="/tagesquiz" className={styles.primary}>Frage beantworten<AppIcon name="arrow-right" size={20} /></Link>
    <p className={styles.small}>Täglich eine andere Frage aus den Lerninhalten – ohne Zeitlimit.</p>
  </section>;
}
