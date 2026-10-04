// pages/preise.js
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function Preise() {
  const router = useRouter();
  const [paymentMessage, setPaymentMessage] = useState("");

  const nextParam = useMemo(() => {
    const raw = router.query.next;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.next]);

  const loginHref = useMemo(() => {
    if (!nextParam) return "/login";
    return `/login?next=${encodeURIComponent(String(nextParam))}`;
  }, [nextParam]);

  const container = {
    maxWidth: 960,
    margin: "0 auto",
    padding: "16px 14px 26px",
    fontFamily: "system-ui, Segoe UI, Roboto, Arial",
  };

  const h1 = {
    margin: "6px 0 8px",
    fontSize: 30,
    lineHeight: 1.2,
    letterSpacing: "-.01em",
    color: "#121518",
  };

  const lead = {
    color: "#475569",
    margin: "0 0 16px",
    fontSize: 16,
  };

  const card = {
    background: "#fff",
    border: "1px solid #e6eee6",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 8px 18px rgba(17,41,25,0.06)",
    marginBottom: 14,
  };

  const priceTitle = {
    margin: "0 0 6px",
    fontSize: 22,
  };

  const sub = {
    margin: "0 0 12px",
    color: "#4b5563",
  };

  const note = {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  };

  const smallText = {
    marginTop: 18,
    color: "#6b7280",
    fontSize: 14,
  };

  const themeLink = {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 999,
    background: "#f3e7b2",
    border: "1px solid #d9bd55",
    color: "#111827",
    fontWeight: 700,
    textDecoration: "none",
  };

  useEffect(() => {
    const script = document.createElement("script");
    let cancelled = false;
    let buttons;

    script.src =
      `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AQx7R9V-b-x8NJmvXUkRrJ-Js68jqMq3udNpdVmONZrpS0y6zpUj5QMIAiunCQDCTPpwmiKFaJJybJBW")}&vault=true&intent=subscription&currency=EUR`;

    script.async = true;

    script.onload = () => {
      if (!cancelled && window.paypal) {
        buttons = window.paypal.Buttons({
            style: {
              shape: "rect",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },

            createSubscription(data, actions) {
              return actions.subscription.create({
                plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-9XU38461YG7706134NESJQWA",
              });
            },

            async onApprove(data) {
              if (cancelled) return;
              setPaymentMessage("Die Zahlungsbestätigung wird geprüft …");
              try {
                const response = await fetch("/api/paypal/confirm-subscription", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subscriptionId: data.subscriptionID }),
                });
                const confirmation = await response.json();
                if (cancelled) return;
                if (!response.ok || confirmation.activated !== true) {
                  setPaymentMessage(confirmation.error || "Die Bestätigung wird noch verarbeitet. Bitte melde dich in Kürze mit deiner PayPal-E-Mail an.");
                  return;
                }
                window.location.href = `${loginHref}${loginHref.includes("?") ? "&" : "?"}reauth=1`;
              } catch {
                if (!cancelled) setPaymentMessage("Die Bestätigung konnte noch nicht geprüft werden. Bitte melde dich später mit deiner PayPal-E-Mail an.");
              }
            },
            onError() { if (!cancelled) setPaymentMessage("PayPal ist derzeit nicht erreichbar. Bitte erneut versuchen."); },
          });
        Promise.resolve(buttons.render("#paypal-subscribe-preise")).catch(() => {
          if (!cancelled) setPaymentMessage("PayPal konnte nicht geladen werden. Bitte erneut versuchen.");
        });
      }
    };

    document.body.appendChild(script);
    script.onerror = () => { if (!cancelled) setPaymentMessage("PayPal konnte nicht geladen werden. Bitte erneut versuchen."); };

    return () => {
      cancelled = true;
      try { Promise.resolve(buttons?.close?.()).catch(() => {}); } catch {}
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, [loginHref]);

  return (
    <>
      <Head>
        <title>Preise – Jagdlatein</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>

      <main
        style={{
          background: "linear-gradient(180deg,#fff,#f7faf7)",
        }}
      >
        <div style={container}>
          <h1 className="jl" style={h1}>
            Preise
          </h1>

          <p style={lead}>
            Wähle dein Modell. Der Zugang zur Lernplattform wird nach
            erfolgreicher Bezahlung automatisch freigeschaltet.
          </p>

          <div style={card}>
            <h3 style={priceTitle}>
              Monatszugang
            </h3>

            <p style={sub}>
              5 € / Monat · jederzeit kündbar
            </p>

            <div id="paypal-subscribe-preise"></div>
            {paymentMessage && <p role="status" aria-live="polite">{paymentMessage}</p>}

            <p style={note}>
              Die Zahlung wird sicher über PayPal abgewickelt. Nach
              erfolgreicher Zahlung erhältst du eine Bestätigung und kannst
              dich mit deiner E-Mail einloggen.
            </p>
          </div>

          <p style={smallText}>
            Bereits gekauft?{" "}
            <Link
              href={loginHref}
              style={themeLink}
            >
              Hier einloggen
            </Link>
          </p>

          <p style={smallText}>
            Fragen zur Zahlung?{" "}
            <a
              href="mailto:info@jagdlatein.de?subject=Frage%20zur%20Zahlung%20bei%20Jagdlatein"
              style={themeLink}
            >
              info@jagdlatein.de
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
