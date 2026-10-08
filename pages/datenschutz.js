import LearningToolLayout from "../components/LearningToolLayout";
import styles from "../styles/LearningExperience.module.css";
import { operatorContact } from "../lib/operator-contact";

export default function Datenschutz(){
  return (
    <LearningToolLayout title="Datenschutzerklärung" description="Informationen zur Datenverarbeitung und deinen Rechten." icon="law" eyebrow="Informationen zu Jagdlatein" hideCommunity><section className={styles.panel}>

          <h2>1. Verantwortlicher</h2>
          <address style={{ fontStyle: "normal", lineHeight: 1.8 }}>
            {operatorContact.name} · Jagdlatein<br />{operatorContact.street}<br />
            {operatorContact.city}, {operatorContact.country}
          </address>
          <p>Kontakt: <a href={`mailto:${operatorContact.email}`}>{operatorContact.email}</a> ·
            Telefon: <a href={operatorContact.phoneHref}>{operatorContact.phone}</a></p>

          <h2>2. Welche Daten die App verwendet</h2>
          <ul>
            <li><strong>Anmeldung und Konto:</strong> E-Mail-Adresse, Anmeldestatus und Zugangsberechtigung. Login-Codes werden zur Prüfung als Hash gespeichert; ein Code gilt zehn Minuten.</li>
            <li><strong>Lernfortschritt:</strong> begonnene und abgeschlossene Kurse, Quizantworten und Ergebnisse, Punktestand sowie Zeitangaben zu Lernrunden.</li>
            <li><strong>Abo:</strong> Kennungen des Zahlungsanbieters, Tarif, Status und bestätigte Zugangszeiträume. Bei PayPal erfolgen Zustimmung und Eingabe von Zahlungsdaten bei PayPal. Bei einem Apple-Abo verarbeitet Apple den Kauf; Jagdlatein prüft die signierten Transaktionsnachweise und den aktuellen Abostatus. Eine zufällige Kontokennung ordnet den Apple-Kauf deinem Lernkonto zu. Zahlungsdaten wie deine Kartennummer werden dabei nicht in Jagdlatein gespeichert.</li>
            <li><strong>Community und Rangliste:</strong> öffentlicher Lernname, Beiträge, Antworten und Ranglistenwerte. Das gewählte Ranglistenland gehört zur öffentlichen Ranglistenanzeige.</li>
            <li><strong>Technischer Betrieb:</strong> bei Aufrufen übermittelte Verbindungs- und Browserinformationen; bei aktivierten Pushnachrichten außerdem eine Gerätekennung für die Zustellung.</li>
          </ul>
          <p>Diese Daten dienen dem Betrieb der Lernplattform, der Anmeldung, deinem persönlichen Lernfortschritt, dem Austausch in der Community, dem Support und der Abwicklung deines Abos.</p>

          <h2>3. Rechtsgrundlagen</h2>
          <p>Einwilligung, Vertragserfüllung, berechtigtes Interesse, gesetzliche Pflichten.</p>

          <h2>4. Cookies und Speicherung auf deinem Gerät</h2>
          <p>Die Anmeldung verwendet einen technisch notwendigen Sitzungscookie mit einer Gültigkeit von höchstens 40 Tagen. Die App prüft die Zugangsberechtigung zusätzlich; die Cookie-Laufzeit verlängert kein Abo und keinen Testzugang. Beim Abmelden wird die Sitzung beendet.</p>
          <p>Der Lernrucksack speichert die von dir ausgewählten Kurse und Medien auf deinem Gerät. Ein Paket ist höchstens sieben Tage nutzbar und endet bei einem kürzeren bestätigten Zugang entsprechend früher. Über „Downloads entfernen“ kannst du es löschen; beim Abmelden werden die Downloads ebenfalls entfernt.</p>
          <p>Eigene Notizen im Hundetrainingsjournal bleiben im lokalen Browserspeicher dieses Geräts. Sie werden nicht als Journal in deinem Konto gespeichert. Du kannst Einträge im Journal entfernen oder eine Sicherungsdatei für dich exportieren. Das Löschen der Browserdaten entfernt auch diese lokalen Notizen.</p>
          <p>Für Navigation und das Fortsetzen einer Quizrunde werden außerdem vorübergehende Angaben in der Browsersitzung gespeichert.</p>

          <h2>5. Speicherung im Konto</h2>
          <p>Konto-, Lern- und Communitydaten werden für die Bereitstellung der jeweiligen Funktionen gespeichert. Zahlungsnachweise können darüber hinaus gesetzlichen Aufbewahrungspflichten unterliegen. Die Gültigkeit eines Login-Codes ist nicht mit der Aufbewahrungsdauer aller Kontodaten gleichzusetzen.</p>
          <p>Wenn du Auskunft, Berichtigung oder die Löschung deiner Daten anfragen möchtest, schreibe an <a href="mailto:info@jagdlatein.de?subject=Anfrage%20zu%20meinen%20Daten">info@jagdlatein.de</a>. Sobald die direkte Kontolöschung freigeschaltet ist, findest du sie unter „Mein Konto“. Sie entfernt deine Kontodaten, Lernfortschritte und eigenen Community-Inhalte. Für die Abrechnung und gegen eine erneute Zuordnung gelöschter Konten bleiben minimale Zahlungsreferenzen ohne deine Konto-E-Mail erhalten.</p>
          <p>Eine Kontolöschung kündigt ein laufendes Apple- oder PayPal-Abo nicht automatisch. Verwalte und kündige es vor der Löschung beim jeweiligen Anbieter. Lokal gespeicherte Daten auf anderen Geräten werden durch die Serverlöschung nicht automatisch entfernt.</p>

          <h2>6. Empfänger und öffentliche Angaben</h2>
          <p>Hosting über Vercel, Speicherung von Konto- und Lerndaten in Supabase, der für Login-Codes eingesetzte E-Mail-Dienst sowie PayPal oder Apple bei den jeweiligen Aboabschlüssen und Zahlungen. Für aktivierte Pushnachrichten werden Gerätekennungen und Nachrichten über Firebase Cloud Messaging übermittelt.</p>
          <p>In der Community werden dein gewählter öffentlicher Lernname und deine Beiträge angezeigt. Deine Konto-E-Mail wird anderen Lernenden dabei nicht angezeigt.</p>
          <p>Auf der Preisseite wird zum Anzeigen der Bezahlmöglichkeit ein PayPal-Skript geladen. Dabei verbindet sich dein Browser mit PayPal. Wenn du einen Quellenlink öffnest, gelten für die besuchte Website deren eigene Datenschutzhinweise.</p>

          <h2>7. Deine Rechte und Kontakt</h2>
          <p>Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit.</p>

          <p className={styles.muted}>Fragen zur Verarbeitung deiner Daten kannst du an <a href="mailto:info@jagdlatein.de">info@jagdlatein.de</a> richten.</p>
        </section></LearningToolLayout>
  );
}
