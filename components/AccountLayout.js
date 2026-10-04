import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import AppIcon from "./AppIcon";
import styles from "../styles/Account.module.css";

export default function AccountLayout({ title, description, active, children }) {
  return (
    <LearningToolLayout title={title} description={description} icon={active === "statistics" ? "chart" : active === "courses" ? "progress" : "account"} eyebrow="Dein persönlicher Lernbereich" robots="noindex, nofollow">
        <div className={styles.wrap}>
          <nav className={styles.nav} aria-label="Kontomenü">
            <Link href="/konto" aria-current={active === "account" ? "page" : undefined}><AppIcon name="account" size={18} />Mein Konto</Link>
            <Link href="/meine-kurse" aria-current={active === "courses" ? "page" : undefined}><AppIcon name="progress" size={18} />Meine Kurse</Link>
            <Link href="/auswertungen" aria-current={active === "statistics" ? "page" : undefined}><AppIcon name="chart" size={18} />Auswertungen</Link>
            <Link href="/community"><AppIcon name="community" size={18} />Community</Link>
            <Link href="/"><AppIcon name="home" size={18} />Startseite</Link>
          </nav>
          {children}
        </div>
    </LearningToolLayout>
  );
}

export function AccountError({ error, next, onRetry }) {
  const renew = error.status === 401;
  return (
    <div className={styles.notice} role="alert">
      <p>{renew
        ? "Bitte bestätige deine Anmeldung einmal mit einem E-Mail-Code, um deine persönlichen Kursdaten zu sehen."
        : "Deine Kontodaten sind gerade nicht erreichbar. Bitte versuche es später erneut."}</p>
      {renew ? (
        <Link href={`/login?reauth=1&next=${encodeURIComponent(next)}`} className={styles.button}>Anmeldung erneuern</Link>
      ) : (
        <button type="button" onClick={onRetry} className={styles.button}>Erneut versuchen</button>
      )}
    </div>
  );
}

export function ProgressError({ error, next = "/meine-kurse", onRetry }) {
  if (error?.status === 401) {
    return <AccountError error={error} next={next} onRetry={onRetry} />;
  }
  return (
    <div className={styles.notice} role="alert">
      <p>Dein Kursfortschritt ist gerade nicht erreichbar. Bitte versuche es später erneut.</p>
      <button type="button" onClick={onRetry} className={styles.secondaryButton}>Erneut versuchen</button>
    </div>
  );
}
