import { useCallback, useEffect, useState } from "react";
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
    else if (view === "reports") parameters.set("view", "reports");
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
  return { data: data?.selection === selection ? data.result : null, loading, error, reload };
}

function ProfileForm({ onSubmit, busy }) {
  const [name, setName] = useState(""); const [accepted, setAccepted] = useState(false);
  return <section className={learning.panel}><h2>Dein Name in der Community</h2><p>Wähle einen Anzeigenamen. Andere Lernende sehen diesen Namen; deine E-Mail-Adresse wird in der Community nicht angezeigt. Der gewählte Name bleibt deinem Community-Profil zugeordnet.</p><form onSubmit={event => { event.preventDefault(); onSubmit({ action: "profile", displayName: name.trim(), acceptedRules: accepted }); }}><label className={learning.field}>Anzeigename<input required minLength={3} maxLength={30} autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} disabled={busy} /></label><Rules /><label className={styles.checkbox}><input required type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy} />Ich habe die Community-Regeln gelesen und halte sie ein.</label><button className={learning.primary} disabled={busy || !accepted}>{busy ? "Wird gespeichert …" : "Community-Profil anlegen"}</button></form></section>;
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
  return <section className={learning.panel} id="community-compose"><h2>{threadId ? "Deine Antwort" : "Neues Thema eröffnen"}</h2><form onSubmit={submit}>
    {!threadId && <><div className={styles.formRow}><label className={learning.field}>Themenbereich<select value={category} onChange={event => setCategory(event.target.value)} disabled={busy}>{communityCategories.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label><label className={learning.field}>Beitragsart<select value={type} onChange={event => setType(event.target.value)} disabled={busy}><option value="question">Frage</option><option value="discussion">Austausch</option></select></label></div><label className={learning.field}>Titel<input required minLength={8} maxLength={140} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} placeholder="Welche Frage möchtest du besprechen?" /></label></>}
    <label className={learning.field}>{threadId ? "Antwort" : "Deine Frage oder dein Beitrag"}<textarea required minLength={threadId ? 2 : 10} maxLength={threadId ? 4000 : 6000} value={body} onChange={event => setBody(event.target.value)} disabled={busy} placeholder="Beschreibe, was du bereits verstanden hast und wo du noch unsicher bist. Nenne bei fachlichen Aussagen nach Möglichkeit eine Quelle." /></label><p className={styles.hint}>{body.length} / {threadId ? 4000 : 6000} Zeichen · Bitte keine persönlichen Daten oder genauen Revierstandorte veröffentlichen.</p><label className={styles.checkbox}><input required type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy} />Mein Beitrag hält die Community-Regeln ein.</label><div className={learning.actions}><button className={learning.primary} disabled={busy || !accepted}>{busy ? "Wird gesendet …" : threadId ? "Antwort veröffentlichen" : "Thema veröffentlichen"}</button>{onCancel && <button className={learning.secondary} type="button" onClick={onCancel} disabled={busy}>Abbrechen</button>}</div>
  </form></section>;
}

function PostActions({ post, admin, busy, mutate, setReport, setRemoval }) {
  return <div className={styles.postActions}>{post.owned && <button type="button" onClick={() => setRemoval(post.id)} disabled={busy}>Eigenen Beitrag entfernen</button>}{!post.owned && <button type="button" onClick={() => setReport(post.id)} disabled={busy}>Beitrag melden</button>}{admin && <button type="button" onClick={() => mutate({ action: "moderate", postId: post.id, status: post.status === "hidden" ? "visible" : "hidden" }, "PATCH")} disabled={busy}>{post.status === "hidden" ? "Wieder anzeigen" : "Ausblenden"}</button>}</div>;
}

function PostContent({ post, admin, busy, mutate, setReport, setRemoval }) {
  return <article className={styles.post}><div className={styles.postMeta}><strong>{post.displayName}</strong><time dateTime={post.createdAt}>{displayDate(post.createdAt)}</time>{post.status === "hidden" && <span>Ausgeblendet</span>}</div><p className={styles.body}>{post.body}</p><PostActions {...{ post, admin, busy, mutate, setReport, setRemoval }} /></article>;
}

