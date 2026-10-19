import LearningToolLayout from "../components/LearningToolLayout";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";
import styles from "../styles/LearningExperience.module.css";

export default function Datenschutz() {
  return (
    <LearningToolLayout title="Datenschutzerklärung" description="Informationen zur Datenverarbeitung und deinen Rechten." icon="law" eyebrow="Informationen zu Jagdlatein" hideCommunity>
      <section className={styles.panel}>
        <PrivacyPolicyContent mutedClassName={styles.muted} />
      </section>
    </LearningToolLayout>
  );
}
