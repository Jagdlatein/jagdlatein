// pages/preise.js
import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";
import authStyles from "../styles/Auth.module.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const [trialOfferVerified, setTrialOfferVerified] = useState(false);
  const [checkoutRevision, setCheckoutRevision] = useState(0);
  const trialPlan = (process.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID || "").trim();
  const regularPlan = (process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-9XU38461YG7706134NESJQWA").trim();
  const validPlan = (value) => /^P-[A-Z0-9]{6,64}$/.test(value);
  const isTrialPlan = Boolean(trialPlan && validPlan(trialPlan));
  // A broken explicit trial configuration must never charge the old plan.
  const planId = trialPlan ? (isTrialPlan ? trialPlan : null) : (validPlan(regularPlan) ? regularPlan : null);
  const showTrialOffer = isTrialPlan && trialOfferVerified;

  const nextParam = useMemo(() => {
    const raw = router.query.next;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.next]);

  const loginHref = useMemo(() => {
    if (!nextParam) return "/login";
    return `/login?next=${encodeURIComponent(String(nextParam))}`;
  }, [nextParam]);

  useEffect(() => {
    let cancelled = false;
    let eligible = false;
    let confirming = false;
    let subscriptionPromise;
    let script;
    let buttons;
    const controller = new AbortController();
    setCheckoutStatus("checking");
    setPaymentMessage("");
    setTrialOfferVerified(false);

    if (!planId) {
      setCheckoutStatus("unavailable");
      return () => controller.abort();
    }

    function loadPayPal(paypalPlanId) {
      if (cancelled || !eligible) return;
      script = document.createElement("script");
      const paypalFailed = () => {
        if (cancelled) return;
        eligible = false;
        setCheckoutStatus("sdk-error");
        setPaymentMessage("PayPal konnte nicht geladen werden. Bitte erneut versuchen.");
      };

      script.src =
        `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AQx7R9V-b-x8NJmvXUkRrJ-Js68jqMq3udNpdVmONZrpS0y6zpUj5QMIAiunCQDCTPpwmiKFaJJybJBW")}&vault=true&intent=subscription&currency=EUR`;

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

            createSubscription(data, actions) {
              if (cancelled || !eligible) return Promise.reject(new Error("Aboabschluss derzeit nicht möglich."));
              if (!subscriptionPromise) {
                subscriptionPromise = Promise.resolve().then(() => {
                  if (cancelled || !eligible) throw new Error("Aboabschluss derzeit nicht möglich.");
                  return actions.subscription.create({ plan_id: paypalPlanId });
                })
                  .catch((error) => { subscriptionPromise = null; throw error; });
              }
              return subscriptionPromise;
            },

            async onApprove(data) {
              if (cancelled || !eligible || confirming) return;
              confirming = true;
              setPaymentMessage("Deine Abo-Bestätigung wird geprüft …");
              try {
                const response = await fetch("/api/paypal/confirm-subscription", {
                  method: "POST", credentials: "same-origin", signal: controller.signal,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscriptionId: data.subscriptionID }),
                });
                const confirmation = await response.json();
                if (cancelled) return;
                if (!response.ok || confirmation.activated !== true) {
                  setPaymentMessage(confirmation.error || "Die Bestätigung wird noch verarbeitet. Bitte melde dich in Kürze mit deiner PayPal-E-Mail an.");
                  return;
                }
                eligible = false;
                try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
                if (confirmation.accessType === "trial") {
                  const until = accessDate(confirmation.trialUntil);
                  setActivation({ accessType: "trial" });
                  setPaymentMessage(until
                    ? `Testzugang aktiviert – kostenlos bis ${until}. Melde dich mit deiner PayPal-E-Mail an.`
                    : "Dein Testzugang wurde bestätigt. Melde dich mit deiner PayPal-E-Mail an, um die Laufzeit im Konto zu prüfen.");
                  return;
                }
                window.location.href = `${loginHref}${loginHref.includes("?") ? "&" : "?"}reauth=1`;
              } catch {
                if (!cancelled) setPaymentMessage("Die Bestätigung konnte noch nicht geprüft werden. Bitte melde dich später mit deiner PayPal-E-Mail an.");
              } finally {
                confirming = false;
              }
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
          if (data.account.paid || data.account.admin) {
            setCheckoutStatus("existing");
            return;
          }
        } else {
          setAccount(null);
        }
        let paypalPlanId = planId;
        if (isTrialPlan) {
          let offer;
          try {
            const configuration = await fetch("/api/paypal/checkout-config", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
            if (cancelled) return;
            if (!configuration.ok) throw new Error("Testabo nicht verfügbar.");
            offer = await configuration.json();
            if (cancelled) return;
            if (!offer || offer.planId !== planId || !validPlan(offer.planId) || offer.trialDays !== 3 || offer.amount !== "5.00" || offer.currency !== "EUR") throw new Error("Testabo nicht verfügbar.");
          } catch {
            if (!cancelled) setCheckoutStatus("trial-unavailable");
            return;
          }
          paypalPlanId = offer.planId;
          setTrialOfferVerified(true);
        }
        eligible = true;
        setCheckoutStatus("ready");
        loadPayPal(paypalPlanId);
      } catch {
        if (!cancelled) setCheckoutStatus("error");
      }
    }
    void checkAccount();

    return () => {
      cancelled = true;
      eligible = false;
      controller.abort();
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
      try {
        if (script) document.body.removeChild(script);
      } catch {}
    };
  }, [loginHref, planId, checkoutRevision]);

  return <LearningToolLayout title="Preise und Zugang" description={checkoutStatus === "existing"
    ? "Dein Zugang ist aktiv. Die Laufzeit und dein Abo findest du im Konto."
    : showTrialOffer ? "Teste die Lernplattform 3 Tage kostenlos. Danach kostet das Abo automatisch 5 € pro Monat."
    : trialPlan ? "Die Konditionen für den Testzugang werden vor dem Aboabschluss geprüft."
    : "Dein Monatszugang zur Lernplattform wird nach geprüfter Zahlungsbestätigung freigeschaltet."}
    icon="shield" eyebrow="Lernen mit Jagdlatein" hideCommunity>
    <section className={`${styles.panel} ${authStyles.pricePanel}`} aria-labelledby="price-heading">
      <h2 id="price-heading">{checkoutStatus === "existing" ? "Dein Zugang" : showTrialOffer ? "3 Tage kostenlos testen" : trialPlan ? "Testabo" : "Monatszugang"}</h2>
      {checkoutStatus !== "existing" && (!trialPlan || showTrialOffer) && <p className={authStyles.price}>{showTrialOffer ? "3 Tage kostenlos, danach automatisch 5 € / Monat · jederzeit kündbar" : "5 € / Monat · jederzeit kündbar"}</p>}
      {showTrialOffer && <p>Du bestätigst das Abo zuerst in PayPal. Die drei kostenlosen Tage laufen ab dem von PayPal bestätigten Abostart;
        das Ablaufdatum steht im Konto. Danach verlängert sich das Abo monatlich für 5 €. Wenn du vor Ablauf bei PayPal kündigst,
        fällt keine Abozahlung an. Die Kündigung beendet den unbezahlten Testzugang.</p>}
      {checkoutStatus === "checking" && <p role="status">Dein Kontostatus wird geprüft …</p>}
      {checkoutStatus === "existing" && <div className={styles.note}><p>{account?.accessType === "trial" ? "Dein Testzugang ist bereits aktiv." : "Dein Zugang ist bereits aktiv."}</p><Link href="/konto" className={styles.primary}>Zum Konto</Link></div>}
      {(checkoutStatus === "unavailable" || checkoutStatus === "trial-unavailable") && <p role="alert" className={styles.note}>{trialPlan ? "Das Testabo ist derzeit nicht verfügbar." : "Das Aboangebot ist derzeit nicht verfügbar."} Bitte versuche es später erneut.</p>}
      {(checkoutStatus === "trial-unavailable" || checkoutStatus === "sdk-error") && <p><button type="button" className={styles.secondary} onClick={() => setCheckoutRevision(value => value + 1)}>Erneut prüfen</button></p>}
      {checkoutStatus === "error" && <div role="alert" className={styles.note}><p>Dein Kontostatus konnte nicht geprüft werden.</p><button type="button" className={styles.secondary} onClick={() => setCheckoutRevision(value => value + 1)}>Erneut prüfen</button></div>}
      <div id="paypal-subscribe-preise" hidden={checkoutStatus !== "ready" || Boolean(activation)} />
      {paymentMessage && <p role="status" aria-live="polite" className={styles.note}>{paymentMessage}</p>}
      {activation && <p><Link href={`${loginHref}${loginHref.includes("?") ? "&" : "?"}reauth=1`} className={styles.primary}>Mit PayPal-E-Mail anmelden</Link></p>}
      <p className={styles.muted}>{checkoutStatus === "existing" ? "Informationen zu deinem aktuellen Zugang findest du im Konto."
        : showTrialOffer ? "Abschluss und spätere Zahlungen erfolgen über PayPal. Nach der geprüften Abo-Bestätigung meldest du dich mit der E-Mail-Adresse deines PayPal-Kontos an."
        : trialPlan ? "Der Abschluss ist erst nach Bestätigung der Testabo-Konditionen möglich."
        : "Die Zahlung erfolgt über PayPal. Nach geprüfter Zahlungsbestätigung kannst du dich mit der E-Mail-Adresse deines PayPal-Kontos einloggen."}</p>
    </section>
    <section className={`${styles.panel} ${authStyles.pricePanel}`} aria-labelledby="access-help-heading">
      <h2 id="access-help-heading">Anmeldung und Hilfe</h2>
      <p>Bereits einen Zugang? Melde dich mit deiner registrierten E-Mail-Adresse an.</p>
      <div className={authStyles.support}>
        <Link href={loginHref} className={styles.secondary}>Hier einloggen</Link>
        <a href="mailto:info@jagdlatein.de?subject=Frage%20zur%20Zahlung%20bei%20Jagdlatein" className={styles.secondary}>Fragen zur Zahlung</a>
      </div>
    </section>
  </LearningToolLayout>;
}