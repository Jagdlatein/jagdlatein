// Original schematic summaries of the named, source-reviewed lessons.
// These are reading aids, not photographs or scale anatomical drawings.
const diagrams = {
  "wissen-ausbau-koerperfunktion-kreislauf-2026": {
    blutweg: {
      title: "Den Blutweg einmal im Kreis verfolgen",
      note: "Vereinfachtes Schema für das normale erwachsene Säugetier. Nach Schritt 4 beginnt der Weg wieder bei Schritt 1.",
      steps: [
        { title: "Rechte Herzhälfte", text: "Hohlvenen → rechter Vorhof → rechte Kammer." },
        { title: "Durch die Lunge", text: "Lungenarterien → Lungenkapillaren → Lungenvenen." },
        { title: "Linke Herzhälfte", text: "Linker Vorhof → linke Kammer." },
        { title: "Durch den Körper zurück", text: "Aorta → Körperkapillaren → Körpervenen → Hohlvenen." },
      ],
    },
  },
  "wissen-ausbau-anwendung-muskelbiologie-2026": {
    muskelaufbau: {
      title: "Vom ganzen Muskel zur Kontraktionseinheit",
      note: "Vereinfachte Vergrößerungsfolge der Skelettmuskulatur. Die Kästen zeigen Organisationsebenen, keine Größenverhältnisse.",
      steps: [
        { title: "Muskel", text: "Enthält Faserbündel. Das Epimysium umgibt den ganzen Muskel." },
        { title: "Faserbündel", text: "Enthält Muskelfasern. Das Perimysium umgibt das Bündel." },
        { title: "Muskelfaser", text: "Eine Muskelzelle mit vielen Myofibrillen. Außen liegt das Endomysium; die Zellmembran heißt Sarkolemm." },
        { title: "Myofibrille", text: "Enthält in Längsrichtung hintereinander angeordnete Sarkomere." },
        { title: "Sarkomer", text: "Kontraktionseinheit zwischen zwei Z-Scheiben mit dünnen und dicken Filamenten." },
      ],
    },
  },
};

export function getLessonDiagram(courseId, lessonId) {
  if (!Object.hasOwn(diagrams, courseId) || !Object.hasOwn(diagrams[courseId], lessonId)) return null;
  return diagrams[courseId][lessonId];
}
