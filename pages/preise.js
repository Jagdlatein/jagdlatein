import Seo from '../components/Seo';

export default function Preise(){
  const fakeCheckout = (method) => {
    alert(`${method} Checkout wird demnächst aktiviert. Bis dahin bitte Abo über Login anfragen oder E-Mail an info@jagdlatein.de.`);
  };

  return (
    <>
      <Seo title="Preise – Jagdlatein" description="Monat 10 €, Jahr 100 €. Monatlich kündbar." />
      <section className="section">
        <div className="container">
          <h1>Preise</h1>
          <p className="lead">Wähle dein Abo – jederzeit kündbar.</p>

          <div className="grid">
            <div className="card">
              <h3>Monat</h3>
              <p style={{fontSize:24,margin:'8px 0'}}><b>10 €</b> / Monat</p>
              <ul>
                <li>Alle Kurse DE / AT / CH</li>
                <li>Quiz & Karteikarten</li>
                <li>Neue Inhalte inklusive</li>
              </ul>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
                <button className="cta" onClick={()=>fakeCheckout('PayPal')}>PayPal</button>
                <button className="btn" onClick={()=>fakeCheckout('Kreditkarte')}>Kreditkarte</button>
                <button className="btn" onClick={()=>fakeCheckout('TWINT')}>TWINT (CH)</button>
              </div>
            </div>

            <div className="card">
              <h3>Jahr</h3>
              <p style={{fontSize:24,margin:'8px 0'}}><b>100 €</b> / Jahr</p>
              <ul>
                <li>Alle Kurse DE / AT / CH</li>
                <li>Quiz & Karteikarten</li>
                <li>2 Monate geschenkt</li>
              </ul>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
                <button className="cta" onClick={()=>fakeCheckout('PayPal')}>PayPal</button>
                <button className="btn" onClick={()=>fakeCheckout('Kreditkarte')}>Kreditkarte</button>
                <button className="btn" onClick={()=>fakeCheckout('TWINT')}>TWINT (CH)</button>
              </div>
            </div>
          </div>

          <p className="small" style={{marginTop:24}}>
            Bezahlarten werden in Kürze live geschaltet. Bis dahin: <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a>
          </p>
        </div>
      </section>
    </>
  );
}
