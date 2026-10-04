import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { filterNewsItems, formatNewsDate, newsRefreshSeconds, newsSources, newsTopics } from "../lib/news-catalog";
import styles from "../styles/JagdNews.module.css";
import learning from "../styles/LearningExperience.module.css";

const pageSize = 12;
const countryLabels = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz", DACH: "Deutschland · Österreich · Schweiz" };
const emptyNews = { items: [], sources: [], generatedAt: null, latestPublishedAt: null, refreshSeconds: newsRefreshSeconds };

export function useJagdNews(initialNews) {
  const [news, setNews] = useState(initialNews || emptyNews);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const activeRequest = useRef(null);
  const mounted = useRef(false);
  const currentNews = useRef(news);
  currentNews.current = news;

  const refresh = useCallback(async () => {
    if (activeRequest.current) return;
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), 15000);
    activeRequest.current = controller;
    setRefreshing(true);
    setRefreshError(false);
    try {
      const response = await fetch("/api/news", { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("News unavailable");
      const result = await response.json();
      if (!Array.isArray(result?.items) || !Array.isArray(result?.sources)) throw new Error("Invalid news response");
      if (mounted.current) {
        setNews(result);
        setRefreshed(true);
      }
    } catch (error) {
      if (mounted.current) setRefreshError(true);
    } finally {
      clearTimeout(requestTimeout);
      if (activeRequest.current === controller) activeRequest.current = null;
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialNews) return;
    setNews(initialNews);
    setRefreshError(false);
    setRefreshed(false);
  }, [initialNews]);

  useEffect(() => {
    mounted.current = true;
    const intervalMs = newsRefreshSeconds * 1000;
    const lastGenerated = Date.parse(currentNews.current.generatedAt);
    const firstDelay = Number.isFinite(lastGenerated) ? Math.min(intervalMs, Math.max(1000, intervalMs - (Date.now() - lastGenerated))) : intervalMs;
    let interval;
    const timeout = setTimeout(() => {
      refresh();
      interval = setInterval(refresh, intervalMs);
    }, firstDelay);
    const onVisibilityChange = () => {
      const generated = Date.parse(currentNews.current.generatedAt);
      if (document.visibilityState === "visible" && (!Number.isFinite(generated) || Date.now() - generated >= intervalMs)) refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      mounted.current = false;
      clearTimeout(timeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      activeRequest.current?.abort();
    };
  }, [refresh]);

  return { news, refresh, refreshing, refreshError, refreshed };
}

export function NewsCard({ item, compact = false, sourceSnapshot }) {
  const topic = newsTopics.find(value => value.id === item.topic);
  const source = newsSources.find(value => value.id === item.sourceId);
  return <article className={`${styles.card} ${compact ? styles.compactCard : ""}`}>
    <p className={styles.topic}><AppIcon name={topic?.icon || "book"} size={17} />{topic?.label || "Jagdwissen"}</p>
    <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}<AppIcon name="arrow-right" size={19} /></a></h3>
    <p className={styles.meta}><span>{item.sourceLabel}</span>{source?.country && <span className={styles.country}>{countryLabels[source.country] || source.country}</span>}</p>
    <p className={styles.date}><AppIcon name="calendar" size={15} /><span>Veröffentlicht: <time dateTime={item.publishedAt}>{formatNewsDate(item.publishedAt)}</time></span></p>
    {sourceSnapshot && <p className={styles.sourceFetched}>{sourceSnapshot.fetchedAt ? <>{sourceSnapshot.status === "ok" && !sourceSnapshot.stale ? "Quelle abgerufen: " : "Gespeicherter Quellenabruf: "}<time dateTime={sourceSnapshot.fetchedAt}>{formatNewsDate(sourceSnapshot.fetchedAt, { withTime: true })}</time></> : "Noch kein erfolgreicher Quellenabruf."}</p>}
    {!compact && topic?.description && <p className={styles.topicDescription}>{topic.description}</p>}
    <a className={styles.articleLink} href={item.url} target="_blank" rel="noopener noreferrer">Bei der Quelle lesen<AppIcon name="arrow-right" size={17} /></a>
  </article>;
}

export function NewsRefreshStatus({ news, refreshing, refreshError, refreshed }) {
  const sources = news.sources || [];
  const unavailable = sources.filter(source => source.status !== "ok" || source.stale);
  return <div className={styles.status}>
    {news.latestPublishedAt && <p><strong>Neueste Meldung:</strong> <time dateTime={news.latestPublishedAt}>{formatNewsDate(news.latestPublishedAt)}</time></p>}
    {news.generatedAt && <p>Übersicht zusammengestellt: <time dateTime={news.generatedAt}>{formatNewsDate(news.generatedAt, { withTime: true })}</time></p>}
    <p className={styles.refreshMessage} role="status" aria-live="polite">{refreshing ? "Meldungen werden abgerufen …" : refreshError ? "Der Abruf ist gerade nicht möglich. Bereits geladene Meldungen bleiben erhalten." : refreshed ? "Übersicht geladen. Veröffentlichungsdatum und Quellenabruf stehen bei den Meldungen und Quellen." : "Die Übersicht wird automatisch alle 30 Minuten abgerufen."}</p>
    {unavailable.length > 0 && <p className={styles.notice}>{unavailable.map(source => source.label).join(", ")}: derzeit kein erfolgreicher neuer Abruf. Gespeicherte Meldungen können weiterhin angezeigt werden; den letzten erfolgreichen Quellenabruf findest du unter „Quellen und Abrufstand“.</p>}
    {sources.length === 0 && news.items.length === 0 && <p className={styles.notice}>Aktuell sind keine Meldungen verfügbar. Du kannst den Abruf erneut versuchen.</p>}
  </div>;
}

