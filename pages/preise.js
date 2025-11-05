// pages/preise.js
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import styles from "../styles/Home.module.css";

// Wichtig: PayPal-Buttons nicht server-rendern
const PayPalButtons = dynamic(() => import("../components/PayPalButtons"), { ssr: false });

const cardStyle = {
  background: "#fff",
  border: "1px solid #e6eee6",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 6px 16px rgba(17,41,25,0.06)",
};

export default function Preise() {
  return (
    <>
      <Head>
        <title>Preise – Jagdlatein</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className={styles?.main || ""} style={{ padding: "24px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ marginBottom: 10 }}>Preise</h1>
          <p style={{ color: "#374151", marginBottom: 20 }}>
            Wähle dein Modell. Zugang wird nach erfolgreicher Zahlung automatisch freigeschaltet.
          </p>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            {/* MONAT */}
            <div className="plan" style={cardStyle}>
              <h3 style={{ margin: "0 0 6px" }}>Monatszugang</h3>
              <p style={{ margin: "0 0 10px", color: "#4b5563" }}>10 € / Monat · jederzeit kündbar</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <a
                  className={`${styles?.cta || ""} ${styles?.ctaPrimary || ""}`}
                  href="https://buy.stripe.com/6oUcN61GxaRcbahgu94Vy00"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe • 10 €
                </a>
                <div style={{ minWidth: 260 }}>
                  <PayPalButtons tier="monthly" />
                </div>
              </div>
            </div>

            {/* JAHR */}
            <div className="plan" style={cardStyle}>
              <h3 style={{ margin: "0 0 6px" }}>Jahreszugang</h3>
              <p style={{ margin: "0 0 10px", color: "#4b5563" }}>80 € / Jahr · entspricht 6,67 € / Monat</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <a
                  className={`${styles?.cta || ""} ${styles?.ctaPrimary || ""}`}
                  href="https://buy.stripe.com/fZucN698Z7F07Y53Hn4Vy01"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe • 80 €
                </a>
                <div style={{ minWidth: 260 }}>
                  <PayPalButtons tier="yearly" />
                </div>
              </div>
            </div>
          </div>

          <p style={{ marginTop: 18, color: "#6b7280" }}>
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>
      </main>
    </>
  );
}
