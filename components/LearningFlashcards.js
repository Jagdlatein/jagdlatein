import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { FLASHCARD_STORAGE_KEY, parseFlashcardReview, rateFlashcardReview, getDueCards } from "../lib/flashcard-review";
import { flashcardSelectionQuery, matchesFlashcardSelection } from "../lib/flashcard-selection";
import styles from "../styles/LearningFlashcards.module.css";

const EMPTY_REVIEW = { version: 1, cards: {} };
const cleanQuery = value => typeof value === "string" ? value.slice(0, 160) : "";
export const normalizeFlashcardSearch = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
export function filterFlashcards(cards, category = "all", query = "", selection = null) {
  const terms = normalizeFlashcardSearch(query).split(" ").filter(Boolean);
  return cards.filter(card => matchesFlashcardSelection(card, selection) && (category === "all" || card.categoryId === category) && terms.every(term => normalizeFlashcardSearch([card.question, card.answer, card.explanation, card.categoryTitle, card.moduleTitle, card.context, card.lessonTitle].join(" ")).includes(term)));
}
export function FlashcardSelectionNotice({ selection }) {
  if (!selection) return null;
  return <aside className={styles.selectionNotice} aria-label="Gewählte Lernkartenauswahl">
    <strong>{selection.invalid ? "Diese Lernkartenauswahl wurde nicht gefunden." : selection.title}</strong>
    {selection.lessonTitle && <p>{selection.lessonTitle}</p>}
    <div>{selection.returnHref && <Link href={selection.returnHref} prefetch={false}>Zur Lektion</Link>}<Link href="/lernen/lernkarten" prefetch={false}>Alle Lernkarten</Link></div>
  </aside>;
}
export function formatFlashcardDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("de-CH", { timeZone: "UTC" });
}
export function FlashcardImage({ image, printing = false }) {
  if (!image) return null;
  return <figure className={printing ? styles.printFigure : styles.figure}>
    <img src={image.src} width={image.width} height={image.height} alt={image.alt || "Tierfoto für diese Bestimmungskarte"} />
    <figcaption><a href={image.creditUrl} target="_blank" rel="noopener noreferrer">{image.author}</a>{" · "}<a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a></figcaption>
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
  const [category, setCategory] = useState(() => !selection && categories.some(item => item.id === (router.query?.kategorie || router.query?.category)) ? (router.query.kategorie || router.query.category) : "all");
  const [query, setQuery] = useState(() => cleanQuery(router.query?.q));
  const [mode, setMode] = useState("pending");
  const [review, setReview] = useState(EMPTY_REVIEW);
  const [loaded, setLoaded] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [now, setNow] = useState(0);
  const [currentId, setCurrentId] = useState(null);
  const [rated, setRated] = useState(0);
  const [againIds, setAgainIds] = useState([]);
  const [message, setMessage] = useState("");
  const reviewRef = useRef(EMPTY_REVIEW);
  const generation = useRef(0);
  const againRef = useRef([]);
  const active = useRef(null);
  const headingRef = useRef(null);

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
    if (router.isReady === false) return;
    const requested = cleanQuery(router.query?.kategorie || router.query?.category);
    generation.current++;
    active.current = null;
    setCurrentId(null);
    setCategory(!selection && categories.some(item => item.id === requested) ? requested : "all");
    setQuery(cleanQuery(router.query?.q));
  }, [router.isReady, router.query?.kategorie, router.query?.category, router.query?.q, selection?.courseId, selection?.lessonId, selection?.invalid, categories]);

  useEffect(() => {
    if (!loaded || !canSave || typeof window === "undefined") return;
    try { window.localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(review)); }
    catch { setCanSave(false); }
  }, [review, loaded, canSave]);

  const filtered = useMemo(() => filterFlashcards(cards, category, query, selection), [cards, category, query, selection]);
  const available = mode === "all" ? filtered : pendingCards(filtered, review, now, againIds);
  const current = available.find(card => card.id === currentId) || available[0] || null;
  const token = generation.current;
  active.current = current?.id || null;
  const printQuery = { ...flashcardSelectionQuery(selection), ...(!selection && category !== "all" ? { kategorie: category } : {}), ...(query.trim() ? { q: query.trim() } : {}) };
  const printHref = { pathname: "/lernen/lernkarten-drucken", query: printQuery };

  function changeFilter(change) {
    generation.current++;
    active.current = null;
    setCurrentId(null); setMessage("");
    change();
  }
  function showCurrentQuestion() {
    if (typeof window !== "undefined") window.requestAnimationFrame(() => {
      const heading = headingRef.current;
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }
  function nextWithoutRating() {
    if (!current || available.length < 2 || generation.current !== token || active.current !== current.id) return;
    generation.current++;
    active.current = null;
    const index = available.findIndex(card => card.id === current.id);
    setCurrentId(available[(index + 1) % available.length].id);
    setMessage("");
    showCurrentQuestion();
  }
  function rate(rating) {
    if (!loaded || !current || generation.current !== token || active.current !== current.id) return;
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
    setCurrentId(next?.id || null);
    setMessage(rating === "again" ? "Die Karte kommt nach den übrigen Karten noch einmal." : "Als gewusst bewertet. Die Karte kommt später wieder.");
    showCurrentQuestion();
  }

  return <LearningToolLayout title="Lernkarten" description="Wildwissen mit Frage und Antwort wiederholen, auf diesem Gerät vormerken oder als Lernkarten ausdrucken." icon="book" category={{ href: "/lernen", title: "Lernbereich" }} headingOnly searchHref="#lernkarten-suche" hideCommunity className={styles.page}>
    <FlashcardSelectionNotice selection={selection} />
    <div className={`${styles.filters} ${selection ? styles.scopedFilters : ""}`} id="lernkarten-suche">
      {!selection && <label className={styles.field}>Kategorie<select value={category} onChange={event => changeFilter(() => setCategory(event.target.value))}><option value="all">Alle Kategorien</option>{categories.map(item => <option key={item.id} value={item.id}>{item.title} ({item.count})</option>)}</select></label>}
      <label className={styles.field}>Karten suchen<div className={styles.searchInput}><AppIcon name="search" size={21} /><input type="search" value={query} onChange={event => changeFilter(() => setQuery(event.target.value.slice(0, 160)))} placeholder="Zum Beispiel Gams, Hund oder Wald" autoComplete="off" /></div></label>
    </div>
    <div className={styles.summary}>
      <p>{incomplete ? `${cards.length} von ${totalCount} Karten geladen` : `${available.length} ${available.length === 1 ? "Karte" : "Karten"}${mode === "pending" ? " offen oder fällig" : " in deiner Auswahl"}`}{rated > 0 ? ` · ${rated} in dieser Sitzung bewertet` : ""}</p>
      <label className={styles.mode}><input type="checkbox" checked={mode === "pending"} onChange={event => changeFilter(() => setMode(event.target.checked ? "pending" : "all"))} />Nur offene und fällige Karten</label>
    </div>
    <div className={styles.status} role="status" aria-live="polite">{loadError || (loading ? "Weitere Lernkarten werden geladen. Du kannst die erste Karte schon beantworten." : message)}{loadError && onReload && <button className={styles.textButton} type="button" onClick={onReload}>Erneut laden</button>}</div>
    {current ? <article className={styles.card} aria-labelledby="lernkarten-frage" key={current.id}>
      <div className={styles.cardTop}><span><AppIcon name={current.categoryId} size={22} />{current.categoryTitle}</span><span>Frage und Antwort</span></div>
      {current.context && (!selection?.lessonId || selection.lessonId !== current.lessonId) && <p className={styles.context}>{current.context}{current.lessonTitle && current.lessonTitle !== current.context ? ` · ${current.lessonTitle}` : ""}</p>}
      <h2 id="lernkarten-frage" ref={headingRef} tabIndex={-1}>{current.question}</h2>
      <FlashcardImage image={current.image} />
      <div className={styles.back}>
          <p className={styles.answer}>{current.answer}</p>
          <p className={styles.explanation}>{current.explanation}</p>
          <div className={styles.rating} aria-label="Freiwillige Selbsteinschätzung"><button type="button" onClick={() => rate("again")} disabled={!loaded} className={styles.secondary}>Noch üben</button><button type="button" onClick={() => rate("known")} disabled={!loaded} className={styles.primary}>Gewusst</button><button type="button" onClick={nextWithoutRating} disabled={available.length < 2} className={styles.nextCard}>Weiter ohne Bewertung</button></div>
          <div className={styles.sources}>
            <h3>{current.sourceScope === "photo" ? "Bildnachweis und Artenporträt" : current.sourceScope === "lesson" ? "Quellen der Ausgangslektion" : "Quellen des Ausgangskurses"}</h3>
            <ul>{current.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
            {current.image && <p>Foto: <a href={current.image.creditUrl} target="_blank" rel="noopener noreferrer">{current.image.author}</a> · <a href={current.image.licenseUrl} target="_blank" rel="noopener noreferrer">{current.image.license}</a></p>}
            {formatFlashcardDate(current.reviewedOn) && <p>{current.sourceScope === "photo" ? "Bildnachweis geprüft" : current.sourceScope === "lesson" ? "Stand der Ausgangslektion" : "Stand des Ausgangskurses"}: {formatFlashcardDate(current.reviewedOn)}.</p>}
            <Link href={current.courseHref} className={styles.courseLink}>{current.moduleTitle}<AppIcon name="arrow-right" size={19} /></Link>
          </div>
        </div>
    </article> : <section className={styles.empty} aria-labelledby="lernkarten-leer"><h2 id="lernkarten-leer">{incomplete ? "Deine Auswahl wird vollständig geladen." : filtered.length ? "Für jetzt ist deine Auswahl wiederholt." : "Keine passenden Karten gefunden."}</h2><p>{incomplete ? "Die Suche berücksichtigt den vollständigen Bestand, sobald der Abruf abgeschlossen ist." : filtered.length ? "Deine Bewertungen sind eine Selbsteinschätzung. Schalte den Filter oben aus, wenn du alle passenden Karten erneut ansehen möchtest." : "Wähle eine andere Kategorie oder verkürze deinen Suchbegriff."}</p></section>}
    <p className={styles.deviceNote}>{canSave ? "Deine Bewertungen werden nur in diesem Browser auf diesem Gerät gespeichert. Sie werden nicht als Prüfungs- oder Ranglistenpunkte gewertet." : "Dieser Browser lässt das Speichern gerade nicht zu. Deine Bewertungen gelten nur für diese geöffnete Sitzung."}</p>
    <div className={styles.exportLinks}>{!selection?.invalid && <Link href={printHref}><AppIcon name="book" size={21} />Diese Auswahl drucken</Link>}<a href="/lernen/lernkarten/jagdlatein-lernkarten.pdf" download><AppIcon name="download" size={21} />Starterset als PDF</a></div>
  </LearningToolLayout>;
}
