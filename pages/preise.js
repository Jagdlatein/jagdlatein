// oben in pages/preise.js
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

export default function Preise() {
  useEffect(() => {
    // schon geladen?
    if (document.getElementById("pp-sdk-hosted")) {
      if (window.paypal?.HostedButtons) {
        window.paypal.HostedButtons({ hostedButtonId: "FFAVT6VNJM5AE" })
          .render("#paypal-container-FFAVT6VNJM5AE");
      }
      return;
    }

    // LIVE-Client-ID aus ENV (Vercel -> NEXT_PUBLIC_PAYPAL_CLIENT_ID)
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb"; // "sb" nur Sandbox-Test
    const sdk = document.createElement("script");
    sdk.id = "pp-sdk-hosted";
    sdk.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=hosted-buttons&intent=capture`;
    sdk.async = true;
    sdk.onload = () => {
      if (window.paypal?.HostedButtons) {
        window.paypal.HostedButtons({ hostedButtonId: "FFAVT6VNJM5AE" })
          .render("#paypal-container-FFAVT6VNJM5AE");
      } else {
        console.error("PayPal HostedButtons API nicht verfügbar – prüfe components=hosted-buttons.");
      }
    };
    sdk.onerror = () => console.error("PayPal SDK konnte nicht geladen werden.");
    document.body.appendChild(sdk);
  }, []);
  
  // ... dein restlicher Code (Stripe usw.)
  return (
    <>
      <Head><title>Preise – Jagdlatein</title></Head>
      <main className={styles?.main || ""} style={{ padding: "24px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* ... Headline/Text ... */}

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            {/* Monatsplan */}
            <div style={{ background:"#fff", border:"1px solid #e6eee6", borderRadius:16, padding:16 }}>
              <h3>Monatszugang</h3>
              <p style={{ color:"#4b5563" }}>10 € / Monat · jederzeit kündbar</p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                <a className={`${styles?.cta || ""} ${styles?.ctaPrimary || ""}`}
                   href="https://buy.stripe.com/6oUcN61GxaRcbahgu94Vy00" target="_blank" rel="noreferrer">
                  Stripe • 10 €
                </a>
                <div style={{ minWidth:260 }}>
                  <div id="paypal-container-FFAVT6VNJM5AE" />
                </div>
              </div>
            </div>

            {/* Jahresplan */}
            <div style={{ background:"#fff", border:"1px solid #e6eee6", borderRadius:16, padding:16 }}>
              <h3>Jahreszugang</h3>
              <p style={{ color:"#4b5563" }}>80 € / Jahr · entspricht 6,67 € / Monat</p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                <a className={`${styles?.cta || ""} ${styles?.ctaPrimary || ""}`}
                   href="https://buy.stripe.com/fZucN698Z7F07Y53Hn4Vy01" target="_blank" rel="noreferrer">
                  Stripe • 80 €
                </a>
                {/* Optional: zweiter Hosted Button (eigene ID in PayPal erstellen)
                <div style={{ minWidth:260 }}>
                  <div id="paypal-container-SECOND_ID" />
                </div>
                */}
              </div>
            </div>
          </div>

          <p style={{ marginTop:18, color:"#6b7280" }}>
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>
      </main>
    </>
  );
}
