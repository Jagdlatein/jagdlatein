import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import LearningToolLayout from "../components/LearningToolLayout";
import { JL_ACCOUNT_COOKIE, readAccountSession } from "../lib/account-session";
import { getNextUrl, getLoginDestination } from "../lib/login-destination";
import styles from "../styles/LearningExperience.module.css";
import authStyles from "../styles/Auth.module.css";

export async function getServerSideProps({ req, res, query }) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (readAccountSession(req.cookies?.[JL_ACCOUNT_COOKIE]) && query.reauth !== "1") {
    return { redirect: { destination: getNextUrl(query.next), permanent: false } };
  }
  return { props: {} };
}

export default function LoginPage() {
  const router = useRouter();
  const nextUrl = getNextUrl(router.query.next);
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL || "/preise#paypal-subscribe-preise";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const request = useRef(null);
  const redirectTimer = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      clearTimeout(redirectTimer.current);
    };
  }, []);

  async function submitCode(event, verify) {
    event.preventDefault();
    if (busy.current) return;
    const cleanEmail = email.toLowerCase().trim();
    setMsg("");
    if (verify ? !/^\d{6}$/.test(code) : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg(verify ? "Bitte den 6-stelligen Login-Code eingeben." : "Bitte gültige E-Mail eingeben.");
      return;
    }
    busy.current = true;
    setLoading(true);
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 18000);
    let redirecting = false;
    try {
      const response = await fetch(verify ? "/api/auth/verify-code" : "/api/auth/request-code", {
        method: "POST", credentials: "same-origin", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verify ? { email: cleanEmail, code } : { email: cleanEmail }),
      });
      const data = await response.json();
      if (!mounted.current) return;
      if (!response.ok || data.success === false) {
        setMsg(data.message || (verify ? "Login-Code ist ungültig." : "Code konnte nicht versendet werden."));
        return;
      }
      if (verify) {
        redirecting = true;
        setMsg("Erfolgreich eingeloggt – Weiterleitung …");
        redirectTimer.current = setTimeout(() => {
          if (mounted.current) window.location.href = getLoginDestination(nextUrl, data, paymentUrl);
        }, 500);
      } else {
        setEmail(cleanEmail);
        setStep("code");
        setMsg("Wir haben dir einen 6-stelligen Login-Code per E-Mail geschickt.");
      }
    } catch {
      if (mounted.current) setMsg("Server nicht erreichbar. Bitte erneut versuchen.");
    } finally {
      clearTimeout(timeout);
      request.current = null;
      if (!redirecting) {
        busy.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  }

  return <LearningToolLayout title="Willkommen zurück" description="Melde dich mit deiner E-Mail-Adresse und einem einmaligen Login-Code an." icon="account" eyebrow="Dein Zugang zu Jagdlatein" robots="noindex, nofollow" hideCommunity>
    <section className={`${styles.panel} ${authStyles.formPanel}`} aria-labelledby="login-heading">
      <h2 id="login-heading">{step === "email" ? "Mit E-Mail anmelden" : "Login-Code bestätigen"}</h2>
      <p>{step === "email" ? "Gib deine registrierte E-Mail-Adresse ein." : <>Code an <strong>{email}</strong></>}</p>
      <form className={authStyles.form} onSubmit={event => submitCode(event, step === "code")} aria-busy={loading}>
        {step === "email" ? <label>E-Mail-Adresse
          <input type="email" autoComplete="email" placeholder="name@beispiel.de" value={email} disabled={loading} onChange={event => setEmail(event.target.value)} required />
        </label> : <label>6-stelliger Login-Code
          <input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} maxLength={6} pattern="[0-9]{6}" disabled={loading} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className={authStyles.code} required />
        </label>}
        <button type="submit" className={styles.primary} disabled={loading}>{loading ? (step === "email" ? "Wird gesendet …" : "Wird geprüft …") : (step === "email" ? "Login-Code senden" : "Einloggen")}</button>
      </form>
      {step === "code" && <button type="button" className={`${styles.secondary} ${authStyles.otherEmail}`} disabled={loading} onClick={() => { setStep("email"); setCode(""); setMsg(""); }}>Andere E-Mail verwenden</button>}
      {msg && <p className={`${styles.note} ${authStyles.message}`} role="status" aria-live="polite">{msg}</p>}
    </section>
  </LearningToolLayout>;
}