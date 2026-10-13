import photoRecords from "../public/lernen/forest-floor-2026/bildnachweise.json";

export const forestFloorReviewedOn = "2026-10-13";
export const forestFloorSources = {
  forestMuensterIsopods: { organization: "Universität Münster", title: "Hypersoil: Stellung der Asseln im Tierreich", url: "https://hypersoil.uni-muenster.de/1/03/02.htm" },
  forestMuensterWoodlouseHabitat: { organization: "Universität Münster", title: "Hypersoil: Lebensraum der Landasseln und unterschiedliche Anpassung an Trockenheit", url: "https://hypersoil.uni-muenster.de/1/03/06.htm" },
  forestMuensterWoodlouseFood: { organization: "Universität Münster", title: "Hypersoil: Ernährung der Asseln", url: "https://hypersoil.uni-muenster.de/1/03/05.htm" },
  forestMuensterWoodlouseDecomposition: { organization: "Universität Münster", title: "Hypersoil: Bodenbiologische Bedeutung der Asseln", url: "https://hypersoil.uni-muenster.de/1/03/09.htm" },
  forestMuensterMyriapods: { organization: "Universität Münster", title: "Hypersoil: Tausendfüßer – Doppelfüßer, Hundertfüßer und Streunahrung", url: "https://hypersoil.uni-muenster.de/0/07/04/09.htm" },
  forestSenckenbergSoil: { organization: "Senckenberg Museum für Naturkunde Görlitz", title: "Abenteuer Bodenleben: fachlicher Hintergrund zu Doppelfüßern, Landasseln und Hundertfüßern, Seiten 15, 16 und 18 (2021)", url: "https://vr-bodenleben.senckenberg.de/api/assets/6f30f431-563c-4285-8c61-0a2c6f77fd5d/Handout%20f%C3%BCr%20VR-Betreuung_2021.10_Terminal_NEU.pdf" },
  forestBmigTaxa: { organization: "British Myriapod and Isopod Group", title: "Introducing the taxa: Bauplan und Ernährungsweisen von Asseln, Doppelfüßern und Hundertfüßern; keine britischen Artenzahlen auf DACH übertragen", url: "https://bmig.org.uk/index.php/page/introducing-taxa" },
  forestMasseyIsopods: { organization: "Massey University, Zoology & Ecology Group", title: "Soil Bugs: Isopoda – gruppenweiter Bauplan und unterschiedliche Trockenheitstoleranz; keine neuseeländischen Verbreitungsangaben übertragen", url: "https://soilbugs.massey.ac.nz/isopoda.php" },
  forestMasseyMillipedes: { organization: "Massey University, Zoology & Ecology Group", title: "Soil Bugs: Diplopoda – Doppelsegmente und abweichende vordere Körperabschnitte; keine neuseeländischen Artenangaben übertragen", url: "https://soilbugs.massey.ac.nz/diplopoda.php" },
  forestFvaCentipedes: { organization: "Forstliche Versuchs- und Forschungsanstalt Baden-Württemberg", title: "Bodentier-Bestimmungsschlüssel: Hundertfüßer (Chilopoda), ein Beinpaar je Segment", url: "https://www.fva-bw.de/fileadmin/scripts/forschung/bu/bodenschluessel/best_chilopoda.html" },
};

const photos = Object.fromEntries(photoRecords.map(photo => [photo.id, photo]));
const fact = (id, title, text, sourceIds) => ({ id, title, text, sourceIds });
const question = (prompt, choices, answer, explanation) => ({ prompt, choices, answer, explanation });

