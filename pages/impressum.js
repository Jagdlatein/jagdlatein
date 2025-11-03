import Seo from '../components/Seo';

export default function Impressum(){
  return (
    <>
      <Seo title="Impressum – Jagdlatein" description="Kontaktinformationen und rechtliche Hinweise." />
      <section className="section">
        <div className="container">
          <h1>Impressum</h1>
          <p><b>Dienstanbieter:</b><br/>Jagdlatein</p>
          <p><b>Kontakt:</b><br/>E-Mail: <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a></p>
          <p className="small">Hinweis: Angebot aus der Schweiz. Länderspezifische Rechtsvorgaben (DE/AT/CH) bitte beachten.</p>
        </div>
      </section>
    </>
  );
}
