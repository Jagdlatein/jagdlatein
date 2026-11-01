import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { filterLearningVideos, resolveVideoLibrarySelection, videoLibraryGroups } from "../lib/video-library-search";
import styles from "../styles/LearningVideoLibrary.module.css";

export default function LearningVideoLibrary({ videos }) {
  const router = useRouter();
  const ready = router.isReady === true;
  const selection = resolveVideoLibrarySelection(router.query);
  const addressKey = () => JSON.stringify([router.isReady === true, router.asPath, router.query, typeof window === "undefined" ? null : window.location?.hash]);
  const key = addressKey();
  const committed = useRef({ key });
  if (committed.current.key !== key) committed.current = { key };
  const origin = committed.current;
  const mounted = useRef(false);
  const navigation = useRef(0);
  const pending = useRef(null);
  const content = useRef(null);
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const draft = useRef(null);
  if (draft.current?.origin !== origin) draft.current = { origin, query: selection.query, group: selection.group };
  if (pending.current?.origin !== origin) pending.current = null;
  const [, setDraftRevision] = useState(0);
  const [failure, setFailure] = useState(null);
  const [loading, setLoading] = useState(null);
  const filters = draft.current;
  const matches = ready && selection.valid ? filterLearningVideos(videos, selection.query, selection.group) : [];
  const navigationError = failure?.origin === origin ? failure.message : "";
  const navigating = loading?.origin === origin && pending.current?.origin === origin;

  // Router state can change before React renders it. Detached handlers and
  // promise callbacks must also reject that interval, including hash changes.
  function currentOrigin() {
    if (!mounted.current || !ready || committed.current !== origin) return false;
    if (addressKey() !== key) {
      // Once an intervening address has been observed, returning to the same
      // bytes cannot revive callbacks captured before that navigation.
      committed.current = { key: null };
      cancelSelectionFocus();
      return false;
    }
    return true;
  }

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pending.current = null; };
  }, []);
  useEffect(() => {
    if (!currentOrigin()) return;
    if (!selection.valid) {
      const timer = setTimeout(() => { if (currentOrigin()) openPageMenu("video-query"); }, 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    focusSelection(content.current);
  }, [origin]);

  function changeDraft(field, value) {
    if (!currentOrigin()) return;
    draft.current = { ...draft.current, [field]: field === "query" ? value.slice(0, 160) : value };
    setDraftRevision(value => value + 1);
  }
  function showAll() {
    if (!currentOrigin()) return;
    draft.current = { origin, query: "", group: "all" };
    setDraftRevision(value => value + 1);
    applyFilters();
  }
  async function applyFilters() {
    if (!currentOrigin()) return;
    const { query, group } = draft.current;
    const cleanQuery = query.trim().slice(0, 160);
    if (!["all", ...videoLibraryGroups.map(item => item.id)].includes(group)) return;
    cancelSelectionFocus();
    setFailure(null);
    if (selection.valid && cleanQuery === selection.query && group === selection.group && pending.current === null) {
      closePageMenu(); focusSelection(content.current); return;
    }
    const request = ++navigation.current;
    const attempt = { origin, request };
    pending.current = attempt;
    setLoading({ origin, request });
    const current = () => currentOrigin() && pending.current === attempt && navigation.current === request;
    const finish = (showError = false) => {
      if (!current()) return;
      pending.current = null;
      setLoading(null);
      if (showError) {
        setFailure({ origin, message: "Die Videosuche konnte nicht geöffnet werden. Die angezeigten Aufnahmen bleiben erhalten. Bitte versuche es erneut." });
        openPageMenu("video-query");
      }
    };
    // Preserve incidental URL context; only this form's filters are replaced.
    const targetQuery = Object.fromEntries(Object.entries(router.query || {}).filter(([name, value]) =>
      !["q", "bereich"].includes(name) && (typeof value === "string" || Array.isArray(value) && value.every(part => typeof part === "string"))));
    if (group !== "all") targetQuery.bereich = group;
    if (cleanQuery) targetQuery.q = cleanQuery;
    const queryKey = value => JSON.stringify(Object.keys(value || {}).sort().map(name => [name, value[name]]));
    const sameAddress = queryKey(router.query) === queryKey(targetQuery)
      && !(router.asPath || "").includes("#") && (typeof window === "undefined" || !window.location?.hash);
    try {
      const accepted = await router.push({ pathname: "/lernen/videos", query: targetQuery }, undefined, { shallow: true, scroll: false });
      if (accepted === false) finish(true);
      else if (sameAddress && current()) {
        // Superseding a different pending target with the exact current URL
        // needs no new origin; the accepted address is already on screen.
        finish(); closePageMenu(); focusSelection(content.current);
      }
      // An accepted push can resolve before the URL commits. Keep its pending
      // identity until a new origin actually renders, or another request wins.
    } catch (error) {
      finish(!error?.cancelled);
    }
  }

  return <LearningToolLayout title="Jagdvideos zum Lernen" description="Originalaufnahmen zu Wildtieren und Hunden mit Beobachtungsfragen, Erklärungen und Quellen." icon="video" headingOnly>
    <PageMenu title="Lernvideos – Aufnahme finden" openInitially={ready && !selection.valid} initialFocusId="video-query">
      <form className={styles.filters} aria-label="Videos filtern" aria-busy={navigating || undefined} onSubmit={event => { event.preventDefault(); applyFilters(); }}>
        <label htmlFor="video-query">Videos durchsuchen<input id="video-query" type="search" maxLength={160} value={filters.query} disabled={!ready} onChange={event => changeDraft("query", event.target.value)} placeholder="Zum Beispiel Reh, Spurlaut oder Gefiederpflege" /></label>
        <label htmlFor="video-bereich">Bereich<select id="video-bereich" value={filters.group} disabled={!ready} onChange={event => changeDraft("group", event.target.value)}><option value="all">Alle Videos</option>{videoLibraryGroups.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <div className={styles.filterActions}><button type="submit" disabled={!ready}>Videos finden</button><button type="button" disabled={!ready} onClick={showAll}>Alle Videos anzeigen</button></div>
      </form>
      {navigationError && <p className={styles.empty} role="alert">{navigationError}</p>}
      {navigating && <p role="status">Die Videosuche wird geöffnet …</p>}
    </PageMenu>
    <p className={styles.intro}>Eine Aufnahme auswählen und direkt ansehen. Zu jeder Szene siehst du, worauf es beim Lernen ankommt. Die Erklärungen trennen sichtbare Beobachtung und fachlichen Hintergrund. Alle Aufnahmen haben einen Herkunfts- und Lizenznachweis; sie starten erst, wenn du sie abspielst.</p>
    <div id="video-ergebnisse" ref={content} tabIndex={-1}>
      {!ready ? <p role="status">Die Videosuche wird geladen.</p> : !selection.valid ? <p className={styles.empty} role="alert">{selection.error}</p> : <>
        <p className={styles.count} role="status" data-video-results="true">{matches.length} {matches.length === 1 ? "Aufnahme" : "Aufnahmen"}{selection.query && <> für „{selection.query}“</>}{selection.group !== "all" && <> · {videoLibraryGroups.find(item => item.id === selection.group).title}</>}</p>
        {videoLibraryGroups.map(section => {
          const items = matches.filter(item => item.group === section.id);
          return items.length > 0 && <section className={styles.group} key={section.id} aria-labelledby={`video-group-${section.id}`}>
            <h2 id={`video-group-${section.id}`}>{section.title}</h2>
            <ul>{items.map(item => <li key={item.id} data-video-id={item.id}>
              <Link className={styles.videoLink} href={item.href} prefetch={false}>
                <img src={item.poster} alt="" loading="lazy" decoding="async" width="240" height="135" />
                <span><strong>{item.title}</strong><span>{item.subject} · ca. {Math.ceil(item.duration)} Sekunden</span><span className={styles.focus}>{item.focus}</span></span><AppIcon name="arrow-right" size={19} />
              </Link>
              {item.courses?.length > 0 && <nav className={styles.courses} aria-label={`Zu ${item.title} weiterlernen`}>{item.courses.slice(0, 2).map(course => <Link key={course.href} href={course.href} prefetch={false}>{course.title}</Link>)}</nav>}
            </li>)}</ul>
          </section>;
        })}
        {matches.length === 0 ? <p className={styles.empty}>Keine Aufnahme passt zu dieser Suche. Ändere den Suchbegriff oder den Bereich unten im Menü.</p> : <details className={styles.credits} id="video-bildnachweise">
          <summary>Quellen und Bildnachweise</summary>
          <p>Die Vorschaubilder sind Standbilder der jeweiligen Originalaufnahme. Sie wurden für die Anzeige verkleinert. Die vollständigen Nachweise und Erklärungen stehen zusätzlich am Ende jedes Videofalls.</p>
          <ul>{matches.map(item => <li key={item.id}><strong>{item.title}</strong>: {item.credit.author} · <a href={item.credit.licenseUrl} target="_blank" rel="noopener noreferrer">{item.credit.license}</a> · <a href={item.credit.source} target="_blank" rel="noopener noreferrer">Originalquelle</a></li>)}</ul>
        </details>}
      </>}
    </div>
  </LearningToolLayout>;
}
