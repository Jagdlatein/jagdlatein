import Seo from '../components/Seo';

export default function Success(){
  return (
    <>
      <Seo title="Zahlung erfolgreich – Jagdlatein" />
      <section className="section">
        <div className="container" style={{maxWidth:620}}>
          <h1>Danke – Zahlung erfolgreich!</h1>
          <p>Dein Zugang ist aktiv. Bitte nutze <b>die gleiche E-Mail</b> vom Kauf beim Login:</p>
          <a className="cta" href="/login">Jetzt einloggen</a>
          <p className="small" style={{marginTop:12}}>
            Keine E-Mail bekommen? Prüfe Spam oder schreibe uns: <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a>
          </p>
        </div>
      </section>
    </>
  );
}
