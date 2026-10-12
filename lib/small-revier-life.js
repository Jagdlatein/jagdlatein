import photoRecords from "../public/lernen/kleines-revierleben-2026/bildnachweise.json";

export const revierLifeReviewedOn = "2026-10-12";
export const revierLifeGroups = [
  { id: "insekten", title: "Insekten" },
  { id: "pilze", title: "Pilze" },
  { id: "boden", title: "Bodenleben" },
];
export const revierLifeSources = {
  thuenen: { organization: "Thünen-Institut", title: "Wildbienen – eine faszinierende Artengruppe", url: "https://wildbienen.thuenen.de/ueber-wildbienen/ueber-wildbienen" },
  thuenenMonitoring: { organization: "Thünen-Institut", title: "Wildbienen-Monitoring: Habitatansprüche und Nistressourcen (2025), Zusammenfassung und Methoden", url: "https://wildbienen.thuenen.de/fileadmin/nisthilfen/Publikationen/Grundlagen_Wildbienen-Monitoring.pdf" },
  agroscopeBees: { organization: "Agroscope", title: "Wildbienen und Bestäubung", url: "https://www.agroscope.admin.ch/de/wildbienen-und-bestaeubung" },
  agroscopeNests: { organization: "Agroscope", title: "Honig- und Wildbienen in der Landwirtschaft fördern", url: "https://www.agroscope.admin.ch/dam/agroscope/de/dokumente/themen/umwelt-ressourcen/oekoausgleich-und-funktionen/merkblatt-bienen.pdf.download.pdf/Merkblatt%20Honig-%20und%20Wildbienen%20in%20der%20Landwirtschaft%20f%C3%B6rdern.pdf" },
  lflBeetles: { organization: "Bayerische Landesanstalt für Landwirtschaft", title: "Laufkäfer in der Agrarlandschaft", url: "https://www.lfl.bayern.de/iab/boden/211545/index.php" },
  bafuBeetles: { organization: "Bundesamt für Umwelt BAFU / info fauna", title: "Rote Liste der Laufkäfer (2024): Ernährungsweisen und Lebensräume, Seiten 8–9 und 54", url: "https://www.bafu.admin.ch/dam/de/sd-web/Hs7Hc2b6PDaY/uv-2411-rl-laufkaefer.pdf" },
  fiblBeetles: { organization: "Forschungsinstitut für biologischen Landbau FiBL", title: "Der DOK-Versuch (2026): Laufkäfer, Nahrung und räumliche Erfassungsgrenzen, Seiten 37–39", url: "https://www.fibl.org/fileadmin/documents/shop/1260-dok-dossier.pdf" },
  wslWood: { organization: "Eidgenössische Forschungsanstalt WSL", title: "Alte Bäume und Totholz – ein vielfältiger Lebensraum", url: "https://totholz.wsl.ch/de/totholz/vielfaeltiger-lebensraum/" },
  bfnWood: { organization: "Bundesamt für Naturschutz", title: "Totholzmengen im Wald: ökologische Funktionen", url: "https://www.bfn.de/daten-und-fakten/totholzmengen-im-wald" },
  wslFungi: { organization: "Eidgenössische Forschungsanstalt WSL", title: "Pilze: Zersetzung und Wurzelpartnerschaften", url: "https://www.wsl.ch/de/biodiversitaet/artenvielfalt/pilze/" },
  ubaWood: { organization: "Umweltbundesamt", title: "Holzzerstörende Pilze: Holzabbau und Fruchtkörper", url: "https://www.umweltbundesamt.de/holzzerstoerende-pilze" },
  wslMycorrhiza: { organization: "Eidgenössische Forschungsanstalt WSL", title: "Mykorrhiza: Partnerschaft, Fruchtkörper und beteiligte Arten", url: "https://www.waldwissen.net/de/lebensraum-wald/baeume-und-waldpflanzen/pflanzenoekologie/mykorrhiza" },
  lwfMycorrhiza: { organization: "Bayerische Landesanstalt für Wald und Forstwirtschaft", title: "Was ist die Mykorrhiza?", url: "https://lwf.bayern.de/wissenstransfer/forstcastnet/234240/index.php" },
  fiblWorms: { organization: "Forschungsinstitut für biologischen Landbau FiBL", title: "Regenwürmer – Baumeister fruchtbarer Böden (2022)", url: "https://www.fibl.org/fileadmin/documents/shop/1610-regenwuermer.pdf" },
  senckenbergWorms: { organization: "Senckenberg Gesellschaft für Naturforschung", title: "Regenwürmer und Enchyträen: Ökologie der Wenigborster", url: "https://www.senckenberg.de/de/forschung/institute-uebersicht/gr-museum-fuer-naturkunde/gr-abt-bodenzoologie/gr-sekt-oligochaeta/" },
  senckenbergSpringtails: { organization: "Senckenberg Gesellschaft für Naturforschung", title: "Abenteuer Bodenleben: Springschwänze", url: "https://vr-bodenleben.senckenberg.de/tiere/porenraum/springschwanz/" },
  lflSpringtails: { organization: "Bayerische Landesanstalt für Landwirtschaft", title: "Bodenmesofauna: Springschwänze und Milben", url: "https://www.lfl.bayern.de/iab/boden/030976/" },
  zurichSpringtails: { organization: "Stadt Zürich, Umwelt- und Gesundheitsschutz", title: "Springschwänze: Lebensformen und zurückgebildete Sprunggabel (April 2023), Seite 1", url: "https://www.stadt-zuerich.ch/content/dam/web/de/gesundheit/gesundheitsschutz/dokumente/schaedlinge/merkblaetter/mb-spz-springschwanz.pdf" },
  lwfSoil: { organization: "Bayerische Landesanstalt für Wald und Forstwirtschaft", title: "Bodenfauna in den Wäldern Bayerns", url: "https://www.lwf.bayern.de/boden-klima/296716/index.php" },
};
const fact = (id, title, text, sourceIds) => ({ id, title, text, sourceIds });
const question = (prompt, choices, answer, explanation) => ({ prompt, choices, answer, explanation });
const photos = Object.fromEntries(photoRecords.map(photo => [photo.id, photo]));

