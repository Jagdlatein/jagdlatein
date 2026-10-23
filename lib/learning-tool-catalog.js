import { learningCategoryDetails } from "./learning-categories";

const allCategories = learningCategoryDetails.map(category => category.slug);
const allCountries = ["DE", "AT", "CH"];

// The same catalog drives the visible shortcuts and the shared learning search.
export const learningTools = [
  { href: "/kurse", icon: "courses", title: "Kurse", description: "Alle Kurse und kompakte Wissenschecks.", categories: allCategories },
  { href: "/lernen/lernkarten", icon: "book", title: "Lernkarten", aliases: ["Karteikarten", "Lernkartei", "Flashcards", "Wiederholen", "Selbstabfrage", "Druckvorlage", "Lernkarten PDF"], description: "Frage, Antwort und Wissenstext direkt lesen und gezielt wiederholen. Mit Quellen und Karten zum Ausdrucken.", categories: allCategories.filter(category => category !== "jagdrecht") },
  { href: "/quiz-app", icon: "quiz", title: "Quiz mit Rangliste", aliases: ["Jagdquiz", "Bestenliste", "Wettbewerb"], description: "Bis zu zehn Fragen pro Runde mit Zeit und Punkten. Deine beste abgeschlossene Runde zählt für die Rangliste. Länderwahl nur bei Recht.", categories: allCategories, countries: allCountries },
  { href: "/quiz-app/leaderboard", icon: "trophy", title: "Quiz-Rangliste", aliases: ["Bestenliste", "Top 100", "Bestleistung"], description: "Die 100 besten gespeicherten Quiz-Bestleistungen ansehen und eine eigene gewertete Runde starten.", categories: allCategories },
  { href: "/tagesquiz", icon: "daily", title: "Dein Reviermoment", aliases: ["Tagesquiz", "Tagesfrage", "Fall des Tages", "Praxisfall"], description: "Täglich ein anderer geprüfter Lernfall mit Erklärung und Quellen. Ohne Zeitlimit und Ranglistenpunkte.", categories: ["jagdpraxis", "wildkunde", "natur-revier", "pruefung-sprache", "ausruestung-technik", "tierschutz-verantwortung"] },
  { href: "/jagdpraxis", icon: "practice", title: "Praxis & Simulatoren", description: "Ansprechen, Sicherheit und Entscheidungen üben.", categories: ["jagdpraxis", "wildkunde", "waffen-sicherheit", "natur-revier", "wildbret-gesundheit", "hundewesen", "ausruestung-technik", "tierschutz-verantwortung"] },
  { href: "/glossar", icon: "glossary", title: "Glossar", description: "Jagdsprache und Fachbegriffe nachschlagen.", categories: ["pruefung-sprache"] },
  { href: "/ebook", icon: "ebook", title: "E-Book", aliases: ["Ebook", "E Book", "PDF"], description: "Jagdwissen in Ruhe lesen und vertiefen.", categories: allCategories },
  { href: "/wildkunde", icon: "deer", title: "Alle Wildarten", aliases: ["Wildartenliste", "Artenliste", "Arten von A bis Z"], description: "Alle Arten und Vergleichsformen in einer alphabetischen Liste. Merkmale und Lebensraum direkt lesen und das Porträt öffnen.", categories: ["wildkunde"] },
  { href: "/fotohelfer", icon: "camera", title: "Revier-Fotohelfer", aliases: ["Fotohelfer", "Revierfoto", "Wildtierfoto", "Foto vergleichen", "Spuren vergleichen", "Bilderkennung", "Kamera"], description: "Bildvorschläge mit passenden Lernbereichen und geprüften Merkmalsvergleichen.", categories: ["wildkunde", "jagdpraxis", "natur-revier"] },
  { href: "/lernen/kiefer-3d", icon: "cube", title: "Kiefer & Schädel in 3D", aliases: ["Unterkiefer", "Mandibel", "Schädelscan", "Museumsscan", "3D Kiefer", "3D Schädel"], description: "Echte artspezifische Sammlungspräparate drehen und mit den belegten Zahnformeln vergleichen. Noch fehlende Modelle sind gekennzeichnet.", categories: ["wildkunde"] },
  { href: "/jagdrecht", icon: "law", title: "Recht nach Land", description: "Gesetze und regionale Regelungen für Deutschland, Österreich und die Schweiz.", categories: ["jagdrecht"], countries: allCountries },
];

export const legalLearningHubs = [
  { href: "/jagdrecht/de", icon: "flag-DE", title: "Deutsches Jagdrecht", description: "Bundesjagdgesetz, Verordnungen und Landesjagdgesetze für Deutschland.", categories: ["jagdrecht"], countries: ["DE"] },
  { href: "/jagdrecht/at", icon: "flag-AT", title: "Österreichisches Jagdrecht", description: "Landesjagdgesetze, Verordnungen und Jagdkarten der österreichischen Bundesländer.", categories: ["jagdrecht"], countries: ["AT"] },
  { href: "/jagdrecht/ch", icon: "flag-CH", title: "Schweizer Jagdrecht", description: "JSG, JSV, Kantone und Jagdsysteme in der Schweiz.", categories: ["jagdrecht"], countries: ["CH"] },
];

export const learningToolCatalog = [...learningTools, ...legalLearningHubs];
