import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import styles from "../styles/Account.module.css";

export default function AccountLayout({ title, description, active, children, hideCommunity = false }) {
  return (
    <LearningToolLayout title={title} description={description} icon={active === "statistics" ? "chart" : active === "courses" ? "progress" : "account"} eyebrow="Dein persönlicher Lernbereich" robots="noindex, nofollow" hideCommunity={hideCommunity} compact>
        <div className={styles.wrap}>
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
