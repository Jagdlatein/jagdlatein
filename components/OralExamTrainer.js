import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import { oralExamQuestions, getOralExamSummary } from "../lib/oral-exam-trainer";
import { getLearningCategory } from "../lib/learning-categories";
import styles from "../styles/LearningExperience.module.css";

export default function OralExamTrainer() {
  const [category, setCategory] = useState("all");
  const [reviewIds, setReviewIds] = useState(null);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [finished, setFinished] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [speechNotice, setSpeechNotice] = useState("");
  const generation = useRef(0);
  const advance = useRef(null);
  const active = useRef(null);
  const speechGeneration = useRef(0);
  const questions = reviewIds ? reviewIds.map(id => oralExamQuestions.find(item => item.id === id)) : oralExamQuestions.filter(item => category === "all" || item.categorySlug === category);
  const item = questions[Math.min(index, questions.length - 1)];
  const response = responses[item.id] || { answer: "", spoken: false, revealed: false, criteria: [], rating: "" };
  const token = generation.current;
  active.current = item.id;
  const summary = getOralExamSummary(questions, responses);
  const categories = [...new Set(oralExamQuestions.map(entry => entry.categorySlug))];
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eintrag"); const selected = oralExamQuestions.findIndex(entry => entry.id === id); if (selected >= 0) setIndex(selected);
    setCanSpeak("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => { speechGeneration.current++; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  useEffect(() => { speechGeneration.current++; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeechNotice(""); }, [item.id]);
  function change(patch) { if (generation.current !== token || active.current !== item.id) return; setResponses(previous => ({ ...previous, [item.id]: { answer: "", spoken: false, revealed: false, criteria: [], rating: "", ...previous[item.id], ...patch } })); }
  function move(nextIndex) { generation.current++; advance.current = null; setIndex(nextIndex); setFinished(false); }
  function next() { if (!response.rating || generation.current !== token || active.current !== item.id || advance.current === item.id) return; advance.current = item.id; generation.current++; if (index + 1 === questions.length) setFinished(true); else setIndex(index + 1); }
  function readPrompt() {
    if (!canSpeak || generation.current !== token || active.current !== item.id) return;
    const voice = window.speechSynthesis.getVoices().find(entry => entry.localService && entry.lang.toLowerCase().startsWith("de"));
    if (!voice) { setSpeechNotice("Keine lokale deutsche Gerätestimme verfügbar. Die Frage steht vollständig als Text bereit."); return; }
    try { window.speechSynthesis.cancel(); const current = ++speechGeneration.current; const utterance = new window.SpeechSynthesisUtterance(item.prompt); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.95; utterance.onerror = () => { if (speechGeneration.current === current) setSpeechNotice("Vorlesen ist gerade nicht verfügbar. Nutze den Text der Frage."); }; window.speechSynthesis.speak(utterance); setSpeechNotice("Die Frage wird mit einer lokalen Gerätestimme vorgelesen."); }
    catch { setSpeechNotice("Vorlesen ist hier nicht verfügbar. Nutze den Text der Frage."); }
  }
  return <LearningToolLayout title="Prüfungsgespräch üben" description="Wissen in eigenen Worten erklären, mit Musterantworten vergleichen und konkrete Lernlücken erkennen." icon="book" category="pruefung-sprache" stats={[{ value: oralExamQuestions.length, label: "offene Fragen" }, { value: categories.length, label: "Themenbereiche" }, { value: "4", label: "Kriterien pro Antwort" }]}>
    <p className={styles.note}>Eigene Übungsfragen mit Selbsteinschätzung, kein amtlicher Fragenkatalog. Deine Antworttexte bleiben nur in dieser geöffneten Seite und werden nicht hochgeladen. Vorlesen nutzt, soweit verfügbar, eine lokale Gerätestimme; es ist keine menschliche Originalaufnahme.</p>
    <div className={styles.grid}><label className={styles.field}>Themenbereich<select value={category} onChange={event => { generation.current++; advance.current = null; setCategory(event.target.value); setReviewIds(null); setIndex(0); setFinished(false); }}><option value="all">Alle Themen</option>{categories.map(slug => <option key={slug} value={slug}>{getLearningCategory(slug).title}</option>)}</select></label>{!finished && <label className={styles.field}>Frage wählen<select value={item.id} onChange={event => move(questions.findIndex(entry => entry.id === event.target.value))}>{questions.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>}</div>
    {finished ? <section className={styles.panel} aria-live="polite"><h2>Deine Gesprächsrunde</h2><p>{summary.practiced} Fragen verglichen; {summary.secure} davon selbst als sicher eingeschätzt. Diese Einschätzung ersetzt keine Prüfung durch eine ausbildende Person.</p><div className={styles.actions}>{summary.repeatIds.length > 0 && <button type="button" className={styles.primary} onClick={() => { generation.current++; advance.current = null; setReviewIds(summary.repeatIds); setResponses(previous => { const nextResponses = { ...previous }; summary.repeatIds.forEach(id => { nextResponses[id] = { answer: "", spoken: false, revealed: false, criteria: [], rating: "" }; }); return nextResponses; }); setIndex(0); setFinished(false); }}>Offene Fragen erneut erklären</button>}<button type="button" className={styles.secondary} onClick={() => { generation.current++; advance.current = null; setResponses({}); setReviewIds(null); setIndex(0); setFinished(false); }}>Neue Runde beginnen</button></div></section> : <section className={styles.panel} aria-labelledby="exam-question-title"><p className={styles.muted}>{getLearningCategory(item.categorySlug).title} · Frage {index + 1} von {questions.length}{reviewIds && " · Wiederholung"}</p><h2 id="exam-question-title">{item.title}</h2><p>{item.prompt}</p>{canSpeak && <div className={styles.actions}><button className={styles.secondary} type="button" onClick={readPrompt}>Frage vorlesen</button><button type="button" className={styles.secondary} onClick={() => { speechGeneration.current++; window.speechSynthesis.cancel(); setSpeechNotice("Vorlesen beendet."); }}>Vorlesen stoppen</button></div>}{speechNotice && <p role="status" className={styles.muted}>{speechNotice}</p>}
      <label className={styles.field}>Deine Antwort in eigenen Worten<textarea maxLength={4000} value={response.answer} onChange={event => change({ answer: event.target.value, rating: "" })} placeholder="Sachverhalt, Begründung, offene Voraussetzungen und nächster Schritt." /></label><label><input type="checkbox" checked={response.spoken} onChange={event => change({ spoken: event.target.checked })} /> Ich habe meine Antwort selbst laut erklärt.</label><div className={styles.actions}><button type="button" className={styles.primary} disabled={!response.answer.trim() && !response.spoken} onClick={() => change({ revealed: true })}>Mit der Musterantwort vergleichen</button></div>
      {response.revealed && <><div className={styles.feedback}><h3>Eine mögliche strukturierte Antwort</h3><p>{item.model}</p><p><strong>Typischer Denkfehler:</strong> {item.mistake}</p><p><strong>Nachfrage:</strong> {item.followUp}</p></div><h3>Was war in deiner Antwort enthalten?</h3><p className={styles.muted}>Hake nur Punkte ab, die du selbst erklärt hast. Die App bewertet deinen Text nicht automatisch.</p><div className={styles.choices}>{item.criteria.map((criterion, position) => <label className={styles.choice} key={criterion}><input type="checkbox" checked={response.criteria.includes(position)} onChange={event => change({ criteria: event.target.checked ? [...new Set([...response.criteria, position])] : response.criteria.filter(value => value !== position), rating: "" })} />{criterion}</label>)}</div><p>{response.criteria.length} von {item.criteria.length} Punkten selbst wiedergegeben.</p><h3>Wie sicher war deine eigene Erklärung?</h3><div className={styles.modeButtons}>{[["offen", "Noch offene Lücken"], ["teilweise", "Teilweise sicher"], ["sicher", "Sicher erklärt"]].map(([value, label]) => <button key={value} type="button" aria-pressed={response.rating === value} className={response.rating === value ? styles.primary : styles.secondary} onClick={() => change({ rating: value })}>{label}</button>)}</div><Link className={styles.secondary} href={`/kurse/${item.course}`}>Im passenden Kurs vertiefen</Link><details className={styles.sources}><summary>Fachquellen · geprüft am 04.10.2026</summary><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details><div className={styles.actions}><button type="button" className={styles.primary} disabled={!response.rating} onClick={next}>{index + 1 === questions.length ? "Runde auswerten" : "Nächste Frage"}</button></div></>}
    </section>}
  </LearningToolLayout>;
}
