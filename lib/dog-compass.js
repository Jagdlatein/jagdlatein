import { breedPictures } from "./learning-media";

// Rassenschwerpunkte nach den verlinkten FCI-Standards, geprüft am 04.10.2026.
// Die Arbeitsgebiete sind Lernfilter; sie beurteilen keinen individuellen Hund.
export const dogWorkTasks = [
  { id: "vorstehen", title: "Vorstehen", text: "Wildwitterung durch Stehen anzeigen; Suche und Zusammenarbeit unterscheiden sich von Stöberarbeit." },
  { id: "stoebern", title: "Stöbern", text: "Wild in Deckung suchen und in Bewegung bringen. Suchweise, Laut und Rückkehr gehören zur Ausbildung." },
  { id: "apport", title: "Apportieren", text: "Gefundenes Wild aufnehmen und zur führenden Person bringen; kontrolliertes Tragen und Abgeben werden erlernt." },
  { id: "wasser", title: "Wasserarbeit", text: "Suchen und Apportieren am oder im Wasser. Gewöhnung, Bedingungen und Belastungsgrenzen müssen passen." },
  { id: "schweiss", title: "Schweißarbeit", text: "Verletztes Schalenwild auf seiner Fährte nachsuchen. Schwierige Nachsuchen verlangen spezialisierte, erfahrene Teams." },
  { id: "brackieren", title: "Spurlaut & Brackieren", text: "Eine Wildspur mit Laut verfolgen. Diese Arbeitsweise ist von der spezialisierten Nachsuche am Riemen zu unterscheiden." },
  { id: "bau", title: "Arbeit unter der Erde", text: "Ein eigenes Arbeitsgebiet mit besonderen Risiken und örtlichen Regeln; hier lernst du die Rassezuordnung, keine Einsatzanleitung." },
];

const photoFor = name => {
  const picture = breedPictures.find(item => item.name === name);
  if (!picture) return null;
  const dimensions = {
    "Deutsch Drahthaar": [2048, 1536], "Kleiner Münsterländer": [924, 552],
    "Deutscher Wachtelhund": [1579, 1184], "Bayerischer Gebirgsschweißhund": [2048, 1536],
  };
  const [width, height] = dimensions[name];
  return { ...picture, width, height };
};
const breed = (id, name, group, standard, tasks, summary, work, training, everyday, care, boundary) => ({
  id, name, group, standard, tasks, summary, work, training, everyday, care, boundary,
  photo: photoFor(name),
  source: { title: `FCI: ${name}, Standard Nr. ${standard.number}`, url: `https://www.fci.be/Nomenclature/Standards/${String(standard.number).padStart(3, "0")}g${String(standard.group).padStart(2, "0")}-en.pdf` },
});

