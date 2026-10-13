import originalPoints from "../public/lernen/bewegung-entwicklung-2026/weissstorch-messpunkte.json";
import originalCountries from "../public/lernen/bewegung-entwicklung-2026/europa-natural-earth.json";

export const wildMovementReviewedOn = "2026-10-13";
export const wildMovementSources = {
  lifetrack: { organization: "Fiedler, Flack und weitere Datenautoren · Movebank Data Repository", title: "LifeTrack White Stork SW Germany (2013–2019)", url: "https://doi.org/10.5441/001/1.ck04mn78", role: "Originaldaten, keine zweite Messung" },
  bto: { organization: "British Trust for Ornithology (BTO)", title: "Bird tracking – a masterclass", url: "https://www.bto.org/learn/about-birds/articles/bird-tracking-masterclass", role: "Unabhängige Erklärung von GPS und ergänzenden Sensoren" },
  gps: { organization: "GPS.gov · US National Coordination Office", title: "GPS Accuracy", url: "https://www.gps.gov/gps-accuracy", role: "Unabhängige Erklärung von Empfänger- und Umgebungseinflüssen" },
  rowcliffe: { organization: "ZSL Institute of Zoology und beteiligte Forschungsinstitutionen", title: "Rowcliffe et al. (2012): Bias in estimating animal travel distance", url: "https://doi.org/10.1111/j.2041-210X.2012.00197.x", role: "Originalarbeit zum Einfluss der Messhäufigkeit; andere Tiere, keine zweite Storchmessung" },
  gunner: { organization: "Swansea University, MPI für Verhaltensbiologie und beteiligte Forschungsinstitutionen", title: "Gunner et al. (2026): High resolution data reveal fundamental steps and turns", url: "https://doi.org/10.1002/ecm.70069", role: "Eigenständige Originalarbeit zu Messauflösung und Bewegungspfaden" },
  naturalEarth: { organization: "Natural Earth · Tom Patterson, Nathaniel Vaughn Kelso und Mitwirkende", title: "Länderumrisse 1:110 Mio., Version 5.1.2 · Public domain", url: "https://www.naturalearthdata.com/about/terms-of-use/", role: "Vereinfachte Kartengrundlage, keine Messdaten" },
};

export const movementMapCountries = originalCountries;
export const wildMovementDatasets = [{
  id: "weissstorch-olea-2014", title: "Weißstorch: echte Messpunkte einer Zugphase", species: "Weißstorch", latin: "Ciconia ciconia", category: "natur-revier", region: "Forschungsprojekt Südwestdeutschland · Messungen in Deutschland, Schweiz, Frankreich und Spanien", reviewedOn: wildMovementReviewedOn,
  description: "Ein historischer Ausschnitt aus dem Forschungsprojekt LifeTrack. Erkunde die zeitliche Folge tatsächlich veröffentlichter GPS-Messungen eines einzelnen Vogels – ohne erfundene Fluglinie.",
  animalIdentifier: "Olea + / DER AN868 (eobs 3644)", shortName: "Olea", observedPeriod: "23. August bis 4. September 2014", publicationState: "Datensatz veröffentlicht am 23. Juli 2019, Datenpaket bis 31. März 2019; hier ausschließlich der benannte Ausschnitt von 2014.",
  unit: "Geografische Länge/Breite in Dezimalgrad, Bezugssystem WGS84", timeBasis: "Zeitstempel unverändert aus der Datei. Das README nennt UTC oder GPS-Zeit, mit wenigen Sekunden Unterschied; keine lokale Uhrzeit.",
  producer: "Fiedler W., Flack A., Schäfle W., Keeves B., Quetting M., Eid B., Schmid H., Wikelski M. (2019)", license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  points: originalPoints,
  sampling: "Aus 65.998 passenden Originalereignissen wurden 52 bestehende Messungen gewählt: je veröffentlichtem Kalendertag die nächste gültige Messung zu 00/06/12/18 Uhr, höchstens drei Stunden entfernt. Sichtbar TRUE, Sensor GPS, Status A und gültige Koordinaten. Kein Tagesmittel und keine interpolierte Position. Die genaue Auswahl ist als Datei dokumentiert.",
  facts: [
    { id: "gps-location", title: "Ortung ist eine Schätzung", text: "GPS bestimmt Positionen aus Satellitensignalen. Empfänger, Satellitengeometrie und Umgebung beeinflussen die Genauigkeit. Die im Ausschnitt gespeicherte horizontale Genauigkeitsschätzung ist eine Geräteangabe, kein nachträglich vermessener wahrer Fehler.", sourceIds: ["bto", "gps", "lifetrack"] },
    { id: "sampling-resolution", title: "Weniger Messungen zeigen weniger Einzelheiten", text: "Wechsle von vier ausgewählten Messungen je Tag auf eine. Beides sind Originalpunkte, aber die dünnere Auswahl lässt weitere Bewegungen zwischen den Orten offen. Ein vollständiger Weg oder eine genaue geflogene Strecke lässt sich daraus nicht ablesen.", sourceIds: ["rowcliffe", "gunner"] },
    { id: "behaviour-limit", title: "Ort ist nicht automatisch Verhalten", text: "Ein Messpunkt dokumentiert eine geschätzte Position. Ob der Vogel dort fraß, ruhte oder nach Nahrung suchte, ist daraus allein nicht gesichert. Verhaltensuntersuchungen nutzen zusätzliche Sensoren, Beobachtungen oder geprüfte Modelle.", sourceIds: ["bto", "gunner"] },
  ],
  boundaries: ["Ein Vogel und ein ausgewählter Zeitraum sind keine Karte aller Weißstörche und kein allgemeiner Zugkalender.", "Die Darstellung zeigt historische veröffentlichte Daten, keine heutigen Aufenthaltsorte.", "Punkte werden nicht verbunden: Zwischen ihnen können Umwege und zeitliche Lücken liegen. Es wird keine Gesamtstrecke berechnet.", "Die stark vereinfachten Länderumrisse dienen der Orientierung. Sie zeigen weder Lebensräume noch rechtlich oder zur Navigation verwendbare Grenzen.", "Originaldaten und methodische Fachquellen sind getrennt: Die anderen Quellen haben diese Storchmessungen nicht unabhängig wiederholt."],
  question: { prompt: "Was lässt sich aus zwei zeitlich getrennten Punkten sicher lesen?", choices: ["Der Vogel flog geradlinig zwischen ihnen.", "Die Datei enthält zwei geschätzte Positionen mit ihren Zeitstempeln.", "Der Vogel fraß an beiden Orten dieselbe Nahrung."], answer: 1, explanation: "Messpunkte und Zeitstempel stammen aus der Originaldatei. Weg und Verhalten zwischen ihnen wurden in dieser Ansicht nicht erfasst oder rekonstruiert.", sourceIds: ["rowcliffe", "gunner", "bto"] },
  aliases: ["Storch", "Weißstorch", "Weissstorch", "GPS", "Telemetrie", "Zug", "Vogelzug", "Bewegungskarte", "Olea", "Messhäufigkeit", "Satellitenortung"],
}];

