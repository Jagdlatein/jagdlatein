import { getLearningCategoryByTitle } from "./learning-categories";
import { learningWildlifePhotos } from "./learning-wildlife-photos";
import { categoryPhotographs } from "./learning-category-photos";

export const learningHero = {
  src: "/lernen/waldwiese.jpg",
  width: 1600, height: 1200,
  alt: "Fotografierte Wiese am Waldrand im Waldpark Mannheim",
  caption: "Jagd verstehen heißt, Tiere, Lebensräume und verantwortliche Entscheidungen gemeinsam zu betrachten.",
  credit: "Foto: Gerda Arendt · CC0 1.0 · Waldpark Mannheim. Für die Webanzeige proportional verkleinert.",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Meadow_in_Waldpark_Mannheim.jpg",
  licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
};

const steps = (...items) => items.map(([title, text]) => ({ title, text }));
export const learningDiagrams = {
  wildkunde: { title: "Vom Beobachten zur belastbaren Aussage", steps: steps(
    ["Merkmale sammeln", "Körperbau, Bewegung, Verhalten und Lebensraum gemeinsam betrachten."],
    ["Beobachtung dokumentieren", "Ort, Zeit, Bedingungen und Unsicherheiten festhalten."],
    ["Alternative erklären", "Mehrere Sichtungen können dasselbe Tier betreffen. Sichtbarkeit ist kein Bestandsmaß."],
    ["Aussage begrenzen", "Nur sichere Merkmale benennen; aus Einzelbeobachtungen keine Population ableiten."]
  ) },
  "waffen-sicherheit": { title: "Sicherheit als durchgängiger Ablauf", steps: steps(
    ["Vorher abstimmen", "Zuständigkeiten, örtliche Regeln und sichere Handhabung unter Anleitung klären."],
    ["Situation prüfen", "Personen, Umgebung, Zustand der Ausrüstung und sichere Richtung beachten."],
    ["Bei Zweifel unterbrechen", "Keine Handlung fortsetzen, solange eine Sicherheitsfrage offen ist."],
    ["Übergabe klar machen", "Zustand nachvollziehbar kontrollieren und Verantwortung eindeutig übergeben."]
  ) },
  jagdpraxis: { title: "Eine verantwortliche Entscheidung vorbereiten", steps: steps(
    ["Beobachten", "Gelände, Wetter, Menschen, Tiere und Veränderungen wahrnehmen."],
    ["Einordnen", "Gesicherte Beobachtung von Vermutung trennen; Grenzen der Situation erkennen."],
    ["Entscheiden", "Nur bei geklärter Sicherheit und Berechtigung handeln. Verzicht bleibt eine Entscheidung."],
    ["Nachbereiten", "Beobachtungen, Abbruchgründe und Absprachen für das nächste Mal festhalten."]
  ) },
  "natur-revier": { title: "Revierpflege mit Rückmeldung", steps: steps(
    ["Ausgangslage erfassen", "Lebensräume, Nutzung, Störungen und Beobachtungsbedingungen beschreiben."],
    ["Ziel vereinbaren", "Mit Beteiligten klären, was verbessert werden soll und woran Erfolg erkennbar ist."],
    ["Maßnahme abstimmen", "Zuständigkeit, Genehmigungen, Zeitpunkt und mögliche Nebenwirkungen prüfen."],
    ["Wirkung beobachten", "Vergleichbare Beobachtungen wiederholen und die Planung bei Bedarf anpassen."]
  ) },
  hundewesen: { title: "Vom Arbeitsgebiet zum passenden Hund", steps: steps(
    ["Aufgabe benennen", "Vorstehen, Stöbern, Fährtenarbeit oder Apportieren: Anforderungen unterscheiden."],
    ["Hund und Alltag prüfen", "Anlagen, individuelle Gesundheit, Zeit, Betreuung und Lebensumfeld berücksichtigen."],
    ["Ausbildung begleiten", "Schrittweise, tierschutzgerecht und mit fachlicher Unterstützung lernen."],
    ["Eignung nachweisen", "Individuelle Leistung und örtliche Anforderungen prüfen; Rasse allein genügt nicht."]
  ) },
  "wildbret-gesundheit": { title: "Qualität braucht einen nachvollziehbaren Prozess", steps: steps(
    ["Beobachtung festhalten", "Auffälligkeiten und die Herkunft des Stückes nachvollziehbar dokumentieren."],
    ["Hygienisch arbeiten", "Saubere Abläufe und Ausrüstung einsetzen, Verunreinigung vermeiden."],
    ["Kühlung sichern", "Zeit und Temperatur im vorgesehenen Prozess kontrollieren; Unterbrechungen klären."],
    ["Freigabe klären", "Erforderliche Untersuchungen und Nachweise vor einer Abgabe erfüllen."]
  ) },
  jagdrecht: { title: "Eine Rechtsfrage am richtigen Ort prüfen", steps: steps(
    ["Ort und Handlung klären", "Land, Region, Gebiet, Art und die beabsichtigte Tätigkeit genau benennen."],
    ["Rechtsquellen suchen", "Geltende Gesetze, Verordnungen und örtliche Anordnungen heranziehen."],
    ["Voraussetzungen prüfen", "Berechtigung, Nachweise, Zeiten und Einschränkungen zusammen betrachten."],
    ["Unklarheit auflösen", "Bei der zuständigen Stelle nachfragen und erst mit geklärter Grundlage handeln."]
  ) },
  "pruefung-sprache": { title: "Verstehen, abrufen und begründen", steps: steps(
    ["Zusammenhang verstehen", "Begriffe und Ursache-Wirkungs-Beziehungen in eigenen Worten erklären."],
    ["Ohne Vorlage abrufen", "Eine Frage beantworten, bevor du die Lösung ansiehst."],
    ["Antwort prüfen", "Die Begründung vergleichen und den konkreten Denkfehler festhalten."],
    ["Später erneut anwenden", "Wiederholungen verteilen und das Wissen auf einen neuen Fall übertragen."]
  ) },
  "wald-pflanzen": { title: "Wald in mehreren Ebenen lesen", steps: steps(
    ["Standort", "Boden, Wasser, Klima und Nutzung prägen die Entwicklungsmöglichkeiten."],
    ["Struktur", "Baum-, Strauch- und Krautschicht sowie Lücken und Totholz gemeinsam betrachten."],
    ["Verjüngung", "Junge Pflanzen, Licht, Konkurrenz und Schäden über die Zeit beobachten."],
    ["Entwicklung", "Wiederholte Beobachtungen sind aussagekräftiger als eine einzelne Momentaufnahme."]
  ) },
  "landwirtschaft-lebensraeume": { title: "Nutzungswechsel rechtzeitig gemeinsam planen", steps: steps(
    ["Fläche verstehen", "Kultur, Bewirtschaftung, Randstrukturen und mögliche Tieraufenthalte erfassen."],
    ["Zeitpunkt abstimmen", "Landwirtschaft, Jagd und geeignete Helfer vor dem Arbeitsbeginn zusammenbringen."],
    ["Ablauf koordinieren", "Zuständigkeiten und geeignete Schutzmaßnahmen für die konkrete Fläche klären."],
    ["Veränderung nachverfolgen", "Nach Mahd oder Ernte Deckung, Nahrung und mögliche Ausweichräume neu bewerten."]
  ) },
  "ausruestung-technik": { title: "Technik bewusst einplanen", steps: steps(
    ["Aufgabe bestimmen", "Was muss die Ausrüstung unter den erwarteten Bedingungen leisten?"],
    ["Grenzen prüfen", "Wetter, Akkus, Empfang, Optik und Bedienbarkeit beeinflussen die Zuverlässigkeit."],
    ["Reserve vorbereiten", "Orientierung, Kommunikation und sichere Rückkehr auch bei Ausfall planen."],
    ["Hilfsmittel einordnen", "Technische Anzeige mit der Situation abgleichen; Verantwortung bleibt beim Menschen."]
  ) },
  "tierschutz-verantwortung": { title: "Bei Tierfunden besonnen handeln", steps: steps(
    ["Abstand halten", "Aus sicherer Entfernung beobachten und unnötige Störung vermeiden."],
    ["Situation beschreiben", "Ort, Art soweit sicher bestimmbar, Verhalten und erkennbare Gefahren nennen."],
    ["Zuständige Hilfe erreichen", "Örtlich zuständige Fachstellen einschalten und ihre Hinweise beachten."],
    ["Abgestimmt handeln", "Eigenschutz, Tierwohl und Berechtigung berücksichtigen; keine improvisierte Behandlung."]
  ) },
};

