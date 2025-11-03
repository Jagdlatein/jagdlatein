import Seo from '../components/Seo';

export default function Preise(){
  return (
    <>
      <Seo title="Preise – Jagdlatein" description="Monat 10 €, Jahr 100 €. Zugriff auf alle Lerninhalte, jederzeit kündbar." />
      <section className="section">
        <div className="container">
          <h1>Preise</h1>
          <p className="lead">Wähle dein Abo – sofort startklar, jederzeit kündbar.</p>

          <div className="grid">
            {/* Monatsabo */}
            <div className="card">
              <h3>Monat</h3>
              <p style={{fontSize:24,margin:'8px 0'}}><b>10 €</b> / Monat</p>
              <ul>
                <li>Zugang zu allen Inhalten (DE / AT / CH)</li>
                <li>Quiz, Glossar, Karteikarten inklusive</li>
                <li>Ohne Mindestlaufzeit, monatlich kündbar</li>
              </ul>

              <a
                className="cta"
                href="https://buy.stripe.com/6oUcN61GxaRcbahgu94Vy00"
                target="_blank"
                rel="noopener noreferrer"
                style={{marginTop:12, display:'inline-block'}}
              >
                Jetzt per Stripe bezahlen
              </a>
              <p className="small">Kreditkarte, TWINT, Apple Pay u.v.m.</p>
            </div>

            {/* Jahresabo */}
            <div className="card">
              <h3>Jahr</h3>
              <p style={{fontSize:24,margin:'8px 0'}}><b>100 €</b> / Jahr</p>
              <ul>
                <li>Zugang zu allen Inhalten (DE / AT / CH)</li>
                <li>Quiz, Glossar, Karteikarten inklusive</li>
                <li>2 Monate geschenkt 🎁</li>
              </ul>

              <a
                className="cta"
                href="https://buy.stripe.com/fZucN698Z7F07Y53Hn4Vy01"
                target="_blank"
                rel="noopener noreferrer"
                style={{marginTop:12, display:'inline-block'}}
              >
                Jetzt per Stripe bezahlen
              </a>
              <p className="small">Kreditkarte, TWINT, Apple Pay u.v.m.</p>
            </div>
          </div>

          <p className="small" style={{marginTop:24}}>
            Zahlung & Zugang erfolgen über Stripe. Du erhältst nach dem Kauf eine Bestätigung mit Zugangsdaten.
          </p>
        </div>
      </section>
    </>
  );
}
