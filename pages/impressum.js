import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";
import { operatorContact } from "../lib/operator-contact";

export default function Impressum(){
  return (
    <LearningToolLayout title="Impressum" description="Kontaktinformationen und rechtliche Hinweise." icon="law" eyebrow="Informationen zu Jagdlatein" hideCommunity><section className={styles.panel}>
          <h2>Betreiber und Kontakt</h2>
          <address style={{ fontStyle: "normal", lineHeight: 1.8 }}>
            {operatorContact.name}<br />{operatorContact.street}<br />
            {operatorContact.city}<br />{operatorContact.country}
          </address>
          <p>E-Mail: <a href={`mailto:${operatorContact.email}`}>{operatorContact.email}</a><br />
            Telefon: <a href={operatorContact.phoneHref}>{operatorContact.phone}</a></p>
          <h2>Logo und Medien</h2>
          <p>Das vom Betreiber bereitgestellte Jagdlatein-Logo ist eine mit ChatGPT erstellte Illustration. Die in den Lerneinheiten verwendeten Fotos und Tieraufnahmen haben eigene Quellen- und Lizenznachweise.</p>
        </section></LearningToolLayout>
  );
}
