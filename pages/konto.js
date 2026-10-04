import Link from "next/link";
import AccountLayout, { AccountError, ProgressError } from "../components/AccountLayout";
import useAccountOverview from "../hooks/useAccountOverview";
import { getAccountPageProps } from "../lib/account-page";
import { courses } from "../lib/course-catalog";
import styles from "../styles/Account.module.css";

export const getServerSideProps = getAccountPageProps;

function accessDate(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin", timeZoneName: "short" }).format(new Date(value));
}

export default function AccountPage() {
  const { account, progress, accountError, progressError, loading, progressLoading, reload } = useAccountOverview();
  const known = progress.filter((entry) => courses.some((course) => course.id === entry.course_id));
  const completed = known.filter((entry) => entry.status === "completed").length;
  const started = known.filter((entry) => entry.status === "in_progress").length;
  const trial = account?.accessType === "trial" && !account?.admin;
  const trialStopped = trial && ["CANCELLED", "SUSPENDED", "EXPIRED"].includes(account?.subscriptionStatus);
  const trialUntil = accessDate(account?.trialUntil);
  const paidUntil = accessDate(account?.paidUntil);
  const endedTrial = !account?.admin && !account?.paid && trialUntil && (Date.parse(account.trialUntil) <= Date.now() || ["CANCELLED", "SUSPENDED", "EXPIRED"].includes(account.subscriptionStatus));
  const subscriptionLabels = { ACTIVE: "Aktiv", APPROVED: "Bestätigung wird verarbeitet", APPROVAL_PENDING: "Zustimmung ausstehend", CANCELLED: "Gekündigt", SUSPENDED: "Pausiert", EXPIRED: "Beendet" };
  const subscriptionLabel = subscriptionLabels[account?.subscriptionStatus];

  return (
    <AccountLayout title="Mein Konto" description="Deine Kontodaten und dein persönlicher Lernfortschritt." active="account">
      {loading ? <p role="status">Dein Konto wird geladen …</p> : accountError ? (
        <AccountError error={accountError} next="/konto" onRetry={reload} />
      ) : account && (
        <>
          <section className={styles.card} aria-labelledby="account-details">
            <h2 id="account-details">Kontodaten</h2>
            <dl className={styles.details}>
              <div><dt>E-Mail-Adresse</dt><dd>{account.email}</dd></div>
              <div><dt>Zugang</dt><dd>{account.admin ? "Adminzugang" : trialStopped || endedTrial || (trial && !account.paid) ? "Testzugang beendet" : trial && account.paid ? "Kostenloser Testzugang aktiv" : account.paid ? "Premium aktiv" : "Premium nicht aktiv"}</dd></div>
              {trial && account.paid && !trialStopped && trialUntil && <div><dt>Kostenlos bis</dt><dd>{trialUntil}</dd></div>}
              {!trial && !account.admin && account.paid && paidUntil && <div><dt>Zugang bestätigt bis</dt><dd>{paidUntil}</dd></div>}
              {!account.admin && subscriptionLabel && <div><dt>PayPal-Abo</dt><dd>{subscriptionLabel}</dd></div>}
              <div><dt>Anmeldung</dt><dd>Mit einem Code per E-Mail</dd></div>
            </dl>
            {trial && account.paid && !trialStopped && <p className={styles.muted}>
              Nach den 3 kostenlosen Tagen verlängert sich dein Abo automatisch für 5 € pro Monat.
              Du kannst es vor Ablauf bei PayPal kündigen. Dann fällt keine Abozahlung an und dein Testzugang endet.
            </p>}
            {!account.admin && account.subscriptionStatus === "CANCELLED" && <p className={styles.muted}>
              Dein PayPal-Abo ist gekündigt. Es verlängert sich nicht mehr.
              {account.accessType === "paid" && account.paid ? " Dein bereits bezahlter Zugang bleibt bis zum bestätigten Ablauf nutzbar." : !account.paid ? " Dein Zugang ist nicht mehr aktiv." : trialStopped ? " Dein Testzugang ist beendet." : ""}
            </p>}
            {!account.admin && (trial || account.accessType === "paid" || subscriptionLabel) && <p>
              <a href="https://www.paypal.com/myaccount/autopay/" target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>Abo bei PayPal verwalten</a>
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
        </>
      )}
    </AccountLayout>
  );
}
