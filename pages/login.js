import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LearningToolLayout from "../components/LearningToolLayout";
import { JL_ACCOUNT_COOKIE, readAccountSession } from "../lib/account-session";
import { getNextUrl, getLoginDestination } from "../lib/login-destination";
import { getTestLoginMailMode } from "../lib/test-environment";
import { reviewLoginConfiguration } from "../lib/apple-review-login-policy";
import styles from "../styles/LearningExperience.module.css";
import authStyles from "../styles/Auth.module.css";

export async function getServerSideProps({ req, res, query }) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (readAccountSession(req.cookies?.[JL_ACCOUNT_COOKIE]) && query.reauth !== "1") {
    return { redirect: { destination: getNextUrl(query.next), permanent: false } };
  }
  const testMailMode = getTestLoginMailMode();
  let allowReviewLogin = false;
  try { allowReviewLogin = Boolean(reviewLoginConfiguration()); }
  catch { /* Invalid private review settings leave ordinary email sign-in available. */ }
  return { props: { allowRegistration: process.env.ACCOUNT_REGISTRATION_ENABLED === "true",
    isTestMail: testMailMode !== null, testMailMode, allowReviewLogin } };
}

export default function LoginPage({ registration = false, allowRegistration = false, isTestMail = false, testMailMode = "sink", allowReviewLogin = false } = {}) {
  const router = useRouter();
  const nextUrl = getNextUrl(router.query.next);
  const nextPath = decodeURIComponent(new URL(nextUrl, "https://jagdlatein.invalid").pathname).replace(/\/+$/, "");
  const forSubscription = nextPath === "/preise";
  const loginHref = `/login?next=${encodeURIComponent(nextUrl)}`;
  const registrationHref = `/registrieren?next=${encodeURIComponent(nextUrl)}`;
  const reviewNextUrl = nextUrl === "/" || nextPath === "/review-login" ? "/konto" : nextUrl;
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL || "/preise#paypal-subscribe-preise";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const busy = useRef(false);
  const mounted = useRef(true);
  const request = useRef(null);
  const requestTimer = useRef(null);
  const redirectTimer = useRef(null);
  const resendTimer = useRef(null);
  const resendDeadlines = useRef(new Map());
  const authMode = useRef(registration);

  useEffect(() => {
    mounted.current = true;
    // Both routes export this component, so Next can retain it when switching.
    // A code belongs to one endpoint; only the address survives the switch.
    if (authMode.current !== registration) {
      authMode.current = registration;
      setStep("email");
      setCode("");
      setMsg("");
      setLoading(false);
      updateResendWait(email);
    }
    return () => {
      mounted.current = false;
      request.current?.abort();
      request.current = null;
      busy.current = false;
      clearTimeout(requestTimer.current);
      clearTimeout(redirectTimer.current);
      clearTimeout(resendTimer.current);
    };
  }, [registration]);

  function resendKey(cleanEmail) {
    return `${registration ? "register" : "login"}:${cleanEmail}`;
  }

  function remainingWait(cleanEmail) {
    return Math.max(0, Math.ceil(((resendDeadlines.current.get(resendKey(cleanEmail)) || 0) - Date.now()) / 1000));
  }

  function updateResendWait(value) {
    clearTimeout(resendTimer.current);
    const cleanEmail = value.toLowerCase().trim();
    const remaining = remainingWait(cleanEmail);
    setResendSeconds(remaining);
    // Use the original deadline rather than decrementing a counter. Timers
    // paused by a mobile browser then catch up when the page becomes active.
    if (remaining > 0) resendTimer.current = setTimeout(() => {
      if (mounted.current) updateResendWait(cleanEmail);
    }, 1000);
  }

  async function submitCode(event, verify) {
    event.preventDefault();
    if (busy.current) return;
    const cleanEmail = email.toLowerCase().trim();
    setMsg("");
    if (verify ? !/^\d{6}$/.test(code) : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg(verify ? "Bitte den 6-stelligen Login-Code eingeben." : "Bitte gültige E-Mail eingeben.");
      return;
    }
    if (!verify && remainingWait(cleanEmail) > 0) {
      updateResendWait(cleanEmail);
      setStep("code");
      setMsg("Nutze den zuletzt angeforderten Code. Einen neuen kannst du nach Ablauf der Wartezeit anfordern.");
      return;
    }
    busy.current = true;
    setLoading(true);
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 18000);
    requestTimer.current = timeout;
    const isCurrentRequest = () => mounted.current && request.current === controller;
    let redirecting = false;
    try {
      const endpoint = registration
        ? (verify ? "/api/auth/register-verify" : "/api/auth/register-request")
        : (verify ? "/api/auth/verify-code" : "/api/auth/request-code");
      const response = await fetch(endpoint, {
        method: "POST", credentials: "same-origin", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verify ? { email: cleanEmail, code } : { email: cleanEmail }),
      });
      const data = await response.json();
      if (!isCurrentRequest()) return;
      if (controller.signal.aborted) throw new Error("Anfrage abgelaufen.");
      if (!response.ok || data.success === false) {
        setMsg(data.message || (verify ? "Login-Code ist ungültig." : "Code konnte nicht versendet werden."));
        return;
      }
      if (verify) {
        redirecting = true;
        setMsg("Erfolgreich eingeloggt – Weiterleitung …");
        redirectTimer.current = setTimeout(() => {
          if (isCurrentRequest()) window.location.href = getLoginDestination(registration && nextUrl === "/" ? "/konto" : nextUrl, data, paymentUrl);
        }, 500);
      } else {
        // Apply the same visible wait to every neutral success response. It
        // does not reveal whether the address has a registered account.
        resendDeadlines.current.set(resendKey(cleanEmail), Date.now() + 60000);
        updateResendWait(cleanEmail);
        setEmail(cleanEmail);
        setCode("");
        setStep("code");
        setMsg(typeof data.message === "string" && data.message.trim() ? data.message : (registration
          ? "Falls die Adresse erreichbar ist, wurde ein Bestätigungscode versendet."
          : "Falls diese E-Mail registriert ist, wurde ein Login-Code versendet."));
      }
    } catch {
      if (isCurrentRequest()) setMsg("Server nicht erreichbar. Bitte erneut versuchen.");
    } finally {
      clearTimeout(timeout);
      // A late result from the former route must not release a newer request.
      if (isCurrentRequest() && !redirecting) {
        request.current = null;
        busy.current = false;
        setLoading(false);
      }
    }
  }

  const title = forSubscription ? "Dein Konto für das Abo" : registration ? "Dein Lernkonto" : "Willkommen zurück";
  const description = forSubscription
    ? "Mit deinem Jagdlatein-Konto bleibt dein Abo dir zugeordnet. Erst danach bestätigst du dein Angebot und die Zahlung."
    : registration ? "Erstelle dein kostenloses Konto und bestätige deine E-Mail-Adresse. Ein Abo wählst du danach separat." : "Melde dich mit deiner E-Mail-Adresse und einem einmaligen Login-Code an.";

  return <LearningToolLayout title={title} description={description} icon="account" eyebrow="Dein Zugang zu Jagdlatein" robots="noindex, nofollow" hideCommunity compact>
    <section className={`${styles.panel} ${authStyles.formPanel}`} aria-labelledby="login-heading">
      {forSubscription && <ol className={authStyles.progress} aria-label="Schritte zum Abo">
        {["E-Mail", "Code bestätigen", "Abo wählen"].map((label, index) => <li key={label} aria-current={(step === "email" ? 0 : 1) === index ? "step" : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}
      </ol>}
      {forSubscription && allowRegistration && !registration && step === "email" && <nav className={authStyles.accountChoice} aria-label="Jagdlatein-Konto wählen">
        <Link href={loginHref} aria-current={!registration ? "page" : undefined}>Ich habe ein Konto</Link>
        <Link href={registrationHref} aria-current={registration ? "page" : undefined}>Konto kostenlos anlegen</Link>
      </nav>}
      <h2 id="login-heading">{step === "email" ? (forSubscription && registration ? "Mit E-Mail fortfahren" : registration ? "Konto kostenlos anlegen" : "Mit E-Mail anmelden") : (registration ? "E-Mail bestätigen" : "Login-Code bestätigen")}</h2>
      <p>{step === "email" ? (forSubscription && registration ? "Mit deiner E-Mail anmelden oder kostenloses Konto anlegen. Dein bestehendes Konto bleibt erhalten. Dieser Schritt löst keine Zahlung aus." : registration ? "Gib die E-Mail-Adresse für dein Jagdlatein-Konto ein. Die Registrierung löst keine Zahlung aus." : "Gib die E-Mail-Adresse deines Jagdlatein-Kontos ein.") : <>Code für <strong className={authStyles.emailAddress}>{email}</strong></>}</p>
      {isTestMail && <p className={styles.note}>
        <strong>Testumgebung:</strong> {testMailMode === "tester-smtp"
          ? "Freigegebene Tester erhalten ihren Anmelde- oder Registrierungscode per E-Mail. Bitte prüfe auch den Spamordner."
          : "Anmelde- und Registrierungscodes landen ausschließlich im getrennten Testpostfach. Dein normales E-Mail-Postfach erhält keine Nachricht."}
        {" Konten der öffentlichen App werden hier nicht übernommen."}
        {registration ? (testMailMode === "tester-smtp" ? " Registriere dein eigenes Testkonto mit deiner freigegebenen E-Mail-Adresse." : " Mit dem Code aus dem Testpostfach bestätigst du dein eigenes Testkonto.")
          : allowRegistration && " Wenn du hier noch kein Konto hast, wähle zuerst „Kostenlos registrieren“."}
      </p>}
      <form className={authStyles.form} onSubmit={event => submitCode(event, step === "code")} aria-busy={loading}>
        {step === "email" ? <label>E-Mail-Adresse
          <input key="email" type="email" inputMode="email" enterKeyHint="next" autoComplete="email" autoCapitalize="none" spellCheck={false} autoFocus placeholder="name@beispiel.de" value={email} disabled={loading} onChange={event => { setEmail(event.target.value); updateResendWait(event.target.value); }} aria-describedby="login-help" required />
        </label> : <label>{registration ? "6-stelliger Bestätigungscode" : "6-stelliger Login-Code"}
          <input key="code" type="text" inputMode="numeric" enterKeyHint="go" autoComplete="one-time-code" autoFocus placeholder="123456" value={code} maxLength={6} pattern="[0-9]{6}" disabled={loading} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className={authStyles.code} aria-describedby="login-help" required />
        </label>}
        <p id="login-help" className={authStyles.help}>{step === "email" ? "Kein Passwort nötig: Du bestätigst deine E-Mail mit einem einmaligen Code." : isTestMail && testMailMode === "sink" ? "Der Code steht im getrennten Testpostfach. Gib den neuesten Code ein; er ist 10 Minuten gültig." : "Öffne dein E-Mail-Postfach und gib den neuesten Code ein; er ist 10 Minuten gültig. Prüfe auch den Spamordner."}</p>
        <button type="submit" className={styles.primary} disabled={loading}>{loading ? (step === "email" ? "Wird gesendet …" : "Wird geprüft …") : (step === "email" ? (registration ? "Bestätigungscode senden" : "Login-Code senden") : (forSubscription ? "Bestätigen und zum Abo" : "Einloggen"))}</button>
      </form>
      {msg && <p className={`${styles.note} ${authStyles.message}`} role="status" aria-live="polite">{msg}</p>}
      {step === "code" && <div className={authStyles.codeActions}>
        <button type="button" className={styles.secondary} disabled={loading} onClick={() => { setStep("email"); setCode(""); setMsg(""); }}>E-Mail ändern</button>
        <button type="button" className={styles.secondary} disabled={loading || resendSeconds > 0} aria-describedby="resend-help" onClick={event => submitCode(event, false)}>Neuen Code senden</button>
        <p id="resend-help">{resendSeconds > 0 ? <><span aria-hidden="true">Neuer Code in {resendSeconds} {resendSeconds === 1 ? "Sekunde" : "Sekunden"}.</span><span className={authStyles.srOnly}>Bitte warte kurz, bevor du einen neuen Code anforderst.</span></> : "Kein Code angekommen? Prüfe zuerst den Spamordner und fordere dann einen neuen Code an."}</p>
      </div>}
      {!(forSubscription && allowRegistration && step === "email") && (registration ? <p className={authStyles.switchAccount}>Bereits ein Konto? <Link href={loginHref}>Mit E-Mail anmelden</Link></p> : allowRegistration && <p className={authStyles.switchAccount}>Noch kein Konto? <Link href={registrationHref}>Kostenlos registrieren</Link></p>)}
      {!registration && !isTestMail && allowReviewLogin === true && <p><Link href={`/review-login?next=${encodeURIComponent(reviewNextUrl)}`} className={styles.secondary}>Mit Prüfkonto anmelden</Link></p>}
    </section>
  </LearningToolLayout>;
}
