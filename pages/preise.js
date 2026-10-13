// pages/preise.js
import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";
import checkoutStyles from "../styles/Checkout.module.css";
import { getNextUrl } from "../lib/login-destination";
import { onVisibleReturn } from "../lib/visible-return";
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
    return ["/preise", "/success"].includes(new URL(destination, "https://jagdlatein.invalid").pathname.replace(/\/+$/, "")) ? "/" : destination;
  }, [router.query.next]);
  const checkoutHref = `/preise${learningHref !== "/" ? `?next=${encodeURIComponent(learningHref)}` : ""}#paypal-subscribe-preise`;
  const registerHref = `/registrieren?next=${encodeURIComponent(checkoutHref)}`;

  useEffect(() => {
    let cancelled = false;
    let eligible = false;
    let confirming = false;
    let creating = false;
    let approvalOpen = false;
    let resuming = false;
    let returnQueued = false;
    let existingCheckout = false;
    let subscriptionPromise;
    let script;
    let buttons;
    let checkoutEmail;
    let loadingPayPal = false;
    let startupComplete = false;
    const controller = new AbortController();
    const startupTimeout = setTimeout(() => {
      if (cancelled || startupComplete) return;
      eligible = false;
      controller.abort();
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
      setCheckoutStatus(loadingPayPal ? "sdk-error" : "error");
      setPaymentMessage(loadingPayPal ? "PayPal konnte nicht rechtzeitig geladen werden. Bitte erneut prüfen." : "Dein Zugang konnte nicht rechtzeitig geprüft werden. Bitte erneut prüfen.");
    }, 20000);
    function finishStartup() {
      startupComplete = true;
      clearTimeout(startupTimeout);
      flushVisibleReturn();
    }
    setCheckoutStatus("checking");
    setPaymentMessage("");
    setActivation(null);
    setOfferVerified(false);
    retryApproval.current = null;

    function closeButtons() {
      eligible = false;
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
    }

    function validCheckout(checkout) {
      return typeof checkout?.activated === "boolean" && (!checkout.activated || Boolean(checkout.subscriptionId)) &&
        (checkout.subscriptionId === null && checkout.status === null ||
          typeof checkout.subscriptionId === "string" && /^I-[A-Z0-9]{6,64}$/i.test(checkout.subscriptionId) &&
          ["APPROVAL_PENDING", "APPROVED", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"].includes(checkout.status));
    }

    function flushVisibleReturn() {
      if (cancelled || !returnQueued || !startupComplete || creating || confirming || resuming) return;
      returnQueued = false;
      void resumeExistingCheckout();
    }

    async function resumeExistingCheckout() {
      if (cancelled || !startupComplete || creating || confirming || resuming) { returnQueued = true; return; }
      resuming = true;
      const attempt = new AbortController();
      const cancelAttempt = () => attempt.abort();
      controller.signal.addEventListener("abort", cancelAttempt, { once: true });
      const timeout = setTimeout(cancelAttempt, 18000);
      try {
        const response = await fetch("/api/account", { cache: "no-store", credentials: "same-origin", signal: attempt.signal });
        if (cancelled) return;
        if (creating || confirming) { returnQueued = true; return; }
        if (response.status === 401) {
          eligible = false;
          setAccount(null);
          setActivation(null);
          setCheckoutStatus("login-required");
          setPaymentMessage("Bitte melde dich erneut mit deinem Jagdlatein-Konto an, um deinen Zugang zu prüfen.");
          return;
        }
        if (!response.ok) throw new Error("Kontostatus nicht verfügbar.");
        const data = await response.json();
        if (cancelled) return;
        if (creating || confirming) { returnQueued = true; return; }
        if (!data.account || typeof data.account.email !== "string" ||
            typeof data.account.paid !== "boolean" || typeof data.account.admin !== "boolean") throw new Error("Kontostatus nicht verfügbar.");
        if (!checkoutEmail || data.account.email.trim().toLowerCase() !== checkoutEmail) {
          if (approvalOpen) {
            eligible = false;
            setAccount(data.account);
            setCheckoutStatus("error");
            setPaymentMessage("Das angemeldete Jagdlatein-Konto hat sich geändert. Prüfe dein Konto und öffne die Aboübersicht erneut.");
            return;
          }
          // No live SDK operation is running. Re-establish the current account
          // through the ordinary guarded startup; never reuse another identity.
          setCheckoutRevision(value => value + 1);
          return;
        }
        setAccount(data.account);
        if (data.account.paid || data.account.admin) {
          eligible = false;
          setCheckoutStatus("existing");
          setPaymentMessage("Dein Lernzugang ist aktiv. Du kannst jetzt weiterlernen.");
          return;
        }
        const statusResponse = await fetch("/api/paypal/checkout-status", {
          method: "POST", cache: "no-store", credentials: "same-origin", signal: attempt.signal,
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
        });
        const checkout = await statusResponse.json();
        if (cancelled) return;
        if (creating || confirming) { returnQueued = true; return; }
        if (!statusResponse.ok || !validCheckout(checkout)) throw new Error("Abo-Abgleich nicht verfügbar.");
        existingCheckout = Boolean(checkout.subscriptionId);
        // An unfinished provider popup is left intact. Returning never reloads
        // its SDK or invokes create-subscription, even when approval is pending.
        if (!checkout.subscriptionId || !checkout.activated && !["APPROVED", "ACTIVE", "SUSPENDED"].includes(checkout.status)) {
          if (!approvalOpen && !eligible) setCheckoutRevision(value => value + 1);
          return;
        }
        retryApproval.current = () => confirmApproval(checkout.subscriptionId);
        if (checkout.activated) {
          eligible = false;
          await refreshAccess(checkout, attempt.signal);
        } else if (checkout.status === "SUSPENDED") {
          eligible = false;
          setCheckoutStatus("suspended");
          setPaymentMessage("Dein PayPal-Abo ist pausiert. Prüfe es in deinem Konto und verwalte es bei PayPal.");
        } else {
          eligible = false;
          await confirmApproval(checkout.subscriptionId);
        }
      } catch {
        if (!cancelled && !creating && !confirming) setPaymentMessage(existingCheckout || approvalOpen
          ? "Dein Zugang konnte bei der Rückkehr noch nicht geprüft werden. Ein weiterer Kauf ist nicht nötig; prüfe dein bestehendes Abo erneut."
          : "Dein Kontostatus konnte bei der Rückkehr noch nicht geprüft werden. Bitte erneut prüfen.");
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", cancelAttempt);
        resuming = false;
        flushVisibleReturn();
      }
    }

    async function refreshAccess(confirmation, signal) {
      const statusResponse = await fetch("/api/auth/status", { cache: "no-store", credentials: "same-origin", signal });
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
        await refreshAccess(confirmation, attempt.signal);
      } catch {
        if (!cancelled) {
          setCheckoutStatus("pending");
          setPaymentMessage("Deine Bestätigung konnte noch nicht geprüft werden. Prüfe den Zugang erneut; ein weiterer Kauf ist nicht nötig.");
        }
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", cancelAttempt);
        confirming = false;
        flushVisibleReturn();
      }
    }

    function loadPayPal(paypalPlanId, paypalClientId) {
      if (cancelled || !eligible) return;
      script = document.createElement("script");
      const paypalFailed = () => {
        if (cancelled || !eligible || startupComplete) return;
        finishStartup();
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
              approvalOpen = true;
              // A user can click as soon as the SDK exposes its button, even
              // before render() resolves. Startup must not interrupt approval.
              finishStartup();
              setCheckoutStatus("ready");
              if (!subscriptionPromise) {
                creating = true;
                subscriptionPromise = Promise.resolve().then(async () => {
                  if (cancelled || !eligible) throw new Error("Aboabschluss derzeit nicht möglich.");
                  const attempt = new AbortController();
                  const cancelAttempt = () => attempt.abort();
                  controller.signal.addEventListener("abort", cancelAttempt, { once: true });
                  const timeout = setTimeout(cancelAttempt, 18000);
                  try {
                    const response = await fetch("/api/paypal/create-subscription", {
                      method: "POST", credentials: "same-origin", signal: attempt.signal,
                      headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
                    });
                    const created = await response.json();
                    if (!response.ok || typeof created.subscriptionId !== "string" || !/^I-[A-Z0-9]{6,64}$/i.test(created.subscriptionId))
                      throw new Error("Das Abo konnte deinem aktuellen Konto nicht zugeordnet werden.");
                    existingCheckout = true;
                    return created.subscriptionId;
                  } finally {
                    clearTimeout(timeout);
                    controller.signal.removeEventListener("abort", cancelAttempt);
                  }
                })
                  .catch((error) => { subscriptionPromise = null; throw error; })
                  .finally(() => { creating = false; flushVisibleReturn(); });
              }
              return subscriptionPromise;
            },

            async onApprove(data) {
              if (cancelled) return;
              approvalOpen = false;
              if (!eligible || confirming) { flushVisibleReturn(); return; }
              finishStartup();
              closeButtons();
              retryApproval.current = () => confirmApproval(data.subscriptionID);
              await confirmApproval(data.subscriptionID);
            },
            onCancel() {
              if (cancelled) return;
              approvalOpen = false;
              if (!eligible) { flushVisibleReturn(); return; }
              subscriptionPromise = null;
              setPaymentMessage("Der Aboabschluss bei PayPal wurde abgebrochen.");
              flushVisibleReturn();
            },
            onError() {
              if (cancelled) return;
              approvalOpen = false;
              if (!eligible) { flushVisibleReturn(); return; }
              finishStartup();
              closeButtons();
              setCheckoutStatus("sdk-error");
              setPaymentMessage("Der PayPal-Abschluss konnte nicht geladen werden. Prüfe den Zugang erneut; dabei wird zuerst ein bereits begonnenes Abo abgeglichen.");
              flushVisibleReturn();
            },
          });
          Promise.resolve(buttons.render("#paypal-subscribe-preise")).then(() => {
            if (cancelled || !eligible) return;
            finishStartup();
            setCheckoutStatus("ready");
          }).catch(paypalFailed);
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
        if (cancelled || controller.signal.aborted) return;
        if (response.status !== 401) {
          if (!response.ok) throw new Error("Kontostatus nicht verfügbar.");
          const data = await response.json();
          if (cancelled || controller.signal.aborted) return;
          if (!data.account || typeof data.account.paid !== "boolean" || typeof data.account.admin !== "boolean") throw new Error("Kontostatus nicht verfügbar.");
          setAccount(data.account);
          checkoutEmail = typeof data.account.email === "string" ? data.account.email.trim().toLowerCase() : null;
          if (data.account.paid || data.account.admin) {
            finishStartup();
            setCheckoutStatus("existing");
            return;
          }
        } else {
          finishStartup();
          setAccount(null);
          setCheckoutStatus("login-required");
          return;
        }
        // Recover the server-bound checkout after a reload or an interrupted
        // provider window. An uncertain existing approval must never start a
        // second purchase or lose its confirmation retry.
        const checkoutResponse = await fetch("/api/paypal/checkout-status", {
          method: "POST", cache: "no-store", credentials: "same-origin", signal: controller.signal,
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
        });
        const checkout = await checkoutResponse.json();
        if (cancelled || controller.signal.aborted) return;
        if (!checkoutResponse.ok || !validCheckout(checkout))
          throw new Error("Abo-Abgleich nicht verfügbar.");
        existingCheckout = Boolean(checkout.subscriptionId);
        if (checkout.subscriptionId && checkout.activated) {
          retryApproval.current = () => confirmApproval(checkout.subscriptionId);
          await refreshAccess(checkout, controller.signal);
          finishStartup();
          return;
        }
        if (["APPROVED", "ACTIVE", "SUSPENDED"].includes(checkout.status)) {
          finishStartup();
          retryApproval.current = () => confirmApproval(checkout.subscriptionId);
          setCheckoutStatus(checkout.status === "SUSPENDED" ? "suspended" : "pending");
          setPaymentMessage(checkout.status === "SUSPENDED"
            ? "Dein PayPal-Abo ist pausiert. Prüfe es in deinem Konto und verwalte es bei PayPal."
            : "Dein bereits begonnenes Abo wird noch abgeglichen. Prüfe den Zugang erneut; ein weiterer Kauf ist nicht nötig.");
          return;
        }
        if (!planId) {
          finishStartup();
          setCheckoutStatus("unavailable");
          return;
        }
        let offer;
        try {
          // Every checkout is approved by the server before the SDK is loaded.
          // In the private sandbox mode this rejects incomplete test settings.
          const configuration = await fetch("/api/paypal/checkout-config", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
          if (cancelled || controller.signal.aborted) return;
          if (!configuration.ok) throw new Error("Abo nicht verfügbar.");
          offer = await configuration.json();
          if (cancelled || controller.signal.aborted) return;
          if (!offer || offer.planId !== planId || !validPlan(offer.planId) ||
              typeof offer.clientId !== "string" || !/^[A-Za-z0-9_-]{20,256}$/.test(offer.clientId) ||
              offer.trialDays !== (isTrialPlan ? 3 : 0) || offer.amount !== "10.00" || offer.currency !== "EUR")
            throw new Error("Abo nicht verfügbar.");
        } catch {
          finishStartup();
          if (!cancelled && !controller.signal.aborted) setCheckoutStatus(isTrialPlan ? "trial-unavailable" : "unavailable");
          return;
        }
        setOfferVerified(true);
        eligible = true;
        loadingPayPal = true;
        setCheckoutStatus("loading-paypal");
        loadPayPal(offer.planId, offer.clientId);
      } catch {
        finishStartup();
        if (!cancelled && !controller.signal.aborted) setCheckoutStatus("error");
      }
    }
    const stopObserving = onVisibleReturn(() => {
      if (cancelled) return;
      // A startup deadline already retired this SDK attempt. A fresh guarded
      // startup may recover it; no creation or approval was running then.
      if (controller.signal.aborted) {
        setCheckoutRevision(value => value + 1);
        return;
      }
      returnQueued = true;
      flushVisibleReturn();
    });
    void checkAccount();

    return () => {
      cancelled = true;
      stopObserving();
      finishStartup();
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
      <h2 id="price-heading">{accessReady ? "Dein Lernzugang ist aktiv" : checkoutStatus === "login-required" ? "Zuerst mit deinem Konto anmelden" : checkoutStatus === "suspended" ? "Dein PayPal-Abo ist pausiert" : ["pending", "confirming"].includes(checkoutStatus) ? "Dein Abo wird geprüft" : showTrialOffer ? "3 Tage kostenlos testen" : "Dein Jagdlatein-Abo"}</h2>
      {checkoutStatus === "login-required" && <>
        <p>Du brauchst nur deine E-Mail-Adresse und einen Anmeldecode. Ein Passwort ist nicht nötig.</p>
        <div className={checkoutStyles.actions}>
          <Link href={registerHref} className={styles.primary}>Mit E-Mail fortfahren</Link>
        </div>
        <p className={styles.muted}>Mit deiner E-Mail meldest du dich an oder legst ein kostenloses Konto an. Danach kommst du direkt zur Abo-Auswahl zurück. Ein Abo startet erst nach deiner Zustimmung beim Zahlungsanbieter.</p>
      </>}
      {account?.email && !accessReady && <p className={checkoutStyles.account}><span>Angemeldet als</span><strong>{account.email}</strong><span>Dein Abo wird diesem Jagdlatein-Konto zugeordnet.</span></p>}
      {!accessReady && offerVerified && <>
        <p className={checkoutStyles.price}>{showTrialOffer ? "3 Tage kostenlos, danach automatisch 10 € / Monat · jederzeit kündbar" : "10 € / Monat · jederzeit kündbar"}</p>
        {showTrialOffer && <p>Die Probezeit beginnt mit dem von PayPal bestätigten Abostart. Danach verlängert sich dein Abo monatlich für 10 €. Kündigst du vor Ablauf bei PayPal, fällt keine Abozahlung an. Die Kündigung beendet den unbezahlten Testzugang.</p>}
        {checkoutStatus === "ready" && <p>Bestätige jetzt dein Abo bei PayPal. Deine PayPal-E-Mail darf von deiner Jagdlatein-E-Mail abweichen.</p>}
      </>}
      {checkoutStatus === "checking" && <p role="status">Dein Konto und vorhandene Abos werden geprüft …</p>}
      {checkoutStatus === "loading-paypal" && <p role="status">PayPal wird geladen …</p>}
      {checkoutStatus === "existing" && <p>Du kannst direkt weiterlernen. Die Laufzeit und dein Abo findest du im Konto.</p>}
      {(checkoutStatus === "unavailable" || checkoutStatus === "trial-unavailable") && <p role="alert" className={styles.note}>{trialPlan ? "Das Testabo ist derzeit nicht verfügbar." : "Das Aboangebot ist derzeit nicht verfügbar."} Bitte versuche es später erneut.</p>}
      {(checkoutStatus === "unavailable" || checkoutStatus === "trial-unavailable" || checkoutStatus === "sdk-error") && <p><button type="button" className={styles.secondary} onClick={() => setCheckoutRevision(value => value + 1)}>Erneut prüfen</button></p>}
      {checkoutStatus === "error" && <div role="alert" className={styles.note}><p>Dein Kontostatus konnte nicht geprüft werden.</p><button type="button" className={styles.secondary} onClick={() => setCheckoutRevision(value => value + 1)}>Erneut prüfen</button></div>}
      <div id="paypal-subscribe-preise" className={checkoutStyles.paypal} hidden={!["loading-paypal", "ready"].includes(checkoutStatus) || Boolean(activation)} />
      {paymentMessage && <p role="status" aria-live="polite" className={styles.note}>{paymentMessage}</p>}
      {["pending", "suspended"].includes(checkoutStatus) && <div className={checkoutStyles.actions}><button type="button" className={styles.primary} onClick={() => retryApproval.current?.()}>Zugang erneut prüfen</button><Link href="/konto#kontodaten" className={styles.secondary}>Mein Abo ansehen</Link></div>}
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
