import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { answerOrder } from "../lib/answer-order";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { FLASHCARD_STORAGE_KEY, parseFlashcardReview, rateFlashcardReview, getDueCards } from "../lib/flashcard-review";
import { flashcardSelectionQuery, matchesFlashcardSelection } from "../lib/flashcard-selection";
import { createFlashcardURLSync, flashcardNavigationURL, flashcardRouterURL, readFlashcardNavigation, flashcardRouteIsReady, flashcardRouteOriginIsCurrent, flashcardOrigin } from "../lib/flashcard-navigation";
import { isLearningReviewDate } from "../lib/learning-review-date";
import styles from "../styles/LearningFlashcards.module.css";

const EMPTY_REVIEW = { version: 1, cards: {} };
export const normalizeFlashcardSearch = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
export function filterFlashcards(cards, category = "all", query = "", selection = null) {
  const terms = normalizeFlashcardSearch(query).split(" ").filter(Boolean);
  return cards.filter(card => matchesFlashcardSelection(card, selection) && (category === "all" || card.categoryId === category) && terms.every(term => normalizeFlashcardSearch([card.question, card.answer, card.explanation, card.categoryTitle, card.moduleTitle, card.context, card.lessonTitle].join(" ")).includes(term)));
}
export function FlashcardSelectionNotice({ selection, onNavigate }) {
  if (!selection) return null;
  return <aside className={styles.selectionNotice} aria-label="Gewählte Lernkartenauswahl">
    <strong>{selection.invalid ? "Diese Lernkartenauswahl wurde nicht gefunden." : selection.title}</strong>
    {selection.lessonTitle && <p>{selection.lessonTitle}</p>}
    <PageMenu title="Lernkartenauswahl"><div>{selection.returnHref && <Link href={selection.returnHref} onClick={event => onNavigate?.(event, selection.returnHref)} prefetch={false}>Zur Lektion</Link>}<Link href="/lernen/lernkarten?kategorie=all" onClick={event => onNavigate?.(event, "/lernen/lernkarten?kategorie=all")} prefetch={false}>Alle Lernkarten</Link></div></PageMenu>
  </aside>;
}
export function formatFlashcardDate(value) {
  if (!isLearningReviewDate(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("de-CH", { timeZone: "UTC" });
}
export function FlashcardImage({ image, printing = false, showCredit = true }) {
  if (!image) return null;
  return <figure className={printing ? styles.printFigure : styles.figure}>
    <img src={image.src} width={image.width} height={image.height} alt={image.alt || "Tierfoto für diese Bestimmungskarte"} />
    {showCredit && <figcaption><a href={image.creditUrl} target="_blank" rel="noopener noreferrer">{image.author}</a>{" · "}<a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a></figcaption>}
  </figure>;
}
function pendingCards(cards, review, now, againIds = []) {
  const ratings = parseFlashcardReview(review).cards;
  const due = new Set(getDueCards(cards, review, now).map(card => card.id));
  const again = new Set(againIds);
  return cards.filter(card => !Object.hasOwn(ratings, card.id) || due.has(card.id) || again.has(card.id));
}

function getAnswerChoices(card) {
  const choices = card?.choices;
  if (!Array.isArray(choices) || choices.length < 2 || !choices.includes(card.answer)) return null;
  const unique = new Set();
  for (const choice of choices) {
    if (typeof choice !== "string") return null;
    const key = choice.normalize("NFKC").trim();
    if (!key || unique.has(key)) return null;
    unique.add(key);
  }
  return choices;
}
// Equal seed/full records can have different property insertion order. Bind a
// response to the actual content, rather than an object instance or its ID.
function cardIdentity(value) {
  if (Array.isArray(value)) return value.map(cardIdentity);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, cardIdentity(value[key])]));
  return value;
}

