// pages/preise.js
import Head from "next/head";
import Link from "next/link";
import PayPalButtons from "../components/PayPalButtons";

export default function Preise() {
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

  return (
    <>
      <Head>
        <title>Preise – Jagdlatein</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={{ background: "linear-gradient(180deg,#fff,#f7faf7)" }}>
        <div style={container}>
          <h1 className="jl" style={h1}>
            Preise
          </h1>

          <p style={lead}>
            Wähle dein Modell. Der Zugang zur Lernplattform wird nach erfolgreicher
            Bezahlung automatisch freigeschaltet.
          </p>

          <div style={card}>
            <h3 style={priceTitle}>Monatszugang</h3>
            <p style={sub}>5 € / Monat · jederzeit kündbar</p>

            <PayPalButtons />

            <p style={note}>
              Die Zahlung wird sicher über PayPal abgewickelt. Nach erfolgreicher Zahlung
              erhältst du eine Bestätigung und kannst dich mit deiner E-Mail einloggen.
            </p>
          </div>

          <p style={smallText}>
            Bereits gekauft? <Link href="/login">Hier einloggen</Link>.
          </p>

          <p style={smallText}>
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>
      </main>
    </>
  );
}

