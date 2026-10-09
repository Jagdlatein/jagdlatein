import { useRef, useState } from "react";
import { useRouter } from "next/router";
import LearningToolLayout from "../components/LearningToolLayout";
import { reviewLoginConfiguration } from "../lib/apple-review-login-policy";
import { getNextUrl } from "../lib/login-destination";
import styles from "../styles/Auth.module.css";
import learningStyles from "../styles/LearningExperience.module.css";

export async function getServerSideProps({ res }) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  try { if (!reviewLoginConfiguration()) return { notFound: true }; }
  catch { return { notFound: true }; }
  return { props: {} };
}

export default function ReviewLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setPending(true); setMessage("");
    try {
      const response = await fetch("/api/auth/review-login", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      setPassword("");
      if (!response.ok || result.success !== true) { setMessage(result.message || "Die Anmeldung konnte nicht bestätigt werden."); return; }
      const next = getNextUrl(router.query.next || "/konto");
      await router.replace(new URL(next, "https://jagdlatein.invalid").pathname === "/review-login" ? "/konto" : next);
    } catch { setPassword(""); setMessage("Die Anmeldung ist derzeit nicht verfügbar. Bitte erneut versuchen."); }
    finally { busy.current = false; setPending(false); }
  }
  return <LearningToolLayout title="Prüfkonto anmelden" description="Anmeldung mit den bereitgestellten Zugangsdaten."
    icon="account" eyebrow="Dein Konto" hideCommunity robots="noindex, nofollow">
    <section className={`${learningStyles.panel} ${styles.formPanel}`}>
    <form onSubmit={submit} aria-busy={pending} className={styles.form}>
      <label>E-Mail-Adresse<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" maxLength={320} required disabled={pending} /></label>
      <label>Passwort<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" maxLength={43} required disabled={pending} /></label>
      <button type="submit" className={learningStyles.primary} disabled={pending}>{pending ? "Anmeldung wird geprüft …" : "Anmelden"}</button>
      {message && <p role="status">{message}</p>}
    </form>
    </section>
  </LearningToolLayout>;
}
