import originalData from "../public/lernen/forschung-2026/originaldaten.json";

export const researchReviewedOn = "2026-10-12";
export const researchSources = {
  dwd: { organization: "Deutscher Wetterdienst", role: "Originaldaten", title: "CDC: Jahresmittel der Lufttemperatur, Gebietsmittel Deutschland", url: "https://opendata.dwd.de/climate_environment/CDC/regional_averages_DE/annual/air_temperature_mean/regional_averages_tm_year.txt" },
  dwdLicense: { organization: "Deutscher Wetterdienst", role: "Nutzungslizenz", title: "CDC-OpenData: CC BY 4.0", url: "https://opendata.dwd.de/climate_environment/CDC/Nutzungsbedingungen_German.pdf" },
  geosphere: { organization: "GeoSphere Austria", role: "Unabhängige fachliche Einordnung", title: "Wetter und Klima: Zeitskalen und statistische Betrachtung", url: "https://klimaportal.geosphere.at/informationsportal-klimawandel/wetter-und-klima.html" },
  boku2022: { organization: "Universität für Bodenkultur Wien (BOKU)", role: "Originalbilanz", title: "Waldbrand-Jahresrückblick 2022, Stand 12.01.2023", url: "https://fireblog.boku.ac.at/2023/01/12/jahresrueckblick-2022/" },
  boku2024: { organization: "Universität für Bodenkultur Wien (BOKU)", role: "Originalbilanz", title: "Waldbrand-Jahresrückblick 2024, veröffentlicht 10.01.2025", url: "https://fireblog.boku.ac.at/2025/01/10/jahresrueckblick-2024/" },
  boku2025: { organization: "Universität für Bodenkultur Wien (BOKU)", role: "Originalbilanz", title: "Waldbrand-Jahresrückblick 2025, Stand 05.01.2026", url: "https://fireblog.boku.ac.at/2026/01/05/jahresrueckblick-2025/" },
  bfw: { organization: "Bundesforschungszentrum für Wald (BFW)", role: "Unabhängige fachliche Einordnung", title: "Light my Fire: Feuchtigkeit, Brennmaterial, Gelände und Wind", url: "https://www.waldwissen.net/de/waldwirtschaft/schadensmanagement/waldbrand/light-my-fire" },
  bafu: { organization: "Bundesamt für Umwelt (BAFU)", role: "Veröffentlichte Daten und Methodenbeschreibung", title: "Swiss Bird Index: Vergleich der Dreijahresmittel, Stand 19.06.2026", url: "https://www.indikatoren.admin.ch/public/v2/detail?ind=BD138&lng=de" },
  vogelwarte: { organization: "Schweizerische Vogelwarte Sempach", role: "Datenproduzent und Methodenbeschreibung", title: "Swiss Bird Index SBI: Bestandsindices und Artengruppen", url: "https://www.vogelwarte.ch/de/projekte/swiss-bird-index-sbi/" },
  vogelwarteReport: { organization: "Schweizerische Vogelwarte Sempach", role: "Methodische Erläuterung", title: "Vogelmonitoring 2024: Brutbestandstrends, Seite 7", url: "https://www.vogelwarte.ch/wp-content/uploads/2025/05/Vogelmonitoring-2024.pdf" },
  bfnIndex: { organization: "Bundesamt für Naturschutz", role: "Unabhängiger Methodenvergleich (Deutschland)", title: "Artenvielfalt und Landschaftsqualität: Bestandsindices aus ausgewählten Vogelarten", url: "https://www.bfn.de/indikator-artenvielfalt-und-landschaftsqualitaet" },
};

