const skullSource = "https://3d.si.edu/object/3d/white-tailed-deer-skull-and-mandible:fcc69841-d8be-4103-be0f-143e374c9ce6";
const forelimbSource = "https://3d.si.edu/object/3d/white-tailed-deer-forelimb:9395b925-4132-468c-a974-745abec177b4";

export const anatomySources = [
  { title: "Smithsonian: How to Read a Mammal Skull", url: "https://naturalhistory.si.edu/education/teaching-resources/featured-collections/how-read-mammal-skull" },
  { title: "Arizona-Sonora Desert Museum: Säugetierschädel und Gebisse", url: "https://www.desertmuseum.org/fileexchange/fileexchange/skulls.pdf" },
  { title: "Smithsonian: Sammlung EO404749, Schädel und Vorderlauf-Abgüsse", url: skullSource },
];

export const anatomyModels = [
  { id: "schaedel", title: "Schädel", src: "/lernen/anatomie/weisswedelhirsch-schaedel.glb", source: skullSource, size: "3,3 MB", scientificName: "Odocoileus virginianus", description: "Ein echter Museumsscan eines Schädel-Abgusses des nordamerikanischen Weißwedelhirsches. Der Unterkiefer ist hier abgenommen.", features: [
    { id: "augenhoehle", title: "Augenhöhlen", orbit: "70deg 75deg 105%", explanation: "Die seitlich liegenden Augenhöhlen sind gut zu erkennen. Ihre Lage gehört zum Bauplan des Schädels; ein Blick auf den Knochen zeigt jedoch nicht die tatsächliche Sehschärfe des lebenden Tieres." },
    { id: "mahlzaehne", title: "Backenzähne", orbit: "-70deg 110deg 85%", explanation: "Die Backenzahnreihen liegen im hinteren Kieferabschnitt. Ihre Kauflächen dienen der Zerkleinerung pflanzlicher Nahrung. Drehe den Schädel von unten, um beide Reihen zu vergleichen." },
    { id: "nasenraum", title: "Nasenraum", orbit: "180deg 80deg 100%", explanation: "Vorn befindet sich der langgestreckte Nasenbereich. Im lebenden Tier gehören dazu auch Schleimhäute und andere Weichteile, die in diesem Knochen-Abguss nicht dargestellt werden." },
  ] },
  { id: "unterkiefer", title: "Unterkiefer", src: "/lernen/anatomie/weisswedelhirsch-unterkiefer.glb", source: skullSource, size: "3,2 MB", scientificName: "Odocoileus virginianus", description: "Der Unterkiefer ist als eigener Scan verfügbar. So lassen sich Vordergebiss, Zahnlücke und Backenzähne von mehreren Seiten untersuchen.", features: [
    { id: "vordergebiss", title: "Vordergebiss", orbit: "180deg 70deg 85%", explanation: "Das Vordergebiss sitzt am vorderen Ende des Unterkiefers. Beim Weißwedelhirsch arbeitet es bei der Nahrungsaufnahme gegen eine obere Dentalplatte; diese Weichteilstruktur ist im Schädel-Abguss nicht vorhanden." },
    { id: "diastema", title: "Zahnlücke – Diastema", orbit: "70deg 80deg 85%", explanation: "Zwischen Vordergebiss und Backenzähnen liegt ein zahnfreier Abschnitt. Diese Zahnlücke heißt Diastema. Sie ist ein Strukturmerkmal und keine automatisch krankhafte Lücke." },
    { id: "kieferast", title: "Aufsteigender Kieferast", orbit: "-70deg 80deg 100%", explanation: "Hinten steigt der Unterkiefer an. Dort liegen Gelenk- und Muskelansatzbereiche. Die Form erlaubt die Betrachtung des Knochens; Muskeln und Gelenkknorpel zeigt dieser Scan nicht." },
  ] },
  { id: "vorderlauf", title: "Vorderlauf", src: "/lernen/anatomie/weisswedelhirsch-vorderlauf.glb", source: forelimbSource, size: "3,6 MB", orientation: "0deg 90deg 0deg", scientificName: "Odocoileus virginianus", description: "Ein Museumsscan von Vorderlauf-Abgüssen. Die Teile sind für die Lehrsammlung angeordnet; ihre Abstände entsprechen keiner Gelenkbewegung am lebenden Tier.", features: [
    { id: "knochengliederung", title: "Gliederung erkennen", orbit: "0deg 70deg 110%", explanation: "Vergleiche die längeren Knochenabschnitte mit den kleineren Elementen an den Enden. Knochen, Gelenke und Muskeln wirken zusammen; hier siehst du ausschließlich den knöchernen Anteil eines Lehrmodells." },
    { id: "gelenkflaechen", title: "Gelenkflächen", orbit: "80deg 70deg 85%", explanation: "An Knochenenden lassen sich unterschiedliche Gelenkflächen betrachten. Bewegungsumfang und Belastbarkeit sind daraus ohne Weichteile und fachliche Untersuchung nicht zuverlässig abzulesen." },
    { id: "massstab", title: "Maßstab kritisch prüfen", orbit: "-90deg 70deg 110%", explanation: "Die Sammlung weist darauf hin, dass Schädel und Vorderlauf aus verschiedenen Exemplaren stammen können und nicht maßstabsgleich sind. Vergleiche daher keine scheinbaren Größen zwischen den drei Ansichten." },
  ] },
];