export default function LearningFlashcards({ cards = [], categories = [], selection = null, totalCount = cards.length, loading = false, incomplete = false, loadError = "", onReload }) {
  const router = useRouter();
  const href = flashcardRouterURL(router);
  const routeOriginReady = flashcardRouteOriginIsCurrent(router);
  const routeReady = flashcardRouteIsReady(router, categories, selection);
  const navigation = readFlashcardNavigation(router.query, categories, selection);
  const { category, query, mode, cardId: currentId } = navigation;
  const [draftQuery, setDraftQuery] = useState(query);
  const [, setNavigationVersion] = useState(0);
  const [repeatRound, setRepeatRound] = useState(0);
  const [review, setReview] = useState(EMPTY_REVIEW);
  const [loaded, setLoaded] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [now, setNow] = useState(0);
  const [rated, setRated] = useState(0);
  const [againIds, setAgainIds] = useState([]);
  const [message, setMessage] = useState("");
  const [openAnswer, setOpenAnswerState] = useState(null);
  const reviewRef = useRef(EMPTY_REVIEW);
  const generation = useRef(0);
  const againRef = useRef([]);
  const active = useRef(null);
  const answerRef = useRef(null);
  const headingRef = useRef(null);
  const feedbackRef = useRef(null);
  const navigationRef = useRef(navigation);
  const draftRef = useRef(query);
  const routerRef = useRef(router);
  const contextRef = useRef({ categories, selection });
  const syncRef = useRef(null);
  const leaving = useRef(false);
  const mounted = useRef(true);
  const origin = useRef(null);
  const pinned = useRef(null);
  const round = useRef(null);
  const ratingApplied = useRef(null);
  const committedFocus = useRef(null);
  const completion = useRef(null);
  const scope = `${selection?.courseId || ""}/${selection?.lessonId || ""}/${Boolean(selection?.invalid)}`;
  const scopeRef = useRef(scope);
  const selectionFocusRequested = useRef(false);
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(JSON.stringify([scope, category, query, mode]), routeReady);
  const categoryIds = categories.map(item => item.id).join("|");
  routerRef.current = router;
  contextRef.current = { categories, selection };
  const renderOrigin = flashcardOrigin(router);
  if (origin.current !== renderOrigin) { origin.current = renderOrigin; generation.current++; }
  function setOpenAnswer(answer) {
    answerRef.current = answer;
    setOpenAnswerState(answer);
  }
  if (!syncRef.current) syncRef.current = createFlashcardURLSync({
    getRouter: () => routerRef.current,
    getState: () => navigationRef.current,
    getContext: () => contextRef.current,
    onRestore: next => {
      if (!mounted.current) return;
      generation.current++;
      leaving.current = false; committedFocus.current = null; completion.current = null;
      navigationRef.current = next; draftRef.current = next.query; setDraftQuery(next.query); setMessage("");
      setNavigationVersion(value => value + 1);
    },
    onPending: () => { if (mounted.current) setNavigationVersion(value => value + 1); },
    onCommit: committed => {
      if (!mounted.current) return;
      if (completion.current?.href === committed) {
        if (completion.current.finish) pinned.current = { key: completion.current.key, id: null };
        else setRepeatRound(value => value + 1);
        completion.current = null;
      }
      if (selectionFocusRequested.current && committed === flashcardNavigationURL(flashcardRouterURL(routerRef.current), navigationRef.current, contextRef.current.categories, contextRef.current.selection)) committedFocus.current = committed;
      setNavigationVersion(value => value + 1);
    },
    onError: (failed, newerIntent) => {
      if (!mounted.current || newerIntent) return;
      const confirmed = readFlashcardNavigation(routerRef.current.query, contextRef.current.categories, contextRef.current.selection);
      navigationRef.current = { ...confirmed, query: draftRef.current };
      selectionFocusRequested.current = false; committedFocus.current = null;
      setMessage("Die Auswahl konnte nicht geöffnet werden. Bitte wähle sie erneut. Deine aktuelle Karte bleibt erhalten.");
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let restored = EMPTY_REVIEW;
    try { restored = parseFlashcardReview(window.localStorage.getItem(FLASHCARD_STORAGE_KEY)); }
    catch { setCanSave(false); }
    reviewRef.current = restored;
    pinned.current = null;
    setReview(restored);
    setNow(Date.now());
    setLoaded(true);
    const refresh = () => { if (mounted.current) setNow(Date.now()); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    const events = router.events;
    if (!events?.on) return;
    const begin = href => syncRef.current.start(href);
    const failed = () => { if (mounted.current) syncRef.current.resume(); };
    events.on("routeChangeStart", begin);
    events.on("routeChangeError", failed);
    return () => { events.off("routeChangeStart", begin); events.off("routeChangeError", failed); };
  }, [router.events]);

  useEffect(() => {
    if (!routeReady) return;
    if (scopeRef.current !== scope) { scopeRef.current = scope; syncRef.current.restore(href); }
    else syncRef.current.route(href);
  }, [routeReady, href, scope, categoryIds]);

  useEffect(() => {
    mounted.current = true; syncRef.current.resume();
    if (typeof window === "undefined") return;
    const restoreHistory = () => {
      const location = window.location;
      syncRef.current.restore(`${location.pathname}${location.search}${location.hash}`);
    };
    window.addEventListener("popstate", restoreHistory);
    return () => { mounted.current = false; leaving.current = false; selectionFocusRequested.current = false; committedFocus.current = null; generation.current++; syncRef.current.dispose(); window.removeEventListener("popstate", restoreHistory); };
  }, []);

  useEffect(() => {
    if (!loaded || !canSave || typeof window === "undefined") return;
    try { window.localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(review)); }
    catch { setCanSave(false); }
  }, [review, loaded, canSave]);

  const choosingCategory = !selection && (!routeReady || category === null);
  const filtered = useMemo(() => !routeReady || choosingCategory ? [] : filterFlashcards(cards, category, query, selection), [cards, category, query, selection, choosingCategory, routeReady]);
  const available = mode === "all" ? filtered : pendingCards(filtered, review, now, againIds);
  const waitingForCard = routeReady && incomplete && currentId && !cards.some(card => card.id === currentId);
  const navigationKey = JSON.stringify([scope, category, query, mode, currentId]);
  if (!pinned.current || pinned.current.key !== navigationKey || !pinned.current.id && available.length) pinned.current = { key: navigationKey, id: currentId || available[0]?.id || null };
  // A rating may remove a card from the pending pool before its push commits.
  // Keep the confirmed card, rather than borrowing available[0] under its URL.
  const current = routeReady && !waitingForCard ? filtered.find(card => card.id === pinned.current.id) || null : null;
  const unknownCard = routeReady && !waitingForCard && currentId && !current;
  const choices = getAnswerChoices(current);
  const cardKey = current ? JSON.stringify([scope, category, query, mode, cardIdentity(current), repeatRound]) : null;
  if (routeOriginReady && round.current !== cardKey) { round.current = cardKey; generation.current++; ratingApplied.current = null; }
  const answerShown = cardKey !== null && openAnswer?.key === cardKey;
  const selectedChoice = answerShown ? openAnswer.choice : null;
  const choiceFeedbackShown = Boolean(choices && answerShown);
  useEffect(() => {
    if (routeOriginReady && answerRef.current && answerRef.current.key !== cardKey) {
      answerRef.current = null;
      setOpenAnswerState(null);
    }
  }, [cardKey, routeOriginReady]);
  useEffect(() => {
    if (choiceFeedbackShown && live()) feedbackRef.current?.focus();
  }, [choiceFeedbackShown, cardKey]);
  useEffect(() => {
    if (!live() || !selectionFocusRequested.current || !committedFocus.current || waitingForCard || !routeReady || syncRef.current.busy()) return;
    selectionFocusRequested.current = false;
    committedFocus.current = null;
    focusSelection(headingRef.current);
  }, [href, cardKey, waitingForCard, routeReady, syncRef.current.busy()]);
  const token = generation.current;
  active.current = current?.id || null;
  const canInteract = routeReady && syncRef.current.available() && !syncRef.current.busy();
  const canAdvance = Boolean(current && (available.some(card => card.id !== current.id) || ratingApplied.current === cardKey && !available.length));
  const printQuery = { ...flashcardSelectionQuery(selection), ...(!selection && category ? { kategorie: category } : {}), ...(query.trim() ? { q: query.trim() } : {}), ...(mode === "all" ? { modus: "alle" } : {}), ...(current?.id ? { karte: current.id } : {}) };
  const printHref = { pathname: "/lernen/lernkarten-drucken", query: printQuery };

  function live(requireValid = true) {
    return mounted.current && generation.current === token && origin.current === renderOrigin && flashcardOrigin(routerRef.current) === renderOrigin && flashcardRouteOriginIsCurrent(routerRef.current) && syncRef.current.available() && (!requireValid || flashcardRouteIsReady(routerRef.current, contextRef.current.categories, contextRef.current.selection));
  }
  function updateNavigation(next, delay = 0, method = "push") {
    navigationRef.current = next;
    syncRef.current.schedule(delay, method);
  }
  function changeFilter(key, value) {
    if (!live(false)) return;
    leaving.current = false; completion.current = null;
    selectionFocusRequested.current = false; cancelSelectionFocus();
    setMessage("");
    const next = { ...navigationRef.current, [key]: value, cardId: null };
    if (key === "query" && next.category === null && value.trim()) next.category = "all";
    if (key === "query") { draftRef.current = value; setDraftQuery(value); }
    else { closePageMenu(); selectionFocusRequested.current = true; }
    updateNavigation(next, key === "query" ? 220 : 0, key === "query" ? "replace" : "push");
  }
  function selectCategory(value) {
    if (!live(false) || routeReady && !unknownCard && value === (syncRef.current.busy() ? navigationRef.current.category : category)) return;
    if (value !== "all" && !categories.some(item => item.id === value)) return;
    changeFilter("category", value);
  }
  function rememberBeforeLeaving(event, href) {
    // An invalid scoped deck has no current card to flush. Its one explicit
    // escape is an ordinary Next link, bound to this mounted complete address.
    if (selection?.invalid && href === "/lernen/lernkarten?kategorie=all") {
      if (!live(false) || syncRef.current.busy()) event?.preventDefault();
      return;
    }
    if (!live()) { event?.preventDefault(); return; }
    const modified = event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey || event?.button > 0;
    // Flush the draft without attaching an unrelated old card to a new search.
    const desired = navigationRef.current;
    const targetCards = filterFlashcards(cards, desired.category || "all", desired.query, selection);
    const target = desired.query === query && desired.category === category && desired.mode === mode ? current : (desired.mode === "all" ? targetCards : pendingCards(targetCards, reviewRef.current, now, againRef.current))[0];
    navigationRef.current = { ...desired, cardId: target?.id || desired.cardId };
    const destinationHref = typeof href === "object" && href.pathname === "/lernen/lernkarten-drucken" ? {
      pathname: href.pathname,
      query: { ...flashcardSelectionQuery(selection), ...(!selection && desired.category ? { kategorie: desired.category } : {}), ...(desired.query.trim() ? { q: desired.query.trim() } : {}), ...(desired.mode === "all" ? { modus: "alle" } : {}), ...(target?.id ? { karte: target.id } : {}) },
    } : href;
    const sourceHref = flashcardRouterURL(routerRef.current);
    const targetSourceHref = flashcardNavigationURL(sourceHref, navigationRef.current, contextRef.current.categories, contextRef.current.selection);
    const pending = syncRef.current.flush();
    if (modified || event?.defaultPrevented || typeof routerRef.current.push !== "function") return;
    event?.preventDefault();
    const ticket = {};
    leaving.current = ticket;
    const version = syncRef.current.version();
    let timeout;
    const bounded = Promise.race([pending.then(value => value !== false), new Promise(resolve => { timeout = window.setTimeout(() => resolve(false), 500); })]);
    // Save the current history entry before Next starts the course/print route.
    bounded.then(saved => {
      if (!mounted.current || leaving.current !== ticket || !syncRef.current.isCurrent(version) || !flashcardRouteOriginIsCurrent(routerRef.current) || ![sourceHref, targetSourceHref].includes(flashcardRouterURL(routerRef.current))) return;
      if (!saved) {
        // A hung shallow router must not trap a real link. Before the ordinary
        // browser navigation, preserve this entry with Next's history key intact.
        const source = flashcardNavigationURL(flashcardRouterURL(routerRef.current), navigationRef.current, contextRef.current.categories, contextRef.current.selection);
        const destination = typeof destinationHref === "string" ? destinationHref : `${destinationHref.pathname}${Object.keys(destinationHref.query || {}).length ? `?${new URLSearchParams(destinationHref.query)}` : ""}`;
        if (!source || window.location.pathname !== "/lernen/lernkarten" || !destination.startsWith("/") || destination.startsWith("//")) return;
        const history = window.history.state;
        window.history.replaceState(history?.__N ? { ...history, url: source, as: source } : history, "", source);
        window.location.assign(destination);
        return;
      }
      return routerRef.current.push(destinationHref);
    }).catch(() => {
      if (mounted.current && leaving.current === ticket && syncRef.current.isCurrent(version)) setMessage("Die Lernseite konnte gerade nicht geöffnet werden. Bitte versuche den Link erneut.");
    }).finally(() => { window.clearTimeout(timeout); if (leaving.current === ticket) leaving.current = false; });
  }
  function showSelection() {
    if (!live()) return;
    closePageMenu();
    cancelSelectionFocus();
    selectionFocusRequested.current = true;
    syncRef.current.flush();
  }
  function toggleAnswer() {
    if (!live() || syncRef.current.busy() || !current || active.current !== current.id || round.current !== cardKey) return;
    const alreadyShown = answerRef.current?.key === cardKey;
    if (choices && alreadyShown) return;
    setOpenAnswer(alreadyShown ? null : { key: cardKey, choice: null });
  }
  function chooseAnswer(choice) {
    if (!live() || syncRef.current.busy() || !current || active.current !== current.id || round.current !== cardKey || answerRef.current?.key === cardKey || !choices?.includes(choice)) return;
    setOpenAnswer({ key: cardKey, choice });
  }
  function nextWithoutRating() {
    if (!live() || syncRef.current.busy() || !current || !canAdvance || active.current !== current.id || round.current !== cardKey) return;
    leaving.current = false; completion.current = null; selectionFocusRequested.current = true; cancelSelectionFocus();
    const index = available.findIndex(card => card.id === current.id);
    const next = available.length ? available[(index + 1) % available.length] : null;
    const nextNavigation = { ...navigation, cardId: next?.id || null };
    if (!next) completion.current = { href: flashcardNavigationURL(href, nextNavigation, categories, selection), finish: true, key: JSON.stringify([scope, category, query, mode, null]) };
    updateNavigation(nextNavigation);
    setMessage("");
  }
  function rate(rating) {
    if (!live() || syncRef.current.busy() || !loaded || !current || round.current !== cardKey || ratingApplied.current === cardKey || active.current !== current.id || answerRef.current?.key !== cardKey) return;
    ratingApplied.current = cardKey;
    leaving.current = false; selectionFocusRequested.current = true; cancelSelectionFocus();
    const time = Date.now();
    const nextReview = rateFlashcardReview(reviewRef.current, current.id, rating, time);
    const nextAgain = againRef.current.filter(id => id !== current.id);
    if (rating === "again") nextAgain.push(current.id);
    againRef.current = nextAgain;
    reviewRef.current = nextReview;
    const nextCards = mode === "all" ? filtered : pendingCards(filtered, nextReview, time, nextAgain);
    const index = filtered.findIndex(card => card.id === current.id);
    const following = filtered.slice(index + 1).concat(filtered.slice(0, index + 1));
    const nextIds = new Set(nextCards.map(card => card.id));
    const next = following.find(card => nextIds.has(card.id));
    setReview(nextReview); setAgainIds(nextAgain); setNow(time); setRated(count => count + 1);
    const nextNavigation = { ...navigation, cardId: next?.id || null };
    if (!next || next.id === current.id) completion.current = {
      href: flashcardNavigationURL(href, nextNavigation, categories, selection),
      finish: !next,
      key: JSON.stringify([scope, category, query, mode, nextNavigation.cardId]),
    };
    updateNavigation(nextNavigation);
    setMessage(rating === "again" ? "Die Karte kommt nach den übrigen Karten noch einmal." : "Als gewusst bewertet. Die Karte kommt später wieder.");
  }

  return <LearningToolLayout title="Lernkarten" description="Wildwissen mit Frage und Antwort wiederholen, auf diesem Gerät vormerken oder als Lernkarten ausdrucken." icon="book" category={{ href: "/lernen", title: "Lernbereich" }} headingOnly searchHref="#lernkarten-suche" hideCommunity className={styles.page}>
    <FlashcardSelectionNotice selection={selection} onNavigate={rememberBeforeLeaving} />
    {choosingCategory ? <MenuChoice id="lernkarten-kategorien" label="Kategorie wählen" disabled={!routeOriginReady} onChange={event => selectCategory(event.target.value)}>
      {categories.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      <option value="all">Alle Kategorien</option>
    </MenuChoice> : !selection && <label className={`${styles.field} ${styles.categorySwitch}`}>
      Kategorie
      <select aria-label="Kategorie" value={category} disabled={!routeOriginReady} onChange={event => selectCategory(event.target.value)}>
        <option value="all">Alle Kategorien</option>
        {categories.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </label>}
    <PageMenu title="Lernkarten suchen und filtern"><form className={`${styles.filters} ${styles.scopedFilters}`} id="lernkarten-suche" onSubmit={event => { event.preventDefault(); if (!live(false)) return; showSelection(); }}>
      <label className={styles.field}>Karten suchen<div className={styles.searchInput}><AppIcon name="search" size={21} /><input type="search" value={draftQuery} disabled={!routeOriginReady} onChange={event => changeFilter("query", event.target.value.slice(0, 160))} placeholder="Zum Beispiel Gams, Hund oder Wald" autoComplete="off" enterKeyHint="search" /></div></label>
      <label className={styles.mode}><input type="checkbox" checked={mode === "pending"} disabled={choosingCategory || !routeOriginReady} onChange={event => changeFilter("mode", event.target.checked ? "pending" : "all")} />Nur offene und fällige Karten</label>
      <button type="submit" disabled={!routeOriginReady} className={styles.textButton}>Karten anzeigen</button>
    </form></PageMenu>
    {!choosingCategory && <div className={styles.summary}>
      <p>{incomplete ? `${cards.length} von ${totalCount} Karten geladen` : `${available.length} ${available.length === 1 ? "Karte" : "Karten"}${mode === "pending" ? " offen oder fällig" : " in deiner Auswahl"}`}{rated > 0 ? ` · ${rated} in dieser Sitzung bewertet` : ""}</p>
    </div>}
    <PageMenu title="Lernkarten drucken und speichern"><nav className={`${styles.exportLinks} ${styles.cardExports}`} aria-label="Lernkarten drucken und speichern">{!selection?.invalid && <Link href={printHref} aria-label="Diese Auswahl drucken" onClick={event => rememberBeforeLeaving(event, printHref)}><AppIcon name="book" size={21} />Drucken</Link>}<a href="/lernen/lernkarten/jagdlatein-lernkarten.pdf" download aria-label="Starterset als PDF">PDF-Starterset</a></nav></PageMenu>
    <div className={styles.status} role="status" aria-live="polite">{loadError || (loading && !choosingCategory ? (current ? "Weitere Lernkarten werden geladen. Du kannst die erste Karte schon beantworten." : "Weitere Lernkarten werden geladen.") : message)}{loadError && onReload && <button className={styles.textButton} type="button" disabled={!routeOriginReady} onClick={() => { if (live(false)) onReload(); }}>Erneut laden</button>}</div>
    {current ? <article className={styles.card} aria-labelledby="lernkarten-frage" key={current.id}>
      <div className={styles.cardTop}><span><AppIcon name={current.categoryId} size={22} />{current.categoryTitle}</span><span>Lernkarte</span></div>
      <h2 id="lernkarten-frage" ref={headingRef} tabIndex={-1}>{current.question}</h2>
      <FlashcardImage image={current.image} showCredit={false} />
      <div className={styles.back}>
        {choices && <div className={styles.choices} role="group" aria-label="Antwort wählen">
          {answerOrder(choices, current.id).map(index => {
            const choice = choices[index];
            const correct = answerShown && choice === current.answer;
            const wrong = selectedChoice === choice && !correct;
            return <button type="button" key={choice} disabled={answerShown || !canInteract} aria-pressed={selectedChoice === choice} onClick={() => chooseAnswer(choice)} className={`${styles.choice} ${correct ? styles.correctChoice : wrong ? styles.wrongChoice : ""}`}>
              <span>{choice}</span>
              {correct && <span className={styles.choiceLabel}>Richtige Antwort</span>}
              {wrong && <span className={styles.choiceLabel}>Deine Antwort</span>}
            </button>;
          })}
        </div>}
        {(!choices || !answerShown) && <button type="button" onClick={toggleAnswer} disabled={!canInteract} className={choices || answerShown ? styles.secondary : styles.primary} aria-expanded={answerShown} aria-controls="lernkarten-antwort">{answerShown ? "Antwort ausblenden" : "Antwort zeigen"}</button>}
        <div id="lernkarten-antwort" hidden={!answerShown}>
          {answerShown && <>
            {choices && <h3 className={styles.feedbackTitle} ref={feedbackRef} tabIndex={-1}>{selectedChoice === null ? "Auflösung" : selectedChoice === current.answer ? "Richtig beantwortet" : "Das ist noch nicht richtig"}</h3>}
            <p className={styles.answer}>{current.answer}</p>
            <p className={styles.explanation}>{current.explanation}</p>
            <div className={styles.rating} aria-label="Freiwillige Selbsteinschätzung"><button type="button" onClick={() => rate("again")} disabled={!loaded || !canInteract || ratingApplied.current === cardKey} className={styles.secondary}>Noch üben</button><button type="button" onClick={() => rate("known")} disabled={!loaded || !canInteract || ratingApplied.current === cardKey} className={styles.primary}>Gewusst</button></div>
            {current.lessonTitle && current.lessonTitle !== current.moduleTitle && (!selection?.lessonId || selection.lessonId !== current.lessonId) && <p className={styles.context}>{current.lessonTitle}</p>}
            <Link href={current.courseHref} className={styles.courseLink} onClick={event => rememberBeforeLeaving(event, current.courseHref)}>{current.moduleTitle}<AppIcon name="arrow-right" size={19} /></Link>
          </>}
        </div>
        <button type="button" onClick={nextWithoutRating} disabled={!canInteract || !canAdvance} className={styles.nextCard}>Weiter ohne Bewertung</button>
      </div>
    </article> : !choosingCategory && <section className={styles.empty} aria-labelledby="lernkarten-leer"><h2 id="lernkarten-leer" ref={headingRef} tabIndex={-1}>{!routeReady || unknownCard ? "Diese Lernkartenauswahl wurde nicht gefunden." : incomplete ? "Deine Auswahl wird vollständig geladen." : filtered.length ? "Für jetzt ist deine Auswahl wiederholt." : "Keine passenden Karten gefunden."}</h2><p>{!routeReady || unknownCard ? "Wähle die Kategorie oder den Filter erneut. Es wird keine andere Karte für diesen Link eingesetzt." : incomplete ? "Die Suche berücksichtigt den vollständigen Bestand, sobald der Abruf abgeschlossen ist." : filtered.length ? "Deine Bewertungen sind eine Selbsteinschätzung. Im unteren Menü kannst du den Filter ausschalten und alle passenden Karten erneut ansehen." : "Wähle eine andere Kategorie oder verkürze deinen Suchbegriff."}</p></section>}
    <p className={styles.deviceNote}>{canSave ? "Deine Bewertungen werden nur in diesem Browser auf diesem Gerät gespeichert. Sie werden nicht als Prüfungs- oder Ranglistenpunkte gewertet." : "Dieser Browser lässt das Speichern gerade nicht zu. Deine Bewertungen gelten nur für diese geöffnete Sitzung."}</p>
    {current && (answerShown || current.image) && <details className={styles.sources} key={`sources-${current.id}-${answerShown}`}>
      <summary>{current.sourceScope === "photo" ? (answerShown ? "Bildnachweis und Artenporträt" : "Bildnachweis") : current.sourceScope === "lesson" ? "Quellen der Ausgangslektion und Prüfstand" : "Quellen des Ausgangskurses und Prüfstand"}</summary>
      {answerShown && <ul>{current.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>}
      {current.image && <p>Foto: <a href={current.image.creditUrl} target="_blank" rel="noopener noreferrer">{current.image.author}</a> · <a href={current.image.licenseUrl} target="_blank" rel="noopener noreferrer">{current.image.license}</a></p>}
      {formatFlashcardDate(current.reviewedOn) && <p>{current.sourceScope === "photo" ? "Bildnachweis geprüft" : current.sourceScope === "lesson" ? "Stand der Ausgangslektion" : "Übernommener Prüfstand"}: {formatFlashcardDate(current.reviewedOn)}.</p>}
    </details>}
  </LearningToolLayout>;
}
