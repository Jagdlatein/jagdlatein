import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { communityCategories, communityRules } from "../lib/community-catalog";
import styles from "../styles/Community.module.css";
import learning from "../styles/LearningExperience.module.css";

export function CommunityInvite({ category, context }) {
  const href = { pathname: "/community", query: { ...(category ? { category } : {}), ...(context ? { thema: context.slice(0, 120) } : {}) } };
  return <section className={styles.invite} aria-label="Gemeinsam lernen"><span className={styles.inviteIcon}><AppIcon name="community" size={32} /></span><div><p className={styles.eyebrow}>Gemeinsam weiterkommen</p><h2>Deine Jagdlatein-Community</h2><p>Fragen stellen, Zusammenhänge besprechen und Erfahrungen mit anderen Lernenden austauschen.</p><Link href={href} className={learning.secondary}>Zur Community<AppIcon name="arrow-right" size={19} /></Link></div></section>;
}

function displayDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("de-CH", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Zurich" }).format(date) : "";
}
function categoryName(slug) { return communityCategories.find(category => category.slug === slug)?.title || "Allgemeiner Austausch"; }
function Rules() {
  return <details className={styles.rules}><summary>So lernen wir gemeinsam</summary><p>Community-Beiträge stammen von Lernenden. Prüfe fachliche Aussagen anhand verlässlicher Quellen und nutze für Lernwissen auch die geprüften Lerneinheiten.</p><ul>{communityRules.map(rule => <li key={rule.title}><strong>{rule.title}:</strong> {rule.text}</li>)}</ul></details>;
}

