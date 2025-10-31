export default function Preise() {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="brand">
            <div style={{ width: 28, height: 28, background: '#D4AF37', borderRadius: '50%' }} />
            <div>Jagdlatein <span>• Lernplattform</span></div>
          </div>
          <nav className="menu">
            <a href="/">Start</a>
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h1>Preise</h1>
          <p>Wähle dein Abo – jederzeit kündbar.</p>
          <div className="grid">
            <div className="card">
              <h3>Monat</h3>
              <p style={{fontSize:24, margin:'8px 0'}}><b>10 €</b> / Monat</p>
              <ul>
                <li>Alle Kurse DE / AT / CH</li>
                <li>Quiz & Karteikarten</li>
                <li>Neue Inhalte inklusive</li>
              </ul>
              <a className="cta" href="/login" style={{display:'inline-block', marginTop:12}}>Jetzt starten</a>
            </div>
            <div className="card">
              <h3>Jahr</h3>
              <p style={{fontSize:24, margin:'8px 0'}}><b>100 €</b> / Jahr</p>
              <ul>
                <li>Alle Kurse DE / AT / CH</li>
                <li>Quiz & Karteikarten</li>
                <li>2 Monate geschenkt</li>
              </ul>
              <a className="cta" href="/login" style={{display:'inline-block', marginTop:12}}>Jetzt starten</a>
            </div>
          </div>

          <div style={{marginTop:24}} className="small">
            Bezahlarten (geplant): PayPal, Kreditkarte, TWINT.
          </div>
        </div>
      </section>
    </>
  )
}
