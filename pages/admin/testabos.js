import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AccountLayout from "../../components/AccountLayout";
import { getPaidPageProps } from "../../lib/account-access";
import { isPayPalSandboxTestEnvironment } from "../../lib/test-environment";
import accountStyles from "../../styles/Account.module.css";
import styles from "../../styles/TrialOverview.module.css";

const PAGE_SIZE = 25;
const REQUEST_TIMEOUT = 18000;
const stages = {
  trial: "Testzugang aktiv", regular: "Reguläres Abo", grace: "Zahlungsfrist",
  ended: "Beendet", cancelled: "Gekündigt", paused: "Pausiert", review: "Prüfung offen",
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
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...options, signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Object.assign(new Error("Die Übersicht ist gerade nicht erreichbar."), { status: response.status, code: data?.code });
        return data;
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(Object.assign(new Error("Die Anfrage hat zu lange gedauert."), { status: 504, code: "REQUEST_TIMEOUT" }));
        }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function useTrialOverview(testEnvironment = false) {
  const [query, setQuery] = useState("");
  const [environment, setEnvironment] = useState(testEnvironment ? "sandbox" : "live");
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(null);
  const [mailPending, setMailPending] = useState(false);
  const [mailMessage, setMailMessage] = useState("");
  const mailRequest = useRef(null);
  const mailBusy = useRef(false);
  const notificationVersion = useRef(0);
  const loadVersion = useRef(0);
  const currentLoad = useRef(null);

  useEffect(() => () => { mailRequest.current?.abort(); mailRequest.current = null; }, []);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const version = ++loadVersion.current;
    currentLoad.current = controller;
    const currentRequest = () => current && loadVersion.current === version;
    const notificationAtStart = notificationVersion.current;
    setLoading(true);
    setData(null);
    setError(null);
    if (query.trim() && !normalizedOverviewQuery(query)) {
      setLoading(false);
      return () => { current = false; controller.abort(); };
    }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ environment, q: normalizedOverviewQuery(query), offset: String(offset), limit: String(PAGE_SIZE) });
        const result = await requestTrialOverview(`/api/admin/trials?${params}`, {}, controller);
        if (!validTrialOverview(result) || result.offset !== offset || result.items.some(item => item.environment !== (environment === "live" ? "Production" : "Sandbox"))) {
          throw Object.assign(new Error("Die Übersicht konnte nicht gelesen werden."), { code: "INVALID_RESPONSE" });
        }
        if (!currentRequest() || controller.signal.aborted) return;
        setData(result);
        if (notificationVersion.current === notificationAtStart) setNotifications(result.notifications);
      } catch (failure) {
        if (currentRequest()) {
          if ([401, 403].includes(failure.status)) setNotifications(null);
          setError({ status: failure.status || 503, code: failure.code || "UNAVAILABLE" });
        }
      } finally {
        if (currentRequest()) setLoading(false);
      }
    }, query.trim() ? 300 : 0);
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [query, environment, offset, revision]);

  async function checkNotifications() {
    if (mailBusy.current) return;
    const controller = new AbortController();
    mailRequest.current = controller;
    mailBusy.current = true;
    notificationVersion.current += 1;
    setMailPending(true);
    setMailMessage("");
    try {
      const result = await requestTrialOverview("/api/admin/trials", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      }, controller, 45000);
      if (!validNotifications(result.notifications) || !result.delivery || !Number.isSafeInteger(result.delivery.processed)) throw new Error("Ungültige Antwort");
      if (mailRequest.current !== controller) return;
      setNotifications(result.notifications);
      const sent = count(result.delivery.sent);
      const retry = count(result.delivery.retry);
      setMailMessage(result.delivery.retry > 0
        ? `${sent} E-Mails versendet. ${retry} Benachrichtigungen warten auf einen weiteren Versandversuch.`
        : result.delivery.sent > 0 ? `${sent} E-Mails versendet.` : "Benachrichtigungen geprüft. Keine weitere E-Mail versendet.");
    } catch (failure) {
      if (mailRequest.current !== controller) return;
      if ([401, 403].includes(failure.status)) {
        loadVersion.current += 1;
        currentLoad.current?.abort();
        setLoading(false);
        setData(null);
        setNotifications(null);
        setError({ status: failure.status });
      }
      setMailMessage("Die E-Mail-Prüfung konnte nicht abgeschlossen werden. Die Aboübersicht bleibt davon unabhängig. Bitte später erneut prüfen.");
    } finally {
      if (mailRequest.current === controller) {
        mailRequest.current = null;
        mailBusy.current = false;
        setMailPending(false);
      }
    }
  }

  return {
    query, environment, offset, data, error, loading, notifications, mailPending, mailMessage,
    incompleteSearch: Boolean(query.trim() && !normalizedOverviewQuery(query)),
    search(value) { setQuery(value.slice(0, 320)); setOffset(0); },
    chooseEnvironment(value) { if (!["live", "sandbox"].includes(value) || (testEnvironment && value !== "sandbox")) return; setEnvironment(value); setOffset(0); },
    reload() { setRevision(value => value + 1); },
    previous() { setOffset(value => Math.max(0, value - PAGE_SIZE)); },
    next() { if (data?.hasMore && !loading) setOffset(value => value + PAGE_SIZE); },
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
      <span className={`${styles.stage} ${styles[item.stage] || ""}`}>{stages[item.stage]}</span>
      <p className={styles.renewal}>{item.renewal === true ? "Verlängerung eingeschaltet" : item.renewal === false ? "Keine automatische Verlängerung" : "Verlängerung noch nicht bestätigt"}</p>
    </div>
    <dl className={styles.dates}>
      <div><dt>Testabo begonnen</dt><dd>{overviewDate(item.trialStartedAt)}</dd></div>
      <div><dt>Kostenlos bis</dt><dd>{overviewDate(item.trialUntil)}</dd></div>
      <div><dt>Reguläres Abo bestätigt</dt><dd>{overviewDate(item.firstRegularAt)}</dd></div>
      <div><dt>Zugang bestätigt bis</dt><dd>{overviewDate(item.accessUntil)}</dd></div>
    </dl>
    <p className={styles.verified}>Zuletzt vom Anbieter bestätigt: {overviewDate(item.verifiedAt)}</p>
  </article>;
}

