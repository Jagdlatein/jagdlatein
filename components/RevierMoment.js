import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import ResearchQuestionRound from "./ResearchQuestionRound";
import styles from "../styles/RevierMoment.module.css";

function reviewedDate(value) {
  return new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default function RevierMoment({ moment }) {
  const { question, topic, reading } = moment;
  const readingSection = <section className={styles.deeper} aria-labelledby="moment-deeper-title">
    <p className={styles.kicker}>Passender Lerntext</p><h2 id="moment-deeper-title">{reading.title}</h2>
    {reading.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {reading.takeaway && <p><strong>Merksatz: </strong>{reading.takeaway}</p>}
    {reading.exercise && <p><strong>Selbst erklären: </strong>{reading.exercise}</p>}
    <Link href={moment.href} className={styles.textLink} prefetch={false}>In dieser Lektion weiterlernen<AppIcon name="arrow-right" size={18} /></Link>
  </section>;
  return <LearningToolLayout title="Fall des Tages" description="Eine Lernsituation aus unseren Kursen: vier Antworten, eine richtige Antwort und der passende Lerntext." category="jagdpraxis" icon="binoculars" headingOnly searchHref="/lernen#lernen-suche" hideCommunity className={styles.page}>
    <p className={styles.date}><time dateTime={moment.dateKey}>{moment.displayDate}</time> · Ohne Zeitlimit</p>
    <p className={styles.small}>Gemeinsames Lernwissen für Deutschland, Österreich und die Schweiz. Ein eigener Lernfall, keine amtliche Prüfungsfrage. Örtliches Recht und praktische Ausbildung werden dadurch nicht ersetzt.</p>
    <p className={styles.topic}>Thema {topic.title}</p>
    <ResearchQuestionRound key={`${moment.dateKey}:${question.id}`} questions={[question]} sources={topic.sources} daily title="Deine Entscheidung" showSources={false} afterAnswer={readingSection} />
    <nav className={styles.nextSteps} aria-label="Passend weiterlernen"><Link href="/lernen/fuenf-minuten"><AppIcon name="book" size={20} /><span>Persönlich wiederholen<small>Kurze Runde mit deinem Verlauf auf diesem Gerät</small></span><AppIcon name="arrow-right" size={18} /></Link><Link href="/quiz-app"><AppIcon name="trophy" size={20} /><span>Quiz mit Rangliste<small>Gewertete Runde mit Zeit und Punkten</small></span><AppIcon name="arrow-right" size={18} /></Link></nav>
    <p className={styles.small}>Die Auswahl umfasst 60 Lernfälle und wiederholt sich nach 60 Tagen. Es werden hier keine Antworten gespeichert und keine Ranglistenpunkte vergeben.</p>
    <details className={styles.sources} id="reviermoment-quellen">
      <summary>Quellen und übernommener Prüfstand</summary>
      <p>{moment.sourceScope === "lesson" ? "Die Quellen sind in der zugeordneten Lektion hinterlegt." : "Die Quellen stammen aus dem zugeordneten Kurs. Es liegt keine zusätzliche Einzelzuordnung jeder Quelle zu dieser Frage vor."}</p>
      <ul>{topic.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      <p>Übernommener Prüfstand der Lektion beziehungsweise ihres Kurses: <time dateTime={question.reviewedOn}>{reviewedDate(question.reviewedOn)}</time>. Die tägliche Auswahl ist keine neue fachliche Prüfung.</p>
    </details>
  </LearningToolLayout>;
}
