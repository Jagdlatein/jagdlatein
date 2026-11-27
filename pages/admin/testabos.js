import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AccountLayout from "../../components/AccountLayout";
import { getPaidPageProps } from "../../lib/account-access";
import { isPayPalSandboxTestEnvironment } from "../../lib/test-environment";
import { onVisibleReturn } from "../../lib/visible-return";
import accountStyles from "../../styles/Account.module.css";
import styles from "../../styles/TrialOverview.module.css";

const PAGE_SIZE = 25;
const REQUEST_TIMEOUT = 18000;
const stages = {
  trial: "Testzugang aktiv", regular: "Reguläres Abo", grace: "Zahlungsfrist",
};

export async function getServerSideProps(context) {
  const result = await getPaidPageProps(context, { adminOnly: true });
  if (!result.props) return result;
  try { return { props: { ...result.props, testEnvironment: isPayPalSandboxTestEnvironment() } }; }
  catch { return { redirect: { destination: "/konto?access=unavailable", permanent: false } }; }
}

export function normalizedOverviewQuery(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return email.length <= 320 && /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(email) ? email : "";
}

export function overviewDate(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "Noch nicht bestätigt";
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Zurich", timeZoneName: "short",
  }).format(new Date(value));
}

function count(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : "–";
}

function validNotifications(value) {
  return value && typeof value === "object" && typeof value.configured === "boolean" &&
    (!value.configured || (typeof value.recipient === "string" && value.recipient.length > 0));
}

export function validTrialOverview(value) {
  return Boolean(value && Array.isArray(value.items) && value.items.length <= PAGE_SIZE &&
    typeof value.hasMore === "boolean" && Number.isSafeInteger(value.offset) && value.offset >= 0 &&
    value.limit === PAGE_SIZE && Number.isSafeInteger(value.windowLimit) && value.windowLimit > 0 && value.windowLimit <= 200 &&
    typeof value.windowLimited === "boolean" && typeof value.olderRecordsAvailable === "boolean" &&
    validNotifications(value.notifications) && value.items.every(item =>
      item && typeof item.id === "string" && typeof item.email === "string" &&
      ["apple", "paypal"].includes(item.provider) && ["Production", "Sandbox"].includes(item.environment) &&
      Object.hasOwn(stages, item.stage)));
}

export async function requestTrialOverview(url, options, controller, timeout = REQUEST_TIMEOUT) {
  let timer, cancel;
  try {
    if (controller.signal.aborted) throw Object.assign(new Error("Anfrage abgebrochen."), { code: "ABORTED" });
    const cancellation = new Promise((_, reject) => {
      cancel = () => reject(Object.assign(new Error("Anfrage abgebrochen."), { code: "ABORTED" }));
      controller.signal.addEventListener("abort", cancel, { once: true });
    });
    return await Promise.race([
      cancellation,
      (async () => {
        const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...options, signal: controller.signal });
        if ([401, 403].includes(response.status)) throw Object.assign(new Error("Die Übersicht ist nicht verfügbar."), { status: response.status });
        const data = await response.json();
        if (!response.ok) throw Object.assign(new Error("Die Übersicht ist gerade nicht erreichbar."), { status: response.status, code: data?.code });
        return data;
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error("Die Anfrage hat zu lange gedauert."), { status: 504, code: "REQUEST_TIMEOUT" }));
          controller.abort();
        }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (cancel) controller.signal.removeEventListener("abort", cancel);
  }
}