export function getWildMovementDataset(id) {
  return wildMovementDatasets.find(dataset => dataset.id === id) || wildMovementDatasets[0];
}
export function selectMovementPoints(dataset, sampling = "four") {
  if (!dataset || !Array.isArray(dataset.points)) return [];
  return sampling === "daily" ? dataset.points.filter(point => point.targetHour === 12) : dataset.points;
}
export function nearestMovementPointIndex(points, timestamp) {
  if (!Array.isArray(points) || points.length === 0) return 0;
  const time = Date.parse(String(timestamp).replace(" ", "T") + "Z");
  if (!Number.isFinite(time)) return 0;
  let nearest = 0, difference = Infinity;
  points.forEach((point, index) => {
    const pointTime = Date.parse(String(point.timestamp).replace(" ", "T") + "Z");
    const gap = Math.abs(pointTime - time);
    if (gap < difference) { nearest = index; difference = gap; }
  });
  return nearest;
}
export function formatMovementTimestamp(timestamp) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(String(timestamp || ""));
  return match ? `${match[3]}.${match[2]}.${match[1]} · ${match[4]}:${match[5]}:${match[6]}` : "Zeitstempel fehlt";
}
const radians = degree => degree * Math.PI / 180;
const mercatorY = latitude => Math.log(Math.tan(Math.PI / 4 + radians(Math.max(-85, Math.min(85, latitude))) / 2));
export function projectMovementPoint(longitude, latitude, width = 760, height = 490) {
  // Stable overview, Mercator, preserves uniform x/y scale. No data positions rounded.
  const extent = { west: -3.0, east: 11.5, south: 38.5, north: 50.5 };
  const left = radians(extent.west), right = radians(extent.east), top = mercatorY(extent.north), bottom = mercatorY(extent.south);
  const scale = Math.min((width - 72) / (right - left), (height - 56) / (top - bottom));
  const offsetX = (width - (right - left) * scale) / 2, offsetY = (height - (top - bottom) * scale) / 2;
  return { x: offsetX + (radians(longitude) - left) * scale, y: offsetY + (top - mercatorY(latitude)) * scale };
}
export function movementCountryPaths(geometry, width = 760, height = 490) {
  const polygons = geometry?.type === "Polygon" ? [geometry.coordinates] : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
  return polygons.map(polygon => polygon.map(ring => ring.map(([longitude, latitude], index) => { const point = projectMovementPoint(longitude, latitude, width, height); return `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`; }).join(" ") + " Z").join(" "));
}
export const wildMovementSearchEntries = wildMovementDatasets.map(dataset => ({ id: `bewegung:${dataset.id}`, type: "entry", title: dataset.title, description: dataset.description, href: `/lernen/forschung-verstehen?datensatz=${dataset.id}#wildbewegung`, categories: ["natur-revier", "wildkunde"], aliases: dataset.aliases, text: [dataset.species, dataset.region, dataset.observedPeriod, ...dataset.facts.map(fact => fact.text)].join(" ") }));
export const wildMovementAssetPaths = ["/lernen/bewegung-entwicklung-2026/weissstorch-messpunkte.json", "/lernen/bewegung-entwicklung-2026/weissstorch-originalausschnitt.csv", "/lernen/bewegung-entwicklung-2026/bewegungsdaten-nachweis.json", "/lernen/bewegung-entwicklung-2026/lifetrack-original-readme.txt", "/lernen/bewegung-entwicklung-2026/lifetrack-original-reference.csv", "/lernen/bewegung-entwicklung-2026/lifetrack-original-metadata.json", "/lernen/bewegung-entwicklung-2026/europa-natural-earth.json"];
