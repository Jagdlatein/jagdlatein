import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { FLASHCARD_STORAGE_KEY, parseFlashcardReview, rateFlashcardReview, getDueCards } from "../lib/flashcard-review";
import { flashcardSelectionQuery, matchesFlashcardSelection } from "../lib/flashcard-selection";
import { createFlashcardURLSync, flashcardNavigationURL, flashcardRouterURL, readFlashcardNavigation, sameFlashcardNavigation } from "../lib/flashcard-navigation";
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
    <PageMenu title="Lernkartenauswahl"><div>{selection.returnHref && <Link href={selection.returnHref} onClick={event => onNavigate?.(event, selection.returnHref)} prefetch={false}>Zur Lektion</Link>}<Link href="/lernen/lernkarten" onClick={event => onNavigate?.(event, "/lernen/lernkarten")} prefetch={false}>Alle Lernkarten</Link></div></PageMenu>
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

export default function LearningFlashcards({ cards = [], categories = [], selection = null, totalCount = cards.length, loading = false, incomplete = false, loadError = "", onReload }) {
  const router = useRouter();
  const [navigation, setNavigation] = useState(() => readFlashcardNavigation(router.query, categories, selection));
  const { category, query, mode, cardId: currentId } = navigation;
  const [review, setReview] = useState(EMPTY_REVIEW);
  const [loaded, setLoaded] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [now, setNow] = useState(0);
  const [rated, setRated] = useState(0);
  const [againIds, setAgainIds] = useState([]);
  const [message, setMessage] = useState("");
  const reviewRef = useRef(EMPTY_REVIEW);
  const generation = useRef(0);
  const againRef = useRef([]);
  const active = useRef(null);
  const headingRef = useRef(null);
  const navigationRef = useRef(navigation);
  const routerRef = useRef(router);
  const contextRef = useRef({ categories, selection });
  const syncRef = useRef(null);
  const leaving = useRef(false);
  const scope = `${selection?.courseId || ""}/${selection?.lessonId || ""}/${Boolean(selection?.invalid)}`;
  const scopeRef = useRef(scope);
  const selectionFocusRequested = useRef(false);
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(JSON.stringify([scope, category, query, mode]), router.isReady !== false);
  const categoryIds = categories.map(item => item.id).join("|");
  routerRef.current = router;
  contextRef.current = { categories, selection };
  if (!syncRef.current) syncRef.current = createFlashcardURLSync({
    getRouter: () => routerRef.current,
    getState: () => ({ ...navigationRef.current, cardId: active.current || navigationRef.current.cardId }),
    getContext: () => contextRef.current,
    onRestore: next => {
      if (sameFlashcardNavigation(navigationRef.current, next)) return;
      generation.current++; active.current = null;
      navigationRef.current = next; setNavigation(next); setMessage("");
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let restored = EMPTY_REVIEW;
    try { restored = parseFlashcardReview(window.localStorage.getItem(FLASHCARD_STORAGE_KEY)); }
    catch { setCanSave(false); }
    reviewRef.current = restored;
    setReview(restored);
    setNow(Date.now());
    setLoaded(true);
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    const events = router.events;
    if (!events?.on) return;
    const begin = href => syncRef.current.start(href);
    const failed = error => { if (!error?.cancelled) syncRef.current.resume(); };
    events.on("routeChangeStart", begin);
    events.on("routeChangeError", failed);
    return () => { events.off("routeChangeStart", begin); events.off("routeChangeError", failed); };
  }, [router.events]);

  useEffect(() => {
    if (router.isReady === false) return;
    const href = flashcardRouterURL(router);
    if (scopeRef.current !== scope) { scopeRef.current = scope; syncRef.current.restore(href); }
    else syncRef.current.route(href);
  }, [router.isReady, flashcardRouterURL(router), scope, categoryIds]);

  useEffect(() => {
    syncRef.current.resume();
    if (typeof window === "undefined") return;
    const restoreHistory = () => {
      const location = window.location;
      syncRef.current.restore(`${location.pathname}${location.search}${location.hash}`);
    };
    window.addEventListener("popstate", restoreHistory);
    return () => { syncRef.current.dispose(); window.removeEventListener("popstate", restoreHistory); };
  }, []);

  useEffect(() => {
    if (!loaded || !canSave || typeof window === "undefined") return;
    try { window.localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(review)); }
    catch { setCanSave(false); }
  }, [review, loaded, canSave]);

  const filtered = useMemo(() => filterFlashcards(cards, category, query, selection), [cards, category, query, selection]);
  const available = mode === "all" ? filtered : pendingCards(filtered, review, now, againIds);
  const waitingForCard = incomplete && currentId && !cards.some(card => card.id === currentId);
  const current = waitingForCard ? null : available.find(card => card.id === currentId) || available[0] || null;
  useEffect(() => {
    if (!selectionFocusRequested.current || waitingForCard) return;
    selectionFocusRequested.current = false;
    focusSelection(headingRef.current);
  }, [navigation, waitingForCard]);
  const token = generation.current;
  active.current = current?.id || null;
  const printQuery = { ...flashcardSelectionQuery(selection), ...(!selection && category !== "all" ? { kategorie: category } : {}), ...(query.trim() ? { q: query.trim() } : {}), ...(mode === "all" ? { modus: "alle" } : {}), ...(current?.id ? { karte: current.id } : {}) };
  const printHref = { pathname: "/lernen/lernkarten-drucken", query: printQuery };

  function updateNavigation(next, delay = 0) {
    navigationRef.current = next;
    setNavigation(next);
    syncRef.current.schedule(delay);
  }
  function changeFilter(key, value) {
    selectionFocusRequested.current = false; cancelSelectionFocus();
    generation.current++;
    active.current = null;
    setMessage("");
    updateNavigation({ ...navigationRef.current, [key]: value, cardId: null }, key === "query" ? 220 : 0);
  }
  function rememberBeforeLeaving(event, href) {
    const modified = event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey || event?.button > 0;
    const pending = syncRef.current.flush();
    if (modified || event?.defaultPrevented || typeof routerRef.current.push !== "function") return;
    event?.preventDefault();
    const ticket = {};
    leaving.current = ticket;
    const version = syncRef.current.version(), generationAtClick = generation.current;
    let timeout;
    const bounded = Promise.race([pending.then(() => true), new Promise(resolve => { timeout = window.setTimeout(() => resolve(false), 500); })]);
    // Save the current history entry before Next starts the course/print route.
    bounded.then(saved => {
      if (leaving.current !== ticket || generation.current !== generationAtClick || !syncRef.current.isCurrent(version)) return;
      if (!saved) {
        // A hung shallow router must not trap a real link. Before the ordinary
        // browser navigation, preserve this entry with Next's history key intact.
        const source = flashcardNavigationURL(flashcardRouterURL(routerRef.current), { ...navigationRef.current, cardId: active.current || navigationRef.current.cardId }, contextRef.current.categories, contextRef.current.selection);
        const destination = typeof href === "string" ? href : `${href.pathname}${Object.keys(href.query || {}).length ? `?${new URLSearchParams(href.query)}` : ""}`;
        if (!source || window.location.pathname !== "/lernen/lernkarten" || !destination.startsWith("/") || destination.startsWith("//")) return;
        const history = window.history.state;
        window.history.replaceState(history?.__N ? { ...history, url: source, as: source } : history, "", source);
        window.location.assign(destination);
        return;
      }
      return routerRef.current.push(href);
    }).catch(() => {
      if (leaving.current === ticket && generation.current === generationAtClick && flashcardRouterURL(routerRef.current).startsWith("/lernen/lernkarten")) setMessage("Die Lernseite konnte gerade nicht geöffnet werden. Bitte versuche den Link erneut.");
    }).finally(() => { window.clearTimeout(timeout); if (leaving.current === ticket) leaving.current = false; });
  }
  function showCurrentQuestion() {
    if (typeof window !== "undefined") window.requestAnimationFrame(() => {
      const heading = headingRef.current;
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }
  function showSelection() {
    closePageMenu();
    cancelSelectionFocus();
    if (sameFlashcardNavigation(navigationRef.current, navigation)) focusSelection(headingRef.current);
    else selectionFocusRequested.current = true;
  }
  function nextWithoutRating() {
    if (!current || available.length < 2 || generation.current !== token || active.current !== current.id) return;
    selectionFocusRequested.current = false; cancelSelectionFocus();
    generation.current++;
    active.current = null;
    const index = available.findIndex(card => card.id === current.id);
    updateNavigation({ ...navigationRef.current, cardId: available[(index + 1) % available.length].id });
    setMessage("");
    showCurrentQuestion();
  }
  function rate(rating) {
    if (!loaded || !current || generation.current !== token || active.current !== current.id) return;
    selectionFocusRequested.current = false; cancelSelectionFocus();
    generation.current++;
    active.current = null;
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
    updateNavigation({ ...navigationRef.current, cardId: next?.id || null });
    setMessage(rating === "again" ? "Die Karte kommt nach den übrigen Karten noch einmal." : "Als gewusst bewertet. Die Karte kommt später wieder.");
    showCurrentQuestion();
  }

  return <LearningToolLayout title="Lernkarten" description="Wildwissen mit Frage und Antwort wiederholen, auf diesem Gerät vormerken oder als Lernkarten ausdrucken." icon="book" category={{ href: "/lernen", title: "Lernbereich" }} headingOnly searchHref="#lernkarten-suche" hideCommunity className={styles.page}>
    <FlashcardSelectionNotice selection={selection} onNavigate={rememberBeforeLeaving} />
    <PageMenu title="Lernkarten auswählen"><form className={`${styles.filters} ${selection ? styles.scopedFilters : ""}`} id="lernkarten-suche" onSubmit={event => { event.preventDefault(); showSelection(); }}>
      {!selection && <MenuChoice label="Kategorie" value={category} onChange={event => { changeFilter("category", event.target.value); showSelection(); }}><option value="all">Alle Kategorien</option>{categories.map(item => <option key={item.id} value={item.id}>{item.title} ({item.count})</option>)}</MenuChoice>}
      <label className={styles.field}>Karten suchen<div className={styles.searchInput}><AppIcon name="search" size={21} /><input type="search" value={query} onChange={event => changeFilter("query", event.target.value.slice(0, 160))} placeholder="Zum Beispiel Gams, Hund oder Wald" autoComplete="off" enterKeyHint="search" /></div></label>
      <label className={styles.mode}><input type="checkbox" checked={mode === "pending"} onChange={event => { changeFilter("mode", event.target.checked ? "pending" : "all"); showSelection(); }} />Nur offene und fällige Karten</label>
      <button type="submit" className={styles.textButton}>Karten anzeigen</button>
    </form></PageMenu>
    <div className={styles.summary}>
      <p>{incomplete ? `${cards.length} von ${totalCount} Karten geladen` : `${available.length} ${available.length === 1 ? "Karte" : "Karten"}${mode === "pending" ? " offen oder fällig" : " in deiner Auswahl"}`}{rated > 0 ? ` · ${rated} in dieser Sitzung bewertet` : ""}</p>
    </div>
    <PageMenu title="Lernkarten drucken und speichern"><nav className={`${styles.exportLinks} ${styles.cardExports}`} aria-label="Lernkarten drucken und speichern">{!selection?.invalid && <Link href={printHref} aria-label="Diese Auswahl drucken" onClick={event => rememberBeforeLeaving(event, printHref)}><AppIcon name="book" size={21} />Drucken</Link>}<a href="/lernen/lernkarten/jagdlatein-lernkarten.pdf" download aria-label="Starterset als PDF">PDF-Starterset</a></nav></PageMenu>
    <div className={styles.status} role="status" aria-live="polite">{loadError || (loading ? "Weitere Lernkarten werden geladen. Du kannst die erste Karte schon beantworten." : message)}{loadError && onReload && <button className={styles.textButton} type="button" onClick={onReload}>Erneut laden</button>}</div>
    {current ? <article className={styles.card} aria-labelledby="lernkarten-frage" key={current.id}>
      <div className={styles.cardTop}><span><AppIcon name={current.categoryId} size={22} />{current.categoryTitle}</span><span>Frage und Antwort</span></div>
      {current.context && (!selection?.lessonId || selection.lessonId !== current.lessonId) && <p className={styles.context}>{current.context}{current.lessonTitle && current.lessonTitle !== current.context ? ` · ${current.lessonTitle}` : ""}</p>}
      <h2 id="lernkarten-frage" ref={headingRef} tabIndex={-1}>{current.question}</h2>
      <FlashcardImage image={current.image} showCredit={false} />
      <div className={styles.back}>
          <p className={styles.answer}>{current.answer}</p>
          <p className={styles.explanation}>{current.explanation}</p>
          <div className={styles.rating} aria-label="Freiwillige Selbsteinschätzung"><button type="button" onClick={() => rate("again")} disabled={!loaded} className={styles.secondary}>Noch üben</button><button type="button" onClick={() => rate("known")} disabled={!loaded} className={styles.primary}>Gewusst</button><button type="button" onClick={nextWithoutRating} disabled={available.length < 2} className={styles.nextCard}>Weiter ohne Bewertung</button></div>
          <Link href={current.courseHref} className={styles.courseLink} onClick={event => rememberBeforeLeaving(event, current.courseHref)}>{current.moduleTitle}<AppIcon name="arrow-right" size={19} /></Link>
        </div>
    </article> : <section className={styles.empty} aria-labelledby="lernkarten-leer"><h2 id="lernkarten-leer">{incomplete ? "Deine Auswahl wird vollständig geladen." : filtered.length ? "Für jetzt ist deine Auswahl wiederholt." : "Keine passenden Karten gefunden."}</h2><p>{incomplete ? "Die Suche berücksichtigt den vollständigen Bestand, sobald der Abruf abgeschlossen ist." : filtered.length ? "Deine Bewertungen sind eine Selbsteinschätzung. Im unteren Menü kannst du den Filter ausschalten und alle passenden Karten erneut ansehen." : "Wähle im unteren Menü eine andere Kategorie oder verkürze deinen Suchbegriff."}</p></section>}
    <p className={styles.deviceNote}>{canSave ? "Deine Bewertungen werden nur in diesem Browser auf diesem Gerät gespeichert. Sie werden nicht als Prüfungs- oder Ranglistenpunkte gewertet." : "Dieser Browser lässt das Speichern gerade nicht zu. Deine Bewertungen gelten nur für diese geöffnete Sitzung."}</p>
    {current && <details className={styles.sources} key={`sources-${current.id}`}>
      <summary>{current.sourceScope === "photo" ? "Bildnachweis und Artenporträt" : current.sourceScope === "lesson" ? "Quellen der Ausgangslektion und Prüfstand" : "Quellen des Ausgangskurses und Prüfstand"}</summary>
      <ul>{current.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
      {current.image && <p>Foto: <a href={current.image.creditUrl} target="_blank" rel="noopener noreferrer">{current.image.author}</a> · <a href={current.image.licenseUrl} target="_blank" rel="noopener noreferrer">{current.image.license}</a></p>}
      {formatFlashcardDate(current.reviewedOn) && <p>{current.sourceScope === "photo" ? "Bildnachweis geprüft" : current.sourceScope === "lesson" ? "Stand der Ausgangslektion" : "Übernommener Prüfstand"}: {formatFlashcardDate(current.reviewedOn)}.</p>}
    </details>}
  </LearningToolLayout>;
}