export function useTrialOverview(testEnvironment = false) {
  const sandboxOnly = testEnvironment === true;
  const initial = { query: "", environment: sandboxOnly ? "sandbox" : "live", offset: 0 };
  const [state, setState] = useState({ ...initial, data: null, error: null, loading: true, notifications: null, mailPending: false, mailMessage: "" });
  const runtime = useRef({ mounted: false, blocked: false, owner: {}, lifetime: null, selection: initial, sandboxOnly, request: null, mail: null, snapshot: null, notifications: null });
  const prop = useRef(sandboxOnly);
  prop.current = sandboxOnly;
  const scope = runtime.current;
  const owner = scope.owner;
  const sameLifetime = () => scope.mounted && prop.current === sandboxOnly && scope.sandboxOnly === sandboxOnly;
  const canAct = () => sameLifetime() && !scope.blocked && scope.owner === owner;

  function invalidate() {
    const read = scope.request, mail = scope.mail;
    // Revoke ownership before aborting: fetch/json need not honour AbortSignal,
    // and their old catch/finally handlers must not affect the next request.
    scope.owner = {};
    scope.request = null;
    scope.mail = null;
    scope.snapshot = null;
    scope.notifications = null;
    if (read) { clearTimeout(read.timer); read.controller.abort(); }
    mail?.controller.abort();
  }

  function deny(status = 401) {
    if (!sameLifetime()) return;
    scope.blocked = true;
    invalidate();
    setState(previous => ({ ...previous, data: null, notifications: null, mailPending: false, mailMessage: "", loading: false, error: { status } }));
  }

  function startRead(selection, { immediate = false, revalidate = false } = {}) {
    if (!sameLifetime() || scope.blocked || sandboxOnly && selection.environment !== "sandbox") return;
    invalidate();
    scope.selection = { ...selection };
    const incomplete = Boolean(selection.query.trim() && !normalizedOverviewQuery(selection.query));
    setState(previous => ({ ...previous, ...selection, data: null, notifications: null, error: null, loading: !incomplete || revalidate, mailPending: false, mailMessage: "" }));
    if (incomplete && !revalidate) return;
    const controller = new AbortController();
    const ticket = { owner: scope.owner, controller, timer: null };
    scope.request = ticket;
    const currentRequest = () => sameLifetime() && !scope.blocked && scope.owner === ticket.owner && scope.request === ticket;
    ticket.timer = setTimeout(async () => {
      if (!currentRequest()) return;
      try {
        const params = new URLSearchParams({ environment: selection.environment, q: normalizedOverviewQuery(selection.query), offset: String(selection.offset), limit: String(PAGE_SIZE) });
        const result = await requestTrialOverview(`/api/admin/trials?${params}`, {}, controller);
        if (!currentRequest() || controller.signal.aborted) return;
        if (!validTrialOverview(result) || result.offset !== selection.offset || result.items.some(item => item.environment !== (selection.environment === "live" ? "Production" : "Sandbox"))) {
          throw Object.assign(new Error("Die Übersicht konnte nicht gelesen werden."), { code: "INVALID_RESPONSE" });
        }
        // An incomplete search remains an edit. A visible return still checks
        // permission, but must not display an unfiltered replacement list.
        const data = incomplete ? null : result;
        scope.snapshot = { owner: ticket.owner, data };
        scope.notifications = result.notifications;
        setState(previous => ({ ...previous, data, notifications: result.notifications }));
      } catch (failure) {
        if (currentRequest()) {
          if ([401, 403].includes(failure.status)) deny(failure.status);
          else setState(previous => ({ ...previous, error: { status: failure.status || 503, code: failure.code || "UNAVAILABLE" } }));
        }
      } finally {
        if (currentRequest()) {
          scope.request = null;
          setState(previous => ({ ...previous, loading: false }));
        }
      }
    }, immediate || !selection.query.trim() ? 0 : 300);
  }

  useEffect(() => {
    const lifetime = {};
    scope.lifetime = lifetime;
    scope.mounted = true;
    scope.blocked = false;
    scope.sandboxOnly = sandboxOnly;
    const selection = { ...scope.selection };
    if (sandboxOnly && selection.environment !== "sandbox") { selection.environment = "sandbox"; selection.offset = 0; }
    startRead(selection);
    const currentLifetime = () => sameLifetime() && scope.lifetime === lifetime;
    const revoked = () => { if (currentLifetime()) deny(401); };
    const stopVisible = onVisibleReturn(() => {
      if (currentLifetime() && !scope.blocked) startRead({ ...scope.selection }, { immediate: true, revalidate: true });
    });
    if (typeof window !== "undefined") {
      window.addEventListener?.("jagdlatein-account-deleted", revoked);
      window.addEventListener?.("jagdlatein-logout", revoked);
    }
    return () => {
      if (scope.lifetime === lifetime) {
        scope.mounted = false;
        scope.blocked = true;
        invalidate();
      }
      stopVisible();
      if (typeof window !== "undefined") {
        window.removeEventListener?.("jagdlatein-account-deleted", revoked);
        window.removeEventListener?.("jagdlatein-logout", revoked);
      }
    };
  }, [sandboxOnly]);

  async function checkNotifications() {
    if (!canAct() || scope.request || scope.mail || scope.snapshot?.owner !== owner || !scope.notifications?.configured) return;
    const controller = new AbortController();
    const ticket = { owner, snapshot: scope.snapshot, controller };
    scope.mail = ticket;
    const currentMail = () => canAct() && scope.mail === ticket && scope.snapshot === ticket.snapshot;
    setState(previous => ({ ...previous, mailPending: true, mailMessage: "" }));
    try {
      const result = await requestTrialOverview("/api/admin/trials", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      }, controller, 45000);
      if (!currentMail() || controller.signal.aborted) return;
      if (!validNotifications(result.notifications) || !result.delivery || !["processed", "sent", "retry"].every(key => Number.isSafeInteger(result.delivery[key]) && result.delivery[key] >= 0)) throw new Error("Ungültige Antwort");
      scope.notifications = result.notifications;
      const sent = count(result.delivery.sent);
      const retry = count(result.delivery.retry);
      const mailMessage = result.delivery.retry > 0
        ? `${sent} E-Mails versendet. ${retry} Benachrichtigungen warten auf einen weiteren Versandversuch.`
        : result.delivery.sent > 0 ? `${sent} E-Mails versendet.` : "Benachrichtigungen geprüft. Keine weitere E-Mail versendet.";
      setState(previous => ({ ...previous, notifications: result.notifications, mailMessage }));
    } catch (failure) {
      if (!currentMail()) return;
      if ([401, 403].includes(failure.status)) {
        deny(failure.status);
        return;
      }
      setState(previous => ({ ...previous, mailMessage: "Die E-Mail-Prüfung konnte nicht abgeschlossen werden. Die Aboübersicht bleibt davon unabhängig. Bitte später erneut prüfen." }));
    } finally {
      if (currentMail()) {
        scope.mail = null;
        setState(previous => ({ ...previous, mailPending: false }));
      }
    }
  }

  return {
    ...state,
    data: sameLifetime() && !scope.blocked && scope.snapshot?.owner === owner && scope.snapshot.data === state.data ? state.data : null,
    notifications: sameLifetime() && !scope.blocked && scope.snapshot?.owner === owner && scope.notifications === state.notifications ? state.notifications : null,
    mailPending: sameLifetime() && !scope.blocked && scope.mail?.owner === owner && state.mailPending,
    mailMessage: sameLifetime() && !scope.blocked && scope.snapshot?.owner === owner ? state.mailMessage : "",
    incompleteSearch: Boolean(state.query.trim() && !normalizedOverviewQuery(state.query)),
    search(value) { if (canAct() && typeof value === "string") startRead({ ...scope.selection, query: value.slice(0, 320), offset: 0 }); },
    chooseEnvironment(value) {
      if (!canAct() || !["live", "sandbox"].includes(value) || sandboxOnly && value !== "sandbox") return;
      startRead({ ...scope.selection, environment: value, offset: 0 });
    },
    reload() { if (canAct()) startRead({ ...scope.selection }); },
    previous() { if (canAct() && !scope.request && scope.snapshot?.data) startRead({ ...scope.selection, offset: Math.max(0, scope.selection.offset - PAGE_SIZE) }); },
    next() { if (canAct() && !scope.request && scope.snapshot?.data?.hasMore) startRead({ ...scope.selection, offset: scope.selection.offset + PAGE_SIZE }); },
    checkNotifications,
  };
}

