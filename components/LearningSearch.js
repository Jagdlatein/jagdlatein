import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AppIcon from "./AppIcon";
import { learningCategoryDetails } from "../lib/learning-categories";
import styles from "../styles/LearningSearch.module.css";
const types = { course: "Kurse", tool: "Lernwerkzeuge", entry: "Einzelne Lerninhalte", species: "Wildarten", practice: "Praxisübungen", glossary: "Fachbegriffe" };
export default function LearningSearch({ category: initialCategory = "all" }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const request = useRef(0);
  const active = Boolean(query.trim() || type !== "all" || category !== initialCategory || country !== "all");
  useEffect(() => { setCategory(initialCategory); setPage(1); }, [initialCategory]);
  useEffect(() => {
    const version = ++request.current;
    if (!active) { setData(null); setError(""); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim(), category, type, country: category === "jagdrecht" ? country : "all", page: String(page) });
        const response = await fetch(`/api/lernen/suche?${params}`, { signal: controller.signal, cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "Die Suche konnte nicht geladen werden.");
        if (version === request.current && !controller.signal.aborted) setData(body);
      } catch (failure) { if (version === request.current && !controller.signal.aborted) { setData(null); setError(failure.message || "Die Suche ist nicht verfügbar."); } }
      finally { if (version === request.current && !controller.signal.aborted) setLoading(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, category, type, country, page, retry, active]);
  function reset() { setQuery(""); setCategory(initialCategory); setType("all"); setCountry("all"); setPage(1); }
  function change(setter, value) { setter(value); setPage(1); setData(null); }
  return <section id="lernen-suche" className={styles.panel} aria-labelledby="all-search-title">
    <h2 id="all-search-title"><AppIcon name="search" size={25} />Alles im Lernbereich finden</h2>
    <p>Kurse, Wildarten, Fachbegriffe, Praxisübungen und einzelne Inhalte der Lernwerkzeuge gemeinsam durchsuchen.</p>
    <div className={styles.filters}>
      <label className={styles.query}>Suchbegriff<input type="search" maxLength={160} value={query} placeholder="Zum Beispiel Rehwild, Rückruf oder Kühlkette" onChange={event => change(setQuery, event.target.value)} /></label>
      <label>Kategorie<select value={category} onChange={event => { change(setCategory, event.target.value); setCountry("all"); }}><option value="all">Alle Kategorien</option>{learningCategoryDetails.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
      <label>Angebotsart<select value={type} onChange={event => change(setType, event.target.value)}><option value="all">Alle Angebote</option>{Object.entries(types).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      {category === "jagdrecht" && <label>Land<select value={country} onChange={event => change(setCountry, event.target.value)}><option value="all">Alle Länder</option><option value="DE">Deutschland</option><option value="AT">Österreich</option><option value="CH">Schweiz</option></select></label>}
    </div>
    <div className={styles.status} role="status" aria-live="polite">{loading ? "Suche läuft …" : data ? `${data.total} passende Angebote` : "Suchbegriff eingeben oder Angebotsart auswählen."}{active && <button type="button" onClick={reset}>Zurücksetzen</button>}</div>
    {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Erneut versuchen</button></div>}
    {!loading && data?.total === 0 && <p>Keine passenden Angebote gefunden. Versuche einen kürzeren Begriff oder eine andere Kategorie.</p>}
    {!loading && data && <ul className={styles.results}>{data.results.map(item => <li key={item.id}><Link href={item.href}><span className={styles.badges}>{types[item.type]} · {item.categories.map(slug => learningCategoryDetails.find(category => category.slug === slug)?.title).filter(Boolean).join(" / ")}</span><strong>{item.title}<AppIcon name="arrow-right" size={18} /></strong><span>{item.description}</span></Link></li>)}</ul>}
    {!loading && data?.pages > 1 && <nav className={styles.pages} aria-label="Suchergebnisse"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Zurück</button><span>Seite {page} von {data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage(value => value + 1)}>Weiter</button></nav>}
  </section>;
}
