import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Account.module.css";

export default function AccountLayout({ title, description, active, children }) {
  return (
    <>
      <Head>
        <title>{`${title} – Jagdlatein`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.main}>
        <div className={styles.wrap}>
          <nav className={styles.nav} aria-label="Kontomenü">
            <Link href="/konto" aria-current={active === "account" ? "page" : undefined}>Mein Konto</Link>
            <Link href="/meine-kurse" aria-current={active === "courses" ? "page" : undefined}>Meine Kurse</Link>
            <Link href="/auswertungen" aria-current={active === "statistics" ? "page" : undefined}>Auswertungen</Link>
            <Link href="/">Startseite</Link>
          </nav>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{description}</p>
          {children}
        </div>
      </main>
    </>
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
