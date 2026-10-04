import MiniCourse from "../../components/MiniCourse";
import { getMiniCourseDetails } from "../../lib/mini-course-details";

const quiz = [
    {
      frage: "Was führt häufig zu Fehlern in der Theorieprüfung?",
      antworten: [
        { text: "Zu schnell lesen", richtig: true },
        { text: "Fragen zweimal lesen", richtig: false },
        { text: "Antworten auswendig lernen", richtig: false },
        { text: "Nachdenken vor dem Ankreuzen", richtig: false }
      ]
    },
    {
      frage: "Was ist für die Waffenhandhabung besonders wichtig?",
      antworten: [
        { text: "Schnelles Laden", richtig: false },
        { text: "Sicherheitsregeln fehlerfrei beherrschen", richtig: true },
        { text: "Die lauteste Waffe auswählen", richtig: false },
        { text: "Immer durchladen", richtig: false }
      ]
    },
    {
      frage: "Wie verbessert man die Schießleistung am besten?",
      antworten: [
        { text: "Unmittelbar vor dem Schießen Kaffee trinken", richtig: false },
        { text: "Ruhig atmen und Nachhalten üben", richtig: true },
        { text: "Nur aus dem Bauch schießen", richtig: false },
        { text: "So schnell wie möglich schießen", richtig: false }
      ]
    },
    {
      frage: "Wie merkt man sich Wildarten am besten?",
      antworten: [
        { text: "Nur Namen auswendig lernen", richtig: false },
        { text: "Merkmale & Verhalten regelmäßig wiederholen", richtig: true },
        { text: "Nur Bilder anschauen", richtig: false },
        { text: "Jedes Tier ansprechen, wie man will", richtig: false }
      ]
    }
  ];

const tipps = [
    "1. Lerne jeden Tag ein bisschen statt alles auf einmal.",
    "2. Wiederhole die wichtigsten Wildarten täglich.",
    "3. Lies die Fragen in der Theorieprüfung immer zweimal.",
    "4. Merke dir typische Schusszeichen und Pirschzeichen.",
    "5. Lerne die Sicherheitsregeln auswendig – fehlerfrei.",
    "6. Gehe Stoffgebiete systematisch durch (Wildkunde, Waffen, Recht).",
    "7. Benutze Eselsbrücken für schwierige Begriffe.",
    "8. Übe Waffenhandhabung regelmäßig trocken.",
    "9. Nimm reale Patronenattrappen zum Laden/Entladen üben.",
    "10. Sprich Wild sicher an – Altersmerkmale wiederholen.",
    "11. Lerne Losungen, Trittsiegel und Fährtenbilder.",
    "12. Verstehe Kugelfang, Hintergrund und Schusswinkel.",
    "13. Beobachte im Revier echte Wildwechsel – Praxiswissen hilft.",
    "14. Stelle viele Prüfungsfragen nach.",
    "15. Achte auf ruhige Atmung beim Schießen.",
    "16. Schieße im Anschlag mehrere Sekunden ruhig nach.",
    "17. Lerne typische Waffenstörungen und wie man reagiert.",
    "18. Schau dir Videos zu Wildverhalten an.",
    "19. Arbeite mit Karte/Kompass – Orientierung zählt.",
    "20. Wiederhole Prüfungsarbeit in kleiner Gruppe.",
    "21. Frage Ausbilder oder Jäger nach ihren Prüfungstipps.",
    "22. Präge dir Jagdzeiten und Schonzeiten ein.",
    "23. Nutze Merksätze für wichtige Revierzeichen.",
    "24. Bleibe ruhig – Nervosität ist normal.",
    "25. Schlaf vor der Prüfung ausreichend. ",
  ];

export default function PruefungstippsKurs({ details }) {
  return (
    <MiniCourse courseId="pruefung" questions={quiz} details={details}>
      <p>
              Kompakte Tipps, die dir helfen, die Jagdprüfung sicher zu bestehen.
            </p>

      <h2>Tipps</h2>

      <ul>
              {tipps.map((tipp, i) => (
                <li key={i} >{tipp}</li>
              ))}
            </ul>
    </MiniCourse>
  );
}

export function getStaticProps() {
  return { props: { details: getMiniCourseDetails("pruefung") } };
}
