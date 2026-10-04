import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";

export default function Datenschutz(){
  return (
    <LearningToolLayout title="Datenschutzerklärung" description="Informationen zur Datenverarbeitung und deinen Rechten." icon="law" eyebrow="Informationen zu Jagdlatein" hideCommunity><section className={styles.panel}>

          <h2>1. Verantwortlicher</h2>
          <p>Jagdlatein · Kontakt: <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a></p>

          <h2>2. Zweck</h2>
          <p>Betrieb der Lernplattform, Anmeldung mit E-Mail-Code, Verwaltung des Lernfortschritts und der Auswertungen, Community, Support und Zahlungsabwicklung über PayPal.</p>

          <h2>3. Rechtsgrundlagen</h2>
          <p>Einwilligung, Vertragserfüllung, berechtigtes Interesse, gesetzliche Pflichten.</p>

          <h2>4. Speicherdauer</h2>
          <p>Nur solange erforderlich bzw. gesetzlich vorgeschrieben.</p>

          <h2>5. Empfänger</h2>
          <p>Hosting über Vercel, Speicherung von Konto- und Lerndaten in Supabase, der für Login-Codes eingesetzte E-Mail-Dienst und PayPal bei Aboabschlüssen und Zahlungen.</p>
          <p>In der Community werden dein gewählter öffentlicher Lernname und deine Beiträge angezeigt. Deine Konto-E-Mail wird anderen Lernenden dabei nicht angezeigt.</p>

          <h2>6. Rechte</h2>
          <p>Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit.</p>

          <p className={styles.muted}>Fragen zur Verarbeitung deiner Daten kannst du an <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a> richten.</p>
        </section></LearningToolLayout>
  );
}