export function getLearningMedia(module) {
  const slug = module.imageKey || getLearningCategoryByTitle(module.category)?.slug;
  if (!learningDiagrams[slug]) return null;
  const pictures = learningWildlifePhotos[module.id];
  const wildlifeDefault = slug === "wildkunde" ? learningWildlifePhotos["wissen-rotwild-sozialverhalten"][0]
    : slug === "tierschutz-verantwortung" ? learningWildlifePhotos["wissen-rehwild-jahreslauf"][0] : null;
  const cover = pictures?.[0] || wildlifeDefault || (slug === "hundewesen" ? learningDogCover : categoryPhotographs[slug] || learningHero);
  return { ...cover, ...(pictures || wildlifeDefault ? { fit: "contain" } : {}), pictures, diagram: learningDiagrams[slug], icon: slug };
}

export const breedPictures = [
  { src: "/lernen/deutsch-drahthaar.jpg", name: "Deutsch Drahthaar", alt: "Deutsch Drahthaar mit rauem Fell und Bart", author: "janjak24", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", url: "https://commons.wikimedia.org/wiki/File:Chien_drahthaar,_2006-03-26.jpg" },
  { src: "/lernen/kleiner-muensterlaender.jpg", name: "Kleiner Münsterländer", alt: "Kleiner Münsterländer mit braun-weißem längeren Fell", author: "4028mdk09", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", url: "https://commons.wikimedia.org/wiki/File:Kleiner_M%C3%BCnsterl%C3%A4nder.jpg" },
  { src: "/lernen/wachtelhund.jpg", name: "Deutscher Wachtelhund", alt: "Brauner Deutscher Wachtelhund im Stand", author: "Steffen Heinz (Caronna)", license: "CC BY-SA 2.5", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5/", url: "https://commons.wikimedia.org/wiki/File:Deutscher_Wachtel_2.jpg" },
  { src: "/lernen/bayerischer-gebirgsschweisshund.jpg", name: "Bayerischer Gebirgsschweißhund", alt: "Bayerischer Gebirgsschweißhund mit dunkler Gesichtsmaske", author: "Moniique", license: "Public Domain", url: "https://commons.wikimedia.org/wiki/File:Bavorsky_barvar.JPG" },
];

const dogPicture = breedPictures.find(picture => picture.src === "/lernen/bayerischer-gebirgsschweisshund.jpg");
export const learningDogCover = {
  src: dogPicture.src, width: 2048, height: 1536, alt: dogPicture.alt,
  fit: "contain",
  caption: "Bayerischer Gebirgsschweißhund: ein Jagdhund für die Fährtenarbeit. Eignung und Ausbildung werden beim einzelnen Hund beurteilt.",
  credit: `Foto: ${dogPicture.author} · gemeinfrei. Unveränderte Originalaufnahme.`,
  creditUrl: dogPicture.url,
};
