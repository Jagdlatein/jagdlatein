import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import Image from "next/image";
import LearningToolLayout from "./LearningToolLayout";
import { LearningPhotoCredit } from "./LearningPhoto";
import ResearchQuestionRound from "./ResearchQuestionRound";
import QuizLeagueEntry from "./QuizLeagueEntry";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/ResearchForPractice.module.css";

function reviewDate(value) {
  return new Intl.DateTimeFormat("de-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function ResearchDossier({ topic, photo }) {
  return <article className={shared.panel} id="revierwissen-inhalt" aria-labelledby="revierwissen-title">
    <div className={styles.opening}>
      <div><p className={shared.eyebrow}>Forschung für deine Jagdpraxis</p><h2 id="revierwissen-title">{topic.title}</h2><p className={styles.summary}>{topic.summary}</p><p className={styles.question}><strong>Deine Praxisfrage:</strong> {topic.question}</p></div>
      <figure className={styles.photo}><Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 760px) 90vw, 420px" priority /><figcaption>{topic.photoContext}</figcaption></figure>
    </div>
    <section className={styles.practice} aria-labelledby="revierwissen-practice"><p className={shared.eyebrow}>{topic.practice.lead}</p><h3 id="revierwissen-practice">Was du im Revier damit anfangen kannst</h3><ol>{topic.practice.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
    <section className={styles.findings} aria-labelledby="revierwissen-findings"><h3 id="revierwissen-findings">Was die Untersuchungen zeigen</h3>{topic.findings.map(finding => <section key={finding.id} className={styles.finding}><h4>{finding.title}</h4><p>{finding.text}</p></section>)}</section>
    <section className={styles.limits} aria-labelledby="revierwissen-limits"><h3 id="revierwissen-limits">Was daraus nicht folgt</h3><ul>{topic.limits.map(limit => <li key={limit}>{limit}</li>)}</ul></section>
  </article>;
}

function ResearchSources({ topic, photo }) {
  const sources = new Map(topic.sources.map(source => [source.id, source]));
  return <details className={shared.sources}><summary>Quellen und Prüfstand</summary>
    <p className={shared.muted}>Fachlicher Abgleich: <time dateTime={topic.reviewedOn}>{reviewDate(topic.reviewedOn)}</time></p>
    <p><strong>Veröffentlichungsstand:</strong> {topic.publicationState}</p><p><strong>Untersuchungsrahmen:</strong> {topic.studyScope}</p>
    <p>Die Studienbefunde und unsere Ableitung für die Praxis sind getrennt dargestellt. Mehrere Veröffentlichungen können dieselben Daten verwenden; die Einordnung steht bei jeder Quelle. Der fachliche Abgleich gilt für dieses Dossier.</p>
    <h3>Belege zu den Untersuchungsergebnissen</h3><ul>{topic.findings.map(finding => <li key={finding.id}><strong>{finding.title}</strong><div className={styles.sourceLinks}>{finding.sourceIds.map(id => { const source = sources.get(id); return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.organization}</a>; })}</div></li>)}</ul>
    <ol className={styles.sourceList}>{topic.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.organization} · {source.kind} · Veröffentlichung: <time dateTime={source.publishedOn}>{source.publishedOn}</time></p><p><strong>Belegt:</strong> {source.supports}</p><p>{source.independence}</p></li>)}</ol>
    <h3>Bildnachweis</h3><p>{topic.photoContext}</p><LearningPhotoCredit media={photo} />
  </details>;
}

