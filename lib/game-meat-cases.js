// Eigene Übungsfälle. Fachgrundlagen zuletzt geprüft am 04.10.2026.
export const gameMeatSources = {
  process: { title: "BfR: Lebensmittelsicherheit Wildbret", url: "https://www.bfr.bund.de/presse/infografiken/lebensmittelsicherheit-wildbret/" },
  spoilage: { title: "BfR: Fragen und Antworten zu verdorbenem Fleisch", url: "https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch/" },
  cold: { title: "BfR: Korrektes Kühlen von Lebensmitteln", url: "https://www.bfr.bund.de/fragen-und-antworten/thema/korrektes-kuehlen-von-lebensmitteln-im-privathaushalt/" },
  hepatitis: { title: "BfR: Hepatitis E und Lebensmittel aus Wild- und Hausschweinen", url: "https://www.bfr.bund.de/en/service/frequently-asked-questions/topic/hepatitis-e-virus-avoiding-transmission-via-domestic-pigs-and-wild-boars-and-food-derived-from-them/" },
  raw: { title: "AGES: VTEC in Rohwürsten aus Wildfleisch", url: "https://www.ages.at/mensch/schwerpunkte/schwerpunktaktionen/detail/vtec-in-rohwuersten-aus-mit-wildfleisch" },
  inspection: { title: "BLV: Schlachtung, Fleischkontrolle und Jagdwild", url: "https://www.blv.admin.ch/de/schlachtung" },
  parasites: { title: "BfR: Fachgespräch Wildbrethygiene – Trichinen und Tiefgefrieren", url: "https://www.bfr.bund.de/cm/343/fachgespraech-wildbrethygiene-am-20-maerz-2013.pdf" },
};
const choice = (text, explanation) => ({ text, explanation });
const item = (id, title, topic, situation, question, choices, answer, takeaway, checklist, sourceKeys) => ({ id, title, topic, situation, question, choices, answer, takeaway, checklist, sources: sourceKeys.map(key => gameMeatSources[key]), course: "wissen-vertiefung-wildbret-hygienekette" });
export const gameMeatCases = [
  item("saubere-wege", "Vom unreinen zum sauberen Arbeitsschritt", "Prozesshygiene", "Nach einem unreinen Arbeitsschritt soll mit demselben Messer auf einer vorbereiteten sauberen Fläche weitergearbeitet werden. Die Fläche ist frei, das Werkzeug wurde noch nicht gereinigt.", "Welche Vorbereitung ist entscheidend?", [
    choice("Werkzeug und Hände hygienisch vorbereiten; unreine und saubere Arbeiten trennen.", "Verunreinigungen können über Hände, Werkzeuge und Flächen weitergetragen werden. Ein geordneter Wechsel unterbricht diesen Weg."),
    choice("Das Messer kurz trocken abwischen und sofort weitermachen.", "Trockenes Abwischen ist kein verlässlich vollständiger Hygieneschritt. Der konkrete Reinigungsablauf und die Trennung der Arbeiten bleiben erforderlich."),
    choice("Nur die Fleischfarbe prüfen.", "Die Farbe des Fleisches sagt nichts darüber aus, ob Werkzeug und Hände gerade Keime übertragen."),
  ], 0, "Ein sauberer Arbeitsplatz braucht auch einen sauberen Arbeitsweg.", ["Unreine Arbeit und saubere Weiterverarbeitung räumlich oder zeitlich trennen.", "Geeignete Hand- und Werkzeughygiene durchführen.", "Saubere Teile vor erneuter Verunreinigung schützen."], ["process"]),
  item("kuehlung-ausfall", "Kühlung über Nacht ausgefallen", "Kühlkette", "Der Kühler war mehrere Stunden außer Betrieb. Es gibt keine vollständige Temperaturaufzeichnung. Das Wildbret riecht noch unauffällig.", "Wie wird der unbekannte Verlauf eingeordnet?", [
    choice("Unauffälliger Geruch beweist, dass alles sicher ist.", "Geruch erfasst weder alle Krankheitserreger noch den unbekannten Temperaturverlauf."),
    choice("Die Unterbrechung dokumentieren, Ware getrennt halten und fachlich klären; keine eigene Freigabe aus dem Geruch ableiten.", "Zeit und Temperatur beeinflussen die Keimvermehrung. Die fehlenden Daten werden als Unsicherheit behandelt und nicht durch einen Sinneseindruck ersetzt."),
    choice("Schnell einfrieren; damit sind alle früheren Risiken beseitigt.", "Einfrieren macht eine unklare vorherige Behandlung nicht rückgängig und ist keine allgemeine Entkeimung."),
  ], 1, "Ein guter Geruch ersetzt keinen geklärten Kühlverlauf.", ["Bekannte Ausfallzeit und Messwerte sichern.", "Betroffene Ware identifizierbar getrennt halten.", "Zuständige fachliche Beurteilung vor weiterer Abgabe einholen."], ["spoilage", "cold"]),
  item("kennzeichnung", "Zwei Stücke, eine lose Notiz", "Rückverfolgbarkeit", "Zwei Wildkörper hängen nebeneinander. Eine lose Notiz nennt Zeitpunkt und Fundort, lässt sich aber nicht eindeutig einem Stück zuordnen.", "Was muss vor der Übergabe geklärt werden?", [
    choice("Es genügt, dass beide Stücke aus demselben Revier stammen.", "Auch innerhalb eines Reviers muss die Zuordnung einzelner Stücke und ihrer Informationen verlässlich bleiben."),
    choice("Die größere Körpermasse macht die Zuordnung ausreichend sicher.", "Eine ungeprüfte Vermutung über Größe ist keine belastbare Identifikation."),
    choice("Eindeutige Identität, Angaben und gegebenenfalls Probenzuordnung herstellen; ungeklärte Ware nicht einfach weitergeben.", "Die Dokumentation muss zum jeweiligen Stück gehören. Vorgeschriebene Kennzeichnung und Untersuchungswege werden nach dem konkreten Abgabeweg geklärt."),
  ], 2, "Jede Information muss eindeutig zum richtigen Stück gehören.", ["Identität und Herkunft zuordnen.", "Zeitpunkte, Auffälligkeiten und Übergabe nachvollziehbar festhalten.", "Erforderliche Untersuchung und Dokumente mit der örtlich zuständigen Stelle klären."], ["process", "inspection"]),
  item("trichinen", "Einfrieren statt Untersuchung?", "Untersuchungsstatus", "Bei einem Wildschwein steht eine erforderliche Untersuchung noch aus. Jemand schlägt vor, das Fleisch stattdessen tiefzufrieren.", "Welche Aussage ist richtig?", [
    choice("Tiefgefrieren ist kein Ersatz für eine erforderliche Trichinenuntersuchung.", "Bei Wild können kälteresistente Trichinellen vorkommen. Einfrieren ist daher keine verlässliche Alternative zur vorgeschriebenen Untersuchung."),
    choice("Jeder Haushaltstiefkühler tötet sämtliche Trichinen sicher ab.", "Diese pauschale Annahme trifft für Wildfleisch nicht zu."),
    choice("Wenn das Stück gesund aussah, ist keine Untersuchung nötig.", "Unauffälliges Aussehen schließt Parasiten nicht aus und hebt eine Untersuchungspflicht nicht auf."),
  ], 0, "Lagerung und Untersuchungsnachweis sind unterschiedliche Dinge.", ["Untersuchungsstatus sichtbar kennzeichnen.", "Stück und Probe eindeutig zuordnen.", "Erforderliche Untersuchung und Freigabe nach örtlichen Vorgaben abwarten."], ["parasites", "inspection"]),
  item("kreuzkontamination", "Salat neben rohem Wildbret", "Küchenhygiene", "Auf einem Brett wurde rohes Wildbret geschnitten. Danach soll darauf Salat für den direkten Verzehr vorbereitet werden.", "Wie wird eine Übertragung vermieden?", [
    choice("Salat zuletzt schneiden; die Reihenfolge allein reicht.", "Gerade der rohe Salat wird nicht mehr erhitzt. Die Reihenfolge ohne Reinigung unterbricht keinen Übertragungsweg."),
    choice("Getrennte saubere Utensilien verwenden oder vor dem Wechsel gründlich reinigen; Hände ebenfalls reinigen.", "Rohe und verzehrfertige Lebensmittel erhalten getrennte Arbeitswege. Damit wird die Übertragung über Brett, Messer und Hände vermindert."),
    choice("Das Brett nur umdrehen.", "Auch Hände, Messer und gegebenenfalls die Unterseite oder Arbeitsfläche können verunreinigt sein."),
  ], 1, "Rohe und verzehrfertige Lebensmittel brauchen getrennte saubere Wege.", ["Rohes Fleisch von verzehrfertigen Speisen trennen.", "Hände und Geräte nach Kontakt reinigen.", "Austretende Flüssigkeit nicht an andere Lebensmittel gelangen lassen."], ["process", "cold"]),
  item("auftauen", "Gefrorenes Fleisch auf der Arbeitsplatte", "Lagerung", "Eine Packung Wildbret soll bis zum Abend auftauen. Zur Auswahl stehen die warme Arbeitsplatte und ein geeigneter Auffangbehälter im Kühlschrank.", "Welcher Ablauf passt?", [
    choice("Bei Raumtemperatur auftauen und Auftauflüssigkeit für die Sauce aufheben.", "Die wärmere Umgebung begünstigt Keimvermehrung. Auftauflüssigkeit kann Keime weitertragen."),
    choice("In warmes Wasser legen; damit ist die Oberfläche gleichzeitig gereinigt.", "Wärme und Wasser ersetzen keine sichere Auftau- und Hygieneführung."),
    choice("Im Kühlschrank auftauen, Auftauflüssigkeit auffangen und Kontakt mit anderen Lebensmitteln vermeiden.", "Der gekühlte Ablauf vermindert Keimvermehrung und ein Auffangbehälter unterbricht den Weg zu anderen Lebensmitteln."),
  ], 2, "Auch beim Auftauen bleibt die Kühl- und Hygieneführung wichtig.", ["Ausreichend Auftauzeit im Kühlschrank einplanen.", "Geeigneten Behälter getrennt von verzehrfertigen Speisen nutzen.", "Auftauflüssigkeit entsorgen und Kontaktflächen reinigen."], ["cold"]),
  item("hepatitis", "Unauffällige Wildschweinleber", "Biologische Risiken", "Eine Wildschweinleber wirkt äußerlich unauffällig. Sie soll roh gekostet werden, um die Qualität zu beurteilen.", "Welche Entscheidung ist sachlich begründet?", [
    choice("Nicht roh kosten; Aussehen schließt Hepatitis-E-Viren nicht aus.", "Wildschweine können das Virus tragen. Ein optisch normaler Eindruck ist kein Virennachweis; sichere Behandlung und vollständiges Erhitzen sind wichtig."),
    choice("Ein sehr kleines rohes Stück ist immer ungefährlich.", "Eine kleine Probiermenge ist kein verlässlicher Schutz vor infektiösen Erregern."),
    choice("Kurzes Anbraten der Oberfläche reicht unabhängig von der Dicke.", "Eine gebräunte Oberfläche belegt keine ausreichende Behandlung im gesamten Lebensmittel."),
  ], 0, "Keine rohe Geschmacksprobe zur Sicherheitsbeurteilung.", ["Rohes Fleisch und Innereien nicht kosten.", "Durchgehende Küchenhygiene beachten.", "Ausreichende Erhitzung im gesamten Lebensmittel erreichen; besonders empfindliche Personen schützen."], ["hepatitis"]),
  item("rohwuersste", "Rohwurst für alle Gäste?", "Biologische Risiken", "Für ein Buffet gibt es nicht erhitzte Rohwurst aus Wildfleisch. Unter den Gästen sind eine Schwangere und ein Mensch mit geschwächtem Immunsystem.", "Welche Planung ist sinnvoll?", [
    choice("Lange Reifung macht jede Rohwurst für alle Personen sicher.", "Eine pauschale Sicherheit ergibt sich daraus nicht; Rohwürste können Krankheitserreger enthalten."),
    choice("Eine geeignete vollständig erhitzte Alternative anbieten und die Rohwurst nicht als risikofrei empfehlen.", "Besonders empfindliche Personen brauchen eine passende Auswahl. Der rohe Produktcharakter und die verbleibenden Risiken werden berücksichtigt."),
    choice("Nur den Geruch prüfen und danach allen das Gleiche anbieten.", "Geruch kann vorhandene Erreger nicht zuverlässig ausschließen."),
  ], 1, "Die Zielgruppe gehört zur Planung der Lebensmittelsicherheit.", ["Empfindliche Personen bei der Menüplanung berücksichtigen.", "Rohe Produkte klar erkennen und geeignete Alternativen anbieten.", "Lager- und Hygienebedingungen auch beim Buffet einhalten."], ["raw", "process"]),
  item("messung", "Kühle Luft, noch warmer Wildkörper", "Kühlkette", "Die Anzeige im Kühlraum zeigt eine niedrige Lufttemperatur. Ein frisch eingebrachter großer Wildkörper hat jedoch noch Wärme gespeichert.", "Was lässt sich aus der Anzeige ableiten?", [
    choice("Alle Stellen des Wildkörpers haben sofort die Lufttemperatur.", "Wärme wird erst mit der Zeit abgeführt. Raumluft und Produktzustand sind verschiedene Größen."),
    choice("Bei niedriger Lufttemperatur ist die Lageranordnung unwichtig.", "Luftzirkulation, Beladung und Abstand beeinflussen den Kühlprozess."),
    choice("Die Anzeige beschreibt die Luft; der tatsächliche Kühlprozess des Stücks muss gesondert kontrolliert werden.", "Ein nachvollziehbarer Prozess berücksichtigt Zeit, geeignete Messung und Luftzirkulation. Eine einzelne Luftanzeige beweist keine sofortige vollständige Durchkühlung."),
  ], 2, "Kühlluft und Temperatur im Produkt nicht gleichsetzen.", ["Kühlung ohne unnötige Verzögerung beginnen.", "Beladung und Luftzirkulation geeignet organisieren.", "Messung hygienisch nach dem fachlich festgelegten Kontrollplan durchführen."], ["cold", "process"]),
  item("auffaelligkeiten", "Ungewöhnlicher Befund bei der Versorgung", "Fachliche Klärung", "Beim Versorgen fallen deutliche Veränderungen an einem Organ auf. Ein Foto wird in einer Chatgruppe als angeblich harmlos bezeichnet.", "Wie wird der Befund behandelt?", [
    choice("Befund und Stückzuordnung sichern, weitere Verwendung zurückstellen und die zuständige fachliche Stelle einbeziehen.", "Ein Foto und eine fremde Vermutung ersetzen keine zuständige Beurteilung. Beobachtungen werden sachlich beschrieben und bleiben dem Stück zugeordnet."),
    choice("Den Chat-Kommentar als amtliche Freigabe dokumentieren.", "Ein Kommentar aus einer Chatgruppe ist keine amtliche Entscheidung und keine verlässliche Untersuchung."),
    choice("Nur das veränderte Organ entfernen und den Rest ohne Klärung abgeben.", "Ohne fachliche Einordnung ist nicht geklärt, welche Bedeutung der Befund für das Stück und die weitere Verwendung hat."),
  ], 0, "Befunde beschreiben, Zuständigkeit klären und keine Diagnose erfinden.", ["Stück und Beobachtung eindeutig dokumentieren.", "Erforderliche Teile und Informationen für die Beurteilung sichern.", "Amtliche oder fachlich zuständige Beurteilung nach dem konkreten Fall einholen."], ["inspection", "spoilage"]),
];

export function getGameMeatSummary(cases, answers) {
  const completed = cases.filter(item => Number.isInteger(answers[item.id]));
  return { completed: completed.length, correct: completed.filter(item => answers[item.id] === item.answer).length, wrongIds: completed.filter(item => answers[item.id] !== item.answer).map(item => item.id) };
}
