import Link from "next/link";
import AccountLayout, { AccountError, ProgressError } from "../components/AccountLayout";
import useAccountOverview from "../hooks/useAccountOverview";
import { getAccountPageProps } from "../lib/account-page";
import { courses } from "../lib/course-catalog";
import styles from "../styles/Account.module.css";

export const getServerSideProps = getAccountPageProps;

export default function AccountPage() {
  const { account, progress, accountError, progressError, loading, progressLoading, reload } = useAccountOverview();
  const known = progress.filter((entry) => courses.some((course) => course.id === entry.course_id));
  const completed = known.filter((entry) => entry.status === "completed").length;
  const started = known.filter((entry) => entry.status === "in_progress").length;

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
              <div><dt>Zugang</dt><dd>{account.admin ? "Adminzugang" : account.paid ? "Premium aktiv" : "Premium nicht aktiv"}</dd></div>
              <div><dt>Anmeldung</dt><dd>Mit einem Code per E-Mail</dd></div>
            </dl>
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
        </>
      )}
    </AccountLayout>
  );
}
