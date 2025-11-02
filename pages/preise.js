export default function Preise(){
  return (
    <section className="section">
      <div className="container">
        <h1>Preise</h1>
        <p>Wähle dein Abo – jederzeit kündbar.</p>
        <div className="grid">
          <div className="card">
            <h3>Monat</h3>
            <p style={{fontSize:24,margin:'8px 0'}}><b>10 €</b> / Monat</p>
            <ul><li>Alle Kurse DE / AT / CH</li><li>Quiz & Karteikarten</li><li>Neue Inhalte inklusive</li></ul>
            <a className="cta" href="/login" style={{display:'inline-block',marginTop:12}}>Weiter</a>
          </div>
          <div className="card">
            <h3>Jahr</h3>
            <p style={{fontSize:24,margin:'8px 0'}}><b>100 €</b> / Jahr</p>
            <ul><li>Alle Kurse DE / AT / CH</li><li>Quiz & Karteikarten</li><li>2 Monate geschenkt</li></ul>
            <a className="cta" href="/login" style={{display:'inline-block',marginTop:12}}>Weiter</a>
          </div>
        </div>
        <p className="small" style={{marginTop:24}}>Bezahlarten (geplant): PayPal, Kreditkarte, TWINT.</p>
      </div>
    </section>
  )
}
