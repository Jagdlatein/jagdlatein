import Seo from '../components/Seo';

export default function Datenschutz(){
  return (
    <>
      <Seo title="Datenschutzerklärung – Jagdlatein" description="Informationen zur Datenverarbeitung und Ihren Rechten." />
      <section className="section">
        <div className="container">
          <h1>Datenschutzerklärung</h1>

          <h3>1. Verantwortlicher</h3>
          <p>Jagdlatein · Kontakt: <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a></p>

          <h3>2. Zweck</h3>
          <p>Betrieb der Lernplattform, Accounts, Authentifizierung, Support, ggf. Zahlungsabwicklung.</p>

          <h3>3. Rechtsgrundlagen</h3>
          <p>Einwilligung, Vertragserfüllung, berechtigtes Interesse, gesetzliche Pflichten.</p>

          <h3>4. Speicherdauer</h3>
          <p>Nur solange erforderlich bzw. gesetzlich vorgeschrieben.</p>

          <h3>5. Empfänger</h3>
          <p>Hosting (Vercel), E-Mail; Zahlungsanbieter nach Aktivierung.</p>

          <h3>6. Rechte</h3>
          <p>Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit.</p>

          <p className="small">Bitte rechtlich prüfen/anpassen vor Live-Schaltung.</p>
        </div>
      </section>
    </>
  );
}
