import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import DigestiveLearning from "./DigestiveLearning";
import { digestiveTopics } from "../lib/digestive-learning";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu } from "./PageMenu";
import { anatomyModels, anatomyQuestions, anatomySources } from "../lib/anatomy-explorer";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

export default function AnatomyExplorer() {
  const router = useRouter();
  const [section, setSection] = useState("museum");
  const [digestiveId, setDigestiveId] = useState("wiederkaeuer-verdauung");
  const [modelId, setModelId] = useState(anatomyModels[0].id);
  const [featureId, setFeatureId] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [orbit, setOrbit] = useState("45deg 75deg 110%");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const contentTarget = useRef(null);
  const focusedRevision = useRef(0);
  const viewer = useRef(null);
  const generation = useRef(0);
  const answered = useRef(new Set());
  const activeQuestion = useRef(0);
  const activeModel = useRef(anatomyModels[0].id);
  const activeSection = useRef("museum");
  const renderGeneration = generation.current;
  const model = anatomyModels.find(item => item.id === modelId);
  // The original question catalog explicitly names its corresponding model.
  // Do not infer anatomical associations from wording or a similar structure.
  const questions = anatomyQuestions.filter(item => item.modelId === modelId);
  const question = questions[questionIndex];
  const selected = question ? answers[question.id] : undefined;
  const answeredCount = questions.filter(item => answers[item.id] !== undefined).length;
  const correct = questions.filter(item => answers[item.id] === item.answer).length;
  const feature = model.features.find(item => item.id === featureId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("eintrag");
    if (anatomyModels.some(item => item.id === id)) chooseModel(id);
    if (params.get("bereich") === "verdauung") {
      chooseDigestive(digestiveTopics.find(item => item.id === params.get("thema"))?.id || digestiveTopics[0].id);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.bereich === "verdauung") {
      chooseDigestive(digestiveTopics.find(item => item.id === router.query.thema)?.id || digestiveTopics[0].id);
    } else {
      setSection("museum");
      chooseModel(anatomyModels.find(item => item.id === router.query.eintrag)?.id || anatomyModels[0].id);
    }
  }, [router.isReady, router.query.bereich, router.query.thema, router.query.eintrag]);

  function selectEntry(id) {
    const digestive = digestiveTopics.some(item => item.id === id);
    if (!digestive && !anatomyModels.some(item => item.id === id)) return;
    if (digestive) chooseDigestive(id); else chooseModel(id);
    closePageMenu();
    setSelectionRevision(value => value + 1);
    if (router.isReady) {
      const { bereich, thema, eintrag, ...query } = router.query;
      router.replace({ pathname: router.pathname, query: { ...query, ...(digestive ? { bereich: "verdauung", thema: id } : { eintrag: id }) } }, undefined, { shallow: true, scroll: false }).catch(() => {});
    }
  }

  useEffect(() => {
    if (selectionRevision === focusedRevision.current || !contentTarget.current) return;
    focusedRevision.current = selectionRevision;
    contentTarget.current.focus({ preventScroll: true });
    contentTarget.current.scrollIntoView({ block: "start", behavior: "auto" });
  }, [selectionRevision, section, modelId, digestiveId]);

  useEffect(() => {
    if (section !== "museum" || !enabled || !scriptReady || !viewer.current) return undefined;
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
  }, [section, enabled, scriptReady, modelId]);

  function chooseModel(id) {
    if (!anatomyModels.some(item => item.id === id)) return;
    if (activeModel.current !== id || activeSection.current !== "museum") resetQuiz();
    activeModel.current = id; activeSection.current = "museum"; setSection("museum");
    setModelId(id); setFeatureId(null); setOrbit("45deg 75deg 110%");
    if (enabled) setStatus("loading");
  }
  function chooseDigestive(id) {
    if (activeSection.current !== "verdauung") resetQuiz();
    activeSection.current = "verdauung"; setSection("verdauung"); setDigestiveId(id);
  }
  function resetQuiz() {
    generation.current += 1; answered.current.clear(); activeQuestion.current = 0;
    setAnswers({}); setQuestionIndex(0); setQuizOpen(false);
  }
  function answer(index) {
    if (!quizOpen || !question || activeSection.current !== "museum" || activeModel.current !== modelId || generation.current !== renderGeneration || activeQuestion.current !== questionIndex || answered.current.has(question.id) || !Number.isInteger(index) || index < 0 || index >= question.choices.length) return;
    answered.current.add(question.id); setAnswers(current => ({ ...current, [question.id]: index }));
  }
  function rotate(delta) {
    const current = viewer.current?.getCameraOrbit?.();
    if (current) setOrbit(`${current.theta * 180 / Math.PI + delta}deg ${current.phi * 180 / Math.PI}deg ${current.radius}m`);
  }
  function changeQuestion(delta) {
    if (!quizOpen || !question || activeSection.current !== "museum" || activeModel.current !== modelId || generation.current !== renderGeneration || activeQuestion.current !== questionIndex || (delta > 0 && !answered.current.has(question.id))) return;
    const next = questionIndex + delta;
    if (next < 0 || next >= questions.length) return;
    activeQuestion.current = next; setQuestionIndex(next);
  }

  return <LearningToolLayout title="Wildkörper verstehen" description="Körperbau und Verdauung an echten Präparatfotos und Museumsscans vergleichen." icon="cube" category="wildkunde" compact>
    <PageMenu title="Körperbau – Thema wählen">
      <label className={styles.field}>Körperbau erkunden<select value={section === "verdauung" ? digestiveId : modelId} onChange={event => selectEntry(event.target.value)}><optgroup label="Verdauung verstehen">{digestiveTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup><optgroup label="Museumsscans drehen">{anatomyModels.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup></select></label>
    </PageMenu>
    <div ref={contentTarget} tabIndex={-1} aria-label={section === "verdauung" ? digestiveTopics.find(item => item.id === digestiveId)?.title : model.title}>
    {section === "verdauung" ? <DigestiveLearning key={digestiveId} selectedId={digestiveId} onSelect={selectEntry} hideSelector /> : <>
    <section className={styles.note}><strong>Ein klar benanntes Vergleichsbeispiel</strong><p>Alle Modelle zeigen Abgüsse des <strong>nordamerikanischen Weißwedelhirsches (Odocoileus virginianus)</strong> aus der Smithsonian-Lehrsammlung EO404749. Sie stellen kein Reh oder Rotwild dar. Schädel und Vorderlauf können aus verschiedenen Exemplaren stammen und sind nicht maßstabsgleich. Keine KI-Modelle.</p></section>
    <section className={styles.panel} aria-labelledby="anatomie-modell">
      <h2 id="anatomie-modell">Das Modell erkunden</h2>
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
    {questions.length > 0 && <details key={model.id} className={styles.sources} open={quizOpen} onToggle={event => { if (generation.current !== renderGeneration || activeSection.current !== "museum" || activeModel.current !== modelId) return; if (!event.currentTarget.open) generation.current += 1; setQuizOpen(event.currentTarget.open); }}>
      <summary>Wissen zum Modell „{model.title}“ prüfen</summary>
      {quizOpen && question && <section className={styles.panel} aria-labelledby="anatomie-fragen"><h2 id="anatomie-fragen">Wissen zum {model.title}</h2><p>Frage {questionIndex + 1} von {questions.length} · {answeredCount} beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={questions.length} aria-label="Beantwortete Fragen zum gewählten Modell" /><h3>{question.question}</h3><div className={styles.choices}>{question.choices.map((choice, index) => <button key={choice} type="button" disabled={selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === question.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => answer(index)}>{choice}</button>)}</div>
        {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig." : `Die richtige Antwort ist: ${question.choices[question.answer]}.`}</strong><p>{question.explanation}</p></div>}
        <div className={styles.actions}><button className={styles.secondary} type="button" disabled={questionIndex === 0} onClick={() => changeQuestion(-1)}>Vorige Frage</button><button className={styles.primary} type="button" disabled={selected === undefined || questionIndex === questions.length - 1} onClick={() => changeQuestion(1)}>Nächste Frage</button>{answeredCount === questions.length && <button className={styles.secondary} type="button" onClick={() => { if (generation.current !== renderGeneration || activeModel.current !== modelId) return; generation.current += 1; answered.current.clear(); activeQuestion.current = 0; setAnswers({}); setQuestionIndex(0); }}>Diese Fragen wiederholen</button>}</div>
        {answeredCount === questions.length && <p className={styles.note} role="status">Runde abgeschlossen: {correct} von {questions.length} richtig. Du kannst jede Erklärung wieder aufrufen.</p>}
      </section>}
    </details>}
    <details className={styles.sources}><summary>Fachliche Quellen und Modellnachweise</summary><ul>{anatomySources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Fachlich geprüft am 4. Oktober 2026. Anatomische Grundstrukturen werden erläutert; keine Altersbestimmung, medizinische Diagnose oder Übertragung exakter Größen auf heimische Wildarten.</p><p>3D-Anzeige: Google model-viewer 4.1.0, lokal bereitgestellt. <a href="/lernen/anatomie/MODEL-VIEWER-LICENSE.txt">Paketlizenz</a> · <a href="/lernen/anatomie/MODEL-VIEWER-NOTICES.txt">Weitere Lizenzhinweise</a></p></details>
    </>}
    </div>
  </LearningToolLayout>;
}
