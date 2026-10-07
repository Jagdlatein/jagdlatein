import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AccountLayout, { AccountError, ProgressError } from "../components/AccountLayout";
import useAccountOverview from "../hooks/useAccountOverview";
import { getAccountPageProps } from "../lib/account-page";
import { courses } from "../lib/course-catalog";
import { clearOfflineLearning } from "../lib/offline-learning";
import styles from "../styles/Account.module.css";

export const getServerSideProps = getAccountPageProps;

function accessDate(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin", timeZoneName: "short" }).format(new Date(value));
}

function AccountDeletion({ onDeleted }) {
  const [available, setAvailable] = useState(false);
  const [reauthentication, setReauthentication] = useState(true);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [deleted, setDeleted] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account/delete", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!controller.signal.aborted && response.ok && data.enabled === true) {
          setAvailable(true);
          setReauthentication(data.requiresReauthentication !== false);
        }
      }).catch(() => {});
    return () => controller.abort();
  }, []);

  async function submitDeletion(event) {
    event.preventDefault();
    if (busy.current || confirmation !== "KONTO LÖSCHEN" || !acknowledged) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, acknowledgeSubscriptions: acknowledged }),
      });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) {
        if (result.code === "DELETION_REAUTH_REQUIRED") setReauthentication(true);
        setMessage(result.message || "Dein Konto konnte nicht gelöscht werden. Bitte erneut versuchen.");
        return;
      }
      setDeleted(true);
      onDeleted();
      try { await clearOfflineLearning(); }
      catch { setMessage("Dein Konto ist gelöscht. Der lokale Lernrucksack auf diesem Gerät konnte nicht vollständig geleert werden. Entferne ihn bitte in den Browser-Einstellungen."); }
      window.dispatchEvent(new Event("jagdlatein-account-deleted"));
    } catch {
      setMessage("Die Bestätigung ist nicht angekommen. Bitte lade dein Konto neu, bevor du es erneut versuchst.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (!available) return null;
  if (deleted) return <section className={styles.card} aria-labelledby="account-deleted">
    <h2 id="account-deleted">Dein Konto ist gelöscht</h2>
    <p role="status">Du bist abgemeldet. Deine Kontodaten, Lernfortschritte und eigenen Community-Inhalte wurden entfernt.</p>
    <p className={styles.muted}>Ein laufendes Abo endet dadurch nicht automatisch. Verwalte es bei Apple oder PayPal.</p>
    {message && <p role="status">{message}</p>}
    <Link href="/" className={styles.button}>Zur Startseite</Link>
  </section>;
  return <section className={styles.card} aria-labelledby="account-delete">
    <h2 id="account-delete">Konto löschen</h2>
    <p className={styles.muted}>Lösche dein Konto dauerhaft, einschließlich Lernfortschritten, Quiz-Auswertungen und eigenen Community-Inhalten. Dieser Schritt kann nicht rückgängig gemacht werden.</p>
    {!open ? <button type="button" className={styles.secondaryButton} onClick={() => setOpen(true)}>Kontolöschung vorbereiten</button> : <>
      <div className={styles.notice}>
        <p><strong>Laufende Abos separat kündigen:</strong> Eine Kontolöschung kündigt dein Abo bei Apple oder PayPal nicht. Öffne vor der Löschung die Abo-Verwaltung des Anbieters. Erforderliche Zahlungsreferenzen bleiben ohne Zuordnung zu deinem gelöschten Konto erhalten.</p>
        <p>Nach der Löschung kannst du ein noch laufendes Abo nicht mehr für dieses Konto nutzen. Der lokale Lernrucksack wird auf diesem Gerät geleert.</p>
      </div>
      {reauthentication ? <>
        <p>Bestätige zuerst deine Identität mit einem neuen E-Mail-Code. Danach entscheidest du erneut über die Löschung.</p>
        <Link href="/login?reauth=1&next=%2Fkonto%3Fdelete%3D1" className={styles.button}>Anmeldung erneut bestätigen</Link>
      </> : <form onSubmit={submitDeletion} aria-busy={pending}>
        <label style={{ display: "block", margin: "20px 0 16px", lineHeight: 1.6 }}>Zur Bestätigung <strong>KONTO LÖSCHEN</strong> eingeben
          <input value={confirmation} disabled={pending} onChange={event => setConfirmation(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} required
            style={{ display: "block", width: "100%", minHeight: 48, marginTop: 8, padding: "10px 12px", border: "1px solid var(--jl-border)", borderRadius: 12, font: "inherit" }} />
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.6, marginBottom: 20 }}>
          <input type="checkbox" checked={acknowledged} disabled={pending} onChange={event => setAcknowledged(event.target.checked)} required style={{ width: 20, height: 20, marginTop: 3, flexShrink: 0 }} />
          Ich verstehe, dass laufende Abos separat gekündigt werden müssen und die Kontolöschung dauerhaft ist.
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.secondaryButton} disabled={pending || confirmation !== "KONTO LÖSCHEN" || !acknowledged}>{pending ? "Konto wird gelöscht …" : "Konto endgültig löschen"}</button>
          <button type="button" className={styles.secondaryButton} disabled={pending} onClick={() => { setOpen(false); setConfirmation(""); setAcknowledged(false); setMessage(""); }}>Abbrechen</button>
        </div>
      </form>}
      {message && <p role="alert">{message}</p>}
    </>}
  </section>;
}

