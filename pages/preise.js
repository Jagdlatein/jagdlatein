// pages/preise.js
import Head from "next/head";
import Link from "next/link";

export default function Preise() {
  // Styles (mobil zuerst)
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

  const grid = {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "1fr", // mobil: eine Spalte
  };

  const card = {
    background: "#fff",
    border: "1px solid #e6eee6",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 8px 18px rgba(17,41,25,0.06)",
  };

  const priceTitle = {
    margin: "0 0 6px",
    fontSize: 22,
  };

  const sub = {
    margin: "0 0 12px",
    color: "#4b5563",
  };

  const ppBtn = {
    textAlign: "center",
    border: "none",
    borderRadius: 12,
    width: "100%",
    height: 52,
    fontWeight: 800,
    backgroundColor: "#FFD140",
    color: "#111",
    fontFamily: 'system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
  };

  const brands = {
    height: 22,
    opacity: 0.9,
    margin: "2px auto 0",
  };

  const note = {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
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
        {/* Desktop-Regel: ab 920px zwei Spalten + größere Headline */}
        <style>{`
          @media (min-width:920px){
            .pricing-grid{grid-template-columns:1fr 1fr; gap:16px}
            h1.jl{font-size:42px; margin:8px 0 6px}
          }
        `}</style>
      </Head>

      <main style={{ background: "linear-gradient(180deg,#fff,#f7faf7)" }}>
        <div style={container}>
          <h1 className="jl" style={h1}>
            Preise
          </h1>

          <p style={lead}>
            Wähle dein Modell. Der Zugang zur Lernplattform wird nach
            erfolgreicher Bezahlung automatisch freigeschaltet.
          </p>

          <div className="pricing-grid" style={grid}>
            {/* Monatszugang */}
            <div style={card}>
              <h3 style={priceTitle}>Monatszugang</h3>
              <p style={sub}>10 € / Monat · jederzeit kündbar</p>

              <form
                action="https://www.paypal.com/ncp/payment/WBPRVVCEQ8HU8"
                method="post"
                target="_blank"
                style={{ display: "grid", gap: 10 }}
              >
                <input type="submit" value="Jetzt kaufen" style={ppBtn} />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Kredit- und Debitkarten"
                  style={brands}
                />
                <div style={note}>
                  Abgewickelt durch{" "}
                  <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                    alt="PayPal"
                    style={{ height: 14, verticalAlign: "-2px" }}
                  />
                </div>
              </form>
            </div>

            {/* Jahreszugang */}
            <div style={card}>
              <h3 style={priceTitle}>Jahreszugang</h3>
              <p style={sub}>100 € / Jahr · entspricht 8,33 € / Monat</p>

              <form
                action="https://www.paypal.com/ncp/payment/UAGCGVBMKL6VJ"
                method="post"
                target="_blank"
                style={{ display: "grid", gap: 10 }}
              >
                <input type="submit" value="Jetzt kaufen" style={ppBtn} />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Kredit- und Debitkarten"
                  style={brands}
                />
                <div style={note}>
                  Abgewickelt durch{" "}
                  <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                    alt="PayPal"
                    style={{ height: 14, verticalAlign: "-2px" }}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Hinweis Login + Kontakt */}
          <p style={smallText}>
            Bereits gekauft?{" "}
            <Link href="/login">Hier mit deiner E-Mail einloggen</Link>.
          </p>
          <p style={smallText}>
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>
      </main>
    </>
  );
}