export const researchDatasets = [
  {
    id: "temperatur", title: "Temperatur: ein Jahr ist noch kein Klima", region: "Deutschland", category: "natur-revier", aliases: ["Wetter", "DWD", "Jahresmittel", "Lufttemperatur"],
    description: "Elf veröffentlichte Jahresmittel vergleichen und zwischen Gebietsmittel, Jahreswitterung und langfristigem Klima unterscheiden.",
    producer: "Deutscher Wetterdienst (DWD)", unit: "°C", decimals: 2, scaleMax: 12,
    observedPeriod: "2015–2025", publicationState: "DWD-Datei erstellt am 02.10.2026; abgerufen am 12.10.2026",
    points: originalData.temperature.points, periods: [{ id: "all", title: "2015–2025", from: 2015 }, { id: "recent", title: "2020–2025", from: 2020 }],
    sourceIds: ["dwd", "geosphere", "dwdLicense"], originalSourceIds: ["dwd"],
    method: "Die Werte stammen unverändert aus der Spalte Deutschland der DWD-Gebietsmittel. Es sind mittlere Lufttemperaturen eines gesamten Jahres und eines großen Gebiets, keine Temperaturen eines bestimmten Waldstücks. Die eigene Balkengrafik zeigt nur die übernommenen Jahreswerte; sie berechnet keinen Trend und keine Zukunftsprognose.",
    interpretation: "2024 und 2025 haben unterschiedliche Jahresmittel. Solche Schwankungen sind Teil einer Zeitreihe. Klima wird über längere Zeiträume statistisch beschrieben; eine Auswahl von sechs oder elf Jahren ist keine eigene vollständige Klimabewertung.",
    boundaries: ["Das Deutschlandmittel sagt weder die Temperatur auf deinem Hochsitz noch die Witterung an einem einzelnen Tag voraus.", "Ein wärmeres Jahresmittel beweist weder eine bestimmte Zahl an Insekten noch eine konkrete Veränderung des Wildbestands.", "Die Werte sind ein geprüfter Datenstand. Spätere Korrekturen der Originaldatei werden nicht automatisch übernommen."],
    question: { prompt: "Was lässt sich aus dem Jahresmittel 2025 von 10,03 °C ablesen?", choices: ["Die Temperatur an jedem Tag war 10,03 °C.", "Das veröffentlichte Gebietsmittel für das gesamte Jahr beträgt 10,03 °C.", "Jedes Revier in Deutschland hatte denselben Tagesverlauf."], answer: 1, explanation: "Ein Jahres- und Gebietsmittel fasst viele Messinformationen zusammen. Tageswerte, örtliche Unterschiede und Extreme werden damit nicht gleichgesetzt." },
    provenance: "Originalwerte: DWD, CC BY 4.0. Eigene Auswahl 2015–2025 und eigene grafische Darstellung, keine Zahlenänderung. GeoSphere erläutert die Zeitskalen unabhängig; die österreichische Quelle wiederholt nicht die deutsche Messung.",
  },
  {
    id: "waldbrand", title: "Waldbrände: Anzahl und Fläche auseinanderhalten", region: "Österreich", category: "natur-revier", aliases: ["BOKU", "BFW", "Waldbrandfläche", "Brandstatistik"],
    description: "Dokumentierte Jahresbilanzen lesen und erkennen, warum mehr Brände nicht automatisch eine größere Brandfläche bedeuten.",
    producer: "Waldbrand-Dokumentation der BOKU Wien", unit: "Waldbrände", decimals: 0, scaleMax: 250,
    observedPeriod: "2022–2025", publicationState: "Einzelbilanzen vom 12.01.2023, 10.01.2025 und 05.01.2026",
    points: originalData.forestFires.points, areaComparison: originalData.forestFires.areaComparison,
    periods: [{ id: "all", title: "2022–2025", from: 2022 }, { id: "recent", title: "2024–2025", from: 2024 }],
    sourceIds: ["boku2022", "boku2024", "boku2025", "bfw"], originalSourceIds: ["boku2022", "boku2024", "boku2025"],
    method: "Übernommen wurden dokumentierte Waldbrandzahlen aus einzelnen veröffentlichten Jahresrückblicken. Der Wert 2023 wird im Rückblick 2024 genannt. Die Bilanzen haben verschiedene Stichtage und können durch Nachmeldungen verändert werden. Sie werden hier nicht als vollständig vereinheitlichte oder laufend aktualisierte Datenbank dargestellt.",
    interpretation: "2025 werden mehr Brände als 2024 berichtet. Die ebenfalls veröffentlichten neigungskorrigierten Flächen betragen 2024 142 Hektar und 2025 rund 45 Hektar. Anzahl und Fläche beschreiben unterschiedliche Eigenschaften des Brandgeschehens. Das BFW erläutert, dass unter anderem Feuchtigkeit, Brennmaterial, Gelände und Wind die Ausbreitung beeinflussen.",
    boundaries: ["Die Grafik zeigt dokumentierte Ereignisse, keine Vorhersage der heutigen örtlichen Brandgefahr.", "Vier Bilanzjahre genügen nicht für eine eigenständig abgesicherte Aussage über einen langfristigen Trend.", "Die Fläche 2025 ist als Rundungswert veröffentlicht. Sie darf nicht als auf den Hektar genau vermessene Gesamtfläche ausgegeben werden."],
    question: { prompt: "193 Brände statt 125: Muss 2025 auch mehr Waldfläche betroffen gewesen sein?", choices: ["Nein. Die veröffentlichte Fläche 2025 ist trotz mehr Bränden kleiner als 2024.", "Ja. Die Anzahl legt die Gesamtfläche immer eindeutig fest.", "Ja. Jedes dokumentierte Feuer betrifft dieselbe Fläche."], answer: 0, explanation: "BOKU berichtet 2024 142 Hektar und 2025 rund 45 Hektar neigungskorrigierte Brandfläche. Die Ereigniszahl allein erklärt weder Fläche noch Schwere eines Jahres." },
    provenance: "Kleine Auswahl publizierter Zahlen aus den BOKU-Jahresbilanzen mit Einzelbelegen; eigene Grafik. Kein fremdes Diagramm oder Foto übernommen. BFW erklärt Einflussgrößen unabhängig und führt damit keine zweite Zählung dieser Brände durch.",
  },
  {
    id: "brutvoegel", title: "Brutvögel: ein Index ist keine Tierzählung", region: "Schweiz", category: "wildkunde", aliases: ["Swiss Bird Index", "SBI", "Waldvögel", "Rote Liste", "Vogelmonitoring"],
    description: "Drei veröffentlichte Indexveränderungen vergleichen und Gesamtheit, Teilgruppen und einzelne Vogelarten auseinanderhalten.",
    producer: "Schweizerische Vogelwarte Sempach; veröffentlicht beim BAFU", unit: "% Indexveränderung", decimals: 2, scaleMax: 40,
    observedPeriod: "Mittel 1990–1992 gegenüber Mittel 2023–2025", publicationState: "BAFU-Indikator aktualisiert am 19.06.2026",
    points: originalData.birds.points, periods: [],
    sourceIds: ["bafu", "vogelwarte", "vogelwarteReport", "bfnIndex"], originalSourceIds: ["bafu"],
    method: "Übernommen ist die beim BAFU veröffentlichte prozentuale Veränderung zwischen zwei Dreijahresmitteln des Swiss Bird Index. Der Index wird von der Vogelwarte aus den Bestandsentwicklungen der Arten berechnet. Angezeigt werden drei ausgewählte Gruppen; es sind keine jährlichen Messpunkte und keine Prozente direkt gezählter Einzelvögel.",
    interpretation: "Die angezeigten Veränderungen liegen für regelmäßige Brutvögel, Arten der Roten Liste und Waldvögel unterschiedlich hoch. Ein positiver Gruppenindex bedeutet nicht, dass jede enthaltene Art zunimmt oder dass Gefährdung verschwunden ist. Die Gruppen überschneiden sich und ihre Prozentwerte werden nicht addiert.",
    boundaries: ["Die Prozentzahl ist eine Veränderung eines Bestandsindex, keine zusätzliche Zahl an Brutpaaren und kein Anteil am gesamten Vogelbestand.", "Die zusammengefassten Werte verdecken Unterschiede zwischen Arten; sie bestimmen keinen lokalen Bestand in deinem Revier.", "Aus zwei Dreijahresmitteln wird hier keine jährliche Verlaufslinie erfunden. Die Originalquelle enthält weiterführende Zeitreihen."],
    question: { prompt: "Der Waldvogelindex verändert sich zwischen den Dreijahresmitteln um +31,88 %. Was folgt daraus?", choices: ["Jede Waldvogelart hat exakt 31,88 % mehr Brutpaare.", "31,88 % aller Schweizer Vögel leben im Wald.", "Der zusammengefasste Index der Waldvogelgruppe hat sich entsprechend verändert."], answer: 2, explanation: "Ein Gruppenindex fasst artspezifische Entwicklungen zusammen. Er ist weder eine Prozentverteilung auf Lebensräume noch ein identischer Verlauf jeder einzelnen Art." },
    provenance: "Drei numerische Vergleichswerte aus der BAFU-Indikatortabelle; eigene Balkengrafik. BAFU und Vogelwarte sind verschiedene Organisationen, die Zahlen beruhen jedoch auf demselben Vogelwarte-Monitoring. Das BfN erklärt unabhängig ein deutsches Verfahren zur Zusammenfassung artspezifischer Bestandsentwicklungen; es bestätigt keine Schweizer Messzahl. Die verschiedenen Verfahren und ihre Bezugsgrößen dürfen nicht gleichgesetzt werden.",
  },
].map(dataset => ({ ...dataset, reviewedOn: researchReviewedOn }));

