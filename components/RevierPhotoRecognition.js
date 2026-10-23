import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPhotoRecognitionRequestId } from "../lib/revier-photo-request-id";
import styles from "../styles/RevierPhotoHelper.module.css";

const ENDPOINT = "/api/fotohelfer/recognize";
const REQUEST_TIMEOUT = 55000;
const LOGIN = "/login?next=%2Ffotohelfer";
const PRICES = "/preise?next=%2Ffotohelfer";

export function RecognitionReport({ result }) {
  return <article className={styles.recognitionReport} aria-labelledby="photo-recognition-title">
    <p className={styles.kicker}>Dein Foto · Kurzbericht</p>
    <h3 id="photo-recognition-title">{result.title}</h3>
    <p>{result.answer}</p>
    {result.category && <p className={styles.categorySuggestion}>Passender Lernbereich: <Link href={result.category.href}>{result.category.title}</Link></p>}
    {result.candidate && result.candidate.href !== result.category?.href && <Link className={styles.learningLink} href={result.candidate.href}>Zum Artikel: {result.candidate.title} →</Link>}
    {result.alternatives?.length > 0 && <p>Zum Vergleichen: {result.alternatives.map((item, index) => <span key={item.id}>{index > 0 ? " · " : ""}<Link href={item.href}>{item.title}</Link></span>)}</p>}
    {result.observations?.length > 0 && <details className={styles.sources}><summary>Woran das Bildmodell den Vorschlag festmacht</summary><p>{result.observationsLabel}</p><ul>{result.observations.map(text => <li key={text}>{text}</li>)}</ul></details>}
    {result.comparison?.sources?.length > 0 && <details className={styles.sources}><summary>Fachquellen zum Lernwissen</summary><p>Die Quellen belegen den Wissenstext zum Vorschlag. Die KI-Bestimmung des Fotos ist damit nicht bestätigt.</p><ul>{result.comparison.sources.map(item => <li key={item.id}><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></li>)}</ul></details>}
    <p className={styles.limit}>{result.notice}</p>
    <p className={styles.small}>Ein Bildvorschlag wird nicht automatisch als eigene Einordnung im Tagebuch gespeichert.</p>
  </article>;
}

