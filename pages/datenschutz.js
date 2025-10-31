export default function Datenschutz() {
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
          <h1>Datenschutzerklärung</h1>
          <p>Wir verarbeiten personenbezogene Daten entsprechend den geltenden Vorschriften (DSG/DSGVO). Bei Fragen wenden Sie sich an info@jagdlatein.de.</p>
          <h3>1. Verantwortlicher</h3>
          <p>jagdlatein</p>
          <h3>2. Zwecke</h3>
          <p>Betrieb der Lernplattform (Konto, Bezahlung, Support), Sicherheit, Statistik.</p>
          <h3>3. Rechtsgrundlagen</h3>
          <p>Einwilligung, Vertragserfüllung, berechtigtes Interesse, gesetzliche Verpflichtungen.</p>
          <h3>4. Speicherdauer</h3>
          <p>So lange nötig zur Vertragserfüllung bzw. gesetzlich vorgeschrieben.</p>
          <h3>5. Empfänger</h3>
          <p>Hosting/Deploy (Vercel), E-Mail (Hostpoint). Zahlungsanbieter nach Aktivierung.</p>
          <h3>6. Rechte</h3>
          <p>Auskunft, Berichtigung, Löschung, Widerspruch, Datenübertragbarkeit.</p>
          <p className="small">Hinweis: Bitte rechtlich prüfen/anpassen.</p>
        </div>
      </section>
    </>
  )
}
