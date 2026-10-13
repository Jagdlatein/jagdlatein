import media from "../public/lernen/koerper-kreislauf-2026/mediennachweise.json";

export const digestiveReviewedOn = "2026-10-13";
const source = (title, url, organization, scope) => ({ title, url, organization, scope, reviewedOn: digestiveReviewedOn });
export const digestiveSources = {
  vetAnatomy: source("Vetmeduni Wien · Anatomie des Verdauungstrakts, Vorbereitungsskript 2025, S. 77–78", "https://www.vetmeduni.ac.at/fileadmin/v/z/mitteilungsblatt/zulassung/2024_2025/20250319_AV25_Skript_Diplomstudium_Veterin%C3%A4rmedizin.pdf", "Vetmeduni Wien", "Anatomische Gliederung der Vormägen und des Labmagens; Schweinemagen und Anhangsdrüsen. Keine Übertragung von Nutztier-Literzahlen auf Wildtiere."),
  bzl: source("BZL · Warum können Rinder von Gras leben?", "https://www.landwirtschaft.de/tier-und-pflanze/tier/rinder/warum-koennen-rinder-von-gras-leben", "Bundesinformationszentrum Landwirtschaft", "Allgemeiner Wiederkäuer-Bauplan, Wiederkäuen und mikrobielle Fermentation. Das Rind ist ein ausdrücklich benanntes Vergleichsbeispiel."),
  agroscope: source("Agroscope · Factsheet Kühe mit Fisteln, S. 2–3", "https://www.agroscope.admin.ch/dam/agroscope/de/dokumente/themen/nutztiere/wiederkaeuer/faq-fistelkuehe.pdf.download.pdf/2014_Factsheet_FragenAntworten_Fistelkuh.pdf", "Agroscope", "Mikroorganismen vergären Nahrung im Pansen; die Mikroben selbst liefern später Protein. Keine Anleitung zur Wildfütterung."),
  vetMicrobes: source("Vetmeduni Wien · Die Pansenwand im Fokus (2023)", "https://www.vetmeduni.ac.at/universitaet/infoservice/presseinformationen/presseinformationen-2023/die-pansenwand-im-fokus-wichtig-fuer-die-nahrungsaufnahme-der-kuh-und-vielseitige-nische-fuer-die-differenzierung-von-bakteriellen-populationen", "Vetmeduni Wien", "Mikrobielle Populationen und Verarbeitung von Pflanzenstoffen im Pansen. Unabhängiger Forschungsbericht gegenüber Agroscope."),
  berlinWater: source("Maren Dölle · Charakterisierung des Na+-Transportes am Psalterepithel des Schafes, FU Berlin (2008), S. 1 und 6", "https://d-nb.info/1027496954/34", "Freie Universität Berlin", "Wasseraufnahme als eine Funktion des Blättermagens; keine Behauptung einer ausschließlich auf Wasser begrenzten Funktion und keine Prozentwerte auf Wildtiere übertragen."),
  minnesota: source("University of Minnesota · Applied GI Physiology, Digestion Overview und Fermentation, S. 113–114 und 130–135", "https://open.lib.umn.edu/vetphysioapplied/open/download?type=pdf", "University of Minnesota", "Vergleichende Veterinärphysiologie: einhöhliger Verdauungsbauplan, Dünndarmverdauung, mikrobielle Verarbeitung im Schweine-Dickdarm und mikrobielle Proteinquelle beim Wiederkäuer. Keine Nutztier-Rationsempfehlung übernommen."),
  luzern: source("Natur-Museum Luzern · Das Reh, Lehrpersonenunterlagen, S. 7–8", "https://www.museumluzern.ch/application/files/1217/3641/6491/Lehrpersonen_Reh.pdf", "Naturmuseen · Rehausstellung", "Reh als Wiederkäuer: vier Magenabschnitte, Wiederkäuen, Blättermagen und Labmagen. Olten und Luzern zählen hier nicht als unabhängige Doppelbestätigung."),
  rlpRuminants: source("Forschungsanstalt für Waldökologie und Forstwirtschaft Rheinland-Pfalz · Wildschäden im Wald (2014), S. 68", "https://fawf.wald.rlp.de/fileadmin/website/fawfseiten/fawf/downloads/WSE/2014/2014_Wildschaeden_im_Wald.pdf", "Landesforsten Rheinland-Pfalz", "Rehwild als wiederkäuendes Schalenwild; Schalenwildbezeichnung und Abgrenzung des Schwarzwilds. Ausschließlich biologische Einordnung übernommen."),
  uzhPig: source("Universität Zürich · Anatomie des Digestitionsapparates des Schweins", "https://www.ictvet.uzh.ch/US_Schwein/html/git1.htm", "Universität Zürich", "Einhöhlig-zusammengesetzter Schweinemagen. Einhöhlig bezeichnet die Kammerzahl, zusammengesetzt die unterschiedlichen Schleimhautbereiche."),
  thuenenPig: source("Thünen · Ernährung und Fütterung der Schweine, S. 125–130", "https://literatur.thuenen.de/digbib_extern/bitv/dk037184.pdf", "Thünen-Institut", "Magen-Darm-Bauplan, enzymatische Verdauung und mikrobielle Umsetzungen im Dickdarm beim Hausschwein. Keine Zahlenübertragung auf Schwarzwild."),
  giessenBoar: source("Universität Gießen · Schriften des Arbeitskreises Wildbiologie, Heft 23", "https://www.uni-giessen.de/de/fbz/fb10/institute_klinikum/zentral/wildbiologie/Publikationen/AKW_Heft23.pdf", "Justus-Liebig-Universität Gießen", "Schwarzwild als nicht wiederkäuender Allesfresser; Abgrenzung vom Wiederkäuer-Bauplan."),
  rlpBoar: source("Landesforsten Rheinland-Pfalz · Schwarzwild", "https://www.wald.rlp.de/wald/saeugetiere/schwarzwild/seite", "Landesforsten Rheinland-Pfalz", "Wildschwein als Allesfresser; Unterschiede zum Wiederkäuen. Es werden ausschließlich biologische Abschnitte verwendet."),
};
const fact = (id, title, text, sourceIds) => ({ id, title, text, sourceIds, reviewedOn: digestiveReviewedOn });
const question = (id, prompt, choices, answer, explanation, factIds) => ({ id, prompt, choices, answer, explanation, factIds });
export const digestiveTopics = [
  {
    id: "wiederkaeuer-verdauung", title: "Wiederkäuer: ein Magen mit vier Abschnitten", category: "Wildkunde", categorySlug: "wildkunde",
    summary: "Am echten Reh-Magenpräparat den Bauplan kennenlernen und nachvollziehen, wie Tier und Mikroorganismen gemeinsam Pflanzenkost verwerten.",
    photo: media.find(item => item.id === "reh-magen"),
    photoContext: "Aufgeschnittenes Reh-Magenpräparat im Bündner Naturmuseum in Chur. Das Foto zeigt unterschiedlich strukturierte Innenflächen. Das ausgestellte Präparat ist keine unveränderte Ansicht im lebenden Körper und kein gemeinsamer Größenmaßstab für andere Wildarten.",
    facts: [
      fact("vier-abschnitte", "Drei Vormägen und ein Drüsenmagen", "Pansen, Netzmagen und Blättermagen bilden die drei Vormagenabschnitte. Der Labmagen ist der Drüsenmagen. Mit ‚vier Mägen‘ ist im Lernalltag dieses gegliederte Magensystem gemeint. Das Reh gehört zu den Wiederkäuern.", ["vetAnatomy", "luzern", "rlpRuminants"]),
      fact("mikroben", "Pflanzenfasern brauchen Helfer", "Mikroorganismen im Pansen bauen Pflanzenbestandteile ab und bilden nutzbare Gärungsprodukte. Die Verdauung ist daher mehr als das Zerkleinern durch Zähne. Ein Teil der Mikroorganismen wird später selbst verdaut und liefert dem Wirt Protein.", ["agroscope", "vetMicrobes", "minnesota"]),
      fact("wiederkaeuen", "Nochmals kauen", "Beim Wiederkäuen gelangt ein Teil des Nahrungsbreis zurück ins Maul, wird erneut gekaut und wieder geschluckt. Pansen und Netzmagen arbeiten dabei zusammen. Ein Schema mit Pfeilen ist eine Vereinfachung und kein einmaliger, streng linearer Durchlauf.", ["luzern", "bzl"]),
      fact("nach-vormaegen", "Weitere Verarbeitung", "Im Blättermagen wird unter anderem Wasser aus dem Nahrungsbrei aufgenommen. Im Labmagen wirken Magensaft und körpereigene Verdauungsenzyme. Die Magenabschnitte erfüllen unterschiedliche Aufgaben; eine große Gärkammer ersetzt den Drüsenmagen nicht.", ["luzern", "berlinWater", "bzl"]),
    ],
    pathway: { title: "Den Zusammenhang merken", note: "Eigene vereinfachte Lernskizze: keine anatomische Lagezeichnung und keine Maßstabsangabe. Der Rückweg zum Maul gehört zum Wiederkäuen.", sourceIds: ["vetAnatomy", "bzl", "berlinWater"], steps: [
      { title: "Maul", text: "Nahrung aufnehmen und schlucken" },
      { title: "Pansen + Netzmagen", text: "Mikrobielle Verarbeitung · ein Teil zurück zum Maul" },
      { title: "Blättermagen", text: "Weitere Verarbeitung und Wasseraufnahme" },
      { title: "Labmagen", text: "Drüsenmagen mit Verdauungssäften" },
    ] },
    observation: "Suche im Präparat zuerst die verschiedenen Oberflächen, statt allein nach der Größe zu urteilen. Die große geöffnete Fläche, die netzartige Struktur und die blätterartig gefaltete Partie lassen sich vergleichen. Eine Funktionsangabe stammt aus der Fachquelle, nicht allein aus der Farbe des Präparats.",
    limit: "Das Präparat beweist weder die aktuelle Nahrung noch den Gesundheitszustand oder den Mageninhalt eines beobachteten Rehs. Verdauungs-Grundwissen ist keine Fütterungsanleitung.",
    questions: [
      question("wiederkaeuer-kammern", "Welche Gruppe nennt die vier Abschnitte dieses Wiederkäuermagens?", ["Pansen, Netzmagen, Blättermagen und Labmagen", "Pansen, Leber, Lunge und Niere", "Vier gleichartige Drüsenmägen"], 0, "Drei Vormagenabschnitte und der Labmagen bilden ein gegliedertes Magensystem. Leber, Lunge und Niere sind andere Organe.", ["vier-abschnitte"]),
      question("wiederkaeuer-helfer", "Wodurch wird faserreiche Pflanzenkost im Pansen nutzbar?", ["Allein durch die Farbe der Magenwand", "Durch Mikroorganismen und ihre Gärungsarbeit", "Durch einen einmaligen Durchlauf ohne weiteres Kauen"], 1, "Die Mikroorganismen bauen Pflanzenbestandteile ab. Wiederkäuen ergänzt diese Verarbeitung durch erneutes Zerkleinern.", ["mikroben", "wiederkaeuen"]),
    ],
    keywords: ["Reh", "Rothirsch", "Verdauung", "Pansen", "Netzmagen", "Blättermagen", "Labmagen", "Wiederkäuen", "Mikroorganismen", "Organe"],
    reviewedOn: digestiveReviewedOn,
  },
  {
    id: "schwarzwild-verdauung", title: "Schwarzwild: ein anderer Verdauungsbauplan", category: "Wildkunde", categorySlug: "wildkunde",
    summary: "Schalenwild ist keine einheitliche Verdauungsgruppe. Das Wildschwein gehört zu den Allesfressern und besitzt kein Wiederkäuer-Vormagensystem.",
    photo: media.find(item => item.id === "wildschwein-schaedel"),
    photoContext: "Echter Wildschwein-Schädel als unvollständiges, verwittertes Fundstück. Das Gebiss ist teilweise erhalten. Der Schädel zeigt keine inneren Verdauungsorgane; fehlende Zähne und Knochen sind keine arttypischen Merkmale. Die Magengliederung wird im Schema und in den Fachquellen erklärt.",
    facts: [
      fact("kein-wiederkaeuer", "Schalenwild und Wiederkäuer unterscheiden", "Das Wildschwein ist ein Paarhufer und ein Allesfresser, aber kein Wiederkäuer. Die jagdliche Sammelbezeichnung Schalenwild beschreibt deshalb keinen einheitlichen Magenbau. Beim Schwarzwild ist ‚Panseninhalt‘ anatomisch keine passende Bezeichnung.", ["giessenBoar", "rlpBoar", "uzhPig"]),
      fact("ein-hohlraum", "Ein Magenhohlraum, verschiedene Wandbereiche", "Der Schweinemagen ist einhöhlig. Fachtexte nennen ihn zugleich zusammengesetzt, weil seine Schleimhaut unterschiedliche Bereiche hat. ‚Zusammengesetzt‘ bedeutet hier also nicht die vier Abschnitte des Wiederkäuermagens. Das gilt als Grundbauplan; Nutztier-Literangaben werden nicht auf Wildschweine übertragen.", ["uzhPig", "thuenenPig", "vetAnatomy"]),
      fact("enzyme", "Magen und Dünndarm", "Beim Schwein übernehmen körpereigene Enzyme wesentliche Schritte der Nahrungszerlegung. Magen und Dünndarm sind wichtige Abschnitte der Verdauung; im Dünndarm werden Nährstoffe aufgenommen. Die Erklärung des Bauplans ist keine Empfehlung für eine Futterration.", ["thuenenPig", "minnesota"]),
      fact("auch-mikroben", "Nichtwiederkäuer haben ebenfalls Mikroorganismen", "Auch beim Schwein finden mikrobielle Umsetzungen statt, besonders im Dickdarm. Das ist vom vorgelagerten Pansen-System der Wiederkäuer zu unterscheiden. ‚Kein Pansen‘ heißt deshalb nicht ‚überhaupt keine mikrobielle Verdauung‘.", ["thuenenPig", "minnesota", "agroscope"]),
    ],
    pathway: { title: "Baupläne vergleichen", note: "Eigene vereinfachte Lernskizze: keine Lage-, Längen- oder Volumenzeichnung. Der Hausschwein-Bauplan wird für den anatomischen Vergleich genutzt; Größenwerte werden nicht auf Schwarzwild übertragen.", sourceIds: ["uzhPig", "minnesota", "giessenBoar"], steps: [
      { title: "Maul + Speiseröhre", text: "Kauen, schlucken, weitertransportieren" },
      { title: "Einhöhliger Magen", text: "Verschiedene Schleimhautbereiche" },
      { title: "Dünndarm", text: "Verdauung und Nährstoffaufnahme" },
      { title: "Dickdarm", text: "Auch mikrobielle Umsetzungen" },
    ] },
    observation: "Vergleiche zunächst die benannten Magenabschnitte in beiden Skizzen. Am Schädel kannst du erhaltene Zahnreihen und den gebogenen Eckzahn betrachten. Die Funktion innerer Organe kannst du am Knochenfundstück nicht ablesen.",
    limit: "Das Schädelbild belegt keinen Mageninhalt und keinen Gesundheitszustand. Die Skizze vergleicht den anatomischen Grundbauplan; sie erlaubt keine Aussage über Größe oder Futterbedarf eines einzelnen Wildschweins.",
    questions: [
      question("schwein-pansen", "Welche Beschreibung passt zum Verdauungsbauplan des Schwarzwilds?", ["Vier Vormägen wie beim Reh", "Einhöhliger Magen, ohne Pansen-System", "Ein Pansen ohne Darm"], 1, "Schwarzwild ist kein Wiederkäuer. Einhöhlig und zusammengesetzt beschreiben bei Schweinen unterschiedliche Aspekte des Magens.", ["kein-wiederkaeuer", "ein-hohlraum"]),
      question("schwein-mikroben", "Welche Aussage ist fachlich zu pauschal?", ["Beim Schwein wirken Verdauungsenzyme", "Schweine haben einen Dünn- und Dickdarm", "Ohne Pansen gibt es keinerlei mikrobielle Verdauung"], 2, "Mikrobielle Umsetzungen kommen auch beim Schwein vor, besonders im Dickdarm. Ihr Ort und ihre Bedeutung unterscheiden sich vom Wiederkäuer-System.", ["enzyme", "auch-mikroben"]),
    ],
    keywords: ["Wildschwein", "Schwarzwild", "Magen", "Dünndarm", "Dickdarm", "Allesfresser", "Nichtwiederkäuer", "Monogastrier", "Verdauung", "Organe"],
    reviewedOn: digestiveReviewedOn,
  },
];
export function getDigestiveTopic(id) { return digestiveTopics.find(item => item.id === id) || digestiveTopics[0]; }
export const digestiveSearchEntries = digestiveTopics.map(topic => ({ id: `verdauung-${topic.id}`, title: topic.title, href: `/lernen/anatomie?bereich=verdauung&thema=${topic.id}#anatomie-verdauung`, description: topic.summary, category: topic.category, categorySlug: topic.categorySlug, keywords: topic.keywords }));
export const digestiveAssetPaths = [...new Set(digestiveTopics.map(topic => topic.photo.src))];
