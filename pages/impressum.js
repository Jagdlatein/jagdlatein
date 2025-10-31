export default function Impressum() {
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
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h1>Impressum</h1>
          <p><b>Verantwortlich:</b><br/>jagdlatein</p>
          <p>
            Kirchweg 3<br/>
            7317 Valens<br/>
            St. Gallen, Schweiz
          </p>
          <p><b>E-Mail:</b> info@jagdlatein.de</p>
          <p className="small">Angaben ohne Gewähr. Länderspezifische Rechtsvorgaben (DE/CH/AT) beachten.</p>
        </div>
      </section>
    </>
  )
}