export function getResearchDataset(id) { return researchDatasets.find(dataset => dataset.id === id) || researchDatasets[0]; }
export function selectResearchPoints(dataset, periodId = "all", groupId = "all") {
  if (!dataset) return [];
  const period = dataset.periods.find(item => item.id === periodId) || dataset.periods[0];
  return dataset.points.filter(point => (!period || point.year >= period.from) && (groupId === "all" || point.id === groupId));
}
export function formatResearchValue(dataset, value) {
  return Number.isFinite(value) ? value.toLocaleString("de-DE", { minimumFractionDigits: dataset.decimals, maximumFractionDigits: dataset.decimals }) : "keine Angabe";
}
export const researchAssetPaths = ["/lernen/forschung-2026/originaldaten.json", "/lernen/forschung-2026/dwd-gebietsmittel-2026-10-12.txt"];
export const researchSearchEntries = researchDatasets.map(dataset => ({
  id: `forschung:${dataset.id}`, type: "entry", title: dataset.title, description: dataset.description,
  href: `/lernen/forschung-verstehen?datensatz=${dataset.id}#forschung-inhalt`, categories: ["natur-revier", ...(dataset.category === "wildkunde" ? ["wildkunde"] : [])],
  aliases: dataset.aliases, text: [dataset.region, dataset.method, dataset.interpretation, ...dataset.boundaries].join(" "),
}));