export const revierLifeTopics = [
  {
    id: "wildbienen", group: "insekten", title: "Wildbienen: Blüten und Nistplätze", aliases: ["Bestäuber", "Mauerbiene", "Hummeln", "Osmia bicornis"],
    summary: "Eine blütenreiche Fläche und ein geeigneter Nistplatz erfüllen unterschiedliche Bedürfnisse.",
    photo: photos.wildbienen,
    photoContext: "Das Foto zeigt eine Rostrote Mauerbiene auf einer Blüte in Hamburg. Ein Blütenbesuch ist sichtbar; ob diese einzelne Blüte erfolgreich bestäubt wurde, zeigt das Bild nicht.",
    facts: [
      fact("bestaeubung", "Blütenbesuche verbinden Pflanzen und Tiere", "Wildbienen tragen zur Bestäubung von Wild- und Kulturpflanzen bei. Auch Hummeln gehören zu den Wildbienen. Eine einzelne fotografierte Biene ist kein Maß für die Bestäubungsleistung eines ganzen Reviers.", ["thuenen", "agroscopeBees"]),
      fact("ressourcen", "Blüten allein reichen nicht", "Je nach Art werden unterschiedliche Pollenpflanzen und Niststrukturen genutzt. Offene Bodenstellen, Pflanzenstängel oder Holz können geeignete Nistplätze bieten. Nahrung und passende Nistmöglichkeiten müssen gemeinsam betrachtet werden; eine Nisthilfe passt nicht automatisch zu jeder Wildbienenart.", ["agroscopeNests", "thuenenMonitoring"]),
      fact("landschaft", "Kleine Strukturen gehören zum Lebensraum", "Blütenreiche, kleinstrukturreiche und verbundene Lebensräume sind für Wildbienen wichtig. Beim Betrachten eines Feldrands sind deshalb sowohl das Blütenangebot als auch mögliche Niststrukturen interessant. Aus einer blütenarmen Momentaufnahme folgt nicht, dass die Fläche das ganze Jahr gleich aussieht.", ["thuenenMonitoring", "agroscopeBees", "agroscopeNests"]),
    ],
    connections: [{ label: "Blüten → Pollen und Nektar → Wildbienen", text: "Nahrungskontakt; Auswahl und Verfügbarkeit sind artabhängig." }, { label: "Boden, Stängel oder Holz → Nistmöglichkeit", text: "Einige Arten nutzen diese Strukturen, andere benötigen andere Bedingungen." }],
    observe: "Von einem vorhandenen Weg aus Blüten, besuchte Pflanzen und erkennbare Niststrukturen getrennt notieren. Nester nicht öffnen und Tiere nicht für die Aufnahme fangen.",
    limit: "Die Karte erklärt ökologische Zusammenhänge. Sie ist kein vollständiger Wildbienenschlüssel und erlaubt keine Artbestimmung allein nach Farbe oder Behaarung.",
    quiz: question("Du siehst viele Blüten und eine Nisthilfe. Was bleibt offen?", ["Welche Arten dort tatsächlich Nahrung und passende Nistmöglichkeiten finden.", "Ob alle Wildbienen dieselbe Nisthilfe benötigen.", "Ob jede Blüte von genau einer Biene besucht wird."], 0, "Blütenangebot und Niststruktur sind verschiedene Ressourcen. Die tatsächlichen Nutzer und ihre Ansprüche müssen beobachtet beziehungsweise fachlich bestimmt werden."),
  },
  {
    id: "laufkaefer", group: "insekten", title: "Laufkäfer: Nahrung am Boden", aliases: ["Goldlaufkäfer", "Carabus auratus", "Bodenräuber", "Samenfresser"],
    summary: "Laufkäfer fressen je nach Art Beutetiere, Samen oder beides. Eine ganze Familie hat keinen einheitlichen Speiseplan.",
    photo: photos.laufkaefer,
    photoContext: "Der Goldlaufkäfer wurde mit einem Regenwurm in Norddeutschland fotografiert. Das zeigt einen konkreten Nahrungskontakt und keinen Speiseplan aller Laufkäfer.",
    facts: [
      fact("nahrung", "Räuber und Samenfresser unterscheiden", "In der Familie der Laufkäfer gibt es räuberische und stärker samenfressende Arten. Räuberische Arten können unter anderem Schnecken oder andere wirbellose Tiere fressen. Deshalb beschreibt der Begriff Laufkäfer allein noch nicht die genaue Ernährungsweise.", ["lflBeetles", "bafuBeetles"]),
      fact("netz", "Beute ist mehr als eine Schädlingsliste", "Das Beutespektrum kann auch Regenwürmer, Springschwänze oder andere Nützlinge umfassen. Laufkäfer sind Teil eines Nahrungsnetzes; ihr Einfluss lässt sich nicht mit einer festen Zahl beseitigter Schädlinge pro beobachtetem Käfer ausdrücken.", ["lflBeetles", "bafuBeetles"]),
      fact("refugien", "Rückzugsräume verbinden Flächen", "Feldränder, Hecken und andere ungestörte Bereiche können Rückzug und Überwinterung ermöglichen. Welche Struktur hilft, hängt von Art und Standort ab. Eine einzelne Falle oder Sichtung erfasst außerdem nur einen Ausschnitt der Gemeinschaft; die Beweglichkeit der Tiere begrenzt ihre Zuordnung zu kleinen Flächen.", ["lflBeetles", "bafuBeetles", "fiblBeetles"]),
    ],
    connections: [{ label: "Regenwurm → Goldlaufkäfer", text: "Im gezeigten Foto belegter Nahrungskontakt." }, { label: "Samen → einige Laufkäferarten", text: "Andere Arten nutzen pflanzliche Nahrung stärker; nicht auf alle übertragen." }],
    observe: "Das sichtbare Tier, den Untergrund und eine wirklich beobachtete Tätigkeit beschreiben. Kein Ködern oder Fanggefäß nötig; ein nicht sichtbarer Käfer ist kein Beleg für Abwesenheit.",
    limit: "Das Foto zeigt einen Goldlaufkäfer. Es bestätigt weder die Art eines anderen ähnlich gefärbten Fundes noch eine pauschale Nützlings- oder Schädlingsbewertung.",
    quiz: question("Ein Goldlaufkäfer frisst im Foto einen Regenwurm. Welche Aussage ist gedeckt?", ["Jeder Laufkäfer frisst ausschließlich Regenwürmer.", "In dieser Aufnahme ist ein Nahrungskontakt zu sehen.", "Samen können für keinen Laufkäfer Nahrung sein."], 1, "Die konkrete Aufnahme lässt sich beschreiben. Ernährungsweisen unterscheiden sich zwischen Arten; die Beobachtung darf nicht auf die ganze Familie ausgeweitet werden."),
  },
  {
    id: "holzpilze", group: "pilze", title: "Holzpilze: Totholz wird Lebensraum", aliases: ["Schmetterlingstramete", "Trametes versicolor", "Zersetzer", "Porlinge"],
    summary: "Pilze bauen Holzbestandteile ab. Baumart, Holzform und Zersetzungsstadium beeinflussen den Lebensraum.",
    photo: photos.holzpilze,
    photoContext: "Die Originalaufnahme zeigt Schmetterlingstrameten auf einem Holzstück in Schottland. Sie illustriert eine auch in DACH vorkommende Form des Holzlebens; sie ist kein örtlicher Artennachweis für dein Revier.",
    facts: [
      fact("abbau", "Pilze arbeiten am Holz", "Holzabbauende Pilze können widerstandsfähige Holzbestandteile zerlegen. Ihre Fruchtkörper sind der sichtbare Teil eines Pilzes; der Holzabbau ist mit einer einzelnen Fotografie nicht in seiner Geschwindigkeit messbar.", ["wslWood", "wslFungi", "ubaWood"]),
      fact("mosaik", "Totholz ist kein einheitliches Material", "Stehendes und liegendes Holz, verschiedene Baumarten, Durchmesser und Zersetzungsstadien bieten unterschiedliche Strukturen. Die Menge allein beschreibt deshalb nicht die gesamte ökologische Qualität einer Totholzfläche.", ["wslWood", "bfnWood"]),
      fact("weitergabe", "Pilze schaffen weitere Lebensräume", "Pilzbesiedlung und Holzzerfall verändern das Substrat. Unterschiedliche Käfer und andere Organismen nutzen Holz, Pilze oder Hohlräume. Nicht jeder Holzkäfer verdaut frisches Holz selbst, und nicht jeder Pilz am Baum erfüllt dieselbe Funktion.", ["wslWood", "bfnWood"]),
    ],
    connections: [{ label: "Totes Holz → holzabbauende Pilze → verändertes Substrat", text: "Ein Teil des Abbaus und der Entstehung weiterer Lebensräume." }, { label: "Holz und Pilze → passende Insekten und andere Arten", text: "Die Nutzung unterscheidet sich nach Art und Entwicklungsstadium." }],
    observe: "Holzlage, sichtbare Fruchtkörper und erkennbare Zersetzung vom sicheren Standpunkt aus vergleichen. Kein morsches Holz aufbrechen und keine stehenden toten Bäume berühren oder unter ihnen verweilen.",
    limit: "Keine Pilzbestimmung zum Essen oder Sammeln. Der sichtbare Fruchtkörper allein sagt weder die verbleibende Baumstabilität noch die Abbaudauer voraus.",
    quiz: question("Zwei Flächen haben gleich viel Totholz. Sind ihre Lebensräume deshalb gleich?", ["Ja, Baumart und Zersetzungsgrad sind unwichtig.", "Ja, das Gewicht beschreibt alle nutzbaren Strukturen.", "Nein, Holzform, Baumart, Dimension und Zersetzung können sich unterscheiden."], 2, "Totholzmenge ist eine wichtige Angabe, ersetzt aber nicht die Beschreibung der unterschiedlichen Strukturen und Entwicklungsstadien."),
  },
  {
    id: "mykorrhiza", group: "pilze", title: "Mykorrhiza: Pilz und Wurzel als Partner", aliases: ["Pilzwurzel", "Symbiose", "Fliegenpilz", "Amanita muscaria"],
    summary: "Wurzelpartnerschaften unterscheiden sich vom Holzabbau. Der Austausch findet überwiegend außerhalb unseres Blicks statt.",
    photo: photos.mykorrhiza,
    photoContext: "Ein Fliegenpilz-Fruchtkörper im Schwarzwald steht hier als Beispiel eines Mykorrhizapilzes. Der Kontakt zu Baumwurzeln ist in diesem Foto nicht sichtbar. Der Fliegenpilz wird nicht als Speisepilz vorgestellt.",
    facts: [
      fact("austausch", "Partner tauschen Ressourcen", "Mykorrhizapilze stehen mit Pflanzenwurzeln in Verbindung. Sie unterstützen die Aufnahme von Wasser und Nährstoffen und erhalten Kohlenstoffverbindungen von der Pflanze. Damit ist Mykorrhiza ein anderer Zusammenhang als das Zersetzen eines abgestorbenen Holzstücks.", ["wslFungi", "lwfMycorrhiza"]),
      fact("fruchtkoerper", "Der Hut ist kein Wurzelnachweis", "Was im Alltag Pilz heißt, ist oft nur der Fruchtkörper. Das Geflecht der Pilzfäden und seine Verbindung mit Wurzeln bleiben im Boden verborgen. Ein Fruchtkörperfoto bildet den Ressourcenaustausch deshalb nicht unmittelbar ab.", ["wslFungi", "lwfMycorrhiza"]),
      fact("partner", "Die beteiligten Arten zählen", "Verschiedene Pilze und Baumarten können unterschiedliche Partnerschaften eingehen. Manche Mykorrhizapilze sind an bestimmte Baumarten gebunden. Ein Pilz neben irgendeinem Baum beweist keine beliebige Partnerschaft dieses konkreten Baums.", ["lwfMycorrhiza", "wslMycorrhiza"]),
    ],
    connections: [{ label: "Pflanze → Kohlenstoffverbindungen → Pilz", text: "Schematische Darstellung des Austauschs, kein Messwert." }, { label: "Pilz → Wasser und Nährstoffe → Pflanze", text: "Die konkrete Wirkung hängt von Partnern und Bedingungen ab." }],
    observe: "Sichtbare Fruchtkörper und benachbarte Baumarten getrennt notieren. Wurzeln nicht ausgraben; aus räumlicher Nähe keinen sicheren Partnernachweis ableiten.",
    limit: "Keine Verzehrfreigabe. Weder ein Pilzfoto noch eine Liste möglicher Partner ersetzt die fachliche Untersuchung einer bestimmten Wurzel-Pilz-Verbindung.",
    quiz: question("Ein Pilzhut steht unter einem Baum. Was zeigt das Foto nicht direkt?", ["Die Lage des sichtbaren Fruchtkörpers.", "Den Stoffaustausch zwischen Pilzfäden und der konkreten Baumwurzel.", "Die sichtbare Farbe des Huts."], 1, "Der Stoffaustausch und die genaue Wurzelverbindung liegen außerhalb des abgebildeten Ausschnitts. Sichtbares Motiv und fachliches Hintergrundwissen werden getrennt."),
  },
  {
    id: "regenwuermer", group: "boden", title: "Regenwürmer: Boden umbauen", aliases: ["Tauwürmer", "Lumbricus terrestris", "Bodengefüge", "Wenigborster"],
    summary: "Regenwürmer verarbeiten organisches Material und verändern das Bodengefüge. Arten und Standorte unterscheiden sich.",
    photo: photos.regenwuermer,
    photoContext: "Der fotografierte Regenwurm stammt aus Dänemark. Er veranschaulicht einen Regenwurm, belegt aber weder die Anzahl noch die Artenzusammensetzung eines Bodens in DACH.",
    facts: [
      fact("material", "Organisches Material wird verarbeitet", "Regenwürmer nehmen an Abbau und Verteilung organischen Materials im Boden teil. Ihre Aktivität verändert das Bodengefüge und wirkt mit anderen Bodenorganismen im Stoffkreislauf zusammen. Sie sind keine voneinander unabhängigen Maschinen zur Humusherstellung.", ["fiblWorms", "senckenbergWorms"]),
      fact("lebensweise", "Nicht jede Art lebt gleich", "Oberflächennah lebende, im Mineralboden arbeitende und tief grabende Arten haben unterschiedliche Lebensweisen. Einige Tiefgräber ziehen Pflanzenreste in ihre Röhren. Eine einzige beobachtete Wurmart bildet deshalb nicht sämtliche Bodenfunktionen ab.", ["fiblWorms", "senckenbergWorms", "lwfSoil"]),
      fact("standort", "Eine Sichtung ist noch kein Bodentest", "Regenwurmgemeinschaften hängen von Standort und Umweltbedingungen ab. Waldböden müssen nicht überall dieselben Tierzahlen wie Grünland aufweisen. Für einen belastbaren Vergleich braucht es abgestimmte Erfassungsmethoden statt einer zufälligen Sichtung nach Regen.", ["fiblWorms", "senckenbergWorms", "lwfSoil"]),
    ],
    connections: [{ label: "Pflanzenreste → Bodenorganismen → verändertes organisches Material", text: "Zerkleinerung, Abbau und Umwandlung wirken zusammen." }, { label: "Regenwurmgänge → Poren und weitere Bodenlebewesen", text: "Das Bodengefüge und andere Organismen stehen in Beziehung." }],
    observe: "Oberfläche, sichtbare Losung und vorhandene Gänge beschreiben, ohne Tiere zu sammeln oder einen Boden für das Lernfoto umzugraben. Datum, Bodenfeuchte und Beobachtungsdauer festhalten.",
    limit: "Keine pauschale Bodenbewertung nach einem Tier. Die Abwesenheit sichtbarer Regenwürmer beweist weder einen toten Boden noch das Fehlen anderer wichtiger Bodentiere.",
    quiz: question("Heute siehst du keinen Regenwurm. Welche Folgerung passt?", ["Der gesamte Boden ist ohne Leben.", "Es gibt sicher keine Regenwürmer in diesem Boden.", "Die Sichtung ist ausgeblieben; Bedingungen und Erfassungsmethode begrenzen den Schluss."], 2, "Eine einzelne Oberflächenbeobachtung erfasst nicht alle Tiere oder Arten im Boden. Standort, Witterung und Methode beeinflussen den Vergleich."),
  },
  {
    id: "springschwaenze", group: "boden", title: "Springschwänze: kleine Tiere, große Zusammenhänge", aliases: ["Collembola", "Collembolen", "Orchesella cincta", "Bodenmesofauna", "Laubstreu"],
    summary: "Springschwänze leben in Streu und Bodenporen. Nahrung, Feuchtigkeit und bestehende Hohlräume gehören zusammen.",
    photo: photos.springschwaenze,
    photoContext: "Die vergrößerte Aufnahme aus Belgien zeigt Orchesella cincta. Andere Springschwänze sehen anders aus; das Foto besitzt keinen eingeblendeten Größenmaßstab.",
    facts: [
      fact("nahrung", "Mikroorganismen gehören zur Nahrung", "Viele Springschwänze nutzen Pilze, Algen, Mikroorganismen und organische Reste. Dadurch sind sie am Zusammenspiel von Streuabbau und Bodenmikroorganismen beteiligt. Ihre kleine Körpergröße macht sie beim normalen Reviergang leicht übersehbar.", ["senckenbergSpringtails", "lflSpringtails"]),
      fact("poren", "Vorhandene Hohlräume sind wichtig", "Bodenbewohnende Springschwänze nutzen Poren und vorhandene Hohlräume. Sie können sich nur begrenzt selbst durch den Boden graben. Streuoberfläche und tieferer Porenraum sind unterschiedliche Lebensbereiche und beherbergen unterschiedlich angepasste Arten.", ["senckenbergSpringtails", "lflSpringtails"]),
      fact("vielfalt", "Nicht jeder Springschwanz springt gleich", "Bei Arten im tieferen Boden kann die namensgebende Sprunggabel zurückgebildet sein. Eine fehlende sichtbare Sprungbewegung schließt Springschwänze daher nicht aus. Gestalt, Lebensraum und weitere Merkmale müssen zusammen betrachtet werden.", ["senckenbergSpringtails", "zurichSpringtails"]),
    ],
    connections: [{ label: "Pilze und organische Reste → Springschwänze", text: "Nahrung variiert nach Art und Lebensbereich." }, { label: "Bodenporen und Streu → Lebensraum", text: "Kleine Hohlräume verbinden physische Struktur und Bodenleben." }],
    observe: "Bereits sichtbare Tiere an einer zugänglichen Streustelle mit Lupe betrachten, ohne den Lebensraum zu zerlegen. Ein Makrofoto vergrößert das Motiv und ist kein eigener Größenmaßstab.",
    limit: "Die Aufnahme ist ein Beispiel, kein vollständiger Bestimmungsschlüssel. Kleine Tiere dürfen nicht pauschal als Schädlinge eingestuft werden; ihre ökologische Rolle hängt von der Art ab.",
    quiz: question("Ein winziges Bodentier springt nicht. Ist es deshalb sicher kein Springschwanz?", ["Nein, bei manchen bodenbewohnenden Arten ist die Sprunggabel zurückgebildet.", "Ja, jedes Tier dieser Gruppe muss bei jeder Beobachtung springen.", "Ja, Springschwänze leben grundsätzlich nur auf Blüten."], 0, "Lebensformen im Boden unterscheiden sich von den leicht sichtbaren Oberflächenformen. Die Bewegung allein reicht zur Abgrenzung nicht aus."),
  },
].map(topic => ({ ...topic, reviewedOn: revierLifeReviewedOn }));

export function getRevierLifeTopic(id) { return revierLifeTopics.find(topic => topic.id === id) || revierLifeTopics[0]; }
export const revierLifeAssetPaths = photoRecords.map(photo => photo.src);
export const revierLifeSearchEntries = revierLifeTopics.map(topic => ({
  id: `revierleben:${topic.id}`, type: "entry", title: topic.title, description: topic.summary,
  href: `/lernen/kleines-revierleben?thema=${topic.id}#revierleben-inhalt`,
  categories: ["natur-revier", ...(topic.group === "pilze" ? ["wald-pflanzen"] : ["landwirtschaft-lebensraeume"])],
  aliases: topic.aliases, text: [topic.group, ...topic.facts.map(item => item.text), ...topic.connections.map(item => `${item.label} ${item.text}`), topic.limit].join(" "),
}));
