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
    boxShadow: "0 6px 16px rgba(17,41,25,0.06)",
  };

  return (
    <>
      <Head>
        <title>Preise – Jagdlatein</title>
        <meta name="robots" content="index, follow" />
      </Head>

      <main style={{ background: "linear-gradient(180deg, #fff, #f7faf7)" }}>
        <div style={page}>
          <h1 style={{ margin: "0 0 6px" }}>Preise</h1>
          <p style={{ color: "#374151", margin: "0 0 20px" }}>
            Wähle dein Modell. Zugang wird nach erfolgreicher Bezahlung automatisch freigeschaltet.
          </p>

          <div style={grid}>
            {/* Monatszugang */}
            <div style={card}>
              <h3 style={{ margin: "0 0 6px" }}>Monatszugang</h3>
              <p style={{ margin: "0 0 12px", color: "#4b5563" }}>10 € / Monat · jederzeit kündbar</p>

              <form
                action="https://www.paypal.com/ncp/payment/WBPRVVCEQ8HU8"
                method="post"
                target="_blank"
                style={{ display: "inline-grid", justifyItems: "center", alignContent: "start", gap: "0.5rem" }}
              >
                <input className="pp-WBPRVVCEQ8HU8" type="submit" value="Jetzt kaufen" />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Karten"
                  style={{ height: "20px" }}
                />
                <section style={{ fontSize: "0.75rem" }}>
                  Abgewickelt durch{" "}
                  <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                    alt="PayPal"
                    style={{ height: "0.875rem", verticalAlign: "middle" }}
                  />
                </section>
                <style jsx>{`
                  .pp-WBPRVVCEQ8HU8 {
                    text-align: center;
                    border: none;
                    border-radius: 0.25rem;
                    min-width: 11.625rem;
                    padding: 0 2rem;
                    height: 2.625rem;
                    font-weight: bold;
                    background-color: #ffd140;
                    color: #000000;
                    font-family: "Helvetica Neue", Arial, sans-serif;
                    font-size: 1rem;
                    line-height: 1.25rem;
                    cursor: pointer;
                  }
                `}</style>
              </form>
            </div>

            {/* Jahreszugang */}
            <div style={card}>
              <h3 style={{ margin: "0 0 6px" }}>Jahreszugang</h3>
              <p style={{ margin: "0 0 12px", color: "#4b5563" }}>100 € / Jahr · entspricht 8,33 € / Monat</p>

              <form
                action="https://www.paypal.com/ncp/payment/UAGCGVBMKL6VJ"
                method="post"
                target="_blank"
                style={{ display: "inline-grid", justifyItems: "center", alignContent: "start", gap: "0.5rem" }}
              >
                <input className="pp-UAGCGVBMKL6VJ" type="submit" value="Jetzt kaufen" />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Karten"
                  style={{ height: "20px" }}
                />
                <section style={{ fontSize: "0.75rem" }}>
                  Abgewickelt durch{" "}
                  <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                    alt="PayPal"
                    style={{ height: "0.875rem", verticalAlign: "middle" }}
                  />
                </section>
                <style jsx>{`
                  .pp-UAGCGVBMKL6VJ {
                    text-align: center;
                    border: none;
                    border-radius: 0.25rem;
                    min-width: 11.625rem;
                    padding: 0 2rem;
                    height: 2.625rem;
                    font-weight: bold;
                    background-color: #ffd140;
                    color: #000000;
                    font-family: "Helvetica Neue", Arial, sans-serif;
                    font-size: 1rem;
                    line-height: 1.25rem;
                    cursor: pointer;
                  }
                `}</style>
              </form>
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
