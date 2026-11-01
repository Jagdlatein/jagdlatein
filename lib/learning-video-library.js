import { wildlifeVideoCases } from "./wildlife-video-cases";
import { huntingDogVideoLessons } from "./hunting-dog-video-lessons";
import { learningVideoLinks } from "./learning-video-links";
import { learningModules } from "./learning-curriculum";

// Discovery phrases summarize the existing lesson, not a diagnosis of the
// animal. Keep specialist terms explicit rather than guessing search synonyms.
const discovery = {
  fuchs: { focus: "Suchbewegungen von einem nachgewiesenen Beutefang unterscheiden.", concepts: ["Suchbewegung", "Beutefang", "Sichtgrenze"] },
  rotwild: { focus: "Sichtbaren Kontakt und Brunftkontext unterscheiden; Geweihenden sind kein Jahreszähler.", concepts: ["Kopfhaltung", "Abstand", "Fortpflanzungszustand", "Altersschätzung"] },
  schwarzwild: { focus: "Sichtbare Tiere zählen und Bewegungsrichtung von vermuteter Absicht trennen.", concepts: ["Rotte", "Bestand", "Angriff", "Geschlechtsmerkmale"] },
  stockente: { focus: "Nahrungssuche beobachten, ohne einzelne Nahrungsteilchen sicher zu bestimmen.", concepts: ["Nahrungsaufnahme", "Wasseroberfläche", "Abtauchen", "Gesundheitsdiagnose"] },
  rehwild: { focus: "Eine einzelne Sichtung von Jahreslebensraum und Bestandsgröße unterscheiden.", concepts: ["Sichtung", "Raumnutzung", "Bestand", "Beobachtungsbericht"] },
  "rehwild-galopp": { focus: "Bewegungsabläufe beschreiben und den Blattzeitkontext der Quelle getrennt einordnen.", concepts: ["Bewegung", "Galopp", "Blattzeit", "Paarung"] },
  "dachs-fellpflege": { focus: "Körperpflege beobachten, ohne daraus Parasitenbefall oder eine Erkrankung abzuleiten.", concepts: ["Körperpflege", "Kratzen", "Parasiten", "Erkrankung"] },
  "biber-schwimmen": { focus: "Die Position am bewachsenen Ufer beschreiben; die genaue Nahrung bleibt offen.", concepts: ["Körperansicht", "Ufer", "Nahrung", "Sichtgrenze"] },
  "feldhase-feld": { focus: "Körperhaltung und Bewegung im sichtbaren Ausschnitt beschreiben.", concepts: ["Körperhaltung", "Bewegung", "Ausschnitt"] },
  "stockente-gefiederpflege": { focus: "Gefiederpflege beobachten und sichtbare Handlungen von vermuteter Wirkung trennen.", concepts: ["Gefiederpflege", "Drüsenwirkung", "Wasserundurchlässigkeit"] },
  "eichhoernchen-mauer": { focus: "Bewegung an einer Hauswand beobachten; Alter und innerer Zustand bleiben offen.", concepts: ["Klettern", "Bewegung", "Alter", "Verhalten"] },
  "basset-faehrtenende": { focus: "Das Fährtenende von der davor liegenden Suchleistung unterscheiden.", concepts: ["Nasenarbeit", "Nasenleistung", "Kopfhaltung", "Fährtenverlauf", "Nachsuche"] },
  "labrador-signal": { focus: "Ein gelerntes Lautsignal von jagdlichem Spurlaut und Sichtlaut unterscheiden.", concepts: ["Spurlaut", "Sichtlaut", "Lautnachweis", "Signalaufbau", "Lernschritte"] },
  "golden-wasser": { focus: "Schwimmen und Tragen beobachten, ohne daraus eine vollständige Arbeitsleistung abzuleiten.", concepts: ["Apportieren", "Apportierleistung", "Wassersicherheit", "Beaufsichtigung"] },
  "rute-kontext": { focus: "Rutenbewegungen zusammen mit Körperhaltung und Situation einordnen.", concepts: ["Rutenwedeln", "Körpersprache", "Körperhaltung", "Gefühlslage"] },
  "maeusebussard-flug": { focus: "Flügelstellung und Schräglage vergleichen; den Einstellungswechsel der Originalaufnahme erkennen.", concepts: ["Flugbild", "Greifvögel", "Flügelstellung", "Schräglage", "Einstellungswechsel"] },
  "fasan-sandbad": { focus: "Bodennahe und aufgerichtete Körperhaltung am Wegrand vergleichen.", concepts: ["Sandbad", "Körperhaltung", "Wegrand", "Grasfläche"] },
  "ringeltaube-ast": { focus: "Gefiederumriss beobachten und Kameraänderungen von sichtbarer Tierbewegung trennen.", concepts: ["Gefiederumriss", "Kameravergrößerung", "Verdeckung", "Bildschärfe"] },
  "wildkaninchen-park": { focus: "Kopfhaltung, Sprünge und Abstände vergleichen; den Kameraschwenk berücksichtigen.", concepts: ["Kopfhaltung", "Sprünge", "Abstand", "Kameraschwenk", "Hasenartige"] },
};

function summary(item, group) {
  const link = learningVideoLinks.find(entry => entry.kind === group && entry.id === item.id);
  const observation = item.observations?.[0];
  const credit = group === "wild" ? item : item.media;
  return {
    id: `${group}-${item.id}`, group, title: item.title,
    subject: group === "wild" ? item.species : item.breed,
    duration: item.duration, tags: item.tags, poster: item.poster,
    credit: { author: credit.author, license: credit.license, licenseUrl: credit.licenseUrl, source: credit.source },
    focus: discovery[item.id]?.focus || (typeof observation === "string" ? observation : observation?.text) || item.title,
    concepts: discovery[item.id]?.concepts || [],
    courses: (link?.moduleIds || []).map(id => learningModules.find(module => module.id === id))
      .filter(Boolean).map(module => ({ title: module.title, href: `/kurse/${module.id}` })),
    href: link?.href || (group === "wild"
      ? `/lernen/wildtier-videofaelle?eintrag=${encodeURIComponent(item.id)}#video-fall`
      : `/lernen/jagdhund-videos?eintrag=${encodeURIComponent(item.id)}#hundevideo-film`),
  };
}

// Server-prepared discovery only. Questions, answer keys and media players stay
// in their existing lesson pages; opening this directory downloads no video.
export function getLearningVideoLibrary() {
  return [
    ...wildlifeVideoCases.map(item => summary(item, "wild")),
    ...huntingDogVideoLessons.map(item => summary(item, "hund")),
  ];
}
