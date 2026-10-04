import { getPaidPageProps } from "../lib/account-access";
// pages/ebook.js
import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";

export async function getServerSideProps(context) {
  return getPaidPageProps(context);
}

export default function Ebook() {
  const pdfUrl = "/ebook.pdf";

  async function openPdf() {
    try {
      const { Capacitor } = await import("@capacitor/core");

      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");

        await Browser.open({
          url: new URL(pdfUrl, window.location.origin).href,
        });

        return;
      }
    } catch (error) {
      console.error("PDF konnte nicht nativ geöffnet werden:", error);
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <LearningToolLayout title="Jagdlatein E-Book" description="Dein Jagdwissen als PDF zum Lesen und Nachschlagen." icon="book">
      <section className={styles.panel}><h2>Das E-Book lesen</h2><p>Dein Zugang ist freigeschaltet. Öffne das PDF in einem neuen Fenster.</p>
        <button type="button" onClick={openPdf} className={styles.primary}>PDF öffnen</button>
      </section>
    </LearningToolLayout>
  );
}
