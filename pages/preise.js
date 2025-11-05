// pages/preise.js
import Head from "next/head";
import Link from "next/link";

export default function Preise() {
  const page = {
    maxWidth: 960,
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: "system-ui, Segoe UI, Roboto, Arial",
  };
  const grid = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr 1fr",
    alignItems: "start",
  };
  const card = {
    background: "#fff",
    border: "1px solid #e6eee6",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 18px rgba(17,41,25,0.06)",
  };
  const ppBtn = {
    textAlign: "center",
    border: "none",
    borderRadius: "12px",
    width: "100%",
    height: "52px",
    fontWeight: 800,
    backgroundColor: "#FFD140",
    color: "#111",
    fontFamily: 'system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: "16px",
    lineHeight: 1,
    cursor: "pointer",
  };
  const brands = { height: 22, opacity: 0.9, margin: "2px auto 0" };
  const ppNote = { fontSize: 12, color: "#6b7280", textAlign: "center" };

  return (
    <>
      <Head>
        <title>Preise – Jagdlatein</title>
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={{ background: "linear-gradient(180deg,#fff,#f7faf7)" }}>
        <div style={page}>
          <h1 style={{ margin: "8px 0 6px", fontSize: 42, lineHeight: 1.15, letterSpacing: "-.02em", color: "#111827" }}>
            Preise
          </h1>
          <p style={{ color: "#374151", margin: "0 0 20px", fontSize: 18 }}>
            Wähle dein Modell. Zugang wird nach erfolgreicher Bezahlung automatisch freigeschaltet.
          </p>

          <div
            style={grid}
          >
            {/* Monatszugang */}
            <div style={card}>
              <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>Monatszugang</h3>
              <p style={{ margin: "0 0 12px", color: "#4b5563" }}>
                10 € / Monat · jederzeit kündbar
              </p>

              <form
                action="https://www.paypal.com/ncp/payment/WBPRVVCEQ8HU8"
                method="post"
                target="_blank"
                style={{ display: "grid", gap: 10 }}
              >
                <input type="submit" value="Jetzt kaufen" style={ppBtn} />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Karten"
                  style={brands}
                />
                <div style={ppNote}>
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
              <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>Jahreszugang</h3>
              <p style={{ margin: "0 0 12px", color: "#4b5563" }}>
                100 € / Jahr · entspricht 8,33 € / Monat
              </p>

              <form
                action="https://www.paypal.com/ncp/payment/UAGCGVBMKL6VJ"
                method="post"
                target="_blank"
                style={{ display: "grid", gap: 10 }}
              >
                <input type="submit" value="Jetzt kaufen" style={ppBtn} />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Karten"
                  style={brands}
                />
                <div style={ppNote}>
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

          <p style={{ marginTop: 20, color: "#6b7280" }}>
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>

        {/* Mobile-Layout */}
        <style jsx global>{`
          @media (max-width: 768px) {
            .pricing-grid {
              grid-template-columns: 1fr !important;
              gap: 14px !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
