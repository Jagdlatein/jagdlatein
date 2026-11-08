// Original schematic summaries of the named, source-reviewed lessons.
// These are reading aids, not photographs or scale anatomical drawings.
const diagrams = {
  "wissen-ausbau-biologie-verdauungsvergleich-2026": {
    "zotten-mikrovilli": {
      title: "Zotte, Zelle und Zelloberfläche",
      note: "Eigenes vereinfachtes Begriffsschema zum Säuger-Dünndarm: drei Strukturebenen, kein maßstäblicher Vergleich und kein zeitlicher Ablauf.",
      steps: [
        { title: "Darmzotte", text: "Ein Vorsprung der Dünndarmschleimhaut, dessen Oberfläche von Epithelzellen bedeckt ist." },
        { title: "Aufnahmezelle", text: "Eine einzelne Zelle dieser Bedeckung. Ihre freie Oberfläche ist zum Darminneren gerichtet." },
        { title: "Mikrovilli", text: "Viele kleine Vorsprünge an der freien Oberfläche der Aufnahmezelle vergrößern deren Oberfläche." },
      ],
    },
  },
  "wissen-lebensraeume-biotopverbund": {
    "biotop-biozoenose": {
      title: "Lebensraum und Lebensgemeinschaft",
      note: "Eigenes Begriffsschema, keine räumliche Aufteilung einer Landschaft. Das Ökosystem umfasst die Lebensgemeinschaft und ihre unbelebte Umwelt mit ihren Wechselwirkungen.",
      steps: [
        { title: "Biotop", text: "Der Lebensraum einer Lebensgemeinschaft." },
        { title: "Biozönose", text: "Die Gemeinschaft von Lebewesen verschiedener Arten in diesem Lebensraum." },
        { title: "Ökosystem", text: "Lebensgemeinschaft und unbelebte Umwelt werden gemeinsam mit ihren Wechselwirkungen betrachtet." },
      ],
    },
  },
  "wissen-ausbau-revierpraxis-lebensmittelbakterien-2026": {
    "vorgebildete-toxine": {
      title: "Bakterium und Giftstoff unterscheiden",
      note: "Eigenes Begriffsschema für im Lebensmittel vorgebildete Enterotoxine von Staphylococcus aureus. Die Kästen vergleichen verschiedene Gegenstände, keine Kochschritte. Kein Nachweis der Genusstauglichkeit.",
      steps: [
        { title: "Bakterienzelle", text: "Lebende S.-aureus-Bakterien können sich unter geeigneten Bedingungen vermehren." },
        { title: "Vorgebildetes Enterotoxin", text: "Ein von Bakterien gebildeter Giftstoff ist selbst kein lebender Keim und vermehrt sich nicht." },
        { title: "Abtötung und Inaktivierung", text: "Bakterien abzutöten ist nicht dasselbe wie bereits gebildetes Enterotoxin zu inaktivieren. Übliches küchentechnisches Erhitzen beseitigt diese Enterotoxine nicht zuverlässig." },
      ],
    },
  },
  "wissen-ausbau-biologie-vogelkoerper-2026": {
    "vogelbein": {
      "title": "Vom Körper zu den Zehen",
      "note": "Eigenes vereinfachtes Lageschema für einen auf den Zehen stehenden Vogel; keine maßstäbliche Anatomiezeichnung oder Artbestimmung.",
      "steps": [
        {
          "title": "Knie",
          "text": "Liegt höher am Körper und ist häufig unter Gefieder verborgen."
        },
        {
          "title": "Sprunggelenk",
          "text": "Der auffällige untere Knick gehört zum Sprung- beziehungsweise Fersengelenk."
        },
        {
          "title": "Fußabschnitt und Zehen",
          "text": "Unter dem Sprunggelenk folgt der Fußabschnitt; die Zehen tragen beim Stehen den Bodenkontakt."
        }
      ]
    }
  },
  "wissen-vertiefung-kompass-nordrichtungen-2026": {
    richtungswinkel: {
      type: "compass-learning",
      title: "Richtungswinkel sichtbar machen",
      note: "Eigener ebener Lernkreis, kein Sensor, keine gemessene Nordrichtung oder Deklination.",
      steps: [
        { title: "Von N im Uhrzeigersinn", text: "In diesem Richtungskreis gilt N = 0° oder 360°, O = 90°, S = 180° und W = 270°." },
        { title: "Gegenrichtung im Lernkreis", text: "Eine Drehung um 180° führt zur Gegenrichtung desselben ebenen Bezugssystems." },
      ],
    },
  },
  "wissen-pruefung-bodenwasser-wurzelraum-2026": {
    "wurzelhaare": {
      title: "Wurzel, Oberhautzelle und Wurzelhaar",
      note: "Eigenes vereinfachtes Begriffsschema einer jungen Wurzel mit Wurzelhaaren. Die drei Ebenen sind kein maßstäblicher Vergleich und kein zeitlicher Ablauf.",
      steps: [
        { title: "Wurzel", text: "Ein mehrzelliges Pflanzenorgan mit verschiedenen Geweben." },
        { title: "Rhizodermiszelle", text: "Eine einzelne Zelle der äußeren Wurzeloberhaut, der Rhizodermis." },
        { title: "Wurzelhaar", text: "Eine Ausstülpung derselben Zelle. Sie vergrößert die Kontaktfläche zur Umgebung und ist kein eigenes Wurzelorgan." },
      ],
    },
    wurzelraumspeicher: {
      type: "soil-water-capacity",
      title: "Wasserspeicher selbst vergleichen",
      note: "Eigenes gleichförmiges Lernprofil, keine Standortmessung oder Bewässerungsempfehlung.",
      steps: [
        { title: "Nutzbarer Wasseranteil", text: "Wassergehalt bei Feldkapazität minus Wassergehalt am permanenten Welkepunkt, beide in Volumenprozent." },
        { title: "Durchwurzelte Tiefe", text: "Der nutzbare Speicher wird nur für den im Lernmodell erreichbaren, gleichförmigen Wurzelraum berechnet." },
        { title: "Wassersäule", text: "Volumenprozent-Differenz × Tiefe in Zentimetern ÷ 10 ergibt Millimeter nutzbare Speicherkapazität; kein aktueller Füllstand." },
      ],
    },
  },
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
