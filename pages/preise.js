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
import Head from "next/head";
import Link from "next/link";
import PayPalButtons from "../components/PayPalButtons";
import styles from "../styles/Home.module.css";

export default function Preise() {
  return (
    <>
      <Head><title>Preise – Jagdlatein</title></Head>
      <main className={styles.main} style={{padding:"24px 16px"}}>
        <div style={{maxWidth:900, margin:"0 auto"}}>
          <h1 style={{marginBottom:10}}>Preise</h1>
          <p style={{color:"#374151", marginBottom:20}}>
            Wähle dein Modell. Zugang wird nach erfolgreicher Zahlung automatisch freigeschaltet.
          </p>

          <div style={{display:"grid", gap:16, gridTemplateColumns:"1fr 1fr"}}>
            {/* Monat */}
            <div className="plan" style={cardStyle}>
              <h3 style={{margin:"0 0 6px"}}>Monatszugang</h3>
              <p style={{margin:"0 0 10px", color:"#4b5563"}}>10 € / Monat · jederzeit kündbar</p>
              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <a className={`${styles.cta} ${styles.ctaPrimary}`}
                   href="https://buy.stripe.com/6oUcN61GxaRcbahgu94Vy00"
                   target="_blank" rel="noopener noreferrer">
                  Stripe • 10 €
                </a>
                <div style={{minWidth:260}}>
                  <PayPalButtons tier="monthly" />
                </div>
              </div>
            </div>

            {/* Jahr */}
            <div className="plan" style={cardStyle}>
              <h3 style={{margin:"0 0 6px"}}>Jahreszugang</h3>
              <p style={{margin:"0 0 10px", color:"#4b5563"}}>80 € / Jahr · entspricht 6,67 € / Monat</p>
              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <a className={`${styles.cta} ${styles.ctaPrimary}`}
                   href="https://buy.stripe.com/fZucN698Z7F07Y53Hn4Vy01"
                   target="_blank" rel="noopener noreferrer">
                  Stripe • 80 €
                </a>
                <div style={{minWidth:260}}>
                  <PayPalButtons tier="yearly" />
                </div>
              </div>
            </div>
          </div>

          <p style={{marginTop:18, color:"#6b7280"}}>
            Fragen zur Zahlung? <Link href="/kontakt">Kontakt</Link>
          </p>
        </div>
      </main>
    </>
  );
}

const cardStyle = {
  background:"#fff",
  border:"1px solid #e6eee6",
  borderRadius:16,
  padding:16,
  boxShadow:"0 6px 16px rgba(17,41,25,0.06)"
};