export default function TrialOverviewPage({ testEnvironment = false }) {
  const overview = useTrialOverview(testEnvironment);
  const denied = [401, 403].includes(overview.error?.status);
  const notification = overview.notifications;
  return <AccountLayout title="Testabos und Abos" description="Neue Testabos und ihr weiterer Verlauf – privat für den Betreiber." active="account" hideCommunity>
    <section className={styles.panel} aria-labelledby="trial-overview-heading">
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>Betreiberübersicht</p><h2 id="trial-overview-heading">Alle Systeme an einem Ort</h2></div>
        {!denied && <button type="button" className={accountStyles.secondaryButton} onClick={overview.reload} disabled={overview.loading}>Aktualisieren</button>}
      </div>
      <p className={styles.intro}>Apple-Abos aus der iPhone-/iPad-App und PayPal-Abos von Android oder der Website. Angezeigt werden bestätigte Testabos mit ihrem aktuellen Verlauf.</p>
      {!denied && <div className={styles.controls}>
        <label>E-Mail-Adresse suchen<input type="search" inputMode="email" value={overview.query} onChange={event => overview.search(event.target.value)} placeholder="Vollständige E-Mail-Adresse" maxLength={320} autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>
        <label>Umgebung<select value={overview.environment} onChange={event => overview.chooseEnvironment(event.target.value)} disabled={testEnvironment}>{!testEnvironment && <option value="live">Live · echte Kunden</option>}<option value="sandbox">Test · Sandbox / TestFlight</option></select></label>
      </div>}
      <p className={styles.environment}>{overview.environment === "live" ? "Live: Kundenabos der veröffentlichten App und Website." : "Testdaten: kostenlose Sandbox- und TestFlight-Käufe. Keine echten Kundenzahlungen."}</p>
      {overview.loading ? <p className={styles.result} role="status">Abos werden geladen …</p> : overview.error ? <OverviewError error={overview.error} /> : overview.incompleteSearch ? <p className={styles.result} role="status">Gib die vollständige E-Mail-Adresse ein oder leere die Suche, um alle Abos zu sehen.</p> : overview.data && <>
        <p className={styles.result} role="status">{overview.data.items.length ? `${overview.offset + 1}–${overview.offset + overview.data.items.length} ${overview.query.trim() ? "Treffer" : "Abos"}${overview.data.hasMore ? " · weitere vorhanden" : ""}` : overview.query.trim() ? "Keine Abos für diese Suche gefunden." : overview.environment === "live" ? "Noch keine bestätigten Testabos in der Live-Umgebung vorhanden." : "Noch keine bestätigten Testabos in dieser Testumgebung vorhanden."}</p>
        {overview.data.items.length > 0 && <div className={styles.list} aria-label="Bestätigte Testabos und ihr Verlauf">{overview.data.items.map(item => <SubscriptionRow key={`${item.provider}-${item.environment}-${item.id}`} item={item} />)}</div>}
        {(overview.offset > 0 || overview.data.hasMore) && <nav className={styles.pagination} aria-label="Seiten der Aboübersicht">
          <button type="button" className={accountStyles.secondaryButton} onClick={overview.previous} disabled={overview.offset === 0}>Vorherige Seite</button>
          <span>Seite {Math.floor(overview.offset / PAGE_SIZE) + 1}</span>
          <button type="button" className={accountStyles.secondaryButton} onClick={overview.next} disabled={!overview.data.hasMore}>Nächste Seite</button>
        </nav>}
        <p className={styles.verified}>Übersicht geladen: {overviewDate(overview.data.asOf)}. Das Datum für das reguläre Abo erscheint erst mit der entsprechenden Anbieterbestätigung.</p>
        {(overview.data.windowLimited || overview.data.olderRecordsAvailable) && <p className={styles.environment}>Diese Ansicht ist auf bis zu {overview.data.windowLimit} aktuelle Abos begrenzt. Ältere Einträge können fehlen. Suche mit einer vollständigen E-Mail-Adresse gezielt nach einem Konto.</p>}
      </>}
    </section>
    {!denied && <section className={styles.panel} aria-labelledby="trial-notification-heading">
      <div className={styles.heading}><h2 id="trial-notification-heading">E-Mail bei neuen Testabos</h2><button type="button" className={accountStyles.secondaryButton} onClick={overview.checkNotifications} disabled={overview.mailPending || !notification?.configured}>{overview.mailPending ? "Wird geprüft …" : "Benachrichtigungen prüfen"}</button></div>
      {!notification ? <p className={styles.intro}>Der E-Mail-Status wird mit der Übersicht geladen.</p> : notification.configured ? <>
        <p className={styles.intro}>Benachrichtigungen an <strong>{notification.recipient}</strong>{notification.enabledSince ? ` für neue bestätigte Kunden-Testabos seit ${overviewDate(notification.enabledSince)}` : ""}. Nur Live-Abos lösen E-Mails aus. Sandbox- und TestFlight-Käufe lösen keine Betreiber-E-Mail aus.</p>
        <dl className={styles.mailCounts}><div><dt>Versendet</dt><dd>{count(notification.sentCount)}</dd></div><div><dt>Warten auf Versand</dt><dd>{count(notification.pendingCount)}</dd></div></dl>
        <p className={styles.verified}>Ein offener Versand ändert den Lernzugang nicht. „Benachrichtigungen prüfen“ versucht offene Benachrichtigungen erneut zu senden.</p>
      </> : <p className={styles.notice}>Der E-Mail-Versand ist noch nicht vollständig eingerichtet. Die Aboübersicht funktioniert unabhängig davon.</p>}
      {overview.mailMessage && <p className={styles.result} role="status">{overview.mailMessage}</p>}
    </section>}
  </AccountLayout>;
}