export const dogBreeds = [
  breed("drahthaar", "Deutsch Drahthaar", "Kontinentaler Vorstehhund", { number: 98, group: 7 }, ["vorstehen", "apport", "wasser", "schweiss"],
    "Vielseitiger Vorstehhund mit rauem Schutzhaar und Bart.",
    "Verbindet Feldsuche und Vorstehen mit Aufgaben nach dem Schuss. Wasser- und Fährtenarbeit werden gezielt aufgebaut.",
    "Zusammenarbeit, Rückruf, Ruhe und kontrollierter Apport brauchen ebenso einen Platz wie die Suche. Vielseitigkeit bedeutet mehrere Ausbildungsbausteine.",
    "Ein geplanter Arbeitstag ersetzt keine Betreuung an jagdfreien Tagen. Bewegung und sinnvolle Nasenarbeit mit ausreichender Ruhe verbinden.",
    "Rauhaar, Bart, Haut und Pfoten nach Gelände- und Wasserkontakt kontrollieren; passende Fellpflege am einzelnen Hund klären.",
    "Ein vielseitiger Hund ist nicht automatisch ein Spezialist für jede schwierige Nachsuche."),
  breed("kurzhaar", "Deutsch Kurzhaar", "Kontinentaler Vorstehhund", { number: 119, group: 7 }, ["vorstehen", "apport", "wasser", "schweiss"],
    "Kurzhaariger, ausdauernder Vorstehhund mit vielseitigem Arbeitsprofil.",
    "Feldsuche und Vorstehen gehören zu seinen Schwerpunkten; die vielseitige jagdliche Ausbildung umfasst auch Arbeit nach dem Schuss.",
    "Suchweite und Kontakt zur führenden Person gemeinsam entwickeln. Rückruf und ruhiges Warten unter Ablenkung gehören zur Basis.",
    "Auslauf allein ist kein vollständiger Ausbildungsplan. Suchaufgaben, Zusammenarbeit, Betreuung und Ruhe passend verteilen.",
    "Das kurze Fell erlaubt eine gute Sichtkontrolle, ersetzt aber nicht die Prüfung auf Zecken, kleine Verletzungen und Witterungsbelastung.",
    "Kurzes Haar und sportlicher Körperbau sind keine Garantie für leichte Haltung oder unbegrenzte Belastbarkeit."),
  breed("kleiner-muensterlaender", "Kleiner Münsterländer", "Kontinentaler Vorstehhund", { number: 102, group: 7 }, ["vorstehen", "apport", "wasser", "schweiss"],
    "Mittelgroßer, langhaariger Vorstehhund für Feld, Wald und Wasser.",
    "Die Rasse verbindet Vorstehen mit vielseitigen Aufgaben und Apport. Das gewünschte Arbeitsprofil muss zur jeweiligen Zuchtlinie und Ausbildung passen.",
    "Kontakt, Suche und kontrolliertes Abgeben schrittweise verbinden. Ein kleinerer Körper verkürzt die nötige Lernzeit nicht.",
    "Den Alltag gemeinsam mit der Familie planen. Freundliches Rassebild ersetzt weder Sozialisierung noch beaufsichtigten Umgang mit Kindern.",
    "Befederung und Ohrbereich regelmäßig kontrollieren; Kletten und Verfilzungen nach dem Reviergang früh erkennen.",
    "Kleiner und Großer Münsterländer sind eigenständige Rassen, keine zwei Größen derselben Rasse."),
  breed("grosser-muensterlaender", "Großer Münsterländer", "Kontinentaler Vorstehhund", { number: 118, group: 7 }, ["vorstehen", "apport", "wasser", "schweiss"],
    "Langhaariger Vorstehhund mit schwarzem Kopf und schwarz-weißem beziehungsweise schwarzem Fell.",
    "Der FCI-Standard beschreibt vielseitige Arbeit in Feld, Wald und Wasser vor und nach dem Schuss.",
    "Suche, Vorstehen, Apport und Fährtenarbeit als verschiedene Lernaufgaben behandeln. Ruhe und Führigkeit parallel festigen.",
    "Unterbringung, Transport und Versorgung auf einen kräftigen Hund abstimmen. Dauerhafte gemeinsame Arbeit und Betreuung einplanen.",
    "Langes Fell und Befederung brauchen regelmäßige Kontrolle; Pfoten, Haut und Ohren nach Arbeit in Deckung überprüfen.",
    "Die Ähnlichkeit des Namens zum Kleinen Münsterländer sagt nichts über die Eignung eines einzelnen Hundes aus."),
  breed("pointer", "English Pointer", "Britischer Vorstehhund", { number: 1, group: 7 }, ["vorstehen"],
    "Vorstehspezialist mit einem auf Suche, Ausdauer und Bewegung ausgerichteten Rasseprofil.",
    "Sein Schwerpunkt liegt bei der Suche nach Wildwitterung und dem Vorstehen. Er ist kein automatischer Ersatz für einen vielseitig ausgebildeten Gebrauchshund.",
    "Suchweite, Kontakt und Stoppsignale unter fachlicher Begleitung aufbauen. Aufgaben und Gelände aufeinander abstimmen.",
    "Passende Bewegung mit kontrollierter Beschäftigung und Erholung kombinieren. Auch ein guter Suchhund muss Alltag und Warten lernen.",
    "Kurzes Fell, Pfoten und Haut nach dem Einsatz kontrollieren; Witterung und individuelle Kondition bei der Planung berücksichtigen.",
    "Vorstehvermögen bedeutet nicht automatisch ausgeprägte Apport-, Stöber- oder Nachsucheneignung."),
  breed("wachtelhund", "Deutscher Wachtelhund", "Stöberhund", { number: 104, group: 8 }, ["stoebern", "apport", "wasser", "schweiss"],
    "Stöberhund mit vielseitigen jagdlichen Anlagen und dichtem, häufig gewelltem Fell.",
    "Sucht Wild in Deckung; der Standard betont die Stöberarbeit und vielseitige jagdliche Verwendung. Vorstehen ist nicht sein Rassenschwerpunkt.",
    "Selbstständige Suche mit Rückkehr, Orientierung und Zusammenarbeit verbinden. Laut und Arbeitseifer am einzelnen Hund beurteilen.",
    "Beschäftigung und sichere Führung bei Wildreizen über das ganze Jahr planen. Ein Auslastungsplan braucht auch Ruhephasen.",
    "Dichtes Fell, Ohren und Pfoten nach Deckungs- und Wasserkontakt prüfen; Verfilzungen und Fremdkörper früh beachten.",
    "Stöberhund und Vorstehhund erfüllen unterschiedliche Aufgaben. Beides ist nicht beliebig austauschbar."),
  breed("springer", "English Springer Spaniel", "Stöberhund", { number: 125, group: 8 }, ["stoebern", "apport"],
    "Spaniel zum Finden, Aufstöbern und Apportieren von Wild.",
    "Der Standard beschreibt die Verbindung von Stöberarbeit und Apport. Arbeitslinie, individueller Hund und Einsatzprofil gemeinsam anschauen.",
    "Kontrollierte Suche, Stoppen, Apport und Abgeben einzeln üben. Große Begeisterung braucht verständliche Grenzen und Pausen.",
    "Für jagdliche Arbeit gezüchtete Linien können deutlich andere Anforderungen stellen als das Bild eines reinen Begleithundes erwarten lässt.",
    "Befederung, Ohren und Pfoten nach der Arbeit kontrollieren; Fellpflege in den regelmäßigen Tagesplan aufnehmen.",
    "Der Rassename allein beschreibt weder den Ausbildungsstand noch die passende Suchweise eines Hundes."),
  breed("bracke", "Deutsche Bracke", "Laufhund", { number: 299, group: 6 }, ["brackieren"],
    "Laufhund für spurorientierte Arbeit; keine Vorstehhunderasse.",
    "Die brackentypische Arbeit folgt der Wildspur. Laut und Spurtreue sind von Sichthetze und von einer spezialisierten Nachsuche zu unterscheiden.",
    "Orientierung, Rückkehr und die sichere Führung eines selbstständig arbeitenden Hundes gezielt vorbereiten.",
    "Sichere Auslaufmöglichkeiten und Betreuung planen. Jagdtrieb verschwindet außerhalb eines Jagdtages nicht von selbst.",
    "Fell, Pfoten und Ohren nach längeren Geländewegen kontrollieren; Kondition und Erholung nachvollziehbar beobachten.",
    "Ob und wie Brackieren vor Ort zulässig ist, muss gesondert geklärt werden. Das Profil gibt keine Einsatzfreigabe."),
  breed("hannover", "Hannoverscher Schweißhund", "Schweißhund", { number: 213, group: 6 }, ["schweiss"],
    "Spezialist für die Fährtenarbeit bei verletztem Wild.",
    "Der Standard beschreibt hoch spezialisierte Nachsuchenarbeit. Diese Aufgabe benötigt ein geeignetes Team und regelmäßig passende Arbeit.",
    "Ruhige, sorgfältige Riemenarbeit mit erfahrener Anleitung aufbauen. Schwierige Situationen werden nicht allein anhand eines Rassenprofils bewältigt.",
    "Realistische Arbeitsmöglichkeiten und eine erreichbare fachliche Begleitung vor der Anschaffung klären. Spaziergänge ersetzen die Spezialisierung nicht.",
    "Kondition, Pfoten und Erholung nach Fährtenarbeit beachten; Umfang und Gelände am einzelnen Hund ausrichten.",
    "Kein allgemeiner Vorsteh- oder Apportierhund. Ein Foto oder Rassepapier weist keine Nachsuchenleistung nach."),
  breed("bayerischer", "Bayerischer Gebirgsschweißhund", "Schweißhund", { number: 217, group: 6 }, ["schweiss"],
    "Nachsuchenspezialist, dessen Arbeitsprofil auf Schalenwildfährten ausgerichtet ist.",
    "Spezialisierte Arbeit auf der Fährte verletzten Schalenwildes; der FCI-Standard beschreibt die Anforderungen auch bei schwierigen Nachsuchen.",
    "Fährtenruhe, Zusammenarbeit und fachlich angeleitete Riemenarbeit entwickeln. Reale Einsatzmöglichkeiten und Begleitung sind entscheidend.",
    "Anschaffung und Ausbildung aus der tatsächlich verfügbaren Aufgabe ableiten. Der Name macht den Hund nicht automatisch für jedes Berggelände geeignet.",
    "Pfoten, Kondition und Erholung besonders nach anspruchsvollen Wegen beobachten; Alter und Gesundheit in die Belastungsplanung einbeziehen.",
    "Ein spezialisierter Schweißhund ist kein vielseitiger Ersatz für Stöber-, Vorsteh- und Apportieraufgaben."),
  breed("teckel", "Teckel / Dachshund", "Dachshund", { number: 148, group: 4 }, ["bau", "stoebern", "schweiss"],
    "Kurzläufiger Jagdhund mit verschiedenen Größen und Haararten.",
    "Der Standard beschreibt Arbeit über und unter der Erde sowie spurorientierte Aufgaben. Geeignete Ausbildung und individuelle Leistung entscheiden über den Einsatz.",
    "Rückruf, Zusammenarbeit und kontrollierte Fährtenarbeit aufbauen. Kleine Körpermaße sind kein Grund für weniger Erziehung oder Betreuung.",
    "Bewegung und Ruhe dem einzelnen Hund anpassen. Ein kleiner Jagdhund ist nicht automatisch eine Lösung für wenig Zeit.",
    "Pflege auf Kurz-, Lang- oder Rauhaar abstimmen. Kondition, Gewicht und Bewegungsauffälligkeiten bei tierärztlichen Kontrollen ansprechen.",
    "Arbeit unter der Erde hat besondere Risiken. Sie ist kein unbeaufsichtigter Lernversuch; örtliche Regeln und Fachbegleitung sind Voraussetzung."),
  breed("jagdterrier", "Deutscher Jagdterrier", "Terrier", { number: 103, group: 3 }, ["bau", "stoebern"],
    "Kompakter Jagdterrier, besonders für Arbeit unter der Erde und Stöberarbeit gezüchtet.",
    "Der FCI-Standard nennt diese Schwerpunkte ausdrücklich. Arbeitseifer und Selbstständigkeit müssen mit Führigkeit und sicherem Management zusammenkommen.",
    "Ruhe, Rückruf, Umgang mit Wildreizen und Zusammenarbeit früh aufbauen. Härte ersetzt keinen verständlichen, tierschutzgerechten Lernaufbau.",
    "Sichere Betreuung und einen bewussten Umgang mit anderen Tieren planen. Erwartungen an den Alltag mit Zuchtverein und Fachpersonen besprechen.",
    "Raues oder glattes Fell regelmäßig prüfen; kleine Verletzungen und Fremdkörper nach dichter Deckung nicht übersehen.",
    "Kompakt bedeutet nicht anspruchslos. Risikoreiche Arbeit erfordert besondere fachliche und örtliche Voraussetzungen."),
  breed("labrador", "Labrador Retriever", "Apportierhund", { number: 122, group: 8 }, ["apport", "wasser"],
    "Retriever mit Schwerpunkt Apport und ausgeprägtem Bezug zur Wasserarbeit im Rasseprofil.",
    "Suchen, Bringen und Abgeben nach dem Schuss. Jagdliche Zuchtlinie und überprüfte Anlagen sind für das geplante Arbeitsprofil relevant.",
    "Ruhiges Warten, kontrollierten Apport und sauberes Abgeben trainieren. Nicht jeder Gegenstand muss sofort geworfen und geholt werden.",
    "Freundliches Rassebild ersetzt keine Erziehung. Bewegung, Nasenarbeit und Ruhe mit der Betreuung im Haushalt verbinden.",
    "Dichtes Fell, Haut und Ohren nach Wasserarbeit kontrollieren. Futtermenge, Körperzustand und Belastung individuell abstimmen.",
    "Apportieren ist eine andere Aufgabe als Vorstehen oder spezialisierte Schweißarbeit. Nicht jeder Labrador ist ein ausgebildeter Jagdhund."),
  breed("golden", "Golden Retriever", "Apportierhund", { number: 111, group: 8 }, ["apport", "wasser"],
    "Langhaariger Retriever mit natürlicher Arbeitsanlage und Schwerpunkt Apport an Land und im Wasser.",
    "Als Retriever der FCI-Gruppe 8 auf Arbeit nach dem Schuss ausgerichtet. Dazu gehören Suchen und Apportieren an Land und im Wasser. Bei jagdlichen Plänen Linie, Anlagen und Ausbildung prüfen.",
    "Warten, Suchen, Tragen und Abgeben als einzelne Schritte festigen. Freundliches Wesen macht Ausbildung nicht überflüssig.",
    "Auch ein Familienhund mit Jagdhundhintergrund braucht Betreuung, passende Beschäftigung und Erholung. Zusammenleben wird am einzelnen Tier entwickelt.",
    "Langes Fell und Befederung regelmäßig pflegen; Haut, Ohren und Pfoten nach Geländewegen prüfen.",
    "Ein Golden Retriever ist nicht aufgrund seines Rassenamens für jede Jagdaufgabe oder jede Familie geeignet."),
];

