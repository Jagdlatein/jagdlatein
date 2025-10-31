
export default function Home() {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="brand">
            <img src="/logo.png" width="28" height="28" alt="Jagdlatein Logo" />
            <div>Jagdlatein <span>• Lernplattform</span></div>
          </div>
          <nav className="menu">
            <a href="/">Start</a>
            <a href="#kurse">Kurse</a>
            <a href="#login">Login</a>
            <a href="#kontakt">Kontakt</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <h1>Jagdlatein</h1>
          <p>Lernplattform für die Jagdprüfung in DE · AT · CH</p>
          <a className="cta" href="#kurse">Jetzt 7 Tage kostenlos testen</a>
        </div>
      </section>

      <section id="kurse" className="section">
        <div className="container">
          <div className="grid">
            <div className="card">
              <h3>Glossar</h3>
              <p>Die wichtigsten Begriffe aus dem Jagdlatein – klar erklärt.</p>
              <a className="btn" href="#">Öffnen</a>
            </div>
            <div className="card">
              <h3>Karteikarten</h3>
              <p>Wissen festigen mit smarten Lernkarten – mobilfreundlich.</p>
              <a className="btn" href="#">Öffnen</a>
            </div>
            <div className="card">
              <h3>Quiz</h3>
              <p>Prüfungsnahes Training – bereite dich realistisch vor.</p>
              <a className="btn" href="#">Öffnen</a>
            </div>
          </div>
        </div>
      </section>

      <section id="login" className="section">
        <div className="container">
          <h3>Login</h3>
          <p className="small">Login/Paywall folgen nach Zahlungs-Setup (PayPal / Stripe / TWINT).</p>
        </div>
      </section>

      <section id="kontakt" className="section">
        <div className="container">
          <h3>Kontakt</h3>
          <p>E-Mail: info@jagdlatein.de</p>
        </div>
      </section>

      <footer className="footer">
        <div className="container small">
          © 2025 Jagdlatein – Von Jägern. Für Jäger. • Impressum • Datenschutz
        </div>
      </footer>
    </>
  )
}
