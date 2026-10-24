import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import DigestiveLearning from "./DigestiveLearning";
import { digestiveTopics } from "../lib/digestive-learning";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { anatomyModels, anatomyQuestions, anatomySources } from "../lib/anatomy-explorer";
import styles from "../styles/LearningExperience.module.css";
import mediaStyles from "../styles/LearningMediaExperiences.module.css";

const defaultOrbit = "45deg 75deg 110%";
let scriptRequestSequence = 0;
function readSelection(query) {
  const { bereich, thema, eintrag } = query;
  if (bereich === "verdauung") {
    if (eintrag !== undefined) return null;
    const topic = thema === undefined ? digestiveTopics[0] : digestiveTopics.find(item => typeof thema === "string" && item.id === thema);
    return topic ? { section: "verdauung", id: topic.id, topic } : null;
  }
  if ((bereich !== undefined && bereich !== "museum") || thema !== undefined) return null;
  const model = eintrag === undefined ? anatomyModels[0] : anatomyModels.find(item => typeof eintrag === "string" && item.id === eintrag);
  return model ? { section: "museum", id: model.id, model } : null;
}
function newView(key, previous) {
  return { key, featureId: null, enabled: previous?.enabled || false, scriptReady: previous?.scriptReady || false,
    status: previous?.enabled ? "loading" : "idle", orbit: defaultOrbit, questionIndex: 0, answers: {}, quizOpen: false };
}

