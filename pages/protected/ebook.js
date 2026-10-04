import { getPaidPageProps } from "../../lib/account-access";
import LearningToolLayout from "../../components/LearningToolLayout";
import styles from "../../styles/LearningExperience.module.css";
// pages/protected/ebook.js
export async function getServerSideProps(context) {
  return getPaidPageProps(context);
}

export default function ProtectedEbookPage() {
  return (
    <LearningToolLayout title="Jagdlatein E-Book" description="Dein Jagdwissen als PDF zum Lesen und Nachschlagen." icon="book">
      <section className={styles.panel}><h2>Das E-Book lesen</h2>

      <iframe
        src="/ebook.pdf"
        title="Jagdlatein E-Book als PDF"
        style={{ width: "100%", height: "75vh", border: "1px solid #e0c989", borderRadius: 12, marginTop: 20 }}
      ></iframe>

      <p>
        <a
          href="/ebook.pdf"
          download
          className={styles.primary}
        >
          PDF herunterladen
        </a>
      </p>
      </section>
    </LearningToolLayout>
  );
}