export const dogCompassSources = [
  { title: "Deutscher Retriever Club: Wasser- und Apportierarbeit der Retriever", url: "https://drc.de/interessenten/hobby/das-jagdwesen" },
  { title: "JGHV: unterschiedliche Prüfungsordnungen und Arbeitsgebiete", url: "https://jghv.de/service/pruefungsordnungen-des-jghv" },
  { title: "BLV: Bedürfnisse, Bewegung, Sozialkontakt und Ruhe", url: "https://www.blv.admin.ch/de/hunde" },
];

export function getDogTaskMatch(profile, chosenTasks) {
  const known = new Set(dogWorkTasks.map(task => task.id));
  const selected = [...new Set(chosenTasks.filter(id => known.has(id)))];
  return { matched: selected.filter(id => profile.tasks.includes(id)), missing: selected.filter(id => !profile.tasks.includes(id)) };
}

export function getCompassAdvice({ access, guidance, everyday }) {
  const items = [];
  if (access === "none") items.push("Arbeitsmöglichkeiten fehlen noch: Kläre zuerst, wo fachlich begleitet und rechtmäßig ausgebildet und gearbeitet werden kann. Eine Rasseauswahl löst diese offene Frage nicht.");
  if (access === "planned") items.push("Geplante Arbeitsmöglichkeiten konkret machen: Welche Aufgaben kommen tatsächlich vor, wie oft und mit wem? Stelle diesen Plan einem passenden Rasseverein vor.");
  if (access === "ready") items.push("Arbeitsmöglichkeiten stehen bereit: Gleiche konkrete Aufgabe, Häufigkeit und Einsatzbedingungen mit dem individuellen Hund und seiner Ausbildung ab.");
  if (guidance === "none") items.push("Fachliche Begleitung suchen: Eine passende Ausbildungsgruppe oder ein erfahrener Rasseverein hilft, Anlagen und Ausbildungsbedarf vorab einzuschätzen.");
  if (guidance === "planned") items.push("Fachliche Begleitung verbindlich planen: Zuständigkeit, Lernziele und tierschutzgerechte Methoden vor der ersten Arbeitsübung besprechen.");
  if (guidance === "ready") items.push("Begleitung ist vorhanden: Vereinbare beobachtbare Lernziele, regelmäßige Rückmeldung und Kriterien zum Unterbrechen einer Übung.");
  if (everyday === "open") items.push("Alltag noch organisieren: Tägliche Betreuung, Bewegung, Sozialkontakt, Pflege und ungestörte Ruhe brauchen konkrete Zuständigkeiten – auch an jagdfreien Tagen.");
  if (everyday === "ready") items.push("Alltag ist geplant: Prüfe den Plan auch für Krankheit, Urlaub, jagdfreie Wochen und Veränderungen im Haushalt. Kinder und andere Tiere brauchen betreuten Umgang.");
  return items;
}

