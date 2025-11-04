import Seo from '../components/Seo';
import PayPalButtons from '../components/PayPalButtons';

export default function Preise(){
  return (
    <>
      <Seo title="Preise – Jagdlatein" description="Monat 10 €, Jahr 100 €. Zugriff auf alle Lerninhalte, jederzeit kündbar." />
      <section className="section">
        <div className="container">
          <h1>Preise</h1>
          <p className="lead">Wähle dein Abo – sofort startklar, jederzeit kündbar.</p>

          <div className="grid">
            <div className="card">
              <h3>Monat</h3>
              <p style={{fontSize:24,margin:'8px 0'}}><b>10 €</b> / Monat</p>
              <ul>
                <li>Alle Inhalte (DE / AT / CH)</li>
                <li>Quiz, Glossar, Karteikarten</li>
                <li>Monatlich kündbar</li>
              </ul>

              <a className="cta" href="https://buy.stripe.com/6oUcN61GxaRcbahgu94Vy00" target="_blank" rel="noopener noreferrer" style={{marginTop:12, display:'inline-block'}}>
                Stripe (Karte/TWINT/Apple Pay)
              </a>

              <div style={{border:'1px dashed rgba(42,35,25,.2)',borderRadius:12,padding:10, marginTop:10}}>
                <PayPalButtons plan="monthly" />
              </div>
            </div>

            <div className="card">
              <h3>Jahr</h3>
              <p style={{fontSize:24,margin:'8px 0'}}><b>100 €</b> / Jahr</p>
              <ul>
                <li>Alle Inhalte (DE / AT / CH)</li>
                <li>Quiz, Glossar, Karteikarten</li>
                <li>2 Monate geschenkt</li>
              </ul>

              <a className="cta" href="https://buy.stripe.com/fZucN698Z7F07Y53Hn4Vy01" target="_blank" rel="noopener noreferrer" style={{marginTop:12, display:'inline-block'}}>
                Stripe (Karte/TWINT/Apple Pay)
              </a>

              <div style={{border:'1px dashed rgba(42,35,25,.2)',borderRadius:12,padding:10, marginTop:10}}>
                <PayPalButtons plan="yearly" />
              </div>
            </div>
          </div>

          <p className="small" style={{marginTop:24}}>
            Nach Zahlung → Login mit deiner E-Mail unter <a href="/login">/login</a>. Zugang wird automatisch geprüft.
          </p>
        </div>
      </section>
    </>
  );
}
