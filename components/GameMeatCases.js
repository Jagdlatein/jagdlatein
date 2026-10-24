import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ParasiteLearning from "./ParasiteLearning";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import { parasiteTopics } from "../lib/parasite-learning";
import LearningToolLayout from "./LearningToolLayout";
import { gameMeatCases, getGameMeatSummary } from "../lib/game-meat-cases";
import styles from "../styles/LearningExperience.module.css";

function readView(query, ready) {
  if (!ready) return { mode: "", entry: null, parasite: null };
  if (query.bereich !== undefined) {
    if (query.bereich !== "parasiten") return { mode: "", entry: null, parasite: null };
    const parasite = query.thema === undefined ? parasiteTopics[0] : parasiteTopics.find(item => typeof query.thema === "string" && item.id === query.thema) || null;
    return { mode: "parasiten", entry: null, parasite };
  }
  if (query.eintrag !== undefined) return { mode: "discover", entry: gameMeatCases.find(item => typeof query.eintrag === "string" && item.id === query.eintrag) || null, parasite: null };
  return { mode: "practice", entry: null, parasite: null };
}

export default function GameMeatCases() {
  const router = useRouter();
  const ready = router.isReady === true;
  const { mode, entry, parasite } = readView(router.query, ready);
  const [ids, setIds] = useState(gameMeatCases.map(item => item.id));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [roundRevision, setRoundRevision] = useState(0);
  const [navigationError, setNavigationError] = useState("");
  const content = useRef(null);
  const navigation = useRef(0);
  const pendingRequest = useRef(null);
  const mounted = useRef(false);
  const lastCase = useRef(gameMeatCases[0].id);
  const lastParasite = useRef(parasiteTopics[0].id);
  if (entry) lastCase.current = entry.id;
  if (parasite) lastParasite.current = parasite.id;
  const viewKey = JSON.stringify([ready, mode, entry?.id, parasite?.id]);
  const committedView = useRef({ key: viewKey });
  if (committedView.current.key !== viewKey) committedView.current = { key: viewKey };
  const origin = committedView.current;
  const round = useRef({ answered: new Set(), advanced: new Set() });
  const currentRound = round.current;
  const cases = ids.map(id => gameMeatCases.find(item => item.id === id));
  const item = mode === "discover" ? entry : mode === "practice" ? cases[index] : null;
  const active = useRef(null);
  active.current = { round: currentRound, origin, id: item?.id, finished };
  const answer = item ? answers[item.id] : undefined;
  const answered = Number.isInteger(answer);
  const summary = getGameMeatSummary(cases, answers);
  const validView = mode === "practice" || !!entry || !!parasite;

  function focusContent() {
    const target = content.current?.querySelector?.("h2") || content.current;
    target?.setAttribute?.("tabindex", "-1");
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: "start", behavior: "auto" });
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current += 1; pendingRequest.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setNavigationError("");
    if (!validView) {
      const timer = setTimeout(() => openPageMenu("game-meat-choices"), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusContent();
  }, [ready, mode, entry?.id, parasite?.id, item?.id, finished, roundRevision]);

  async function navigate(query, hash, sameSelection) {
    if (!ready) return;
    setNavigationError("");
    closePageMenu();
    if (sameSelection && pendingRequest.current === null) { focusContent(); return; }
    const request = ++navigation.current;
    const requestOrigin = committedView.current;
    pendingRequest.current = request;
    try {
      await router.push({ pathname: "/lernen/wildbret-fallwerkstatt", query, hash }, undefined, { shallow: true, scroll: false });
    } catch (error) {
      if (error?.cancelled || !mounted.current || request !== navigation.current || committedView.current !== requestOrigin) return;
      setNavigationError("Das Thema konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("game-meat-choices");
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }
  function selectParasite(id) {
    if (!parasiteTopics.some(item => item.id === id)) return;
    const { bereich, thema, eintrag, ...query } = router.query;
    return navigate({ ...query, bereich: "parasiten", thema: id }, "wildbret-parasiten", mode === "parasiten" && parasite?.id === id);
  }
  function chooseCase(id) {
    if (!gameMeatCases.some(item => item.id === id)) return;
    const { bereich, thema, eintrag, ...query } = router.query;
    return navigate({ ...query, eintrag: id }, "game-meat-content", mode === "discover" && entry?.id === id);
  }
  function chooseMode(value) {
    if (value === "parasiten") return selectParasite(lastParasite.current);
    if (value === "discover") return chooseCase(lastCase.current);
    if (value !== "practice") return;
    const { bereich, thema, eintrag, ...query } = router.query;
    return navigate(query, "game-meat-content", mode === "practice");
  }
  function isCurrentRound() {
    return ready && mode === "practice" && mounted.current && round.current === currentRound && committedView.current === origin && active.current?.round === currentRound && active.current?.origin === origin && active.current?.id === item?.id && active.current?.finished === finished;
  }
  function start(nextIds = gameMeatCases.map(item => item.id)) {
    if (!isCurrentRound()) return;
    const validIds = nextIds.filter(id => gameMeatCases.some(item => item.id === id));
    if (!validIds.length) return;
    round.current = { answered: new Set(), advanced: new Set() };
    setIds(validIds); setIndex(0); setAnswers({}); setFinished(false); setRoundRevision(value => value + 1);
  }
  function choose(value) {
    if (!isCurrentRound() || finished || !item || answered || currentRound.answered.has(item.id) || !Number.isInteger(value) || value < 0 || value >= item.choices.length) return;
    currentRound.answered.add(item.id);
    setAnswers(previous => Number.isInteger(previous[item.id]) ? previous : { ...previous, [item.id]: value });
  }
  function next() {
    if (!isCurrentRound() || finished || !item || !answered || currentRound.advanced.has(item.id)) return;
    currentRound.advanced.add(item.id);
    if (index + 1 === cases.length) setFinished(true); else setIndex(index + 1);
  }

  return <LearningToolLayout title="Wildbret-Fallwerkstatt" description="Hygienefälle lösen und Parasitenkreisläufe mit Wirten, Übertragungswegen und echten Lehrfotos verstehen." icon="health" category="wildbret-gesundheit" headingOnly>
    <PageMenu title="Wildbret – Thema wählen" openInitially={ready && !validView} initialFocusId="game-meat-choices">
      <div id="game-meat-choices" tabIndex={-1}>
        <label className={styles.field}>Lernangebot<select id="game-meat-mode" value={mode} onChange={event => chooseMode(event.target.value)}>
          {!mode && <option value="">Lernangebot wählen</option>}
          <option value="practice">Hygienefälle lösen</option><option value="discover">Hygienefälle nachschlagen</option><option value="parasiten">Parasitenkreisläufe verstehen</option>
        </select></label>
        {mode === "discover" && <label className={styles.field}>Fall wählen<select id="game-meat-case" value={entry?.id || ""} onChange={event => chooseCase(event.target.value)}><option value="" disabled>Fall wählen</option>{gameMeatCases.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
        {mode === "parasiten" && <label className={styles.field}>Parasit<select id="game-meat-parasite" value={parasite?.id || ""} onChange={event => selectParasite(event.target.value)}><option value="" disabled>Parasit wählen</option>{parasiteTopics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
        {mode === "practice" && <button type="button" className={styles.secondary} onClick={() => start()}>Neue Fallrunde beginnen</button>}
        {navigationError && <p className={styles.wrong} role="alert">{navigationError}</p>}
        {item && <Link href={`/kurse/${item.course}`} prefetch={false}>Im Hygienekurs vertiefen</Link>}
      </div>
    </PageMenu>
    {mode !== "parasiten" && <p className={styles.note}>Die Fälle trainieren allgemeine Hygienelogik. Untersuchungspflichten, Kennzeichnung und Abgabewege richten sich nach dem Ort und dem konkreten Betrieb. Die App erteilt keine Freigabe für ein reales Stück.</p>}
    <div id="game-meat-content" ref={content} tabIndex={-1}>
      {!ready ? <p className={styles.note}>Das gewählte Lernangebot wird geladen.</p> : !validView ? <p className={styles.note}>Dieses Thema ist nicht verfügbar. Wähle unten im Menü einen Hygienefall oder Parasitenkreislauf.</p> : mode === "parasiten" ? <ParasiteLearning key={parasite.id} selectedId={parasite.id} onSelect={selectParasite} hideSelector /> : finished && mode === "practice" ? <section className={styles.panel} aria-live="polite"><h2>Deine Fallrunde</h2><p>{summary.correct} von {cases.length} Entscheidungen richtig begründet.</p><div className={styles.actions}>{summary.wrongIds.length > 0 && <button className={styles.primary} type="button" onClick={() => start(summary.wrongIds)}>Offene Fälle wiederholen</button>}<button className={styles.secondary} type="button" onClick={() => start()}>Alle Fälle neu beginnen</button></div></section> : <section className={styles.panel} aria-labelledby="game-meat-title">
        <p className={styles.muted}>{item.topic}{mode === "practice" && ` · Fall ${index + 1} von ${cases.length}`}</p><h2 id="game-meat-title">{item.title}</h2><p>{item.situation}</p><h3>{item.question}</h3>
        {mode === "practice" ? <div className={styles.choices}>{item.choices.map((choice, position) => <button key={choice.text} type="button" disabled={answered} className={[styles.choice, answered && position === item.answer ? styles.correct : "", answered && position === answer && answer !== item.answer ? styles.wrong : ""].join(" ")} onClick={() => choose(position)}>{choice.text}</button>)}</div> : <p><strong>{item.choices[item.answer].text}</strong></p>}
        {(answered || mode === "discover") && <div className={styles.feedback} role="status"><h3>{mode === "discover" ? "Begründung" : answer === item.answer ? "Richtig begründet" : "Hier ist ein anderer Schritt nötig"}</h3>{mode === "practice" && <p>{item.choices[answer].explanation}</p>}{(mode === "discover" || answer !== item.answer) && <p>{item.choices[item.answer].explanation}</p>}<strong>{item.takeaway}</strong></div>}
        {(answered || mode === "discover") && <><h3>Für einen geordneten Ablauf</h3><ul>{item.checklist.map(text => <li key={text}>{text}</li>)}</ul><details className={styles.sources}><summary>Fachquellen · geprüft am 04.10.2026</summary><ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details></>}
        {answered && mode === "practice" && <div className={styles.actions}><button type="button" className={styles.primary} onClick={next}>{index + 1 === cases.length ? "Runde auswerten" : "Nächster Fall"}</button></div>}
      </section>}
    </div>
  </LearningToolLayout>;
}
