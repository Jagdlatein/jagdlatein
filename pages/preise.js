// pages/preise.js
import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";
import checkoutStyles from "../styles/Checkout.module.css";
import { getNextUrl } from "../lib/login-destination";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

function accessDate(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin", timeZoneName: "short" }).format(new Date(value));
}

export default function Preise() {
  const router = useRouter();
  const [paymentMessage, setPaymentMessage] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("checking");
  const [account, setAccount] = useState(null);
  const [activation, setActivation] = useState(null);
  const [offerVerified, setOfferVerified] = useState(false);
  const [checkoutRevision, setCheckoutRevision] = useState(0);
  const retryApproval = useRef(null);
  const trialPlan = (process.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID || "").trim();
  const regularPlan = (process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "").trim();
  const validPlan = (value) => /^P-[A-Z0-9]{6,64}$/.test(value);
  const isTrialPlan = Boolean(trialPlan && validPlan(trialPlan));
  // A broken explicit trial configuration must never charge the old plan.
  const planId = trialPlan ? (isTrialPlan ? trialPlan : null) : (validPlan(regularPlan) ? regularPlan : null);
  const showTrialOffer = isTrialPlan && offerVerified;

  const learningHref = useMemo(() => {
    const destination = getNextUrl(router.query.next);
    return new URL(destination, "https://jagdlatein.invalid").pathname.replace(/\/+$/, "") === "/preise" ? "/" : destination;
  }, [router.query.next]);
  const checkoutHref = `/preise${learningHref !== "/" ? `?next=${encodeURIComponent(learningHref)}` : ""}#paypal-subscribe-preise`;
  const loginHref = `/login?next=${encodeURIComponent(checkoutHref)}`;
  const registerHref = `/registrieren?next=${encodeURIComponent(checkoutHref)}`;

  useEffect(() => {
    let cancelled = false;
    let eligible = false;
    let confirming = false;
    let subscriptionPromise;
    let script;
    let buttons;
    let checkoutEmail;
    const controller = new AbortController();
    setCheckoutStatus("checking");
    setPaymentMessage("");
    setOfferVerified(false);
    retryApproval.current = null;

    function closeButtons() {
      eligible = false;
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
    }

    async function confirmApproval(subscriptionId) {
      if (cancelled || confirming) return;
      confirming = true;
      setCheckoutStatus("confirming");
      setPaymentMessage("Deine Abo-Bestätigung wird geprüft …");
      const attempt = new AbortController();
      const cancelAttempt = () => attempt.abort();
      controller.signal.addEventListener("abort", cancelAttempt, { once: true });
      const timeout = setTimeout(cancelAttempt, 18000);
      try {
        const response = await fetch("/api/paypal/confirm-subscription", {
          method: "POST", credentials: "same-origin", signal: attempt.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        });
        const confirmation = await response.json();
        if (cancelled) return;
        if (!response.ok || confirmation.activated !== true) {
          setCheckoutStatus("pending");
          setPaymentMessage(confirmation.error || confirmation.message || "Deine Bestätigung wird noch verarbeitet. Prüfe den Zugang erneut; ein weiterer Kauf ist nicht nötig.");
          return;
        }
        // Refresh the signed session from the server, preserving its original
        // authentication deadline. A confirmed purchase needs no second login.
        const statusResponse = await fetch("/api/auth/status", { cache: "no-store", credentials: "same-origin", signal: attempt.signal });
        const access = await statusResponse.json();
        if (cancelled) return;
        if (!statusResponse.ok || access.loggedIn !== true || access.paid !== true ||
            typeof access.email !== "string" || access.email.toLowerCase() !== checkoutEmail) {
          setCheckoutStatus("pending");
          setPaymentMessage("Dein Abo ist bestätigt. Der Lernzugang konnte noch nicht geladen werden. Prüfe den Zugang erneut; ein weiterer Kauf ist nicht nötig.");
          return;
        }
        const until = accessDate(confirmation.trialUntil);
        setActivation({ accessType: confirmation.accessType === "trial" ? "trial" : "paid" });
        setCheckoutStatus("complete");
        setPaymentMessage(confirmation.accessType === "trial"
          ? until ? `Dein Testzugang ist aktiv – kostenlos bis ${until}.` : "Dein Testzugang ist aktiv. Die Laufzeit steht in deinem Konto."
          : "Dein Lernzugang ist aktiv. Du kannst jetzt weiterlernen.");
      } catch {
        if (!cancelled) {
          setCheckoutStatus("pending");
          setPaymentMessage("Deine Bestätigung konnte noch nicht geprüft werden. Prüfe den Zugang erneut; ein weiterer Kauf ist nicht nötig.");
        }
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", cancelAttempt);
        confirming = false;
      }
    }

    function loadPayPal(paypalPlanId, paypalClientId) {
      if (cancelled || !eligible) return;
      script = document.createElement("script");
      const paypalFailed = () => {
        if (cancelled) return;
        eligible = false;
        setCheckoutStatus("sdk-error");
        setPaymentMessage("PayPal konnte nicht geladen werden. Bitte erneut versuchen.");
      };

      script.src =
        `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&vault=true&intent=subscription&currency=EUR`;

      script.async = true;

      script.onload = () => {
        if (cancelled || !eligible) return;
        try {
          if (!window.paypal || typeof window.paypal.Buttons !== "function") throw new Error("PayPal nicht geladen.");
          buttons = window.paypal.Buttons({
            style: {
              shape: "rect",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },

            createSubscription() {
              if (cancelled || !eligible) return Promise.reject(new Error("Aboabschluss derzeit nicht möglich."));
              if (!subscriptionPromise) {
                subscriptionPromise = Promise.resolve().then(async () => {
                  if (cancelled || !eligible) throw new Error("Aboabschluss derzeit nicht möglich.");
                  const response = await fetch("/api/paypal/create-subscription", {
                    method: "POST", credentials: "same-origin", signal: controller.signal,
                    headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
                  });
                  const created = await response.json();
                  if (!response.ok || typeof created.subscriptionId !== "string" || !/^I-[A-Z0-9]{6,64}$/i.test(created.subscriptionId))
                    throw new Error("Das Abo konnte deinem aktuellen Konto nicht zugeordnet werden.");
                  return created.subscriptionId;
                })
                  .catch((error) => { subscriptionPromise = null; throw error; });
              }
              return subscriptionPromise;
            },

            async onApprove(data) {
              if (cancelled || !eligible || confirming) return;
              closeButtons();
              retryApproval.current = () => confirmApproval(data.subscriptionID);
              await confirmApproval(data.subscriptionID);
            },
            onCancel() {
              subscriptionPromise = null;
              if (!cancelled) setPaymentMessage("Der Aboabschluss bei PayPal wurde abgebrochen.");
            },
            onError() { if (!cancelled) setPaymentMessage("PayPal ist derzeit nicht erreichbar. Bitte erneut versuchen."); },
          });
          Promise.resolve(buttons.render("#paypal-subscribe-preise")).catch(paypalFailed);
        } catch {
          paypalFailed();
        }
      };

      script.onerror = paypalFailed;
      document.body.appendChild(script);
    }

    async function checkAccount() {
      try {
        const response = await fetch("/api/account", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
        if (cancelled) return;
        if (response.status !== 401) {
          if (!response.ok) throw new Error("Kontostatus nicht verfügbar.");
          const data = await response.json();
          if (cancelled) return;
          if (!data.account || typeof data.account.paid !== "boolean" || typeof data.account.admin !== "boolean") throw new Error("Kontostatus nicht verfügbar.");
          setAccount(data.account);
          checkoutEmail = typeof data.account.email === "string" ? data.account.email.trim().toLowerCase() : null;
          if (data.account.paid || data.account.admin) {
            setCheckoutStatus("existing");
            return;
          }
        } else {
          setAccount(null);
          setCheckoutStatus("login-required");
          return;
        }
        if (!planId) {
          setCheckoutStatus("unavailable");
          return;
        }
        let offer;
        try {
          // Every checkout is approved by the server before the SDK is loaded.
          // In the private sandbox mode this rejects incomplete test settings.
          const configuration = await fetch("/api/paypal/checkout-config", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
          if (cancelled) return;
          if (!configuration.ok) throw new Error("Abo nicht verfügbar.");
          offer = await configuration.json();
          if (cancelled) return;
          if (!offer || offer.planId !== planId || !validPlan(offer.planId) ||
              typeof offer.clientId !== "string" || !/^[A-Za-z0-9_-]{20,256}$/.test(offer.clientId) ||
              offer.trialDays !== (isTrialPlan ? 3 : 0) || offer.amount !== "10.00" || offer.currency !== "EUR")
            throw new Error("Abo nicht verfügbar.");
        } catch {
          if (!cancelled) setCheckoutStatus(isTrialPlan ? "trial-unavailable" : "unavailable");
          return;
        }
        setOfferVerified(true);
        eligible = true;
        setCheckoutStatus("ready");
        loadPayPal(offer.planId, offer.clientId);
      } catch {
        if (!cancelled) setCheckoutStatus("error");
      }
    }
    void checkAccount();

    return () => {
      cancelled = true;
      eligible = false;
      controller.abort();
      retryApproval.current = null;
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
      try {
        if (script) document.body.removeChild(script);
      } catch {}
    };
  }, [planId, checkoutRevision]);

  const accessReady = checkoutStatus === "existing" || checkoutStatus === "complete";
  const currentStep = accessReady ? 3 : account ? 2 : 1;
  return <LearningToolLayout title="Dein Zugang zum Lernen" description="Mit deinem Jagdlatein-Konto anmelden, das Abo bestätigen und loslernen."
    icon="shield" eyebrow="Lernen mit Jagdlatein" hideCommunity compact>
    <section className={`${styles.panel} ${checkoutStyles.panel}`} aria-labelledby="price-heading">
      <ol className={checkoutStyles.steps} aria-label="Dein Weg zum Lernzugang">
        {["Anmelden", "Abo bestätigen", "Lernen"].map((label, index) => <li key={label} className={index + 1 <= currentStep ? checkoutStyles.reached : undefined} aria-current={index + 1 === currentStep ? "step" : undefined}>
          <span aria-hidden="true">{index + 1}</span>{label}
        </li>)}
      </ol>
      <h2 id="price-heading">{accessReady ? "Dein Lernzugang ist aktiv" : checkoutStatus === "login-required" ? "Zuerst mit deinem Konto anmelden" : showTrialOffer ? "3 Tage kostenlos testen" : "Dein Jagdlatein-Abo"}</h2>
      {checkoutStatus === "login-required" && <>
        <p>Du brauchst nur deine E-Mail-Adresse und einen Anmeldecode. Ein Passwort ist nicht nötig.</p>
        <div className={checkoutStyles.actions}>
          <Link href={loginHref} className={styles.primary}>Ich habe schon ein Konto</Link>
          <Link href={registerHref} className={styles.secondary}>Kostenloses Konto anlegen</Link>
        </div>
        <p className={styles.muted}>Danach kommst du direkt zur Abo-Auswahl zurück. Das Konto ist kostenlos; ein Abo startet erst nach deiner Zustimmung beim Zahlungsanbieter.</p>
      </>}
      {account?.email && !accessReady && <p className={checkoutStyles.account}><span>Angemeldet als</span><strong>{account.email}</strong><span>Dein Abo wird diesem Jagdlatein-Konto zugeordnet.</span></p>}
      {!accessReady && offerVerified && <>
        <p className={checkoutStyles.price}>{showTrialOffer ? "3 Tage kostenlos, danach automatisch 10 € / Monat · jederzeit kündbar" : "10 € / Monat · jederzeit kündbar"}</p>
        {showTrialOffer && <p>Die Probezeit beginnt mit dem von PayPal bestätigten Abostart. Danach verlängert sich dein Abo monatlich für 10 €. Kündigst du vor Ablauf bei PayPal, fällt keine Abozahlung an. Die Kündigung beendet den unbezahlten Testzugang.</p>}
        {checkoutStatus === "ready" && <p>Bestätige jetzt dein Abo bei PayPal. Deine PayPal-E-Mail darf von deiner Jagdlatein-E-Mail abweichen.</p>}
      </>}
      {checkoutStatus === "checking" && <p role="status">Dein Kontostatus wird geprüft …</p>}
      {checkoutStatus === "existing" && <p>Du kannst direkt weiterlernen. Die Laufzeit und dein Abo findest du im Konto.</p>}
      {(checkoutStatus === "unavailable" || checkoutStatus === "trial-unavailable") && <p role="alert" className={styles.note}>{trialPlan ? "Das Testabo ist derzeit nicht verfügbar." : "Das Aboangebot ist derzeit nicht verfügbar."} Bitte versuche es später erneut.</p>}
      {(checkoutStatus === "unavailable" || checkoutStatus === "trial-unavailable" || checkoutStatus === "sdk-error") && <p><button type="button" className={styles.secondary} onClick={() => setCheckoutRevision(value => value + 1)}>Erneut prüfen</button></p>}
      {checkoutStatus === "error" && <div role="alert" className={styles.note}><p>Dein Kontostatus konnte nicht geprüft werden.</p><button type="button" className={styles.secondary} onClick={() => setCheckoutRevision(value => value + 1)}>Erneut prüfen</button></div>}
      <div id="paypal-subscribe-preise" className={checkoutStyles.paypal} hidden={checkoutStatus !== "ready" || Boolean(activation)} />
      {paymentMessage && <p role="status" aria-live="polite" className={styles.note}>{paymentMessage}</p>}
      {checkoutStatus === "pending" && <div className={checkoutStyles.actions}><button type="button" className={styles.primary} onClick={() => retryApproval.current?.()}>Zugang erneut prüfen</button><Link href="/konto" className={styles.secondary}>Zum Konto</Link></div>}
      {accessReady && <div className={checkoutStyles.actions}><Link href={learningHref === "/" ? "/meine-kurse" : learningHref} className={styles.primary}>Jetzt lernen</Link><Link href="/konto" className={styles.secondary}>Mein Konto und Abo</Link></div>}
      {offerVerified && !accessReady && <p className={styles.muted}>Abschluss und spätere Zahlungen erfolgen über PayPal. Erst die geprüfte Bestätigung schaltet deinen Lernzugang frei.</p>}
    </section>
    <details className={`${styles.panel} ${checkoutStyles.panel} ${checkoutStyles.help}`}>
      <summary>Hilfe zu Anmeldung und Zahlung</summary>
      <p>Der Anmeldecode kommt an deine Jagdlatein-E-Mail-Adresse. Prüfe auch den Spamordner. Auf der Anmeldeseite kannst du die Adresse ändern oder einen neuen Code anfordern.</p>
      <p>Dein Jagdlatein-Konto speichert deinen Lernzugang. Die Zahlung bestätigst du anschließend bei PayPal oder in der iPhone-/iPad-App bei Apple.</p>
      <a href="mailto:info@jagdlatein.de?subject=Frage%20zur%20Zahlung%20bei%20Jagdlatein" className={styles.secondary}>Kontohilfe per E-Mail</a>
    </details>
  </LearningToolLayout>;
}