export default function AccountPage() {
  const { account, progress, accountError, progressError, loading, progressLoading, reload } = useAccountOverview();
  const [accountDeleted, setAccountDeleted] = useState(false);
  const known = progress.filter((entry) => courses.some((course) => course.id === entry.course_id));
  const completed = known.filter((entry) => entry.status === "completed").length;
  const started = known.filter((entry) => entry.status === "in_progress").length;
  const trial = account?.accessType === "trial" && !account?.admin;
  const apple = account?.accessProvider === "apple";
  const trialStopped = trial && !apple && ["CANCELLED", "SUSPENDED", "EXPIRED"].includes(account?.subscriptionStatus);
  const trialUntil = accessDate(account?.trialUntil);
  const paidUntil = accessDate(account?.paidUntil);
  const endedTrial = !account?.admin && !account?.paid && trialUntil && (Date.parse(account.trialUntil) <= Date.now() || ["CANCELLED", "SUSPENDED", "EXPIRED"].includes(account.subscriptionStatus));
  const subscriptionLabels = { ACTIVE: "Aktiv", APPROVED: "Bestätigung wird verarbeitet", APPROVAL_PENDING: "Zustimmung ausstehend", CANCELLED: "Gekündigt", SUSPENDED: "Pausiert", EXPIRED: "Beendet", BILLING_RETRY: "Zahlung wird erneut versucht", BILLING_GRACE_PERIOD: "Zahlungsfrist", REVOKED: "Zugang widerrufen" };
  const subscriptionLabel = subscriptionLabels[account?.subscriptionStatus];
  const paypalManagementUrl = [
    "https://www.paypal.com/myaccount/autopay/",
    "https://www.sandbox.paypal.com/myaccount/autopay/",
  ].includes(account?.paypalManagementUrl) ? account.paypalManagementUrl : null;

  return (
    <AccountLayout title="Mein Konto" description="Deine Kontodaten und dein persönlicher Lernfortschritt." active="account">
      {loading ? <p role="status">Dein Konto wird geladen …</p> : accountError ? (
        <AccountError error={accountError} next="/konto" onRetry={reload} />
      ) : account && (
        <>
          {!accountDeleted && <>
          <section className={styles.card} aria-labelledby="account-details">
            <h2 id="account-details">Kontodaten</h2>
            <dl className={styles.details}>
              <div><dt>E-Mail-Adresse</dt><dd>{account.email}</dd></div>
              <div><dt>Zugang</dt><dd>{account.admin ? "Adminzugang" : trialStopped || endedTrial || (trial && !account.paid) ? "Testzugang beendet" : trial && account.paid ? "Kostenloser Testzugang aktiv" : account.paid ? "Premium aktiv" : "Premium nicht aktiv"}</dd></div>
              {trial && account.paid && !trialStopped && trialUntil && <div><dt>Kostenlos bis</dt><dd>{trialUntil}</dd></div>}
              {!trial && !account.admin && account.paid && paidUntil && <div><dt>Zugang bestätigt bis</dt><dd>{paidUntil}</dd></div>}
              {!account.admin && subscriptionLabel && <div><dt>{apple ? "Apple-Abo" : "PayPal-Abo"}</dt><dd>{subscriptionLabel}</dd></div>}
              <div><dt>Anmeldung</dt><dd>Mit einem Code per E-Mail</dd></div>
            </dl>
            {trial && account.paid && !trialStopped && !apple && <p className={styles.muted}>
              Nach den 3 kostenlosen Tagen verlängert sich dein Abo automatisch für 5 € pro Monat.
              Kündige vor dem oben angezeigten Termin bei PayPal, wenn du keine Abozahlung möchtest. Die Kündigung beendet deinen Testzugang.
            </p>}
            {trial && account.paid && apple && <p className={styles.muted}>
              Dein Apple-Testzugang gilt bis zum bestätigten Termin. Preis und Verlängerung richten sich nach den von Apple beim Abschluss angezeigten Bedingungen. Du kannst das Abo in deinem Apple-Konto verwalten.
            </p>}
            {!account.admin && account.subscriptionStatus === "CANCELLED" && <p className={styles.muted}>
              Dein {apple ? "Apple-Abo" : "PayPal-Abo"} ist gekündigt. Es verlängert sich nicht mehr.
              {account.accessType === "paid" && account.paid ? " Dein bereits bezahlter Zugang bleibt bis zum bestätigten Ablauf nutzbar." : !account.paid ? " Dein Zugang ist nicht mehr aktiv." : trialStopped ? " Dein Testzugang ist beendet." : ""}
            </p>}
            {!account.admin && !apple && paypalManagementUrl && (trial || account.accessType === "paid" || subscriptionLabel) && <p>
              <a href={paypalManagementUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>Abo bei PayPal verwalten</a>
            </p>}
            {!account.admin && apple && account.appleManagementUrl === "https://apps.apple.com/account/subscriptions/" && <p>
              <a href={account.appleManagementUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>Abo bei Apple verwalten</a>
            </p>}
            {!account.paid && !account.admin && <Link href="/preise" className={styles.button}>Premium freischalten</Link>}
          </section>
          <section className={styles.card} aria-labelledby="course-summary">
            <h2 id="course-summary">Meine Kurse</h2>
            {progressLoading ? <p role="status">Kursfortschritt wird geladen …</p> : progressError ? (
              <ProgressError error={progressError} next="/konto" onRetry={reload} />
            ) : (
              <>
                <div className={styles.metrics}>
                  <div><strong>{completed}</strong><span>Abgeschlossen</span></div>
                  <div><strong>{started}</strong><span>Begonnen</span></div>
                  <div><strong>{courses.length - known.length}</strong><span>Noch offen</span></div>
                </div>
                <p className={styles.muted}>Dein Fortschritt wird ab jetzt in deinem Konto gespeichert. Frühere Abschlüsse sind hier noch nicht erfasst.</p>
                <Link href="/meine-kurse" className={styles.button}>Zur Kursübersicht</Link>
              </>
            )}
          </section>
          <section className={styles.card} aria-labelledby="activity-summary">
            <h2 id="activity-summary">Meine Auswertungen</h2>
            <p className={styles.muted}>Deine Quizrunden und Ansitzdurchläufe mit Trefferquote, Bestwert und Verlauf.</p>
            <Link href="/auswertungen" className={styles.button}>Auswertungen ansehen</Link>
          </section>
          <section className={styles.card} aria-labelledby="account-privacy">
            <h2 id="account-privacy">Datenschutz und Kontohilfe</h2>
            <p className={styles.muted}>Fragen zu deinen gespeicherten Daten oder eine Anfrage zu Auskunft, Berichtigung oder Löschung kannst du per E-Mail stellen. Eine Datenanfrage kündigt dein PayPal-Abo nicht automatisch.</p>
            <div className={styles.actions}>
              <Link href="/datenschutz" className={styles.secondaryButton}>Datenschutzhinweise lesen</Link>
              <a href="mailto:info@jagdlatein.de?subject=Anfrage%20zu%20meinen%20Kontodaten" className={styles.secondaryButton}>Kontohilfe per E-Mail</a>
            </div>
          </section>
          </>}
          <AccountDeletion onDeleted={() => setAccountDeleted(true)} />
        </>
      )}
    </AccountLayout>
  );
}
