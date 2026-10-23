import Link from "next/link";
import { useEffect, useState } from "react";
import LessonDiagram from "./LessonDiagram";
import LessonEvidence from "./LessonEvidence";
import styles from "../styles/WildlifePortrait.module.css";

export default function WildlifeStudyContent({ slug, target }) {
  const key = `${slug}:${target.moduleId}`;
  const [result, setResult] = useState({ key: "", content: null, error: "", status: 0 });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 18000);
    setResult({ key, content: null, error: "", status: 0 });
    fetch(`/api/lernen/artenwissen?${new URLSearchParams({ art: slug, kurs: target.moduleId })}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async response => {
        const content = await response.json();
        if (!response.ok) throw Object.assign(new Error(content.message || "Das Wissen konnte nicht geladen werden."), { status: response.status });
        if (content.species !== slug || content.moduleId !== target.moduleId || !Array.isArray(content.lessons)) throw new Error("Die Antwort gehört nicht zu dieser Art und diesem Thema.");
        if (!controller.signal.aborted) setResult({ key, content, error: "", status: 200 });
      }).catch(error => {
        if (!controller.signal.aborted || timedOut) setResult({ key, content: null, status: error.status || 503,
          error: timedOut ? "Das Laden dauert zu lange. Bitte erneut versuchen." : ["SyntaxError", "TypeError"].includes(error.name) ? "Das Wissen ist gerade nicht erreichbar. Prüfe deine Verbindung und lade erneut." : error.message });
      }).finally(() => clearTimeout(timer));
    return () => { controller.abort(); clearTimeout(timer); };
  }, [key, retry]);
  const active = result.key === key ? result : { content: null, error: "", status: 0 };
  const content = active.content;
  const returnPath = `/wildkunde/${slug}#art-lerntext-${target.moduleId}`;
  return <section className={styles.depth}>
    <h2>{target.title}</h2>
    {!content && !active.error && <p role="status">Wissenstext wird geladen …</p>}
    {active.error && <div role="alert"><p>{active.error}</p>{active.status === 401 ? <Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Erneut anmelden</Link> : active.status === 403 ? <Link href="/konto">Zugang im Konto prüfen</Link> : <button type="button" onClick={() => setRetry(value => value + 1)}>Erneut laden</button>}</div>}
    {content && <>
      {content.modelNote && <p>{content.modelNote}</p>}
      {content.scope === "foundation" && <p>Biologische Grundlage zur Einordnung dieser Art.</p>}
      {content.lessons.map(lesson => <section key={lesson.id} id={`species-lesson-${lesson.id}`}>
        <h3>{lesson.title}</h3>
        {lesson.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <LessonDiagram diagram={lesson.diagram} />
        {lesson.takeaway && <p><strong>Merke dir:</strong> {lesson.takeaway}</p>}
        {lesson.exercise && <p><strong>Zum Nachdenken:</strong> {lesson.exercise}</p>}
      </section>)}
      {content.scopeNotes?.length > 0 && <aside><h3>Einordnung dieses Wissens</h3><ul>{content.scopeNotes.map(note => <li key={note}>{note}</li>)}</ul></aside>}
      <details className={styles.depthSources}><summary>Ergänzende Fachquellen und Prüfstand</summary>
        {content.reviewedOn && <p>Prüfstand der Ausgangslektion: {content.reviewedOn}.</p>}
        {content.lessons.map(lesson => <LessonEvidence key={lesson.id} lesson={lesson} reviewedOn={content.reviewedOn} embedded />)}
        <ul>{content.sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.label || source.url}</a></li>)}</ul>
      </details>
    </>}
  </section>;
}