function OverviewError({ error }) {
  if (error.status === 401) return <div className={styles.notice} role="alert">
    <p>Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an, um die private Betreiberübersicht zu sehen.</p>
    <Link href="/login?reauth=1&next=%2Fadmin%2Ftestabos" className={accountStyles.button}>Anmeldung erneuern</Link>
  </div>;
  if (error.status === 403) return <div className={styles.notice} role="alert"><p>Diese Übersicht ist nur für das bestehende Betreiberkonto verfügbar.</p><Link href="/konto" className={accountStyles.secondaryButton}>Zum Konto</Link></div>;
  if (["TRIAL_OVERVIEW_NOT_CONFIGURED", "TRIAL_NOTIFICATIONS_NOT_CONFIGURED"].includes(error.code)) return <div className={styles.notice} role="alert"><p>Die Betreiberübersicht ist noch nicht vollständig eingerichtet. Es werden keine Abos als fehlend oder beendet gewertet.</p></div>;
  return <div className={styles.notice} role="alert"><p>{error.code === "REQUEST_TIMEOUT" ? "Das Laden hat zu lange gedauert." : "Die Aboübersicht ist gerade nicht erreichbar."} Wähle „Aktualisieren“, um es erneut zu versuchen.</p></div>;
}

function SubscriptionRow({ item }) {
  return <article className={styles.row} aria-label={`${item.email}: ${stages[item.stage]}`}>
    <div className={styles.identity}>
      <h3>{item.email}</h3>
      <span className={styles.provider}>{item.provider === "apple" ? "Apple · iPhone / iPad" : "PayPal · Android / Website"}</span>
      <p className={styles.renewal}>{item.renewal === true ? "Verlängerung eingeschaltet" : item.renewal === false ? "Keine automatische Verlängerung" : "Verlängerung noch nicht bestätigt"}</p>
    </div>
    <div className={styles.access}>
      <span className={`${styles.stage} ${styles[item.stage] || ""}`}>{stages[item.stage]}</span>
      <p>Zugang bis <strong>{overviewDate(item.accessUntil)}</strong></p>
    </div>
    <details className={styles.rowDetails}>
      <summary>Abo-Details</summary>
      <dl className={styles.dates}>
        <div><dt>Testabo begonnen</dt><dd>{overviewDate(item.trialStartedAt)}</dd></div>
        <div><dt>Kostenlos bis</dt><dd>{overviewDate(item.trialUntil)}</dd></div>
        <div><dt>Reguläres Abo bestätigt</dt><dd>{overviewDate(item.firstRegularAt)}</dd></div>
        <div><dt>Zugang bestätigt bis</dt><dd>{overviewDate(item.accessUntil)}</dd></div>
      </dl>
      <p className={styles.verified}>Zuletzt vom Anbieter bestätigt: {overviewDate(item.verifiedAt)}</p>
    </details>
  </article>;
}

