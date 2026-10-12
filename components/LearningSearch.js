import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import { learningCategoryDetails } from "../lib/learning-categories";
import { canonicalLearningSearchURL, defaultLearningSearch, learningSearchActive, learningSearchTypes as types, learningSearchURL, normalizeLearningSearch, readLearningSearchURL, sameLearningSearch } from "../lib/learning-search-state";
import styles from "../styles/LearningSearch.module.css";
export default function LearningSearch({ category: initialCategory = "all" }) {
  const router = useRouter();
  const [search, setSearch] = useState(() => defaultLearningSearch(initialCategory));
  const { query, category, type, country, page } = search;
  const [urlReady, setURLReady] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const request = useRef(0);
  const currentSearch = useRef(search);
  const currentRouter = useRef(router);
  const urlTimer = useRef(null);
  const ownURLs = useRef(new Set());
  currentRouter.current = router;
  const active = learningSearchActive(search, initialCategory);

  function restore(asPath) {
    const next = readLearningSearchURL(asPath, initialCategory);
    if (!sameLearningSearch(currentSearch.current, next)) {
      ++request.current;
      currentSearch.current = next;
      setSearch(next); setData(null); setError("");
    }
    setURLReady(true);
  }

  useEffect(() => {
    if (!router.isReady) return;
    const key = canonicalLearningSearchURL(router.asPath);
    if (ownURLs.current.delete(key)) { setURLReady(true); return; }
    clearTimeout(urlTimer.current);
    restore(router.asPath);
  }, [router.isReady, router.asPath, initialCategory]);

  useEffect(() => {
    const restoreHistory = () => {
      clearTimeout(urlTimer.current);
      ownURLs.current.clear();
      restore(window.location.pathname + window.location.search + window.location.hash);
    };
    window.addEventListener("popstate", restoreHistory);
    return () => { clearTimeout(urlTimer.current); window.removeEventListener("popstate", restoreHistory); };
  }, [initialCategory]);

  function update(next) {
    const normalized = normalizeLearningSearch(next, initialCategory);
    if (sameLearningSearch(currentSearch.current, normalized)) return;
    ++request.current;
    currentSearch.current = normalized;
    setSearch(normalized); setData(null); setError("");
    clearTimeout(urlTimer.current);
    if (!router.isReady || !urlReady) return;
    urlTimer.current = setTimeout(() => {
      const latestRouter = currentRouter.current;
      const href = learningSearchURL(latestRouter.asPath, normalized, initialCategory);
      const key = canonicalLearningSearchURL(href);
      if (key === canonicalLearningSearchURL(latestRouter.asPath)) return;
      ownURLs.current.add(key);
      // Acknowledging our own URL update must not replace more recent typing.
      if (ownURLs.current.size > 20) ownURLs.current.delete(ownURLs.current.values().next().value);
      Promise.resolve(latestRouter.replace(href, undefined, { shallow: true, scroll: false }))
        .then(completed => { if (completed === false) ownURLs.current.delete(key); })
        .catch(() => ownURLs.current.delete(key));
    }, 220);
  }

  useEffect(() => {
    const version = ++request.current;
    if (!urlReady || !active) { setData(null); setError(""); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim(), category, type, country: category === "jagdrecht" ? country : "all", page: String(page) });
        const response = await fetch(`/api/lernen/suche?${params}`, { signal: controller.signal, cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "Die Suche konnte nicht geladen werden.");
        if (version === request.current && !controller.signal.aborted) {
          const lastPage = Number.isInteger(body.pages) && body.pages >= 0 ? Math.max(1, body.pages) : null;
          if (lastPage !== null && page > lastPage) update({ ...currentSearch.current, page: lastPage });
          else setData(body);
        }
      } catch (failure) { if (version === request.current && !controller.signal.aborted) { setData(null); setError(failure.message || "Die Suche ist nicht verfügbar."); } }
      finally { if (version === request.current && !controller.signal.aborted) setLoading(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, category, type, country, page, retry, active, urlReady]);
  function reset() { update(defaultLearningSearch(initialCategory)); }
  function change(field, value) { update({ ...currentSearch.current, [field]: value, page: 1 }); }
  const searchHref = learningSearchURL(router.asPath || "/lernen", search, initialCategory);
  return <section id="lernen-suche" className={styles.panel} aria-labelledby="all-search-title">
    <h2 id="all-search-title"><AppIcon name="search" size={25} />Alles im Lernbereich finden</h2>
    <p>Kurse, Wildarten, Fachbegriffe, Praxisübungen und einzelne Inhalte der Lernwerkzeuge gemeinsam durchsuchen.</p>
    <div className={styles.filters}>
      <label className={styles.query}>Suchbegriff<input type="search" maxLength={160} disabled={!urlReady} value={query} placeholder="Zum Beispiel Rehwild, Rückruf oder Kühlkette" onChange={event => change("query", event.target.value)} /></label>
      <label>Kategorie<select disabled={!urlReady} value={category} onChange={event => update({ ...currentSearch.current, category: event.target.value, country: "all", page: 1 })}><option value="all">Alle Kategorien</option>{learningCategoryDetails.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
      <label>Angebotsart<select disabled={!urlReady} value={type} onChange={event => change("type", event.target.value)}><option value="all">Alle Angebote</option>{Object.entries(types).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      {category === "jagdrecht" && <label>Land<select disabled={!urlReady} value={country} onChange={event => change("country", event.target.value)}><option value="all">Alle Länder</option><option value="DE">Deutschland</option><option value="AT">Österreich</option><option value="CH">Schweiz</option></select></label>}
    </div>
    <div className={styles.status} role="status" aria-live="polite">{!urlReady ? "Suche wird vorbereitet …" : loading ? "Suche läuft …" : data ? `${data.total} passende Angebote` : "Suchbegriff eingeben oder Angebotsart auswählen."}{active && <button type="button" onClick={reset}>Zurücksetzen</button>}</div>
    {urlReady && active && <p className={styles.searchLink}><a href={searchHref.includes("#") ? searchHref : `${searchHref}#lernen-suche`}>Link zu dieser Suche<AppIcon name="arrow-right" size={16} /></a><span>Die Auswahl bleibt im Link erhalten. Zum Teilen kannst du den Link kopieren.</span></p>}
    {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Erneut versuchen</button></div>}
    {!loading && data?.total === 0 && <p>Keine passenden Angebote gefunden. Versuche einen kürzeren Begriff oder eine andere Kategorie.</p>}
    {!loading && data && <ul className={styles.results}>{data.results.map(item => <li key={item.id}><Link href={item.href}><span className={styles.badges}>{types[item.type]} · {item.categories.map(slug => learningCategoryDetails.find(category => category.slug === slug)?.title).filter(Boolean).join(" / ")}</span><strong>{item.title}<AppIcon name="arrow-right" size={18} /></strong><span>{item.description}</span></Link></li>)}</ul>}
    {!loading && data?.pages > 1 && <nav className={styles.pages} aria-label="Suchergebnisse"><button type="button" disabled={page <= 1} onClick={() => update({ ...currentSearch.current, page: page - 1 })}>Zurück</button><span>Seite {page} von {data.pages}</span><button type="button" disabled={page >= data.pages} onClick={() => update({ ...currentSearch.current, page: page + 1 })}>Weiter</button></nav>}
  </section>;
}