export const anatomyQuestions = [
  { id: "art", modelId: "schaedel", question: "Welche Tierart zeigen die drei Museumsscans?", choices: ["Europäisches Reh", "Nordamerikanischer Weißwedelhirsch", "Europäischer Rothirsch"], answer: 1, explanation: "Die Sammlung benennt Odocoileus virginianus, den Weißwedelhirsch. Er gehört zur Familie der Hirsche. Ein Vergleich erklärt Strukturen, ersetzt aber keine artgenaue Bestimmung heimischer Schädel." },
  { id: "auge", modelId: "schaedel", question: "Was lässt sich am Schädel direkt erkennen?", choices: ["Die Lage der Augenhöhlen", "Die exakte Sehschärfe", "Die Augenfarbe"], answer: 0, explanation: "Die knöchernen Augenhöhlen sind Bestandteil des Scans. Sehschärfe und Augenfarbe sind Eigenschaften des lebenden Tieres und lassen sich hier nicht direkt feststellen." },
  { id: "luecke", modelId: "unterkiefer", question: "Wie heißt der zahnfreie Abschnitt zwischen Vordergebiss und Backenzähnen?", choices: ["Rosenstock", "Diastema", "Gehörgang"], answer: 1, explanation: "Diastema bezeichnet die Zahnlücke. Bei diesem Pflanzenfresser ist sie Teil des normalen Gebissbaus. Sie allein ist kein Nachweis eines Zahnverlusts." },
  { id: "weichteil", modelId: "unterkiefer", question: "Welche Grenze hat der Knochen-Abguss?", choices: ["Er zeigt automatisch alle inneren Organe", "Er zeigt Muskeln und Knorpel vollständig", "Weichteile werden nicht vollständig dargestellt"], answer: 2, explanation: "Ein Knochen-Abguss bildet knöcherne Strukturen ab. Dentalplatte, Muskeln, Knorpel und Schleimhäute des lebenden Tieres sind hier nicht vollständig vorhanden." },
  { id: "groessen", modelId: "vorderlauf", question: "Darfst du Schädel und Vorderlauf am Bildschirm als maßstabsgleich vergleichen?", choices: ["Ja, die Bildschirmgröße ist ein Körpermaß", "Nein, die Sammlung weist auf unterschiedliche Exemplare und Maßstäbe hin", "Ja, wenn beide auf demselben Handy erscheinen"], answer: 1, explanation: "Die Sammlungsangaben warnen ausdrücklich vor dem Größenvergleich. Ein Viewer passt jedes Modell an sein Fenster an; dadurch wird es zusätzlich optisch ähnlich groß." },
  { id: "scan", modelId: "vorderlauf", question: "Was bildet dieses Modell ab?", choices: ["Eine künstlich erdachte Anatomie", "Einen vollständigen lebenden Weißwedelhirsch", "Einen Scan von Abgüssen aus einer Museums-Lehrsammlung"], answer: 2, explanation: "Es sind reale digitalisierte Lehrsammlungs-Abgüsse des Smithsonian. Die digitale Ansicht ist drehbar, rekonstruiert aber keine fehlenden Weichteile oder Bewegung." },
];

export const anatomyAssetPaths = anatomyModels.map(model => model.src).concat("/lernen/anatomie/model-viewer-4.1.0.min.js", "/lernen/anatomie/MODEL-VIEWER-LICENSE.txt", "/lernen/anatomie/MODEL-VIEWER-NOTICES.txt");