export default function RevierPhotoRecognition({ photo }) {
  const [view, setView] = useState({ photo: null, phase: "checking" });
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const generation = useRef(0), active = useRef(null), working = useRef(false);
  const current = view.photo === photo ? view : { photo, phase: "checking" };
  useEffect(() => {
    const request = ++generation.current;
    working.current = false;
    const controller = new AbortController();
    active.current?.abort(); active.current = controller;
    setView({ photo, phase: "checking" });
    const timer = setTimeout(() => controller.abort(), 10000);
    (async () => {
      try {
        const response = await fetch(ENDPOINT, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) throw new Error("aborted");
        if (request !== generation.current) return;
        if (response.status === 401) setView({ photo, phase: "login" });
        else if (response.status === 403) setView({ photo, phase: "subscription" });
        else if (response.ok && data.available === true && data.configured === true) setView({ photo, phase: "ready", dailyLimit: data.dailyLimit });
        else setView({ photo, phase: "unavailable" });
      } catch {
        if (request === generation.current) setView({ photo, phase: "unavailable" });
      } finally { clearTimeout(timer); }
    })();
    return () => { generation.current++; clearTimeout(timer); controller.abort(); active.current?.abort(); };
  }, [photo, availabilityAttempt]);

  async function recognize() {
    if (working.current || current.phase === "working" || !["ready", "error"].includes(current.phase)) return;
    working.current = true;
    const request = ++generation.current;
    const controller = new AbortController();
    active.current?.abort(); active.current = controller;
    setView({ photo, phase: "working", dailyLimit: current.dailyLimit });
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const requestId = createPhotoRecognitionRequestId();
      const response = await fetch(ENDPOINT, {
        method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
        headers: { "Content-Type": "image/jpeg", "X-Jagdlatein-Photo-Consent": "openai-v1", "X-Jagdlatein-Photo-Request-Id": requestId },
        body: photo,
      });
      const data = await response.json();
      if (controller.signal.aborted) throw new Error("aborted");
      if (request !== generation.current) return;
      if (response.ok && data.ok === true && data.result && ["suggestion", "uncertain", "unknown"].includes(data.result.status)) {
        setView({ photo, phase: "done", result: data.result });
      } else if (response.status === 401) setView({ photo, phase: "login" });
      else if (response.status === 403) setView({ photo, phase: "subscription" });
      else setView({ photo, phase: response.status === 429 ? "limited" : "error", dailyLimit: current.dailyLimit,
        message: response.status === 429 ? "Das Erkennungslimit ist erreicht. Bitte versuche es später erneut. Die Merkmalsvergleiche bleiben verfügbar."
          : "Das Foto konnte gerade nicht ausgewertet werden. Bitte versuche es erneut oder nutze den Merkmalsvergleich." });
    } catch (error) {
      if (request === generation.current) setView({ photo, phase: "error", dailyLimit: current.dailyLimit,
        message: controller.signal.aborted ? "Die Erkennung dauert zu lange. Bitte versuche es erneut; die bisherigen Vergleiche bleiben verfügbar."
          : error?.code === "photo_secure_random_unavailable" ? "Dein Browser kann keine sichere Foto-Anfrage erstellen. Bitte aktualisiere deinen Browser oder dein Gerät. Die Merkmalsvergleiche bleiben verfügbar."
          : "Die Bilderkennung ist gerade nicht erreichbar. Prüfe deine Verbindung und versuche es erneut." });
    } finally { clearTimeout(timer); if (request === generation.current) working.current = false; }
  }

  return <section className={styles.recognition} aria-labelledby="photo-recognition-heading" aria-busy={current.phase === "working" || current.phase === "checking"}>
    <h2 id="photo-recognition-heading">Foto erkennen und Wissen finden</h2>
    {current.phase === "checking" && <p role="status">Bilderkennung wird vorbereitet …</p>}
    {current.phase === "login" && <p>Dein Foto ist bereit. <Link className={styles.learningLink} href={LOGIN}>Für die Bilderkennung anmelden →</Link><br />Die Merkmalsvergleiche unten funktionieren auch ohne Anmeldung.</p>}
    {current.phase === "subscription" && <p>Die automatische Bilderkennung gehört zum aktiven Jagdlatein-Zugang. <Link href={PRICES}>Zugang ansehen</Link>. Die manuellen Vergleiche bleiben verfügbar.</p>}
    {current.phase === "unavailable" && <><p role="status">Die automatische Bilderkennung ist gerade nicht verfügbar. Dein Foto ist vorbereitet; die Merkmalsvergleiche unten bleiben verfügbar.</p><button type="button" className={styles.textButton} onClick={() => setAvailabilityAttempt(value => value + 1)}>Verfügbarkeit erneut prüfen</button></>}
    {["ready", "error"].includes(current.phase) && <>
      <p>Das Bildmodell schlägt ein Motiv und den passenden Lernbereich vor. Der Wissenstext dazu stammt aus den vorhandenen Lerninhalten.</p>
      <p className={styles.small}>Mit „Mit OpenAI erkennen“ sendest du die verkleinerte Fotokopie über Jagdlatein an OpenAI. Ursprüngliche Aufnahme- und Standort-Metadaten werden entfernt. OpenAI kann Inhalte zur Missbrauchskontrolle bis zu 30 Tage aufbewahren; besondere Ausnahmen stehen im <Link href="/datenschutz">Datenschutz</Link>. Vermeide Fotos mit Personen oder privaten Dokumenten.</p>
      <button type="button" className={styles.primary} onClick={recognize}>Mit OpenAI erkennen</button>
      {Number.isInteger(current.dailyLimit) && <p className={styles.small}>Bis zu {current.dailyLimit} Erkennungsversuche pro Tag und Konto. Ein zusätzliches Gesamtlimit schützt vor unerwarteten Kosten.</p>}
    </>}
    {current.phase === "working" && <div className={styles.recognitionProgress} role="status"><span aria-hidden="true" className={styles.recognitionSpinner} /><p>Dein Foto wird ausgewertet. Der Vorschlag und das passende Wissen erscheinen gleich hier …</p></div>}
    {current.message && <p role="alert" className={styles.error}>{current.message}</p>}
    {current.phase === "done" && <div role="status"><RecognitionReport result={current.result} /></div>}
  </section>;
}