export const forestFloorTopics = [
  {
    id: "asseln", group: "boden", title: "Asseln: Landkrebse in der Streu",
    aliases: ["Landasseln", "Kellerassel", "Porcellio scaber", "Oniscidea", "Isopoda", "Streuzersetzer"],
    reviewedOn: forestFloorReviewedOn,
    categories: ["wald-pflanzen", "landwirtschaft-lebensraeume"],
    summary: "Landasseln gehören zu den Krebstieren. Viele nutzen abgestorbene Pflanzenreste und feuchte Rückzugsorte.",
    photo: photos.asseln,
    photoContext: "Die Originalquelle bezeichnet das in Erbach-Ringingen in Deutschland fotografierte Tier als Kellerassel (Porcellio scaber). Sichtbar sind Rückenschilde und Fühler; alle Laufbeine lassen sich in dieser Ansicht nicht zählen. Das Bild zeigt keinen beobachteten Fraß.",
    facts: [
      fact("bauplan", "Krebstiere mit sieben Laufbeinpaaren", "Landasseln sind Krebstiere und keine Käfer. Ausgewachsene Tiere besitzen sieben Laufbeinpaare am Brustabschnitt. Dieser Bauplan wird am Tier oder einer geeigneten Abbildung betrachtet; die Rückenansicht im Foto allein zeigt nicht jedes Bein.", ["forestMuensterIsopods", "forestSenckenbergSoil", "forestBmigTaxa", "forestMasseyIsopods"]),
      fact("feuchtigkeit", "Feuchte Verstecke helfen gegen Wasserverlust", "Viele Landasseln nutzen feuchte Streu und geschützte Stellen, etwa an Rinde oder zwischen Pflanzenresten. Ihre Anpassung an trockenere Luft ist je nach Art unterschiedlich. Deshalb beschreibt ein einzelner Fund weder alle Landasseln noch die Feuchtigkeit des gesamten Waldbodens.", ["forestMuensterWoodlouseHabitat", "forestSenckenbergSoil", "forestMasseyIsopods"]),
      fact("streunahrung", "Pflanzenreste werden weiterverarbeitet", "Falllaub und Holzreste gehören zur Nahrung vieler Landasseln; auch Pilze können genutzt werden. Beim Fressen zerkleinern sie Material und tragen zur Streuzersetzung bei. Ein Blattloch allein verrät jedoch nicht, welches Tier daran gefressen hat.", ["forestMuensterWoodlouseFood", "forestMuensterWoodlouseDecomposition", "forestSenckenbergSoil", "forestBmigTaxa"]),
    ],
    connections: [
      { label: "Falllaub und Holzreste → Landasseln", text: "Beispiele von Nahrung; das Foto dokumentiert keinen Fraßkontakt." },
      { label: "Feuchte Streu und geschützte Stellen → Rückzugsraum", text: "Wasserverlust und artspezifische Anpassungen gehören zur Lebensraumbetrachtung." },
    ],
    observe: "Bereits offen sichtbare Tiere und Pflanzenreste von einem zugänglichen Weg aus betrachten. Für den Bauplan das vergrößerbare Lehrfoto nutzen; Tiere nicht aufnehmen, Rinde nicht ablösen und Verstecke nicht öffnen.",
    limit: "Die Karte erklärt Landasseln als Gruppe. Sie ist kein vollständiger Artenschlüssel; das Foto erlaubt weder eine Altersbestimmung noch eine Bewertung der Bodenqualität oder Abbaugeschwindigkeit.",
    quiz: question("Welche Aussage zu einer Landassel passt?", ["Sie ist ein Käfer und hat deshalb sechs Laufbeine.", "Sie gehört zu den Krebstieren; ausgewachsene Tiere besitzen sieben Laufbeinpaare.", "Sie muss dauerhaft unter Wasser leben."], 1, "Landasseln sind an ein Leben an Land angepasste Krebstiere. Der Bauplan ausgewachsener Tiere umfasst sieben Laufbeinpaare; eine ungünstige Fotoansicht kann Beine verdecken."),
  },
  {
    id: "doppelfuesser", group: "boden", title: "Tausendfüßer: Doppelfüßer richtig einordnen",
    aliases: ["Tausendfüßler", "Tausendfüsser", "Diplopoda", "Myriapoda", "Vielfüßer", "Schnurfüßer", "Bandfüßer", "Saftkugler", "Hundertfüßer", "Chilopoda", "Tachypodoiulus niger"],
    reviewedOn: forestFloorReviewedOn,
    categories: ["wald-pflanzen", "landwirtschaft-lebensraeume"],
    summary: "Doppelfüßer sind eine Gruppe der Vielfüßer. Viele verarbeiten Streu; Hundertfüßer haben einen anderen Bauplan und leben überwiegend räuberisch.",
    photo: photos.doppelfuesser,
    photoContext: "Die Originalquelle bezeichnet die in Bayern aufgenommenen Tiere als Tachypodoiulus niger. Sichtbar sind aufgerollte, gegliederte Körper und helle Beine zwischen Holzstücken. Weder der Anlass des Aufrollens noch ein Fraßvorgang sind mit dieser Momentaufnahme belegt.",
    facts: [
      fact("doppelsegmente", "Zwei Beinpaare an vielen Körperringen", "Bei Doppelfüßern (Diplopoda) tragen die meisten Rumpfringe zwei Beinpaare; vordere Abschnitte weichen ab. Hundertfüßer (Chilopoda) tragen an den Laufbeinsegmenten jeweils ein Beinpaar. Beide gehören zu den Vielfüßern (Myriapoda), doch diese Gruppen dürfen nicht gleichgesetzt werden.", ["forestSenckenbergSoil", "forestBmigTaxa", "forestFvaCentipedes", "forestMasseyMillipedes"]),
      fact("nahrungsrollen", "Streufresser und Räuber unterscheiden", "Viele Doppelfüßer nutzen verrottendes Laub und morsches Holz und wirken beim Streuabbau mit. Hundertfüßer erbeuten überwiegend andere kleine Tiere. Viele Beine bedeuten daher keinen einheitlichen Speiseplan; auch innerhalb einer Gruppe gibt es Unterschiede.", ["forestMuensterMyriapods", "forestSenckenbergSoil", "forestBmigTaxa"]),
      fact("koerperformen", "Nicht jeder Doppelfüßer sieht wurmförmig aus", "Schnurfüßer haben eine langgestreckte, etwa walzenförmige Gestalt. Bandfüßer sind flacher und Saftkugler kompakter. Diese Formen gehören zu den Doppelfüßern. Allein ein runder oder flacher Körper ist deshalb kein zuverlässiger Artenschlüssel.", ["forestMuensterMyriapods", "forestBmigTaxa"]),
    ],
    connections: [
      { label: "Verrottendes Laub und morsches Holz → viele Doppelfüßer", text: "Ein Beitrag zur Verarbeitung von Streu; keine Behauptung über den tatsächlichen Fraß im Foto." },
      { label: "Kleine Beutetiere → Hundertfüßer", text: "Die überwiegend räuberische Nahrung unterscheidet sich von der typischen Streunutzung vieler Doppelfüßer." },
    ],
    observe: "An bereits frei sichtbaren Tieren Körperform und erkennbare Beine beschreiben, ohne sie umzudrehen oder aufzurollen. Nicht alle Details sind am Weg erkennbar; für einen Merkmalsvergleich vorhandene Makrofotos nutzen und Holz liegen lassen.",
    limit: "Dieses Profil behandelt die Doppelfüßer (Diplopoda). Die übergeordnete Gruppe Myriapoda umfasst auch Hundertfüßer. Dieses Gruppenwissen bestimmt weder jede Art noch die gesamte Beinzahl eines teilweise verdeckten Tieres.",
    quiz: question("Was unterscheidet Doppelfüßer und Hundertfüßer im Bauplan?", ["Doppelfüßer tragen an vielen Rumpfringen zwei Beinpaare, Hundertfüßer je Laufbeinsegment ein Beinpaar.", "Jeder Doppelfüßer hat genau tausend und jeder Hundertfüßer genau hundert Beine.", "Die Farbe allein trennt beide Gruppen sicher."], 0, "Die Anordnung der Beinpaare ist ein wichtiges Gruppenmerkmal. Namen und Körperfarbe ersetzen den Merkmalsvergleich nicht; bei Doppelfüßern weichen die vorderen Abschnitte von den zwei Beinpaare tragenden Ringen ab."),
  },
];