export default function TrialOverviewPage({ testEnvironment = false }) {
  const overview = useTrialOverview(testEnvironment);
  const denied = [401, 403].includes(overview.error?.status);
  const notification = overview.notifications;
  return <AccountLayout title="Testabos und Abos" description="Aktive Testabos und Abos – privat für den Betreiber." active="account" hideCommunity>
    <p><Link href="/admin" className={accountStyles.secondaryButton}>Gesamtauswertung</Link></p>
    <section className={styles.panel} aria-labelledby="trial-overview-heading">
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>Betreiberübersicht</p><h2 id="trial-overview-heading">Aktive Abos</h2></div>
        {!denied && <button type="button" className={accountStyles.secondaryButton} onClick={overview.reload} disabled={overview.loading}>Aktualisieren</button>}
      </div>
      <p className={styles.intro}>Nur Testabos und Folgeabos mit aktuell bestätigtem Zugang: Apple · iPhone/iPad, PayPal · Android/Website. Eine ausgeschaltete Verlängerung blendet einen noch laufenden Zugang nicht aus.</p>
      {!denied && <div className={styles.controls}>
        <label>E-Mail-Adresse suchen<input type="search" inputMode="email" value={overview.query} onChange={event => overview.search(event.target.value)} placeholder="Vollständige E-Mail-Adresse" maxLength={320} autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>
        <label>Umgebung<select value={overview.environment} onChange={event => overview.chooseEnvironment(event.target.value)} disabled={testEnvironment}>{!testEnvironment && <option value="live">Live · echte Kunden</option>}<option value="sandbox">Test · Sandbox / TestFlight</option></select></label>
      </div>}
      <p className={styles.environment}>{overview.environment === "live" ? "Live: Kundenabos der veröffentlichten App und Website." : "Testdaten: kostenlose Sandbox- und TestFlight-Käufe. Keine echten Kundenzahlungen."}</p>
      {overview.loading ? <p className={styles.result} role="status">Aktive Abos werden geladen …</p> : overview.error ? <OverviewError error={overview.error} /> : overview.incompleteSearch ? <p className={styles.result} role="status">Gib die vollständige E-Mail-Adresse ein oder leere die Suche, um aktive Abos zu sehen.</p> : overview.data && <>
        <p className={styles.result} role="status">{overview.data.items.length ? `${overview.offset + 1}–${overview.offset + overview.data.items.length} ${overview.query.trim() ? "Treffer" : "aktive Abos"}${overview.data.hasMore ? " · weitere vorhanden" : ""}` : overview.query.trim() ? "Keine aktiven Abos für diese Suche gefunden." : overview.environment === "live" ? "Keine aktiven Abos im geprüften Live-Bestand gefunden." : "Keine aktiven Abos im geprüften Testbestand gefunden."}</p>
        {overview.data.items.length > 0 && <div className={styles.list} aria-label="Aktive Testabos und Abos">{overview.data.items.map(item => <SubscriptionRow key={`${item.provider}-${item.environment}-${item.id}`} item={item} />)}</div>}
        {(overview.offset > 0 || overview.data.hasMore) && <nav className={styles.pagination} aria-label="Seiten der Aboübersicht">
          <button type="button" className={accountStyles.secondaryButton} onClick={overview.previous} disabled={overview.offset === 0}>Vorherige Seite</button>
          <span>Seite {Math.floor(overview.offset / PAGE_SIZE) + 1}</span>
          <button type="button" className={accountStyles.secondaryButton} onClick={overview.next} disabled={!overview.data.hasMore}>Nächste Seite</button>
        </nav>}
        <p className={styles.verified}>Übersicht geladen: {overviewDate(overview.data.asOf)}. Das Datum für das reguläre Abo erscheint erst mit der entsprechenden Anbieterbestätigung.</p>
        {(overview.data.windowLimited || overview.data.olderRecordsAvailable) && <p className={styles.environment}>Diese Ansicht prüft bis zu {overview.data.windowLimit} aktuelle Aboeinträge. Ältere aktive Abos können fehlen. Suche mit einer vollständigen E-Mail-Adresse gezielt nach einem Konto.</p>}
      </>}
    </section>
    {!denied && <details className={`${styles.panel} ${styles.notifications}`} aria-labelledby="trial-notification-heading">
      <summary id="trial-notification-heading">E-Mail bei neuen Testabos</summary>
      <div className={styles.heading}><button type="button" className={accountStyles.secondaryButton} onClick={overview.checkNotifications} disabled={overview.mailPending || !notification?.configured}>{overview.mailPending ? "Wird geprüft …" : "Benachrichtigungen prüfen"}</button></div>
      {!notification ? <p className={styles.intro}>Der E-Mail-Status wird mit der Übersicht geladen.</p> : notification.configured ? <>
        <p className={styles.intro}>Benachrichtigungen an <strong>{notification.recipient}</strong>{notification.enabledSince ? ` für neue bestätigte Kunden-Testabos seit ${overviewDate(notification.enabledSince)}` : ""}. Nur Live-Abos lösen E-Mails aus. Sandbox- und TestFlight-Käufe lösen keine Betreiber-E-Mail aus.</p>
        <dl className={styles.mailCounts}><div><dt>Versendet</dt><dd>{count(notification.sentCount)}</dd></div><div><dt>Warten auf Versand</dt><dd>{count(notification.pendingCount)}</dd></div></dl>
        <p className={styles.verified}>Ein offener Versand ändert den Lernzugang nicht. „Benachrichtigungen prüfen“ versucht offene Benachrichtigungen erneut zu senden.</p>
      </> : <p className={styles.notice}>Der E-Mail-Versand ist noch nicht vollständig eingerichtet. Die Aboübersicht funktioniert unabhängig davon.</p>}
      {overview.mailMessage && <p className={styles.result} role="status">{overview.mailMessage}</p>}
    </details>}
  </AccountLayout>;
}