function focusSection(id) {
  const element = document.getElementById(id);
  if (!element) return false;
  element.scrollIntoView({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  element.focus({ preventScroll: true });
  return true;
}

function CommunityToolbar({ threadId, view, viewer, compose, loading, busy, onView, onCompose, onReload }) {
  return <div className={styles.toolbar}>
    <div className={styles.toolbarMain}>
      {threadId && <Link className={learning.secondary} href="/community"><AppIcon name="arrow-left" size={18} />Alle Themen</Link>}
      {!threadId && viewer && !compose && <button className={learning.primary} type="button" onClick={onCompose} disabled={busy}><AppIcon name="community" size={18} />Frage stellen</button>}
      {!threadId && !compose && <nav className={styles.viewNav} aria-label="Community-Ansicht">
        <button type="button" aria-pressed={view === "posts"} onClick={() => onView("posts")} disabled={busy}>Alle Themen</button>
        <button type="button" aria-pressed={view === "submissions"} onClick={() => onView("submissions")} disabled={busy}>Meine Einreichungen</button>
      </nav>}
    </div>
    {!compose && <details className={styles.utilityMenu}><summary>Weitere Optionen</summary><div className={styles.toolbarTools}>
      <button className={learning.secondary} type="button" onClick={onReload} disabled={loading || busy}>Aktualisieren</button>
      {!threadId && <button className={learning.secondary} type="button" aria-pressed={view === "blocks"} onClick={() => onView("blocks")} disabled={busy}>Blockierte Nutzer</button>}
      {!threadId && viewer?.canModerate === true && <>
        <button className={learning.secondary} type="button" aria-pressed={view === "moderation"} onClick={() => onView("moderation")} disabled={busy}>Neue Beiträge prüfen</button>
        <button className={learning.secondary} type="button" aria-pressed={view === "reports"} onClick={() => onView("reports")} disabled={busy}>Gemeldete Beiträge prüfen</button>
      </>}
    </div></details>}
  </div>;
}

function CommunitySearch({ query, category, type, unanswered, search, total, loading, onQuery, onCategory, onType, onUnanswered, onSearch, onReset }) {
  const filtered = Boolean(search || category !== "all" || type !== "all" || unanswered);
  return <section className={`${learning.panel} ${styles.searchPanel}`} aria-labelledby="community-search-heading">
    <h2 id="community-search-heading">Themen finden</h2>
    <form onSubmit={event => { event.preventDefault(); onSearch(); }} className={styles.searchRow}>
      <label className={learning.field}>Community durchsuchen<input type="search" maxLength={160} value={query} onChange={event => onQuery(event.target.value)} placeholder="Zum Beispiel Gams oder Jagdhunde" enterKeyHint="search" /></label>
      <button className={learning.secondary} type="submit"><AppIcon name="search" size={18} />Treffer anzeigen</button>
    </form>
    <details className={styles.filtersDetails} open={category !== "all" || type !== "all" || unanswered}>
      <summary>Themen eingrenzen{category !== "all" || type !== "all" || unanswered ? " · Filter aktiv" : ""}</summary>
      <div className={styles.formRow}>
        <label className={learning.field}>Themenbereich<select value={category} onChange={event => onCategory(event.target.value)}><option value="all">Alle Themenbereiche</option>{communityCategories.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
        <label className={learning.field}>Beitragsart<select value={type} onChange={event => onType(event.target.value)}><option value="all">Fragen und Austausch</option><option value="question">Fragen</option><option value="discussion">Austausch</option></select></label>
      </div>
      <label className={styles.checkbox}><input type="checkbox" checked={unanswered} onChange={event => onUnanswered(event.target.checked)} />Nur Fragen ohne Antwort</label>
    </details>
    <div className={styles.resultSummary}>
      <p role="status" aria-live="polite">{loading ? "Themen werden gesucht …" : `${total} ${total === 1 ? "Thema" : "Themen"}${search ? ` für „${search}“` : ""}`}</p>
      {filtered && <button className={styles.textButton} type="button" onClick={onReset}>Auswahl zurücksetzen</button>}
    </div>
  </section>;
}

function useCommunityData({ signedIn, threadId, category, query, page, type, unanswered, view }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(signedIn);
  const [revision, setRevision] = useState(0);
  const selection = JSON.stringify([threadId, category, query, page, type, unanswered, view]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!signedIn) { setLoading(false); return; }
    const controller = new AbortController();
    let cancelled = false;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoading(true); setError(null);
    const parameters = new URLSearchParams({ page: String(page) });
    if (threadId) parameters.set("thread", threadId);
    else if (["reports", "blocks", "moderation", "submissions"].includes(view)) parameters.set("view", view);
    else { parameters.set("category", category); parameters.set("query", query); parameters.set("type", type); if (unanswered) parameters.set("unanswered", "1"); }
    (async () => {
      try {
        const response = await fetch(`/api/community?${parameters}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw result;
        if (!cancelled) setData({ result, selection });
      } catch (problem) { if (!cancelled) setError({ message: problem?.name === "AbortError" ? "Der Abruf dauert gerade zu lange. Bitte erneut versuchen." : problem?.message || "Die Community ist gerade nicht erreichbar. Bitte erneut versuchen.", code: problem?.code, setupRequired: problem?.setupRequired }); }
      finally { clearTimeout(timeout); if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [signedIn, threadId, category, query, page, type, unanswered, view, revision]);
  return { data: signedIn && data?.selection === selection ? data.result : null, viewer: signedIn ? data?.result?.viewer : null, loading: loading || (signedIn && data?.selection !== selection && !error), error, reload };
}

function ProfileForm({ onSubmit, busy, onCancel }) {
  const [name, setName] = useState(""); const [accepted, setAccepted] = useState(false);
  return <section className={`${learning.panel} ${styles.composePanel}`} id="community-compose" tabIndex={-1} aria-labelledby="community-profile-heading"><h2 id="community-profile-heading">Einmal deinen Lernnamen wählen</h2><p>Zum Mitlesen brauchst du keinen Lernnamen. Zum Schreiben wählst du ihn einmal aus. Andere Lernende sehen deinen Lernnamen; deine E-Mail-Adresse wird in der Community nicht angezeigt.</p><form onSubmit={event => { event.preventDefault(); onSubmit({ action: "profile", displayName: name.trim(), acceptedRules: accepted }); }}><label className={learning.field}>Anzeigename<input required minLength={3} maxLength={30} autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} disabled={busy} placeholder="Zum Beispiel Waldlerner90" aria-describedby="community-name-hint" /></label><p className={styles.hint} id="community-name-hint">3–30 Zeichen: Buchstaben, Zahlen, Leerzeichen, Punkt, Unterstrich oder Bindestrich. Jagdlatein, Admin, Moderator und Support sind reserviert. Dein Lernname bleibt deinem Profil zugeordnet.</p><Rules /><label className={styles.checkbox}><input required type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy} />Ich habe die Community-Regeln gelesen und halte sie ein.</label><div className={learning.actions}><button className={learning.primary} disabled={busy || !accepted}>{busy ? "Wird gespeichert …" : "Community-Profil anlegen"}</button>{onCancel && <button className={learning.secondary} type="button" disabled={busy} onClick={onCancel}>Abbrechen</button>}</div></form></section>;
}

function Compose({ initialCategory, initialTitle = "", threadId, onSubmit, busy, onCancel }) {
  const [category, setCategory] = useState(initialCategory === "all" ? "allgemein" : initialCategory);
  const [type, setType] = useState("question"); const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(""); const [accepted, setAccepted] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const result = await onSubmit(threadId ? { action: "reply", threadId, body, acceptedRules: accepted } : { action: "post", category, type, title, body, acceptedRules: accepted });
    if (result) { setBody(""); setAccepted(false); }
  }
  return <section className={`${learning.panel} ${styles.composePanel}`} id="community-compose" tabIndex={-1} aria-labelledby="community-compose-heading"><h2 id="community-compose-heading">{threadId ? "Deine Antwort" : "Deine Frage stellen"}</h2><form onSubmit={submit}>
    {!threadId && <label className={learning.field}>Titel<input required minLength={8} maxLength={140} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} placeholder="Welche Frage möchtest du klären?" aria-describedby="community-title-hint" /><span className={styles.hint} id="community-title-hint">8–140 Zeichen · Fasse dein Thema kurz zusammen.</span></label>}
    <label className={learning.field}>{threadId ? "Antwort" : "Beschreibung"}<textarea required minLength={threadId ? 2 : 10} maxLength={threadId ? 4000 : 6000} value={body} onChange={event => setBody(event.target.value)} disabled={busy} placeholder={threadId ? "Schreibe deine Antwort und nenne bei fachlichen Aussagen eine Quelle." : "Was möchtest du wissen? Beschreibe kurz, wo du noch unsicher bist."} aria-describedby="community-body-hint" /></label><p className={styles.hint} id="community-body-hint">{body.length} / {threadId ? 4000 : 6000} Zeichen · Keine persönlichen Daten oder genauen Revierstandorte.</p>
    {!threadId && <details className={styles.composeOptions}><summary>{categoryName(category)} · {type === "question" ? "Frage" : "Austausch"} · ändern</summary><div className={styles.formRow}><label className={learning.field}>Themenbereich<select value={category} onChange={event => setCategory(event.target.value)} disabled={busy}>{communityCategories.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label><label className={learning.field}>Beitragsart<select value={type} onChange={event => setType(event.target.value)} disabled={busy}><option value="question">Frage</option><option value="discussion">Austausch</option></select></label></div></details>}
    <p className={styles.composerStatus}>Neue Themen und Antworten werden vor der Veröffentlichung geprüft. Bis zur Freigabe sehen nur du und die Moderation deinen Beitrag.</p><label className={styles.checkbox}><input required type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy} />Mein Beitrag hält die Community-Regeln ein.</label><div className={learning.actions}><button className={learning.primary} disabled={busy || !accepted}>{busy ? "Wird gesendet …" : "Zur Prüfung einreichen"}</button>{onCancel && <button className={learning.secondary} type="button" onClick={onCancel} disabled={busy}>Abbrechen</button>}</div>
  </form></section>;
}

function PostActions({ post, admin, busy, mutate, setReport, setRemoval, setBlock }) {
  return <details className={styles.postActionsDetails}><summary>{post.owned ? "Beitrag verwalten" : "Beitrag melden oder Nutzer blockieren"}</summary><div className={styles.postActions}>{post.owned && <button type="button" onClick={() => setRemoval(post.id)} disabled={busy}>Eigenen Beitrag entfernen</button>}{!post.owned && <><button type="button" onClick={() => setReport(post.id)} disabled={busy}>Beitrag melden</button><button type="button" onClick={() => setBlock({ postId: post.id, displayName: post.displayName })} disabled={busy}>Nutzer blockieren</button></>}{admin && <button type="button" onClick={() => mutate({ action: "moderate", postId: post.id, status: post.status === "hidden" ? "visible" : "hidden" }, "PATCH")} disabled={busy}>{post.status === "hidden" ? "Wieder anzeigen" : "Ausblenden"}</button>}</div></details>;
}

function PostContent({ post, admin, busy, mutate, setReport, setRemoval, setBlock }) {
  if (post.status === "pending") return <CommunitySubmission post={post} admin={admin} busy={busy} mutate={mutate} setRemoval={setRemoval} />;
  return <article className={styles.post}><div className={styles.postMeta}><strong>{post.displayName}</strong><time dateTime={post.createdAt}>{displayDate(post.createdAt)}</time>{post.status === "hidden" && <span>Ausgeblendet</span>}</div><p className={styles.body}>{post.body}</p><PostActions {...{ post, admin, busy, mutate, setReport, setRemoval, setBlock }} /></article>;
}

export function CommunitySubmission({ post, admin = false, busy = false, mutate, setRemoval }) {
  return <article className={styles.post}><h3>{post.title || "Antwort zu einem Thema"}</h3><p><strong>Öffentlicher Lernname:</strong> {post.displayName}</p><time dateTime={post.createdAt}>{displayDate(post.createdAt)}</time><p className={styles.body}>{post.body}</p><p>{post.status === "pending" ? "Wartet auf Prüfung · noch nicht öffentlich" : "Nicht freigegeben · nicht öffentlich"}</p>{admin && post.status === "pending" && <><p>Prüfe den Beitrag und den angezeigten Lernnamen auf die Community-Regeln. Eine Freigabe ist kein fachliches Prüfsiegel.</p>{post.canApprove === false && <p>Das Thema ist nicht öffentlich oder zwischen den beteiligten Profilen besteht eine Blockierung. Die Antwort kann derzeit nicht freigegeben werden.</p>}<div className={learning.actions}><button className={learning.primary} disabled={busy || post.canApprove === false} aria-label={`Beitrag von ${post.displayName} freigeben`} onClick={() => mutate({ action: "moderate", postId: post.id, status: "visible" }, "PATCH")}>Freigeben</button><button className={learning.secondary} disabled={busy} aria-label={`Beitrag von ${post.displayName} ablehnen`} onClick={() => mutate({ action: "moderate", postId: post.id, status: "hidden" }, "PATCH")}>Ablehnen</button></div></>}{post.owned && <button className={learning.secondary} disabled={busy} onClick={() => setRemoval(post.id)}>Eigenen Beitrag entfernen</button>}</article>;
}

export default function Community({ signedIn = false, threadId, initialCategory = "all", context = "" }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory); const [query, setQuery] = useState(""); const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); const [type, setType] = useState("all"); const [unanswered, setUnanswered] = useState(false); const [view, setView] = useState("posts");
  const [compose, setCompose] = useState(Boolean(context)); const [busy, setBusy] = useState(false); const [mutationError, setMutationError] = useState(null); const [notice, setNotice] = useState("");
  const [report, setReportState] = useState(null); const [reportReason, setReportReason] = useState(""); const [removal, setRemovalState] = useState(null);
  const [block, setBlockState] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const resultFocusRequested = useRef(false);
  useEffect(() => {
    const target = mutationError ? "community-error" : notice ? "community-notice" : report ? "community-report" : removal ? "community-removal" : block ? "community-block-confirmation" : null;
    if (target) setFocusTarget(target);
  }, [mutationError, notice, report, removal, block]);
  const { data, viewer, loading, error, reload } = useCommunityData({ signedIn, threadId, category, query: search, page, type, unanswered, view });
  const canPost = Boolean(viewer && !viewer.profileRequired && viewer.displayName); const admin = viewer?.canModerate === true;
  const sessionNeedsRenewal = ["SESSION_RENEWAL_REQUIRED", "AUTH_REQUIRED"].includes(error?.code);
  useEffect(() => {
    if (focusTarget && !loading && focusSection(focusTarget)) setFocusTarget(null);
  }, [focusTarget, loading, data, compose, viewer]);
  useEffect(() => {
    if (compose && viewer && !loading) focusSection("community-compose");
  }, [compose, viewer?.profileRequired]);
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query.replace(/[\u0000-\u001f\u007f]/g, " ").trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (resultFocusRequested.current && !loading && data) {
      resultFocusRequested.current = false;
      focusSection("community-results");
    }
  }, [loading, data]);
  useEffect(() => { if (error) setFocusTarget("community-load-error"); }, [error]);
  const initialQuery = new URLSearchParams({ ...(initialCategory !== "all" ? { category: initialCategory } : {}), ...(context ? { thema: context } : {}) }).toString();
  const next = threadId ? `/community/${threadId}` : `/community${initialQuery ? `?${initialQuery}` : ""}`;
  useEffect(() => { setCategory(initialCategory); setCompose(Boolean(context)); setPage(1); setReport(null); setRemoval(null); setBlock(null); setNotice(""); setMutationError(null); setFocusTarget(context ? "community-compose" : null); resultFocusRequested.current = false; }, [initialCategory, context, threadId]);
  async function mutate(body, method = "POST") {
    if (busy) return null;
    setBusy(true); setMutationError(null); setNotice("");
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/community", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      const result = await response.json(); if (!response.ok) throw result;
      if (["post", "reply"].includes(body.action) && result.status === "pending") { setCompose(false); if (!threadId) { setView("submissions"); setPage(1); } reload(); setNotice("Dein Beitrag wartet auf Prüfung. Bis zur Freigabe sehen ihn nur du und die Moderation."); }
      else if (body.action === "post") { await router.push(`/community/${result.postId}`); }
      else if (body.action === "block" && threadId) { await router.push("/community"); }
      else if (method === "DELETE" && body.postId === threadId) { await router.push("/community"); }
      else { reload(); setNotice(body.action === "report" ? "Deine Meldung wurde zur Prüfung gespeichert." : body.action === "profile" ? "Dein Community-Profil ist bereit." : body.action === "block" ? "Der Nutzer ist blockiert. Ihr seht die Beiträge des jeweils anderen nicht mehr." : body.action === "unblock" ? "Die Blockierung ist aufgehoben." : method === "DELETE" ? "Dein Beitrag wurde entfernt." : "Gespeichert."); }
      setReport(null); setReportReason(""); setRemoval(null); setBlock(null); return result;
    } catch (problem) { setMutationError(problem?.message || "Das Speichern ist gerade nicht möglich. Dein Text bleibt erhalten; bitte erneut versuchen."); return null; }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  function changeQuery(value) { resultFocusRequested.current = false; if (focusTarget === "community-results") setFocusTarget(null); setQuery(value); }
  function changeFilter(setter, value) { resultFocusRequested.current = false; setter(value); setPage(1); }
  function setReport(value) { setReportState(value); if (value) { setNotice(""); setMutationError(null); setRemovalState(null); setBlockState(null); if (value !== report) setReportReason(""); } }
  function setRemoval(value) { setRemovalState(value); if (value) { setNotice(""); setMutationError(null); setReportState(null); setBlockState(null); } }
  function setBlock(value) { setBlockState(value); if (value) { setNotice(""); setMutationError(null); setReportState(null); setRemovalState(null); } }
  function reset() { resultFocusRequested.current = false; setCategory("all"); setQuery(""); setSearch(""); setType("all"); setUnanswered(false); setPage(1); }
  function showResults() {
    const value = query.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    setSearch(value); setPage(1);
    resultFocusRequested.current = true;
    if (value === search && page === 1 && !loading && data) {
      resultFocusRequested.current = false;
      focusSection("community-results");
    }
  }
  function changeView(value) {
    resultFocusRequested.current = false;
    setView(value); setPage(1); setBlock(null); setReport(null); setRemoval(null);
    setNotice(""); setMutationError(null); setFocusTarget("community-view");
  }
  function startCompose() {
    resultFocusRequested.current = false;
    setView("posts"); setPage(1); setCompose(true); setFocusTarget("community-compose");
    setMutationError(null); setNotice("");
  }
  function cancelCompose() { setCompose(false); setMutationError(null); setFocusTarget(threadId ? "community-replies" : "community-results"); }
  const posts = data?.posts || []; const replies = data?.replies || []; const thread = data?.thread;
  const total = threadId ? data?.replyTotal || 0 : data?.total || 0; const size = data?.pageSize || (threadId || ["reports", "moderation", "submissions"].includes(view) ? 20 : 12);
  const pages = Math.max(1, Math.ceil(total / size));
  useEffect(() => { if (!loading && data && page > pages) setPage(pages); }, [loading, data, page, pages]);
  return <LearningToolLayout title={thread?.title || "Jagdlatein-Community"} description="Fragen finden, Wissen teilen und gemeinsam lernen." eyebrow="Gemeinsam lernen" icon="community" hideCommunity compact>
    {signedIn && <CommunityToolbar {...{ threadId, view, viewer, compose, loading, busy }} onView={changeView} onCompose={startCompose} onReload={reload} />}
    {!signedIn ? <section className={learning.panel}><h2>Hier lernst du mit anderen</h2><p>Ob Jagdhunde, Wildkunde, Natur oder Prüfungsvorbereitung: Tausche dich mit anderen Lernenden aus. Zum Lesen und Schreiben meldest du dich mit deinem Jagdlatein-Konto an. Die Community benötigt kein aktives Abo.</p><div className={styles.benefits}><span><AppIcon name="community" />Fragen und Antworten</span><span><AppIcon name="book" />Alle Lernkategorien</span><span><AppIcon name="shield" />Eigener Anzeigename</span></div><Link className={learning.primary} href={`/login?next=${encodeURIComponent(next)}`}>Anmelden und mitlernen<AppIcon name="arrow-right" size={18} /></Link></section> : <>
      {mutationError && <p id="community-error" tabIndex={-1} role="alert" className={`${styles.error} ${styles.errorFocus}`}>{mutationError}</p>}{notice && <p id="community-notice" tabIndex={-1} role="status" className={`${styles.notice} ${styles.confirmation}`}>{notice}</p>}
      {loading && (!viewer || (!compose && (threadId || view !== "posts"))) && <p role="status">Community wird geladen …</p>}{error && <section id="community-load-error" tabIndex={-1} className={`${styles.error} ${styles.errorFocus}`} role="alert"><h2>{error.setupRequired ? "Die Community wird vorbereitet" : "Community nicht erreichbar"}</h2><p>{error.message}</p>{error.code === "SESSION_RENEWAL_REQUIRED" || error.code === "AUTH_REQUIRED" ? <Link href={`/login?next=${encodeURIComponent(next)}`}>Erneut anmelden</Link> : <button className={learning.secondary} onClick={reload}>Erneut versuchen</button>}</section>}
      {compose && viewer?.profileRequired && <ProfileForm onSubmit={mutate} busy={busy || sessionNeedsRenewal} onCancel={cancelCompose} />}
      {compose && canPost && <Compose key={threadId || `${initialCategory}:${context}`} initialCategory={category} initialTitle={context ? `Frage zu ${context}`.slice(0, 140) : ""} threadId={threadId} onSubmit={mutate} busy={busy || sessionNeedsRenewal} onCancel={cancelCompose} />}
      {!error && (data || viewer) && <>
        {!compose && !threadId && ["moderation", "submissions"].includes(view) && <section id="community-view" tabIndex={-1} className={`${learning.panel} ${styles.confirmation}`}><h2>{view === "moderation" ? "Neue Beiträge prüfen" : "Meine Einreichungen"}</h2><p>{view === "moderation" ? "Diese Warteschlange ist nur für die Moderation sichtbar. Prüfe auch den öffentlichen Lernnamen; Freigaben bestätigen die Community-Regeln, keine fachliche Richtigkeit." : "Hier siehst du deine noch nicht freigegebenen Themen und Antworten. Freigegebene Beiträge findest du in der Themenübersicht."}</p>{posts.map(post => <CommunitySubmission key={post.id} post={post} admin={view === "moderation" && admin} busy={busy} mutate={mutate} setRemoval={setRemoval} />)}{!loading && posts.length === 0 && <p>{view === "moderation" ? "Keine neuen Beiträge warten auf Prüfung." : "Du hast keine offenen oder abgelehnten Einreichungen."}</p>}</section>}
        {!compose && view === "blocks" && !threadId && <section id="community-view" tabIndex={-1} className={`${learning.panel} ${styles.confirmation}`}><h2>Blockierte Nutzer</h2><p>Ihr seht die Beiträge des jeweils anderen nicht mehr und könnt nicht aufeinander antworten. Eine Blockierung kannst du hier aufheben. Für eine Prüfung durch die Moderation melde den betreffenden Beitrag zusätzlich.</p>{(data?.blocks || []).map(item => <article className={styles.post} key={item.id}><h3>{item.displayName}</h3><p>Blockiert am {displayDate(item.createdAt)}</p><button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "unblock", blockId: item.id }, "PATCH")}>Blockierung aufheben</button></article>)}{!loading && !(data?.blocks || []).length && <p>Du hast keine Nutzer blockiert.</p>}</section>}
        {!compose && !threadId && view === "posts" && <div id="community-view" tabIndex={-1} className={styles.confirmation}>
          <CommunitySearch {...{ query, category, type, unanswered, search, total, loading }} onQuery={changeQuery} onCategory={value => changeFilter(setCategory, value)} onType={value => changeFilter(setType, value)} onUnanswered={value => changeFilter(setUnanswered, value)} onSearch={showResults} onReset={reset} />
          <section id="community-results" tabIndex={-1} className={styles.confirmation} aria-label="Gefundene Community-Themen">
            <div className={styles.topics}>{posts.map(post => <article className={styles.topicCard} key={post.id}><div className={styles.badges}><span>{categoryName(post.category)}</span><span>{post.type === "question" ? "Frage" : "Austausch"}</span>{post.solved && <span className={styles.solved}>Als geklärt markiert</span>}</div><h2><Link className={styles.topicLink} href={`/community/${post.id}`}>{post.title}<AppIcon name="arrow-right" size={20} /></Link></h2><p className={styles.preview}>{post.body.slice(0, 220)}{post.body.length > 220 ? " …" : ""}</p><div className={styles.postMeta}><span>{post.displayName}</span><time dateTime={post.createdAt}>{displayDate(post.createdAt)}</time><span>{post.replyCount || 0} {post.replyCount === 1 ? "Antwort" : "Antworten"}</span></div><PostActions {...{ post, admin, busy, mutate, setReport, setRemoval, setBlock }} /></article>)}</div>
            {!loading && posts.length === 0 && <section className={learning.panel}><h2>{search || category !== "all" || type !== "all" || unanswered ? "Keine passenden Themen" : "Hier beginnt euer Austausch"}</h2><p>{search || category !== "all" || type !== "all" || unanswered ? "Ändere die Auswahl oder stelle deine eigene Frage." : "Stelle die erste Frage oder teile einen Lernansatz."}</p>{viewer && <button className={learning.primary} onClick={startCompose}>Frage stellen</button>}</section>}
          </section>
        </div>}
        {!compose && threadId && thread && <><div className={styles.badges}><span>{categoryName(thread.category)}</span><span>{thread.type === "question" ? "Frage" : "Austausch"}</span>{thread.solved && <span className={styles.solved}>Als geklärt markiert</span>}</div><PostContent post={thread} {...{ admin, busy, mutate, setReport, setRemoval, setBlock }} />{thread.status === "visible" && thread.type === "question" && (thread.owned || admin) && <button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "mark-solved", postId: thread.id, solved: !thread.solved }, "PATCH")}>{thread.solved ? "Frage wieder öffnen" : "Frage als geklärt markieren"}</button>}<section id="community-replies" tabIndex={-1} className={styles.confirmation} aria-label="Antworten"><div className={styles.filterFooter}><h2>{total} {total === 1 ? "Antwort" : "Antworten"}</h2>{viewer && thread.status === "visible" && <button className={learning.primary} type="button" onClick={startCompose}>Antwort schreiben</button>}</div>{replies.map(post => <PostContent key={post.id} post={post} {...{ admin, busy, mutate, setReport, setRemoval, setBlock }} />)}{replies.length === 0 && !loading && <p>Noch keine Antwort. Teile dein Wissen und nenne passende Quellen.</p>}</section></>}
        {!compose && view === "reports" && admin && <section id="community-view" tabIndex={-1} className={`${learning.panel} ${styles.confirmation}`}><h2>Gemeldete Beiträge</h2>{(data?.reports || []).map(item => <article className={styles.post} key={item.id}><h3>{item.post?.title || "Gemeldeter Beitrag"}</h3><p className={styles.body}>{item.post?.body}</p><p><strong>Meldungsgrund:</strong> {item.reason}</p><time dateTime={item.createdAt}>{displayDate(item.createdAt)}</time><div className={learning.actions}><button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "moderate", postId: item.postId || item.post?.id, status: "hidden" }, "PATCH")}>Beitrag ausblenden</button><button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "resolve-report", reportId: item.id }, "PATCH")}>Meldung als geprüft markieren</button></div></article>)}{!loading && !(data?.reports || []).length && <p>Keine offenen Meldungen.</p>}</section>}
        {!compose && pages > 1 && <nav className={styles.pagination} aria-label="Community-Seiten"><button className={learning.secondary} disabled={page <= 1 || loading} onClick={() => { setPage(value => value - 1); setFocusTarget(threadId ? "community-replies" : view === "posts" ? "community-results" : "community-view"); }}>Zurück</button><span>Seite {page} von {pages}</span><button className={learning.secondary} disabled={page >= pages || loading} onClick={() => { setPage(value => value + 1); setFocusTarget(threadId ? "community-replies" : view === "posts" ? "community-results" : "community-view"); }}>Weiter</button></nav>}
      </>}
      {removal && <section id="community-removal" tabIndex={-1} className={`${styles.notice} ${styles.confirmation}`} aria-label="Entfernen bestätigen"><h2>Eigenen Beitrag entfernen?</h2><p>Der Beitrag wird aus der Community entfernt.{removal === threadId ? " Dazu gehören auch die Antworten zu diesem Thema." : ""}</p><div className={learning.actions}><button className={learning.secondary} disabled={busy} onClick={() => setRemoval(null)}>Abbrechen</button><button className={learning.primary} disabled={busy} onClick={() => mutate({ postId: removal }, "DELETE")}>Beitrag entfernen</button></div></section>}
      {block && <section id="community-block-confirmation" tabIndex={-1} className={`${styles.notice} ${styles.confirmation}`} aria-label="Blockierung bestätigen"><h2>{block.displayName} blockieren?</h2><p>Ihr seht die Beiträge des jeweils anderen nicht mehr und könnt nicht aufeinander antworten. Unter „Blockierte Nutzer“ kannst du das später aufheben.</p><div className={learning.actions}><button className={learning.secondary} disabled={busy} onClick={() => setBlock(null)}>Abbrechen</button><button className={learning.primary} disabled={busy} onClick={() => mutate({ action: "block", postId: block.postId })}>Nutzer blockieren</button></div></section>}
      {report && <section id="community-report" tabIndex={-1} className={`${learning.panel} ${styles.confirmation}`} aria-label="Beitrag melden"><h2>Beitrag melden</h2><form onSubmit={event => { event.preventDefault(); mutate({ action: "report", postId: report, reason: reportReason }); }}><label className={learning.field}>Warum soll der Beitrag geprüft werden?<textarea required minLength={3} maxLength={1000} value={reportReason} onChange={event => setReportReason(event.target.value)} disabled={busy} /></label><div className={learning.actions}><button className={learning.primary} disabled={busy}>Meldung senden</button><button type="button" className={learning.secondary} onClick={() => { setReport(null); setReportReason(""); }} disabled={busy}>Abbrechen</button></div></form></section>}
    </>}
    <Rules />{!signedIn && <section className={learning.panel}><h2>Für alle Themen deiner Ausbildung</h2><div className={styles.categoryGrid}>{communityCategories.map(item => <div key={item.slug}><AppIcon name={item.icon || item.slug} size={22} /><strong>{item.title}</strong></div>)}</div></section>}
  </LearningToolLayout>;
}
