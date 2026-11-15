// New original scenes; the questions test visible movement and one explicit
// resolution limit. The separate feather course explains the unseen Alula.
const directory = "/lernen/videos-2026-11-15";
const media = id => ({ src: `${directory}/${id}.mp4`, poster: `${directory}/${id}-vorschau.jpg`, mimeType: "video/mp4", reviewedOn: "2026-11-15" });

export const wildlifeVideoExpansionNov15Cases = [
  {
    id: "stockente-flugstart", title: "Stockenten starten vom Wasser", speciesSlug: "stockente", species: "Stockente – Anas platyrhynchos", ...media("stockente-flugstart"),
    location: "Aufnahmeort und Aufnahmedatum nicht belegt · bei Pexels veröffentlicht am 16. November 2025", duration: 27,
    author: "Michal Petráš", source: "https://www.pexels.com/video/serene-ducks-in-flight-over-peaceful-water-34760064/",
    license: "Pexels-Lizenz", licenseUrl: "https://www.pexels.com/license/",
    modifications: "Vollständige Original-Bildfolge von 3840 × 2160 auf 1280 × 720 Pixel skaliert und als H.264/MP4 neu kodiert; alle 816 Bilder und die ursprüngliche Abspielgeschwindigkeit erhalten. Kein Zuschnitt und keine zusätzlichen Schnitte. Die Originaldatei enthält keine Audiospur; die Fassung ist stumm. Vorschau: Standbild derselben Aufnahme bei 3 Sekunden.",
    tags: ["Stockente", "Wasservögel", "Flugstart", "Flügel", "Flugbild", "Daumenfittich", "Alula"],
    course: "/kurse/wissen-ausbau-federaufbau-funktion-2026#lesson-alula",
    transcript: "Mehrere Stockenten schwimmen zunächst auf einer Wasserfläche. Im frühen Abschnitt heben mehrere Tiere mit Flügelschlägen ab; dabei spritzt Wasser auf. Die Kamera folgt den Vögeln. In den späteren Seitenansichten weisen Kopf und Hals nach vorn in Flugrichtung. Unterschiedliche Flügelstellungen werden sichtbar, während sich der Hintergrund von Ufer und Gebäuden zu hellem Himmel verändert. Die Originalseite benennt Stockenten; einen Aufnahmeort und ein Aufnahmedatum belegt sie nicht. Der 16. November 2025 ist das Veröffentlichungsdatum bei Pexels. Die kleinen Einzelfedern des Daumenfittichs und die Strömung an ihnen sind im Film nicht zuverlässig aufgelöst. Seine Funktion erklärt die verknüpfte Lektion getrennt. Aus dem Start wird weder ein bestimmter Auslöser noch ein Gesundheitsbefund abgeleitet. Die Aufnahme ist stumm.",
    observations: [
      "Den Wechsel vom Schwimmen zum Abheben mit Spritzwasser verfolgen.",
      "In der Seitenansicht Kopfhaltung und wechselnde Flügelstellungen vergleichen.",
      "Den sichtbaren Flug von den nicht aufgelösten Details des Daumenfittichs trennen.",
    ],
    questions: [
      { id: "abheben", at: 3, question: "Welche Bewegungsfolge zeigt der frühe Abschnitt am Wasser?", choices: ["Die Enten landen aus dem Flug und tauchen dabei vollständig unter.", "Mehrere Enten heben mit Flügelschlägen und Spritzwasser von der Wasseroberfläche ab.", "Die Enten gehen nacheinander vom Ufer ins Wasser und legen die Flügel an.", "Die Gruppe schwimmt während des ganzen Abschnitts mit angelegten Flügeln weiter."], answer: 1, explanation: "Die Bildfolge zeigt zunächst schwimmende Enten und anschliessend abhebende Tiere mit bewegten Flügeln und Spritzwasser. Sie zeigt keine Landung oder vollständiges Untertauchen. Warum die Tiere starten, bleibt offen." },
      { id: "flughaltung", at: 20, question: "Wie halten die seitlich vorbeifliegenden Enten Kopf und Hals?", choices: ["Kopf und Hals sind nach hinten über den Rücken gebogen.", "Die Köpfe bleiben tief unter den Rumpf eingezogen.", "Kopf und Hals weisen nach vorn in Flugrichtung.", "Die Hälse sind durchgehend senkrecht nach oben gestreckt."], answer: 2, explanation: "Die Seitenansicht zeigt die Köpfe vor dem Rumpf und in Flugrichtung. In der Bildfolge ändern sich gleichzeitig die Flügelstellungen. Eine genaue Geschwindigkeit wird ohne geeigneten räumlichen Massstab nicht gemessen." },
      { id: "alula-sichtgrenze", at: 24, question: "Welche Einordnung des Daumenfittichs (Alula) passt zu dieser Aufnahme?", choices: ["Die Flügelbewegung ist sichtbar; die genaue Alula-Stellung und Luftströmung bleiben unaufgelöst.", "Die Kopfhaltung zeigt die genaue Alula-Stellung an beiden Flügeln.", "Die Flugrichtung belegt, an welcher Alula gerade die Strömung abreisst.", "Der sichtbare Flügelumriss zeigt die Luftströmung um jede einzelne Alula-Feder."], answer: 0, explanation: "Einzelne Daumenfittichfedern und die Luftströmung sind hier nicht zuverlässig zu unterscheiden. Die verknüpfte Lektion erklärt ihre Funktion als separates Fachwissen. Eine bestimmte Alula-Stellung oder ein Strömungsabriss wird aus diesem Film nicht bestimmt." },
    ],
  },
  {
    id: "graugans-landung", title: "Graugänse im Anflug auf das Wasser", speciesSlug: "graugans", species: "Graugans – Anser anser", ...media("graugans-landung"),
    location: "De Cocksdorp, Texel, Niederlande · 6. Juli 2013", duration: 76,
    author: "Natuur Digitaal (Marc Plomp); Stichting Natuurbeelden", source: "https://commons.wikimedia.org/wiki/File:Vliegende_grauwe_ganzen-4961560.webm",
    license: "CC BY-SA 3.0 NL", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/nl/",
    modifications: "Vollständige Original-Bildfolge als H.264/MP4 neu kodiert; alle 1911 Bilder und die ursprüngliche Abspielgeschwindigkeit erhalten. SD-Quelle: 720 × 576 kodierte Pixel mit nichtquadratischen Pixeln. Ziel: 1024 × 576, Pixelverhältnis 1023:1024; ursprüngliches Anzeigeverhältnis 341:192 erhalten. Kein Zuschnitt und keine zusätzlichen Schnitte; die Einstellungswechsel der Quelle bleiben erhalten. Originalton weggelassen: stumme Fassung. Vorschau: Standbild bei 36 Sekunden, 1023 × 576 mit quadratischen Pixeln. Film und Vorschau: CC BY-SA 3.0 NL.",
    tags: ["Graugans", "Gänse", "Wasservögel", "Anflug", "Landung", "Flügelstellung", "Fluggruppe"],
    course: "/kurse/wissen-vertiefung-wild-wasservoegel-jahreslauf#lesson-familien",
    transcript: "Die Originalaufnahme zeigt Graugänse in mehreren Einstellungen: zunächst im Flug vor dem Himmel, dann beim Anflug auf eine Wasserfläche und später erneut im Flug. Sie ist keine nachgewiesen ununterbrochene Beobachtung derselben Gruppe. Im Landungsabschnitt sind an mehreren Vögeln ausgebreitete Flügel und nach unten hängende Beine erkennbar. Einige Tiere befinden sich später auf dem Wasser, während andere noch darüber fliegen. In einer späteren Flugeinstellung bilden die Vögel eine schräge, versetzte Reihe mit Zwischenräumen. Die Archivbeschreibung nennt Anser anser, De Cocksdorp auf Texel und den 6. Juli 2013. Die Gruppierung beweist keine bestimmte Familie. Der verknüpfte Kurs erklärt Gruppenbeziehungen und verbundene Wasser- und Landflächen als separates Lernwissen. Einzelne Federn, die Alula und Luftströmungen sind in dieser SD-Aufnahme nicht verlässlich erkennbar. Die Originaltonspur ist in dieser Fassung weggelassen.",
    observations: [
      "Im Anflug ausgebreitete Flügel und die unter dem Körper sichtbaren Beine betrachten.",
      "Bereits auf dem Wasser befindliche und noch fliegende Vögel unterscheiden.",
      "Die schräge Anordnung der späteren Fluggruppe beschreiben; Original-Einstellungswechsel beachten.",
    ],
    questions: [
      { id: "anflug-haltung", at: 36, question: "Welche Stellung ist an mehreren Gänsen unmittelbar über der Wasserfläche zu sehen?", choices: ["Beide Flügel liegen eng am Rumpf, während die Füsse auf dem Wasser stehen.", "Die Flügel bleiben seitlich waagrecht, während die Beine nach hinten am Körper liegen.", "Die Flügel sind an den Körper gezogen und die Füsse bewegen sich über trockenen Boden.", "Sie breiten die Flügel aus; die Beine hängen unter dem Körper."], answer: 3, explanation: "An mehreren anfliegenden Gänsen sind die Flügel vom Körper abgespreizt und die Beine unter dem Rumpf sichtbar. Die Frage betrifft diese Körperhaltung im Landungsabschnitt. Kleine Einzelfedern und die Luftströmung werden damit nicht nachgewiesen." },
      { id: "wasser-und-luft", at: 41, question: "Welche Situation zeigt der Landebereich jetzt?", choices: ["Die ganze Gruppe steht bereits auf einer trockenen Sandbank.", "Einige Gänse schwimmen schon, während andere noch darüber fliegen.", "Die ganze Gruppe bleibt hoch am Himmel ohne Kontakt zur Wasserfläche.", "Alle Gänse starten von der Wasserfläche wieder in dieselbe Richtung."], answer: 1, explanation: "Im selben Ausschnitt sind Vögel auf der Wasserfläche und weitere Vögel darüber in der Luft zu sehen. Die Gruppe berührt die Wasserfläche nicht vollständig gleichzeitig. Das ist eine Beobachtung der sichtbaren Tiere, keine Zählung des ganzen Bestands." },
      { id: "flugreihe", at: 71, question: "Wie ist die spätere Fluggruppe im Bild angeordnet?", choices: ["Mit Zwischenräumen in einer schrägen, versetzten Reihe.", "Als geschlossener Kreis um einen Vogel in der Bildmitte.", "Ohne erkennbare Zwischenräume in einer kompakten Fläche.", "Als einzelne waagrechte Reihe auf derselben Bildhöhe."], answer: 0, explanation: "Die späte Flugeinstellung zeigt mehrere Vögel versetzt entlang einer schrägen Linie und mit Zwischenräumen. Beschrieben wird diese Ansicht; die Formation beweist weder Verwandtschaft noch die vollständige Gruppengrösse. Die Originalaufnahme hat vor diesem Abschnitt die Einstellung gewechselt." },
    ],
  },
];
