import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";

export default function Impressum(){
  return (
    <LearningToolLayout title="Impressum" description="Kontaktinformationen und rechtliche Hinweise." icon="law" eyebrow="Informationen zu Jagdlatein" hideCommunity><section className={styles.panel}>
          <h2>Kontakt</h2>
          <p><a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a></p>
        </section></LearningToolLayout>
  );
}
