import { useRouter } from "next/router";
import Link from "next/link";
import PageMenu from "./PageMenu";
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
  const selectedId = typeof router.query.thema === "string" ? router.query.thema : "";
  // Deriving selection from the URL also preserves browser Back/Forward and
  // avoids a stale shallow-navigation acknowledgement overwriting local state.
  const topic = topics.find(item => item.id === selectedId) || topics[0];
  const selectedQuestions = questions.filter(question => question.topicId === topic.id);
  function select(id) {
    if (!router.isReady || !topics.some(item => item.id === id)) return;
    const query = { ...router.query, thema: id };
    const hash = (router.asPath || "").split("#")[1];
    router.replace({ pathname: router.pathname, query, ...(hash ? { hash } : {}) }, undefined, { shallow: true, scroll: false }).catch(() => {});
  }
  return <LearningToolLayout title="Wissen fürs Revier" description="Forschung verstehen und mit abwechslungsreichen Praxisfragen anwenden – auch nach der Jägerprüfung." category="jagdpraxis" eyebrow="Weiterdenken nach der Jägerprüfung" icon="binoculars" compact className={styles.page}>
    <PageMenu title="Wissen fürs Revier – Thema wählen"><section className={styles.selector} aria-label="Praxisthema auswählen"><div className={styles.overviewLine}><span>{topics.length} Themen für dein Revier</span><span>{questions.length} Fragen mit Erklärungen</span></div><label className={shared.field}>Dein Thema<select value={topic.id} onChange={event => select(event.target.value)}>{topics.map(item => <option key={item.id} value={item.id}>{item.id === "wildkameras" ? "Wildkameras richtig auswerten" : item.id === "wild-und-stoerung" ? "Wild, Störungen und Tageszeit" : "Rehwild, Frühling und Setzzeit"}</option>)}</select></label></section></PageMenu>
    <ResearchDossier key={topic.id} topic={topic} photo={photos[topic.photoKey]} />
    <div id="revierwissen-fragen"><QuizLeagueEntry practice /><ResearchQuestionRound key={`questions-${topic.id}`} questions={selectedQuestions} sources={topic.sources} /></div>
    <p className={styles.continue}>Weitere aktuelle Veröffentlichungen findest du unter <Link href="/news">Wissen im Blick</Link>. Dort stehen Veröffentlichungsdatum und Abrufstand; diese vertieften Dossiers haben einen eigenen Prüfstand.</p>
    <details className={shared.sources}><summary>Passendes Wissen vertiefen</summary><ul>{topic.related.map(link => <li key={link.href}><Link href={link.href}>{link.title}</Link></li>)}</ul></details>
    <ResearchSources topic={topic} photo={photos[topic.photoKey]} />
  </LearningToolLayout>;
}
