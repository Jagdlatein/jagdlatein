import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import ResearchQuestionRound from "./ResearchQuestionRound";
import { getLearningCategory } from "../lib/learning-categories";
import { revierMomentRoute } from "../lib/revier-moment-navigation";
import styles from "../styles/RevierMoment.module.css";

function reviewedDate(value) {
  return new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default function RevierMoment({ moment }) {
  const router = useRouter();
  const route = revierMomentRoute(router);
  const mounted = useRef(false);
  const [, refreshLocation] = useState(0);
  const currentOrigin = useRef({ key: route.origin });
  if (currentOrigin.current.key !== route.origin) currentOrigin.current = { key: route.origin };
  const origin = currentOrigin.current;
  const { question, topic, reading } = moment;
  const caseKey = `${moment.dateKey}:${question.id}`;
  const currentCase = useRef(caseKey);
  currentCase.current = caseKey;
  function canInteract() {
    if (!mounted.current || !route.ready || currentOrigin.current !== origin || currentCase.current !== caseKey) return false;
    const live = revierMomentRoute(router);
    return live.ready && live.origin === route.origin;
  }
  useEffect(() => {
    mounted.current = true;
    const browser = typeof window === "undefined" ? null : window;
    const refresh = () => { if (mounted.current) refreshLocation(value => value + 1); };
    browser?.addEventListener("popstate", refresh);
    browser?.addEventListener("hashchange", refresh);
    return () => { mounted.current = false; browser?.removeEventListener("popstate", refresh); browser?.removeEventListener("hashchange", refresh); };
  }, []);
  const category = getLearningCategory(moment.categorySlug);
  const practice = category && category.slug !== "jagdrecht" && moment.practice?.categorySlug === category.slug ? moment.practice : null;
  const reviewHref = practice?.reviewHref === `/lernen/fuenf-minuten?kategorie=${encodeURIComponent(category?.slug)}` ? practice.reviewHref : null;
  const quizHref = practice?.quizHref === `/quiz-app?topic=${encodeURIComponent(category?.title)}` ? practice.quizHref : null;
  const readingSection = <section className={styles.deeper} aria-labelledby="moment-deeper-title">
    <p className={styles.kicker}>Passender Lerntext</p><h2 id="moment-deeper-title">{reading.title}</h2>
    {reading.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {reading.takeaway && <p><strong>Merksatz: </strong>{reading.takeaway}</p>}
    {reading.exercise && <p><strong>Selbst erklären: </strong>{reading.exercise}</p>}
    <Link href={moment.href} className={styles.textLink} prefetch={false} onClick={event => { if (!canInteract()) event.preventDefault(); }}>In dieser Lektion weiterlernen<AppIcon name="arrow-right" size={18} /></Link>
  </section>;
  return <LearningToolLayout title="Fall des Tages" description="Eine Lernsituation aus unseren Kursen: vier Antworten, eine richtige Antwort und der passende Lerntext." category={category?.slug !== "jagdrecht" ? category?.slug : undefined} icon="binoculars" headingOnly searchHref="/lernen#lernen-suche" hideCommunity className={styles.page}>
    {!route.ready && <p role="status">Dein Lernfall wird geladen.</p>}
    <div data-revier-moment-reader hidden={!route.ready} inert={!route.ready} aria-hidden={!route.ready ? true : undefined} style={{ display: route.ready ? "contents" : "none" }}>
    <p className={styles.date} style={{ marginTop: 0 }}><time dateTime={moment.dateKey}>{moment.displayDate}</time> · Ohne Zeitlimit</p>
    <p className={styles.small}>Gemeinsames Lernwissen für Deutschland, Österreich und die Schweiz. Ein eigener Lernfall, keine amtliche Prüfungsfrage. Örtliches Recht und praktische Ausbildung werden dadurch nicht ersetzt.</p>
    <p className={styles.topic}>Thema {topic.title}</p>
    <ResearchQuestionRound key={caseKey} questions={[question]} sources={topic.sources} daily title="Deine Entscheidung" showSources={false} afterAnswer={readingSection} canInteract={canInteract} />
    {(reviewHref || quizHref) && <nav className={styles.nextSteps} aria-label="Passend weiterlernen">{reviewHref && <Link href={reviewHref} prefetch={false} onClick={event => { if (!canInteract()) event.preventDefault(); }}><AppIcon name="book" size={20} /><span>Persönlich wiederholen<small>{category.title} · Verlauf auf diesem Gerät</small></span><AppIcon name="arrow-right" size={18} /></Link>}{quizHref && <Link href={quizHref} prefetch={false} onClick={event => { if (!canInteract()) event.preventDefault(); }}><AppIcon name="trophy" size={20} /><span>Quiz mit Rangliste<small>{category.title} · mit Zeit und Punkten</small></span><AppIcon name="arrow-right" size={18} /></Link>}</nav>}
    <p className={styles.small}>Die Auswahl umfasst 60 Lernfälle und wiederholt sich nach 60 Tagen. Es werden hier keine Antworten gespeichert und keine Ranglistenpunkte vergeben.</p>
    <details className={styles.sources} id="reviermoment-quellen">
      <summary>Quellen und übernommener Prüfstand</summary>
      <p>{moment.sourceScope === "lesson" ? "Die Quellen sind in der zugeordneten Lektion hinterlegt." : "Die Quellen stammen aus dem zugeordneten Kurs. Es liegt keine zusätzliche Einzelzuordnung jeder Quelle zu dieser Frage vor."}</p>
      <ul>{topic.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
      <p>Übernommener Prüfstand der Lektion beziehungsweise ihres Kurses: <time dateTime={question.reviewedOn}>{reviewedDate(question.reviewedOn)}</time>. Die tägliche Auswahl ist keine neue fachliche Prüfung.</p>
    </details>
    </div>
  </LearningToolLayout>;
}
