// pages/preise.js
import Head from "next/head";
import Link from "next/link";

export default function Preise() {
  return (
    <>
      <Head>
        <title>Preise – Jagdlatein</title>
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="pricing">
        <div className="container">
          <h1>Preise</h1>
          <p className="lead">
            Wähle dein Modell. Zugang wird nach erfolgreicher Bezahlung automatisch freigeschaltet.
          </p>

          <div className="grid">
            {/* Monatszugang */}
            <div className="card">
              <h3>Monatszugang</h3>
              <p className="sub">10 € / Monat · jederzeit kündbar</p>

              <form
                action="https://www.paypal.com/ncp/payment/WBPRVVCEQ8HU8"
                method="post"
                target="_blank"
                className="paypalForm"
              >
                <input className="pp-WBPRVVCEQ8HU8" type="submit" value="Jetzt kaufen" />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Karten"
                  className="brands"
                />
                <section className="pp-note">
                  Abgewickelt durch{" "}
                  <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                    alt="PayPal"
                  />
                </section>

                {/* Button-Styles nur für diesen Button */}
                <style jsx>{`
                  .pp-WBPRVVCEQ8HU8 {
                    text-align: center;
                    border: none;
                    border-radius: 12px;
                    width: 100%;
                    height: 52px;
                    font-weight: 800;
                    background-color: #ffd140;
                    color: #111;
                    font-family: system-ui, "Helvetica Neue", Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1;
                    cursor: pointer;
                  }
                `}</style>
              </form>
            </div>

            {/* Jahreszugang */}
            <div className="card">
              <h3>Jahreszugang</h3>
              <p className="sub">100 € / Jahr · entspricht 8,33 € / Monat</p>

              <form
                action="https://www.paypal.com/ncp/payment/UAGCGVBMKL6VJ"
                method="post"
                target="_blank"
                className="paypalForm"
              >
                <input className="pp-UAGCGVBMKL6VJ" type="submit" value="Jetzt kaufen" />
                <img
                  src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
                  alt="Karten"
                  className="brands"
                />
                <section className="pp-note">
                  Abgewickelt durch{" "}
                  <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                    alt="PayPal"
                  />
                </section>

                <style jsx>{`
                  .pp-UAGCGVBMKL6VJ {
                    text-align: center;
                    border: none;
                    border-radius: 12px;
                    width: 100%;
                    height: 52px;
                    font-weight: 800;
                    background-color: #ffd140;
                    color: #111;
                    font-family: system-ui, "Helvetica Neue", Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1;
                    cursor: pointer;
                  }
                `}</style>
              </form>
            </div>
          </div>

          <p className="foot">
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>

        {/* Seite-weite Styles inkl. Mobile Tweaks */}
        <style jsx global>{`
          :root {
            --forest: #1d4d2b;
            --ink: #111827;
            --muted: #6b7280;
            --line: #e6eee6;
            --bg: #f7faf7;
          }

          .pricing {
            background: linear-gradient(180deg, #fff, var(--bg));
          }

          .container {
            max-width: 960px;
            margin: 0 auto;
            padding: 20px 16px 28px;
            font-family: system-ui, Segoe UI, Roboto, Arial;
          }

          h1 {
            margin: 8px 0 6px;
            font-size: 42px;
            line-height: 1.15;
            color: var(--ink);
            letter-spacing: -0.02em;
          }

          .lead {
            color: #374151;
            margin: 0 0 20px;
            font-size: 18px;
          }

          .grid {
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }

          .card {
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 18px rgba(17, 41, 25, 0.06);
          }

          .card h3 {
            margin: 0 0 6px;
            font-size: 22px;
          }

          .sub {
            margin: 0 0 12px;
            color: #4b5563;
          }

          .paypalForm {
            display: grid;
            gap: 10px;
          }

          .brands {
            height: 22px;
            opacity: 0.9;
            margin: 2px auto 0;
          }

          .pp-note {
            font-size: 12px;
            color: var(--muted);
            text-align: center;
          }

          .pp-note img {
            height: 14px;
            vertical-align: -2px;
          }

          .foot {
            margin-top: 20px;
            color: var(--muted);
          }

          /* 📱 Mobile */
          @media (max-width: 768px) {
            .container {
              padding: 16px 14px 26px;
            }
            h1 {
              font-size: 34px;
              margin-top: 4px;
            }
            .lead {
              font-size: 16px;
              color: #475569;
              margin-bottom: 16px;
            }
            .grid {
              grid-template-columns: 1fr; /* 1 Spalte */
              gap: 14px;
            }
            .card {
              padding: 14px;
              border-radius: 14px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