export default function JagdNews({ initialNews }) {
  const { news, refresh, refreshing, refreshError, refreshed } = useJagdNews(initialNews);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(0);
  const matches = useMemo(() => filterNewsItems(news.items, { query, topic, source }), [news.items, query, topic, source]);
  const safePage = Math.min(page, Math.max(0, Math.ceil(matches.length / pageSize) - 1));
  const sourceSnapshots = news.sources || [];
  function reset() { setQuery(""); setTopic("all"); setSource("all"); setPage(0); }

  return <LearningToolLayout title="Jagdlatein – Wissen im Blick" description="Neue Forschung und Fachwissen zu Wissenschaft, Jagd und Natur aus Deutschland, Österreich und der Schweiz – mit direktem Link zur Originalquelle." icon="book" stats={[{ value: news.items.length, label: "Meldungen" }, { value: sourceSnapshots.length, label: "Quellen" }, { value: "30 Minuten", label: "Abrufintervall" }]}>
    <div className={learning.actions}><Link href="/" className={learning.secondary}><AppIcon name="home" size={19} />Zur Startseite</Link><button type="button" className={learning.primary} onClick={refresh} disabled={refreshing}><AppIcon name="calendar" size={19} />{refreshing ? "Wird geladen …" : "Meldungen aktualisieren"}</button></div>
    <section className={styles.intro} aria-labelledby="news-stand"><p className={styles.eyebrow}>Deutschland · Österreich · Schweiz</p><h2 id="news-stand">Wissenschaft · Jagd · Natur</h2><p>Wildtierforschung, Jagdwissen und neue Erkenntnisse über Lebensräume übersichtlich an einem Ort. Neue Fachmeldungen erscheinen beim nächsten automatischen Abruf, nachdem die eingebundenen Quellen sie bereitgestellt haben.</p><NewsRefreshStatus news={news} refreshing={refreshing} refreshError={refreshError} refreshed={refreshed} /></section>
    <section className={styles.filters} aria-labelledby="news-filter"><h2 id="news-filter">Meldungen finden</h2>
      <label className={styles.field}>News suchen<input type="search" maxLength={160} value={query} placeholder="Zum Beispiel Gams, Wildkrankheiten oder Lebensraum" onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      <div className={styles.filterRow}><label className={styles.field}>Thema<select value={topic} onChange={event => { setTopic(event.target.value); setPage(0); }}><option value="all">Alle Themen</option>{newsTopics.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label><label className={styles.field}>Quelle<select value={source} onChange={event => { setSource(event.target.value); setPage(0); }}><option value="all">Alle Quellen</option>{newsSources.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label><button type="button" className={learning.secondary} onClick={reset}>Filter zurücksetzen</button></div>
      <p className={styles.results} role="status">{matches.length} {matches.length === 1 ? "Meldung" : "Meldungen"}{matches.length > pageSize ? ` · Seite ${safePage + 1} von ${Math.ceil(matches.length / pageSize)}` : ""}</p>
    </section>
    <div className={styles.grid}>{matches.slice(safePage * pageSize, (safePage + 1) * pageSize).map(item => <NewsCard key={item.id} item={item} sourceSnapshot={sourceSnapshots.find(value => value.id === item.sourceId)} />)}</div>
    {matches.length === 0 && <p className={learning.empty}>{news.items.length === 0 ? "Noch keine Meldungen geladen. Bitte später erneut abrufen." : "Keine Meldung passt zu dieser Suche. Ändere das Thema oder die Quelle oder setze die Filter zurück."}</p>}
    {matches.length > pageSize && <nav className={styles.pagination} aria-label="Newsseiten"><button type="button" className={learning.secondary} disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Zurück</button><span>Seite {safePage + 1} von {Math.ceil(matches.length / pageSize)}</span><button type="button" className={learning.primary} disabled={(safePage + 1) * pageSize >= matches.length} onClick={() => setPage(safePage + 1)}>Weitere Meldungen</button></nav>}
    <section className={styles.sourcesPanel} aria-labelledby="news-sources"><h2 id="news-sources">Quellen und Abrufstand</h2><p>Hier siehst du, wann jede Quelle zuletzt erfolgreich abgerufen wurde. Das Datum einer Meldung ist ihr Veröffentlichungsdatum. Die fachliche Einordnung und der vollständige Beitrag stehen bei der Originalquelle.</p><ul className={styles.sourceList}>{newsSources.map(source => {
      const snapshot = sourceSnapshots.find(value => value.id === source.id);
      return <li key={source.id}><div><a href={source.homepage} target="_blank" rel="noopener noreferrer">{source.label}<AppIcon name="arrow-right" size={16} /></a><span className={styles.country}>{countryLabels[source.country] || source.country}</span></div><p>{snapshot?.fetchedAt ? <>Letzter erfolgreicher Abruf: <time dateTime={snapshot.fetchedAt}>{formatNewsDate(snapshot.fetchedAt, { withTime: true })}</time></> : "Noch kein erfolgreicher Abruf verfügbar."}</p>{snapshot?.lastPublishedAt && <p>Neueste Meldung dieser Quelle: <time dateTime={snapshot.lastPublishedAt}>{formatNewsDate(snapshot.lastPublishedAt)}</time></p>}<p className={snapshot?.status === "ok" && !snapshot?.stale ? styles.sourceOk : styles.sourceNotice}>{snapshot?.status === "ok" && !snapshot?.stale ? "Quelle erreichbar" : snapshot?.status === "fallback" || snapshot?.stale ? "Neuer Abruf nicht möglich · gespeicherter Stand" : "Quelle derzeit nicht verfügbar"}</p></li>;
    })}</ul></section>
  </LearningToolLayout>;
}
