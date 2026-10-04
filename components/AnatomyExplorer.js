import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import LearningToolLayout from "./LearningToolLayout";
import { anatomyModels, anatomyQuestions, anatomySources } from "../lib/anatomy-explorer";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

export default function AnatomyExplorer() {
  const [modelId, setModelId] = useState(anatomyModels[0].id);
  const [featureId, setFeatureId] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [orbit, setOrbit] = useState("45deg 75deg 110%");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const viewer = useRef(null);
  const generation = useRef(0);
  const answered = useRef(new Set());
  const activeQuestion = useRef(0);
  const renderGeneration = generation.current;
  const model = anatomyModels.find(item => item.id === modelId);
  const question = anatomyQuestions[questionIndex];
  const selected = answers[question.id];
  const answeredCount = Object.keys(answers).length;
  const correct = anatomyQuestions.filter(item => answers[item.id] === item.answer).length;
  const feature = model.features.find(item => item.id === featureId);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eintrag");
    if (anatomyModels.some(item => item.id === id)) chooseModel(id);
  }, []);

  useEffect(() => {
    if (!enabled || !scriptReady || !viewer.current) return undefined;
    const element = viewer.current;
    let live = true;
    const loaded = async () => {
      try {
        await element.updateFraming?.();
        if (!live) return;
        element.cameraOrbit = "45deg 75deg 110%";
        await element.updateComplete;
        if (live) { element.jumpCameraToGoal?.(); setStatus("loaded"); }
      } catch { if (live) setStatus("error"); }
    };
    const failed = () => { if (live) setStatus("error"); };
    element.addEventListener("load", loaded);
    element.addEventListener("error", failed);
    if (element.loaded) loaded();
    return () => { live = false; element.removeEventListener("load", loaded); element.removeEventListener("error", failed); };
  }, [enabled, scriptReady, modelId]);

  function chooseModel(id) {
    if (!anatomyModels.some(item => item.id === id)) return;
    setModelId(id); setFeatureId(null); setOrbit("45deg 75deg 110%");
    if (enabled) setStatus("loading");
  }
  function answer(index) {
    if (generation.current !== renderGeneration || activeQuestion.current !== questionIndex || answered.current.has(question.id) || !Number.isInteger(index) || index < 0 || index >= question.choices.length) return;
    answered.current.add(question.id); setAnswers(current => ({ ...current, [question.id]: index }));
  }
  function rotate(delta) {
    const current = viewer.current?.getCameraOrbit?.();
    if (current) setOrbit(`${current.theta * 180 / Math.PI + delta}deg ${current.phi * 180 / Math.PI}deg ${current.radius}m`);
  }
  function changeQuestion(delta) {
    if (generation.current !== renderGeneration || activeQuestion.current !== questionIndex || (delta > 0 && !answered.current.has(question.id))) return;
    const next = questionIndex + delta;
    if (next < 0 || next >= anatomyQuestions.length) return;
    activeQuestion.current = next; setQuestionIndex(next);
  }

  return <LearningToolLayout title="Anatomie zum Drehen" description="Echte Museumsscans untersuchen: Schädel, Unterkiefer und Vorderlauf drehen, Strukturen vergleichen und die Grenzen eines Modells verstehen." icon="cube" category="wildkunde" stats={[{ value: 3, label: "Museumsscans" }, { value: 9, label: "Strukturen" }, { value: 6, label: "Übungsfragen" }]}>
    <section className={styles.note}><strong>Ein klar benanntes Vergleichsbeispiel</strong><p>Alle Modelle zeigen Abgüsse des <strong>nordamerikanischen Weißwedelhirsches (Odocoileus virginianus)</strong> aus der Smithsonian-Lehrsammlung EO404749. Sie stellen kein Reh oder Rotwild dar. Schädel und Vorderlauf können aus verschiedenen Exemplaren stammen und sind nicht maßstabsgleich. Keine KI-Modelle.</p></section>
    <section className={styles.panel} aria-labelledby="anatomie-modell">
      <h2 id="anatomie-modell">Das Modell erkunden</h2>
      <div className={styles.modeButtons}>{anatomyModels.map(item => <button key={item.id} type="button" aria-pressed={item.id === modelId} onClick={() => chooseModel(item.id)}>{item.title}</button>)}</div>
      <h3>{model.title}</h3><p>{model.description}</p>
      {!enabled ? <div className={styles.empty}><p>Die drehbare Ansicht wird erst beim Öffnen geladen. Dieses Modell benötigt ungefähr {model.size}.</p><button className={styles.primary} type="button" onClick={() => { setEnabled(true); setStatus("loading"); }}>3D-Ansicht öffnen</button></div> : <>
        <Script src="/lernen/anatomie/model-viewer-4.1.0.min.js" type="module" strategy="afterInteractive" onLoad={() => setScriptReady(true)} onReady={() => setScriptReady(true)} onError={() => setStatus("error")} />
        {scriptReady && <model-viewer key={model.id} ref={viewer} src={model.src} alt={`${model.title} des Weißwedelhirsches, Smithsonian-Museumsscan eines Abgusses`} camera-controls="" disable-pan="" touch-action="pan-y" interaction-prompt="none" camera-orbit={orbit} orientation={model.orientation || "0deg 0deg 0deg"} min-camera-orbit="auto 0deg 50%" max-camera-orbit="auto 180deg 200%" shadow-intensity="0.5" exposure="1" className={mediaStyles.modelViewer} />}
        <p className={styles.muted} role="status">{status === "loading" ? "Das echte 3D-Modell lädt …" : status === "loaded" ? "Mit einem Finger ziehen zum Drehen; mit zwei Fingern oder dem Mausrad zoomen. Am fokussierten Modell drehen auch die Pfeiltasten." : status === "error" ? "Die 3D-Ansicht konnte nicht geladen werden. Die erklärten Strukturen und Fragen stehen unten weiterhin zur Verfügung." : ""}</p>
        {status === "error" && <button className={styles.secondary} type="button" onClick={() => { setEnabled(false); setStatus("idle"); }}>Laden erneut vorbereiten</button>}
        <div className={styles.actions}><button className={styles.secondary} type="button" disabled={status !== "loaded"} onClick={() => rotate(-30)}>Nach links drehen</button><button className={styles.secondary} type="button" disabled={status !== "loaded"} onClick={() => rotate(30)}>Nach rechts drehen</button><button className={styles.secondary} type="button" onClick={() => { setOrbit("45deg 75deg 110%"); setFeatureId(null); }}>Ansicht zurücksetzen</button></div>
      </>}
      <p className={styles.muted}>Scan: Smithsonian Institution · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a> · Unveränderte GLB-Datei · <a href={model.source} target="_blank" rel="noreferrer">Sammlung und Originalmodell</a></p>
      <div className={styles.gridThree}>{model.features.map(item => <button type="button" key={item.id} className={styles.choice} aria-pressed={item.id === featureId} onClick={() => { setFeatureId(item.id); setOrbit(item.orbit); }}>{item.title}</button>)}</div>
      {feature && <div className={styles.feedback} role="status"><h3>{feature.title}</h3><p>{feature.explanation}</p><p className={styles.muted}>Die Kamera zeigt eine Betrachtungsrichtung. Die Erklärung benennt die Struktur; sie ist keine automatische Messung.</p></div>}
    </section>
    <section className={styles.panel} aria-labelledby="anatomie-fragen"><h2 id="anatomie-fragen">Das Verständnis prüfen</h2><p>Frage {questionIndex + 1} von {anatomyQuestions.length} · {answeredCount} beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={anatomyQuestions.length} aria-label="Beantwortete Anatomiefragen" /><h3>{question.question}</h3><div className={styles.choices}>{question.choices.map((choice, index) => <button key={choice} type="button" disabled={selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === question.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => answer(index)}>{choice}</button>)}</div>
      {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig." : `Die richtige Antwort ist: ${question.choices[question.answer]}.`}</strong><p>{question.explanation}</p><button className={styles.secondary} type="button" onClick={() => chooseModel(question.modelId)}>Passendes Modell ansehen</button></div>}
      <div className={styles.actions}><button className={styles.secondary} type="button" disabled={questionIndex === 0} onClick={() => changeQuestion(-1)}>Vorige Frage</button><button className={styles.primary} type="button" disabled={selected === undefined || questionIndex === anatomyQuestions.length - 1} onClick={() => changeQuestion(1)}>Nächste Frage</button>{answeredCount === anatomyQuestions.length && <button className={styles.secondary} type="button" onClick={() => { generation.current += 1; answered.current.clear(); activeQuestion.current = 0; setAnswers({}); setQuestionIndex(0); }}>Alle Fragen wiederholen</button>}</div>
      {answeredCount === anatomyQuestions.length && <p className={styles.note} role="status">Runde abgeschlossen: {correct} von {anatomyQuestions.length} richtig. Du kannst jede Erklärung wieder aufrufen.</p>}
    </section>
    <details className={styles.sources}><summary>Fachliche Quellen und Modellnachweise</summary><ul>{anatomySources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Fachlich geprüft am 4. Oktober 2026. Anatomische Grundstrukturen werden erläutert; keine Altersbestimmung, medizinische Diagnose oder Übertragung exakter Größen auf heimische Wildarten.</p><p>3D-Anzeige: Google model-viewer 4.1.0, lokal bereitgestellt. <a href="/lernen/anatomie/MODEL-VIEWER-LICENSE.txt">Paketlizenz</a> · <a href="/lernen/anatomie/MODEL-VIEWER-NOTICES.txt">Weitere Lizenzhinweise</a></p></details>
  </LearningToolLayout>;
}
