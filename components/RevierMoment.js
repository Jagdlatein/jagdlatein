import Link from "next/link";
import Image from "next/image";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { LearningPhotoCredit } from "./LearningPhoto";
import ResearchQuestionRound from "./ResearchQuestionRound";
import styles from "../styles/RevierMoment.module.css";

function reviewedDate(value) {
  return new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default function RevierMoment({ moment }) {
  const { question, topic, photo } = moment;
  const dossierHref = `/lernen/wissen-fuers-revier?thema=${encodeURIComponent(topic.id)}#revierwissen-inhalt`;
  return <LearningToolLayout title="Dein Reviermoment" description="Ein täglich wechselnder Lernfall aus geprüftem Revierwissen. Einordnen, begründen und in deinem Tempo weiterlernen." category="jagdpraxis" icon="binoculars" headingOnly searchHref="/lernen#lernen-suche" hideCommunity className={styles.page}>
    <p className={styles.date}><time dateTime={moment.dateKey}>{moment.displayDate}</time> · Ohne Zeitlimit</p>
    <p className={styles.topic}>{topic.title}</p>
    <ResearchQuestionRound key={`${moment.dateKey}:${question.id}`} questions={[question]} sources={topic.sources} daily />
    <section className={styles.deeper} aria-labelledby="moment-deeper-title">
      <div><p className={styles.kicker}>Für deine Jagdpraxis</p><h2 id="moment-deeper-title">Die Einordnung dahinter</h2><p>Im Dossier findest du die Studienbefunde, ihre Grenzen und die Ableitung für die Praxis.</p><Link href={dossierHref} className={styles.textLink}>Wissen vertiefen<AppIcon name="arrow-right" size={18} /></Link><p className={styles.small}>Fachlicher Abgleich der Frage: <time dateTime={question.reviewedOn}>{reviewedDate(question.reviewedOn)}</time>. Der tägliche Wechsel ist keine erneute fachliche Prüfung.</p></div>
      <figure className={styles.photo}><Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 640px) 90vw, 300px" /><figcaption>{topic.photoContext}<LearningPhotoCredit media={photo} /></figcaption></figure>
    </section>
    <nav className={styles.nextSteps} aria-label="Passend weiterlernen"><Link href="/lernen/fuenf-minuten"><AppIcon name="book" size={20} /><span>Persönlich wiederholen<small>Kurze Runde mit deinem Verlauf auf diesem Gerät</small></span><AppIcon name="arrow-right" size={18} /></Link><Link href="/quiz-app"><AppIcon name="trophy" size={20} /><span>Quiz mit Rangliste<small>Gewertete Runde mit Zeit und Punkten</small></span><AppIcon name="arrow-right" size={18} /></Link></nav>
    <p className={styles.small}>Die Auswahl umfasst 60 Lernfälle und wiederholt sich nach 60 Tagen. Es werden hier keine Antworten gespeichert und keine Ranglistenpunkte vergeben.</p>
  </LearningToolLayout>;
}