export default function AnatomyExplorer() {
  const router = useRouter();
  const ready = router.isReady === true;
  const selection = ready ? readSelection(router.query) : null;
  const section = selection?.section;
  const model = selection?.model;
  const modelId = model?.id;
  const digestiveId = section === "verdauung" ? selection.id : null;
  const selectionKey = selection ? section + ":" + selection.id : ready ? "invalid" : "unready";
  const [stored, setView] = useState(() => newView(selectionKey));
  const [navigationError, setNavigationError] = useState("");
  const mounted = useRef(false);
  const contentTarget = useRef(null);
  const quizTarget = useRef(null);
  const initialized = useRef(false);
  const focusedOrigin = useRef(null);
  const request = useRef(0);
  const pending = useRef(null);
  const viewKey = JSON.stringify([ready, router.asPath, router.query]);
  const currentOrigin = useRef({ key: viewKey });
  if (currentOrigin.current.key !== viewKey) currentOrigin.current = { key: viewKey };
  const origin = currentOrigin.current;
  const modelScope = useRef({ key: selectionKey });
  const viewer = useRef(null);
  const attemptRef = useRef({});
  const frameRequest = useRef(null);
  const camera = useRef(defaultOrbit);
  const generation = useRef(0);
  const answered = useRef(new Set());
  const activeQuestion = useRef(0);
  if (modelScope.current.key !== selectionKey) {
    modelScope.current = { key: selectionKey };
    attemptRef.current = {};
    frameRequest.current = null;
    camera.current = defaultOrbit;
    generation.current++;
    answered.current.clear();
    activeQuestion.current = 0;
  }
  const scope = modelScope.current;
  const attempt = attemptRef.current;
  // Only an actual committed model/section change replaces its local practice.
  const view = stored.key === selectionKey ? stored : newView(selectionKey, stored);
  if (stored.key !== selectionKey) setView(view);
  const { featureId, enabled, scriptReady, status, orbit, questionIndex, answers, quizOpen } = view;
  const scriptSource = useRef("/lernen/anatomie/model-viewer-4.1.0.min.js");
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const statusRef = useRef(status);
  statusRef.current = status;
  const renderGeneration = generation.current;
  // Keep the original catalog's explicit modelId association.
  const questions = model ? anatomyQuestions.filter(item => item.modelId === modelId) : [];
  const question = questions[questionIndex];
  const selected = question ? answers[question.id] : undefined;
  const answeredCount = questions.filter(item => answers[item.id] !== undefined).length;
  const correct = questions.filter(item => answers[item.id] === item.answer).length;
  const feature = model?.features.find(item => item.id === featureId);
  function canAct() { return mounted.current && ready && !!selection && currentOrigin.current === origin && modelScope.current === scope; }
  function canUseAttempt() { return canAct() && attemptRef.current === attempt; }
  function changeView(patch) {
    if (!canAct()) return;
    setView(previous => canAct() && previous.key === selectionKey ? { ...previous, ...patch } : previous);
  }
  function updateStatus(value) { if (canUseAttempt()) { statusRef.current = value; changeView({ status: value }); } }
  function focusContent() {
    const target = (router.asPath || "").split("#")[1] === "anatomie-fragen" && model ? quizTarget.current : contentTarget.current;
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; pending.current = null; frameRequest.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!selection) {
      const timer = setTimeout(() => { if (mounted.current && currentOrigin.current === origin) openPageMenu("anatomy-entry-select"); }, 0);
      return () => clearTimeout(timer);
    }
    if (focusedOrigin.current === origin) return;
    if (model && (router.asPath || "").split("#")[1] === "anatomie-fragen" && !quizOpen) { changeView({ quizOpen: true }); return; }
    const shouldFocus = initialized.current || ["bereich", "thema", "eintrag"].some(key => router.query[key] !== undefined) || (router.asPath || "").includes("#");
    initialized.current = true;
    focusedOrigin.current = origin;
    if (shouldFocus) { closePageMenu(); focusContent(); }
  }, [ready, origin, quizOpen]);

  async function selectEntry(id) {
    if (!mounted.current || !ready || currentOrigin.current !== origin) return;
    const digestive = digestiveTopics.some(item => item.id === id);
    if (!digestive && !anatomyModels.some(item => item.id === id)) return;
    setNavigationError("");
    if (selection?.id === id && pending.current === null) { closePageMenu(); focusContent(); return; }
    const ticket = ++request.current;
    pending.current = ticket;
    const { bereich, thema, eintrag, ...context } = router.query;
    try {
      const accepted = await router.push({ pathname: "/lernen/anatomie", query: { ...context, ...(digestive ? { bereich: "verdauung", thema: id } : { eintrag: id }) },
        hash: digestive ? "anatomie-verdauung" : "anatomie-modell" }, undefined, { shallow: true, scroll: false });
      if (accepted !== false && mounted.current && request.current === ticket && currentOrigin.current === origin && selection?.id === id) { closePageMenu(); focusContent(); }
    } catch (error) {
      if (error?.cancelled || !mounted.current || request.current !== ticket || currentOrigin.current !== origin) return;
      setNavigationError("Das Thema konnte nicht geöffnet werden. Bitte wähle es erneut."); openPageMenu("anatomy-entry-select");
    } finally { if (pending.current === ticket) pending.current = null; }
  }

  useEffect(() => {
    if (!model || !enabled || !scriptReady || !viewer.current) return undefined;
    const element = viewer.current;
    let live = true;
    const current = () => live && canUseAttempt() && enabledRef.current && viewer.current === element;
    const loaded = async () => {
      if (!current()) return;
      const ticket = {};
      frameRequest.current = ticket;
      try {
        await element.updateFraming?.();
        if (!current() || frameRequest.current !== ticket) return;
        // A structure chosen before or during loading owns its camera goal.
        element.cameraOrbit = camera.current;
        await element.updateComplete;
        if (!current() || frameRequest.current !== ticket) return;
        element.jumpCameraToGoal?.();
        updateStatus("loaded");
      } catch { if (current() && frameRequest.current === ticket) updateStatus("error"); }
    };
    const failed = () => { if (current()) { frameRequest.current = null; updateStatus("error"); } };
    element.addEventListener("load", loaded);
    element.addEventListener("error", failed);
    if (element.loaded && statusRef.current !== "loaded") loaded();
    return () => { live = false; element.removeEventListener("load", loaded); element.removeEventListener("error", failed); };
  }, [scope, origin, enabled, scriptReady, attempt]);

  function openViewer() {
    if (!canUseAttempt() || !model || enabledRef.current) return;
    enabledRef.current = true;
    statusRef.current = "loading";
    changeView({ enabled: true, status: "loading", scriptReady: !!window.customElements?.get("model-viewer") });
  }
  function retryViewer() {
    if (!canUseAttempt() || !model || !enabledRef.current || statusRef.current !== "error") return;
    attemptRef.current = {};
    frameRequest.current = null;
    enabledRef.current = false;
    statusRef.current = "idle";
    // Next caches a caught script failure. Only an explicit failed-module retry
    // needs a fresh URL; an already registered custom element must be reused.
    if (!scriptReady) scriptSource.current = "/lernen/anatomie/model-viewer-4.1.0.min.js?versuch=" + Date.now().toString(36) + "-" + (++scriptRequestSequence).toString(36);
    changeView({ enabled: false, status: "idle" });
  }
  function scriptLoaded() {
    if (!canUseAttempt() || !enabledRef.current || scriptReady) return;
    // A cached rejected Next promise can invoke onLoad without executing the
    // module. Check its actual registration before showing a custom element.
    if (!window.customElements?.get("model-viewer")) { updateStatus("error"); return; }
    changeView({ scriptReady: true });
  }
  function scriptFailed() { if (canUseAttempt() && enabledRef.current && !scriptReady) updateStatus("error"); }
  function changeCamera(value, featureValue = featureId) {
    if (!canUseAttempt() || !model) return;
    camera.current = value;
    if (enabledRef.current && viewer.current) viewer.current.cameraOrbit = value;
    changeView({ orbit: value, featureId: featureValue });
  }
  function rotate(delta) {
    if (!canUseAttempt() || !model || !enabledRef.current || statusRef.current !== "loaded") return;
    const current = viewer.current?.getCameraOrbit?.();
    if (current) changeCamera(`${current.theta * 180 / Math.PI + delta}deg ${current.phi * 180 / Math.PI}deg ${current.radius}m`);
  }
  function canUseQuestion() { return canAct() && !!model && generation.current === renderGeneration && activeQuestion.current === questionIndex; }
  function answer(index) {
    if (!canUseQuestion() || !quizOpen || !question || answered.current.has(question.id) || !Number.isInteger(index) || index < 0 || index >= question.choices.length) return;
    answered.current.add(question.id);
    setView(previous => canUseQuestion() ? { ...previous, answers: { ...previous.answers, [question.id]: index } } : previous);
  }
  function changeQuestion(delta) {
    if (!canUseQuestion() || !quizOpen || !question || (delta > 0 && !answered.current.has(question.id))) return;
    const next = questionIndex + delta;
    if (next < 0 || next >= questions.length) return;
    activeQuestion.current = next;
    changeView({ questionIndex: next });
  }
  function toggleQuiz(open) {
    if (!canUseQuestion()) return;
    if (!open) generation.current++;
    changeView({ quizOpen: open });
  }
  function repeatQuestions() {
    if (!canUseQuestion() || !quizOpen) return;
    generation.current++;
    answered.current.clear(); activeQuestion.current = 0;
    changeView({ answers: {}, questionIndex: 0 });
  }

  return <LearningToolLayout title="Wildkörper verstehen" description="Körperbau und Verdauung an echten Präparatfotos und Museumsscans vergleichen." icon="cube" category="wildkunde" headingOnly>
    <PageMenu title="Körperbau – Thema wählen" openInitially={ready && !selection} initialFocusId="anatomy-entry-select">
      <label className={styles.field}>Körperbau erkunden<select id="anatomy-entry-select" value={selection?.id || ""} disabled={!ready} aria-controls={section === "verdauung" ? "anatomie-verdauung" : "anatomie-modell"} onChange={event => selectEntry(event.target.value)}><option value="" disabled>Thema wählen</option><optgroup label="Verdauung verstehen">{digestiveTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup><optgroup label="Museumsscans drehen">{anatomyModels.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup></select></label>
      {navigationError && <p className={styles.note} role="alert">{navigationError}</p>}
    </PageMenu>
    {!selection ? <p className={styles.note}>{ready ? "Dieses Thema ist nicht verfügbar. Wähle unten im Menü ein Thema." : "Das gewählte Thema wird geladen."}</p> : <div ref={contentTarget} tabIndex={-1} aria-label={section === "verdauung" ? digestiveTopics.find(item => item.id === digestiveId)?.title : model.title}>
    {section === "verdauung" ? <DigestiveLearning key={digestiveId} selectedId={digestiveId} onSelect={selectEntry} hideSelector /> : <>
    <section className={styles.note}><strong>Ein klar benanntes Vergleichsbeispiel</strong><p>Alle Modelle zeigen Abgüsse des <strong>nordamerikanischen Weißwedelhirsches (Odocoileus virginianus)</strong> aus der Smithsonian-Lehrsammlung EO404749. Sie stellen kein Reh oder Rotwild dar. Schädel und Vorderlauf können aus verschiedenen Exemplaren stammen und sind nicht maßstabsgleich. Keine KI-Modelle.</p></section>
    <section className={styles.panel} aria-labelledby="anatomie-modell">
      <h2 id="anatomie-modell">Das Modell erkunden</h2>
      <h3>{model.title}</h3><p>{model.description}</p>
      {!enabled ? <div className={styles.empty}><p>Die drehbare Ansicht wird erst beim Öffnen geladen. Dieses Modell benötigt ungefähr {model.size}.</p><button className={styles.primary} type="button" onClick={openViewer}>3D-Ansicht öffnen</button></div> : <>
        {!scriptReady && <Script key={viewKey} src={scriptSource.current} type="module" strategy="afterInteractive" onLoad={scriptLoaded} onReady={scriptLoaded} onError={scriptFailed} />}
        {scriptReady && <model-viewer key={model.id + ":" + (enabled ? "open" : "closed")} ref={viewer} src={model.src} alt={`${model.title} des Weißwedelhirsches, Smithsonian-Museumsscan eines Abgusses`} camera-controls="" disable-pan="" touch-action="pan-y" interaction-prompt="none" camera-orbit={orbit} orientation={model.orientation || "0deg 0deg 0deg"} min-camera-orbit="auto 0deg 50%" max-camera-orbit="auto 180deg 200%" shadow-intensity="0.5" exposure="1" className={mediaStyles.modelViewer} />}
        <p className={styles.muted} role="status">{status === "loading" ? "Das echte 3D-Modell lädt …" : status === "loaded" ? "Mit einem Finger ziehen zum Drehen; mit zwei Fingern oder dem Mausrad zoomen. Am fokussierten Modell drehen auch die Pfeiltasten." : status === "error" ? "Die 3D-Ansicht konnte nicht geladen werden. Die erklärten Strukturen und Fragen stehen unten weiterhin zur Verfügung." : ""}</p>
        {status === "error" && <button className={styles.secondary} type="button" onClick={retryViewer}>Laden erneut vorbereiten</button>}
        <div className={styles.actions}><button className={styles.secondary} type="button" disabled={status !== "loaded"} onClick={() => rotate(-30)}>Nach links drehen</button><button className={styles.secondary} type="button" disabled={status !== "loaded"} onClick={() => rotate(30)}>Nach rechts drehen</button><button className={styles.secondary} type="button" onClick={() => changeCamera(defaultOrbit, null)}>Ansicht zurücksetzen</button></div>
      </>}
      <p className={styles.muted}>Scan: Smithsonian Institution · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a> · Unveränderte GLB-Datei · <a href={model.source} target="_blank" rel="noreferrer">Sammlung und Originalmodell</a></p>
      <div className={styles.gridThree}>{model.features.map(item => <button type="button" key={item.id} className={styles.choice} aria-pressed={item.id === featureId} onClick={() => changeCamera(item.orbit, item.id)}>{item.title}</button>)}</div>
      {feature && <div className={styles.feedback} role="status"><h3>{feature.title}</h3><p>{feature.explanation}</p><p className={styles.muted}>Die Kamera zeigt eine Betrachtungsrichtung. Die Erklärung benennt die Struktur; sie ist keine automatische Messung.</p></div>}
    </section>
    {questions.length > 0 && <details key={model.id} className={styles.sources} open={quizOpen} onToggle={event => toggleQuiz(event.currentTarget.open)}>
      <summary>Wissen zum Modell „{model.title}“ prüfen</summary>
      {quizOpen && question && <section className={styles.panel} aria-labelledby="anatomie-fragen"><h2 id="anatomie-fragen" ref={quizTarget} tabIndex={-1}>Wissen zum {model.title}</h2><p>Frage {questionIndex + 1} von {questions.length} · {answeredCount} beantwortet · {correct} richtig</p><progress className={styles.progress} value={answeredCount} max={questions.length} aria-label="Beantwortete Fragen zum gewählten Modell" /><h3>{question.question}</h3><div className={styles.choices}>{question.choices.map((choice, index) => <button key={choice} type="button" disabled={selected !== undefined} className={`${styles.choice} ${selected !== undefined && index === question.answer ? styles.correct : selected === index ? styles.wrong : ""}`} onClick={() => answer(index)}>{choice}</button>)}</div>
        {selected !== undefined && <div className={styles.feedback} role="status"><strong>{selected === question.answer ? "Richtig." : `Die richtige Antwort ist: ${question.choices[question.answer]}.`}</strong><p>{question.explanation}</p></div>}
        <div className={styles.actions}><button className={styles.secondary} type="button" disabled={questionIndex === 0} onClick={() => changeQuestion(-1)}>Vorige Frage</button><button className={styles.primary} type="button" disabled={selected === undefined || questionIndex === questions.length - 1} onClick={() => changeQuestion(1)}>Nächste Frage</button>{answeredCount === questions.length && <button className={styles.secondary} type="button" onClick={repeatQuestions}>Diese Fragen wiederholen</button>}</div>
        {answeredCount === questions.length && <p className={styles.note} role="status">Runde abgeschlossen: {correct} von {questions.length} richtig. Du kannst jede Erklärung wieder aufrufen.</p>}
      </section>}
    </details>}
    <details className={styles.sources}><summary>Fachliche Quellen und Modellnachweise</summary><ul>{anatomySources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Fachlich geprüft am 4. Oktober 2026. Anatomische Grundstrukturen werden erläutert; keine Altersbestimmung, medizinische Diagnose oder Übertragung exakter Größen auf heimische Wildarten.</p><p>3D-Anzeige: Google model-viewer 4.1.0, lokal bereitgestellt. <a href="/lernen/anatomie/MODEL-VIEWER-LICENSE.txt">Paketlizenz</a> · <a href="/lernen/anatomie/MODEL-VIEWER-NOTICES.txt">Weitere Lizenzhinweise</a></p></details>
    </>}
    </div>}
  </LearningToolLayout>;
}
