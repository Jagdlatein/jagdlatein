// Shared editorial discovery only. This module deliberately imports no course,
// question, player, media URL or storage data. Terms may name a teaching boundary
// or a linked course concept; they do not assert that it is visible in the film.
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
  "damwild-dyrehaven": { focus: "Körperansichten zwischen Stämmen vergleichen und Verdeckung als Sichtgrenze erkennen.", concepts: ["Damwild", "Verdeckung", "Seitenansicht", "Rückansicht", "Sichtzahl"] },
  "blaesshuhn-bled": { focus: "Helle Kopfpartien und Wasserreflexe unterscheiden.", note: "Kursbezug: Schwimmlappen; die Füße bleiben im Film unsichtbar.", concepts: ["Blässhuhn", "Stirnschild", "Wasserreflexe", "Sichtgrenze", "Schwimmlappen"] },
  "muffelwild-granat": { focus: "Gebogene Hörner und hellere Rumpfunterseite vergleichen; die Aufnahme stammt aus einem Wildpark.", concepts: ["Muffelwild", "Mufflon", "Hörner", "Schnecken", "Kopfschmuck", "Wildpark"] },
  "graugans-dresden": { focus: "Schnabelfarbe und Kopf-, Hals- und Flügelgefieder der schwimmenden Graugänse vergleichen.", concepts: ["Graugans", "Graugänse", "Gänse", "Schnabel", "Gefieder", "Wasservögel"] },
  "steinwild-ljubljana": { focus: "Hornbögen und erhabene Querwülste betrachten; keine Altersjahre aus den Wülsten abzählen.", concepts: ["Steinwild", "Steinbock", "Hornbögen", "Querwülste", "Schmuckknoten", "Altersansprache"] },
  "reiherente-petrosawodsk": { focus: "Helle Flanken und dunklen Kopf sowie Rücken unterscheiden.", note: "Kursbezug: Vogelbein und Sprunggelenk; Füße und Gelenke bleiben im Film unter Wasser unsichtbar.", concepts: ["Reiherente", "Gefieder", "Flanke", "Wasservögel", "Vogelbein", "Sprunggelenk", "Sichtgrenze"] },
};

export function getLearningVideoDiscovery(id) {
  if (typeof id !== "string" || !Object.hasOwn(discovery, id)) return null;
  const item = discovery[id];
  return { ...item, focus: [item.focus, item.note].filter(Boolean).join(" ") };
}

export function learningVideoDiscoveryText(id) {
  const item = getLearningVideoDiscovery(id);
  return item ? [item.focus, ...item.concepts].join(" ") : "";
}