export default function Community({ signedIn = false, threadId, initialCategory = "all", context = "" }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory); const [query, setQuery] = useState(""); const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); const [type, setType] = useState("all"); const [unanswered, setUnanswered] = useState(false); const [view, setView] = useState("posts");
  const [compose, setCompose] = useState(Boolean(context)); const [busy, setBusy] = useState(false); const [mutationError, setMutationError] = useState(null); const [notice, setNotice] = useState("");
  const [report, setReport] = useState(null); const [reportReason, setReportReason] = useState(""); const [removal, setRemoval] = useState(null);
  const { data, loading, error, reload } = useCommunityData({ signedIn, threadId, category, query: search, page, type, unanswered, view });
  const viewer = data?.viewer; const canPost = Boolean(viewer && !viewer.profileRequired && viewer.displayName); const admin = viewer?.admin === true;
  const initialQuery = new URLSearchParams({ ...(initialCategory !== "all" ? { category: initialCategory } : {}), ...(context ? { thema: context } : {}) }).toString();
  const next = threadId ? `/community/${threadId}` : `/community${initialQuery ? `?${initialQuery}` : ""}`;
  useEffect(() => { setCategory(initialCategory); setCompose(Boolean(context)); setPage(1); setReport(null); setRemoval(null); setNotice(""); setMutationError(null); }, [initialCategory, context, threadId]);
  async function mutate(body, method = "POST") {
    if (busy) return null;
    setBusy(true); setMutationError(null); setNotice("");
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/community", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      const result = await response.json(); if (!response.ok) throw result;
      if (body.action === "post") { await router.push(`/community/${result.postId}`); }
      else if (method === "DELETE" && body.postId === threadId) { await router.push("/community"); }
      else { reload(); setNotice(body.action === "report" ? "Deine Meldung wurde zur Prüfung gespeichert." : body.action === "profile" ? "Dein Community-Profil ist bereit." : method === "DELETE" ? "Dein Beitrag wurde entfernt." : "Gespeichert."); }
      setReport(null); setReportReason(""); setRemoval(null); return result;
    } catch (problem) { setMutationError(problem?.message || "Das Speichern ist gerade nicht möglich. Dein Text bleibt erhalten; bitte erneut versuchen."); return null; }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  function changeFilter(setter, value) { setter(value); setPage(1); }
  function reset() { setCategory("all"); setQuery(""); setSearch(""); setType("all"); setUnanswered(false); setPage(1); }
  const posts = data?.posts || []; const replies = data?.replies || []; const thread = data?.thread;
  const total = threadId ? data?.replyTotal || 0 : data?.total || 0; const size = data?.pageSize || (threadId || view === "reports" ? 20 : 12);
  const pages = Math.max(1, Math.ceil(total / size));
  useEffect(() => { if (!loading && data && page > pages) setPage(pages); }, [loading, data, page, pages]);
  return <LearningToolLayout title={thread?.title || "Deine Jagdlatein-Community"} description="Gemeinsam lernen, Fragen klären und Erfahrungen austauschen – nach den Themen deiner Jagdausbildung geordnet." icon="community" hideCommunity>
    <div className={learning.actions}>{threadId && <Link className={learning.secondary} href="/community"><AppIcon name="arrow-left" size={18} />Alle Themen</Link>}{signedIn && <button className={learning.secondary} onClick={reload} disabled={loading || busy}>Aktualisieren</button>}{!threadId && canPost && view === "posts" && <button className={learning.primary} onClick={() => setCompose(true)} disabled={busy}>Frage oder Thema erstellen</button>}{admin && !threadId && <button className={learning.secondary} onClick={() => { setView(view === "reports" ? "posts" : "reports"); setPage(1); }}>{view === "reports" ? "Zur Themenübersicht" : "Gemeldete Beiträge prüfen"}</button>}</div>
    {!signedIn ? <section className={learning.panel}><h2>Hier lernst du mit anderen</h2><p>Ob Jagdhunde, Wildkunde, Natur oder Prüfungsvorbereitung: Tausche dich mit anderen Lernenden aus. Zum Lesen und Schreiben meldest du dich mit deinem Jagdlatein-Konto an. Die Community benötigt kein aktives Abo.</p><div className={styles.benefits}><span><AppIcon name="community" />Fragen und Antworten</span><span><AppIcon name="book" />Alle Lernkategorien</span><span><AppIcon name="shield" />Eigener Anzeigename</span></div><Link className={learning.primary} href={`/login?next=${encodeURIComponent(next)}`}>Anmelden und mitlernen<AppIcon name="arrow-right" size={18} /></Link></section> : <>
      {mutationError && <p role="alert" className={styles.error}>{mutationError}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
      {loading && <p role="status">Community wird geladen …</p>}{error && <section className={styles.error} role="alert"><h2>{error.setupRequired ? "Die Community wird vorbereitet" : "Community nicht erreichbar"}</h2><p>{error.message}</p>{error.code === "SESSION_RENEWAL_REQUIRED" || error.code === "AUTH_REQUIRED" ? <Link href={`/login?next=${encodeURIComponent(next)}`}>Erneut anmelden</Link> : <button className={learning.secondary} onClick={reload}>Erneut versuchen</button>}</section>}
      {!error && data && <>
        {viewer?.profileRequired && <ProfileForm onSubmit={mutate} busy={busy} />}
        {!threadId && view === "posts" && <>
          <section className={learning.panel}><h2>Themen finden</h2><form onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setPage(1); }} className={styles.search}><label className={learning.field}>Community durchsuchen<input type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Gams, Nachsuche oder Jagdhunde" /></label><button className={learning.secondary}>Suchen<AppIcon name="search" size={18} /></button></form><div className={styles.formRow}><label className={learning.field}>Themenbereich<select value={category} onChange={event => changeFilter(setCategory, event.target.value)}><option value="all">Alle Themenbereiche</option>{communityCategories.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label><label className={learning.field}>Beitragsart<select value={type} onChange={event => changeFilter(setType, event.target.value)}><option value="all">Fragen und Austausch</option><option value="question">Fragen</option><option value="discussion">Austausch</option></select></label></div><label className={styles.checkbox}><input type="checkbox" checked={unanswered} onChange={event => changeFilter(setUnanswered, event.target.checked)} />Nur Fragen ohne Antwort</label><div className={styles.filterFooter}><p role="status">{total} {total === 1 ? "Thema" : "Themen"}{search && ` für „${search}“`}</p><button className={styles.textButton} onClick={reset}>Auswahl zurücksetzen</button></div></section>
          {compose && canPost && <Compose key={`${initialCategory}:${context}`} initialCategory={category} initialTitle={context ? `Frage zu ${context}`.slice(0, 140) : ""} onSubmit={mutate} busy={busy} onCancel={() => setCompose(false)} />}
          <div className={styles.topics}>{posts.map(post => <article className={styles.topicCard} key={post.id}><div className={styles.badges}><span>{categoryName(post.category)}</span><span>{post.type === "question" ? "Frage" : "Austausch"}</span>{post.solved && <span className={styles.solved}>Als geklärt markiert</span>}</div><h2><Link href={`/community/${post.id}`}>{post.title}<AppIcon name="arrow-right" size={20} /></Link></h2><p className={styles.preview}>{post.body.slice(0, 220)}{post.body.length > 220 ? " …" : ""}</p><div className={styles.postMeta}><span>{post.displayName}</span><time dateTime={post.createdAt}>{displayDate(post.createdAt)}</time><span>{post.replyCount || 0} {post.replyCount === 1 ? "Antwort" : "Antworten"}</span></div></article>)}</div>
          {!loading && posts.length === 0 && <section className={learning.panel}><h2>{search || category !== "all" || type !== "all" || unanswered ? "Keine passenden Themen" : "Hier beginnt euer Austausch"}</h2><p>{search || category !== "all" || type !== "all" || unanswered ? "Ändere die Auswahl oder eröffne eine eigene Frage." : "Stelle die erste Frage, teile einen Lernansatz oder besprecht einen Zusammenhang aus dem Lernbereich."}</p>{canPost && <button className={learning.primary} onClick={() => setCompose(true)}>Erstes Thema erstellen</button>}</section>}
        </>}
        {threadId && thread && <><div className={styles.badges}><span>{categoryName(thread.category)}</span><span>{thread.type === "question" ? "Frage" : "Austausch"}</span>{thread.solved && <span className={styles.solved}>Als geklärt markiert</span>}</div><PostContent post={thread} {...{ admin, busy, mutate, setReport, setRemoval }} />{thread.type === "question" && (thread.owned || admin) && <button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "mark-solved", postId: thread.id, solved: !thread.solved }, "PATCH")}>{thread.solved ? "Frage wieder öffnen" : "Frage als geklärt markieren"}</button>}<section aria-label="Antworten"><h2>{total} {total === 1 ? "Antwort" : "Antworten"}</h2>{replies.map(post => <PostContent key={post.id} post={post} {...{ admin, busy, mutate, setReport, setRemoval }} />)}{replies.length === 0 && !loading && <p>Noch keine Antwort. Teile dein Wissen und nenne passende Quellen.</p>}</section>{canPost && thread.status !== "hidden" && <Compose key={thread.id} threadId={thread.id} onSubmit={mutate} busy={busy} />}</>}
        {view === "reports" && admin && <section className={learning.panel}><h2>Gemeldete Beiträge</h2>{(data.reports || []).map(item => <article className={styles.post} key={item.id}><h3>{item.post?.title || "Gemeldeter Beitrag"}</h3><p className={styles.body}>{item.post?.body}</p><p><strong>Meldungsgrund:</strong> {item.reason}</p><time dateTime={item.createdAt}>{displayDate(item.createdAt)}</time><div className={learning.actions}><button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "moderate", postId: item.postId || item.post?.id, status: "hidden" }, "PATCH")}>Beitrag ausblenden</button><button className={learning.secondary} disabled={busy} onClick={() => mutate({ action: "resolve-report", reportId: item.id }, "PATCH")}>Meldung als geprüft markieren</button></div></article>)}{!loading && !(data.reports || []).length && <p>Keine offenen Meldungen.</p>}</section>}
        {pages > 1 && <nav className={styles.pagination} aria-label="Community-Seiten"><button className={learning.secondary} disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>Zurück</button><span>Seite {page} von {pages}</span><button className={learning.secondary} disabled={page >= pages || loading} onClick={() => setPage(value => value + 1)}>Weiter</button></nav>}
      </>}
      {removal && <section className={styles.notice} aria-label="Entfernen bestätigen"><h2>Eigenen Beitrag entfernen?</h2><p>Der Beitrag wird aus der Community entfernt.{removal === threadId ? " Dazu gehören auch die Antworten zu diesem Thema." : ""}</p><div className={learning.actions}><button className={learning.secondary} disabled={busy} onClick={() => setRemoval(null)}>Abbrechen</button><button className={learning.primary} disabled={busy} onClick={() => mutate({ postId: removal }, "DELETE")}>Beitrag entfernen</button></div></section>}
      {report && <section className={learning.panel}><h2>Beitrag melden</h2><form onSubmit={event => { event.preventDefault(); mutate({ action: "report", postId: report, reason: reportReason }); }}><label className={learning.field}>Warum soll der Beitrag geprüft werden?<textarea required minLength={3} maxLength={1000} value={reportReason} onChange={event => setReportReason(event.target.value)} /></label><div className={learning.actions}><button className={learning.primary} disabled={busy}>Meldung senden</button><button type="button" className={learning.secondary} onClick={() => { setReport(null); setReportReason(""); }} disabled={busy}>Abbrechen</button></div></form></section>}
    </>}
    <Rules />{!signedIn && <section className={learning.panel}><h2>Für alle Themen deiner Ausbildung</h2><div className={styles.categoryGrid}>{communityCategories.map(item => <div key={item.slug}><AppIcon name={item.icon || item.slug} size={22} /><strong>{item.title}</strong></div>)}</div></section>}
  </LearningToolLayout>;
}