export const dogCompassChecks = [
  { id: "aufgabe", question: "Du möchtest Vorstehen und vielseitige Arbeit in Feld, Wald und Wasser kennenlernen. Welches Profil passt zu diesen Rassenschwerpunkten?", options: ["Bayerischer Gebirgsschweißhund", "Kleiner Münsterländer", "Deutsche Bracke"], answer: 1, explain: "Der Kleine Münsterländer gehört zu den kontinentalen Vorstehhunden und hat ein vielseitiges Arbeitsprofil. Der Bayerische Gebirgsschweißhund ist Nachsuchenspezialist, die Deutsche Bracke ein Laufhund. Über die tatsächliche Eignung entscheidet trotzdem der einzelne Hund samt Ausbildung." },
  { id: "alltag", question: "Im Alltag ist wenig Zeit frei. Was lässt sich aus kleinen Körpermaßen eines Teckels sicher ableiten?", options: ["Er braucht keine regelmäßige Ausbildung.", "Er ist automatisch ein unkomplizierter Familienhund.", "Seine geringe Größe sagt nichts über die gesicherte Betreuung und Ausbildung aus."], answer: 2, explain: "Größe ersetzt keinen Tagesplan. Auch ein kleiner Jagdhund braucht Bewegung, Beschäftigung, Kontakt, Pflege und Ruhe. Die Versorgung muss jeden Tag organisiert sein; die Rasse allein garantiert keinen einfachen Alltag." },
  { id: "vergleich", question: "Ein Profil zeigt Schweißarbeit als Schwerpunkt. Was muss vor einer schwierigen Nachsuche zusätzlich geklärt werden?", options: ["Individuelle Leistung, Ausbildung, Erfahrung und örtliche Einsatzvoraussetzungen.", "Nur ob der Hund auf dem Foto kräftig aussieht.", "Nichts: Der Rassename reicht aus."], answer: 0, explain: "Ein Rassenschwerpunkt beschreibt eine Zuchtausrichtung. Nachsucheneignung und Einsatzberechtigung sind damit nicht bewiesen. Das konkrete Team, tatsächliche Leistung, passende Anleitung und geltende Vorgaben müssen zusammenpassen." },
  { id: "unterscheiden", question: "Warum werden Stöbern und Vorstehen im Kompass getrennt?", options: ["Weil es sich nur um verschiedene Fellfarben handelt.", "Weil ein Stöberhund automatisch alle Vorstehaufgaben beherrscht.", "Weil Suchen und Bewegen von Wild in Deckung eine andere Aufgabe ist als das Anzeigen von Wildwitterung durch Stehen."], answer: 2, explain: "Die Arbeitsweise bestimmt das Ausbildungsziel. Stöberhunde sollen in Deckung suchen und Wild in Bewegung bringen; Vorstehhunde zeigen Wildwitterung durch Stehen an. Einige Rassen arbeiten vielseitig, aber eine Aufgabe beweist nicht automatisch die andere." },
];