export default function ResearchForPractice({ topics, photos, questions = [] }) {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query.thema;
  const topic = ready ? requested === undefined ? topics[0] : topics.find(item => typeof requested === "string" && item.id === requested) || null : null;
  const sectionIds = ["revierwissen-inhalt", "revierwissen-fragen", "revierwissen-title", "revierwissen-practice", "revierwissen-findings", "revierwissen-limits", "revierwissen-praxischeck"];
  const requestedSection = (router.asPath || "").split("#")[1];
  const section = sectionIds.includes(requestedSection) ? requestedSection : "revierwissen-inhalt";
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  const [navigationError, setNavigationError] = useState("");
  const content = useRef(null);
  const mounted = useRef(false);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const selectedQuestions = topic ? questions.filter(question => question.topicId === topic.id) : [];
  function focusContent() {
    const selector = section === "revierwissen-fragen" || section === "revierwissen-praxischeck" ? "#revierwissen-quiz-title" : section === "revierwissen-inhalt" ? "#revierwissen-title" : `#${section}`;
    const target = content.current?.querySelector?.(selector) || content.current;
    target?.setAttribute?.("tabindex", "-1");
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!topic) {
      const timer = setTimeout(() => openPageMenu("revierwissen-choices"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusContent();
  }, [ready, topic?.id, section]);
  async function select(id) {
    if (!ready || !mounted.current || committedView.current !== origin || !topics.some(item => item.id === id)) return;
    setNavigationError("");
    if (topic?.id === id && pendingRequest.current === null) { closePageMenu(); focusContent(); return; }
    const request = ++navigation.current;
    pendingRequest.current = request;
    try {
      await router.push({ pathname: "/lernen/wissen-fuers-revier", query: { ...router.query, thema: id }, hash: section }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== origin) return;
      setNavigationError("Das Thema konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("revierwissen-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  return <LearningToolLayout title="Wissen fürs Revier" description="Forschung verstehen und mit abwechslungsreichen Praxisfragen anwenden – auch nach der Jägerprüfung." category="jagdpraxis" eyebrow="Weiterdenken nach der Jägerprüfung" icon="binoculars" headingOnly className={styles.page}>
    <PageMenu title="Wissen fürs Revier – Thema wählen" openInitially={ready && !topic} initialFocusId="revierwissen-choices"><section id="revierwissen-choices" tabIndex={-1} className={styles.selector} aria-label="Praxisthema auswählen"><div className={styles.overviewLine}><span>{topics.length} Themen für dein Revier</span><span>{questions.length} Fragen mit Erklärungen</span></div><label className={shared.field}>Dein Thema<select id="revierwissen-topic" value={topic?.id || ""} disabled={!ready} aria-controls="revierwissen-inhalt" onChange={event => select(event.target.value)}><option value="" disabled>Thema wählen</option>{topics.map(item => <option key={item.id} value={item.id}>{item.id === "wildkameras" ? "Wildkameras richtig auswerten" : item.id === "wild-und-stoerung" ? "Wild, Störungen und Tageszeit" : "Rehwild, Frühling und Setzzeit"}</option>)}</select></label>{navigationError && <p className={shared.wrong} role="alert">{navigationError}</p>}</section></PageMenu>
    <div ref={content} tabIndex={-1}>{topic ? <>
    <ResearchDossier key={topic.id} topic={topic} photo={photos[topic.photoKey]} />
    <div id="revierwissen-fragen"><QuizLeagueEntry practice /><ResearchQuestionRound key={`questions-${topic.id}`} questions={selectedQuestions} sources={topic.sources} /></div>
    <p className={styles.continue}>Weitere aktuelle Veröffentlichungen findest du unter <Link href="/news">Wissen im Blick</Link>. Dort stehen Veröffentlichungsdatum und Abrufstand; diese vertieften Dossiers haben einen eigenen Prüfstand.</p>
    <details className={shared.sources}><summary>Passendes Wissen vertiefen</summary><ul>{topic.related.map(link => <li key={link.href}><Link href={link.href}>{link.title}</Link></li>)}</ul></details>
    <ResearchSources topic={topic} photo={photos[topic.photoKey]} />
    </> : <p className={shared.note}>{ready ? "Dieses Thema ist nicht verfügbar. Wähle ein Thema unten im Menü." : "Das gewählte Thema wird geladen."}</p>}</div>
  </LearningToolLayout>;
}
