import media from "../public/lernen/koerper-kreislauf-2026/mediennachweise.json";

export const parasiteReviewedOn = "2026-10-13";
const source = (title, url, organization, scope) => ({ title, url, organization, scope, reviewedOn: parasiteReviewedOn });
export const parasiteSources = {
  blvTrich: source("BLV · Trichinellose", "https://www.blv.admin.ch/de/trichinellose-de", "Bundesamt für Lebensmittelsicherheit und Veterinärwesen", "Ansteckung über infiziertes Muskelgewebe; Tiere können ohne erkennbare Symptome infiziert sein."),
  bfrTrich: source("BfR · Trichinen (Trichinella)", "https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/parasiten-in-lebensmitteln/trichinen-trichinella/", "Bundesinstitut für Risikobewertung", "Muskellarven als übertragbares Stadium; Vermehrung im Darm; ausgewählte Muskelproben zur Untersuchung. Keine pauschale DACH-Rechtsregel."),
  cdcTrich: source("CDC · DPDx Trichinellosis", "https://www.cdc.gov/dpdx/trichinellosis/", "Centers for Disease Control and Prevention", "Zyklus vom verzehrten Muskelgewebe über erwachsene Darmwürmer zu Muskellarven. Keine klinische Selbstdiagnose."),
  bfrFreeze: source("BfR · Wildfleisch: gesundheitliche Bewertung humanpathogener Parasiten (2018)", "https://www.bfr.bund.de/cm/343/wildfleisch-gesundheitliche-bewertung-von-humanpathogenen-parasiten.pdf", "Bundesinstitut für Risikobewertung", "Gefrieren ist bei Wildfleisch keine verlässliche Trichinellenkontrolle, weil bestimmte Arten kälteresistent sind."),
  ict: { ...source("International Commission on Trichinellosis · Post-harvest control recommendations (2019)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC7033995/", "International Commission on Trichinellosis · mit BfR-Beteiligung", "Fachkonsens zur begrenzten Wirksamkeit des Gefrierens in Wildtieren; mit BfR-Beteiligung, daher keine vollständig unabhängige BfR-Doppelbestätigung. Keine industriellen Zeit-/Temperaturverfahren als Haushaltsanweisung übernommen."), independenceGroup: "Bundesinstitut für Risikobewertung" },
  cdcFreeze: source("CDC · Preventing Trichinellosis, Stand 12.03.2024", "https://www.cdc.gov/trichinellosis/prevention/index.html", "Centers for Disease Control and Prevention", "Gefrieren von Wildfleisch kann Trichinellen wegen der Kälteresistenz bestimmter Arten nicht zuverlässig abtöten. Keine Haushalts-Zeit-/Temperaturanleitung übernommen."),
  fli: source("FLI · Nationales Referenzlabor für Echinokokkose", "https://www.fli.de/de/institute/institut-fuer-epidemiologie-ife/referenzlabore/nrl-fuer-echinokokkose/", "Friedrich-Loeffler-Institut", "Fuchsbandwurm: erwachsene Würmer im Endwirt, Eier im Kot, Larven im Nager; der Mensch ist Fehlzwischenwirt."),
  uzhEchino: source("Universität Zürich · Vorsicht Fuchsbandwurm, Merkblatt (2019)", "https://www.paras.uzh.ch/dam/jcr:338ac7d5-5457-4e5d-b4e1-924081d4d88e/Flyer_Fuchsbandwurm_allgemein_2019.pdf", "Universität Zürich", "Wirtswechsel und orale Eiaufnahme; Hände waschen, pflanzliche Lebensmittel reinigen. Keine individuellen Untersuchungs- oder Behandlungsempfehlungen übernommen."),
  blvEchino: source("BLV · Echinokokkose", "https://www.blv.admin.ch/de/echinokokkose", "Bundesamt für Lebensmittelsicherheit und Veterinärwesen", "Wildtierzyklus zwischen Fuchs und Wühlmäusen; Endwirte durch Fressen befallener Nager, Zwischenwirte durch Aufnahme von Eiern."),
  laves: source("LAVES · Kleiner Fuchsbandwurm", "https://www.laves.niedersachsen.de/startseite/tiere/wildtiere_und_jagd/kleiner-fuchbandwurm-echinococcus-multilocularis-172071.html", "Niedersächsisches Landesamt für Verbraucherschutz und Lebensmittelsicherheit", "Füchse können ohne äußerlich erkennbare Erkrankung infiziert sein; Handschuhe und Vermeidung von Kotkontamination beim Umgang mit Fuchskörpern. Keine in der Quelle genannte Infektionsdosis übernommen."),
  agesEchino: source("AGES · Zoonosen-Datensammlung 2024, Echinokokkose, S. 30–36; Abschnitt geändert am 21.08.2025", "https://www.ages.at/download/sdl-eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2MDk0NTkyMDAsImV4cCI6NDA3MDkwODgwMCwidXNlciI6MCwiZ3JvdXBzIjpbMCwtMV0sImZpbGUiOiJmaWxlYWRtaW4vQUdFU18yMDIyLzJfTUVOU0NIL0tyYW5raGVpdC9ab29ub3Nlbi9EYXRlbnNhbW1sdW5nX1pvb25vc2VuXzIwMjQucGRmIiwicGFnZSI6MjE0Nn0.iIRW8AH6CClId_r5tgwVKAO7X-hOieVx4Jhg9zyx2Zk/Datensammlung_Zoonosen_2024.pdf", "Österreichische Agentur für Gesundheit und Ernährungssicherheit", "Handschuhe bei toten Füchsen/Fuchskot und Handhygiene nach Erdarbeit und Hundekontakt; befallene Füchse können äußerlich unauffällig sein. Keine Prävalenzzahlen, Therapie oder zeitlichen Richtwerte übernommen."),
  meduniFluke: source("Medizinische Universität Wien · Fasziolose, Steckbrief (2017)", "https://pii.meduniwien.ac.at/fileadmin/content/OE/pii/ISPTM/PDF/Steckbrief_Fasziolose__2017_.pdf", "Medizinische Universität Wien", "Fasciola hepatica: Gallengänge, Eier, Zwergschlammschnecke und Metazerkarien an Pflanzen; Aufnahme durch geeignete Endwirte, auch Menschen."),
  nhmwFluke: source("Sattmann & Hörweg · Schnecken als Zwischenwirte, Denisia 42 (2019), S. 559–560", "https://www.zobodat.at/pdf/DENISIA_0042_0555-0566.pdf", "Naturhistorisches Museum Wien", "Unabhängige zoologische Fachpublikation zum Großen Leberegel. Fasciola hepatica wird nicht mit dem Kleinen oder Amerikanischen Riesenleberegel gleichgesetzt."),
};
const fact = (id, title, text, sourceIds) => ({ id, title, text, sourceIds, reviewedOn: parasiteReviewedOn });
const question = (id, prompt, choices, answer, explanation, factIds) => ({ id, prompt, choices, answer, explanation, factIds });
export const parasiteTopics = [
  {
    id: "trichinellen", title: "Trichinellen: Muskelgewebe verbindet die Wirte", scientificName: "Trichinella spp.", category: "Wildbret & Gesundheit", categorySlug: "wildbret-gesundheit",
    summary: "Die Stationen unterscheiden: übertragbare Muskellarve, erwachsener Wurm im Darm und neue Muskellarven. Das Lernbeispiel erklärt den Zyklus ohne Freigabe eines Wildkörpers.",
    photo: media.find(item => item.id === "trichinella-muskellarven"),
    photoContext: "Mikroskopische Aufnahme: Trichinella-spiralis-Larven in der Zwerchfellmuskulatur eines Schweins; ein Zeiger gehört zur Originalaufnahme. Das ist keine Aufnahme eines Wildschweins und keine Sichtkontrolle für den Alltag. Eine Größenmessung wird aus dem unkalibrierten Bild nicht abgeleitet.",
    facts: [
      fact("trich-aufnahme", "Übertragbares Stadium", "Ein neuer Wirt infiziert sich, wenn er Muskelgewebe mit infektiösen Trichinellenlarven frisst. Für Menschen ist rohes oder unzureichend erhitztes infiziertes Fleisch ein Übertragungsweg, auch vom Wildschwein.", ["blvTrich", "bfrTrich"]),
      fact("trich-darm-muskel", "Darm und Muskulatur erfüllen verschiedene Rollen", "Nach der Aufnahme entwickeln sich erwachsene Würmer im Darm. Die Weibchen setzen Larven frei, die in die quergestreifte Muskulatur gelangen. Wird infiziertes Muskelgewebe von einem geeigneten weiteren Wirt gefressen, kann der Zyklus weitergehen.", ["cdcTrich", "bfrTrich"]),
      fact("trich-kontrolle", "Äußerer Eindruck reicht nicht", "Infizierte Tiere können ohne erkennbare Symptome bleiben. Die Trichinellenkontrolle beruht auf geeigneten, eindeutig zugeordneten Proben und Untersuchungen. Ein Foto eines scheinbar unauffälligen Wildkörpers ersetzt diese nicht.", ["blvTrich", "bfrTrich"]),
      fact("trich-gefrieren", "Gefrieren ist kein verlässlicher Ersatz", "Bestimmte Trichinellenarten in Wildtieren tolerieren Kälte. Gefrieren wird daher nicht als verlässliche Kontrolle für Trichinellen in Wildfleisch angesehen. Erforderliche Untersuchungen bleiben ein eigenes Verfahren.", ["bfrFreeze", "cdcFreeze", "ict"]),
    ],
    cycle: { title: "Vom Gewebe zum nächsten Wirt", sourceIds: ["cdcTrich", "bfrTrich"], steps: [
      { title: "Infiziertes Muskelgewebe", text: "Enthält übertragbare Larven" }, { title: "Aufnahme durch Fressen", text: "Ein geeigneter Wirt nimmt die Larven auf" }, { title: "Erwachsene Würmer im Darm", text: "Weibchen setzen neue Larven frei" }, { title: "Larven in der Muskulatur", text: "Gewebeaufnahme kann den Zyklus weiterführen" },
    ] },
    limit: "Es werden biologische Zusammenhänge erklärt. Zulässige Probenahme, Untersuchung, Abgabe und Freigabe hängen vom Ort und vom konkreten Verfahren ab. Eine unauffällige spezielle Untersuchung beantwortet nicht sämtliche Hygiene- oder Kühlfragen.",
    questions: [
      question("trich-stadium", "Was überträgt Trichinellen auf den nächsten Wirt?", ["Larvenhaltiges Muskelgewebe, das gefressen wird", "Bandwurmeier im Fuchskot", "Erwachsene Würmer, die mit dem Kot ausgeschieden werden"], 0, "Bei Trichinellen gelangen die übertragbaren Muskellarven mit dem infizierten Gewebe in einen weiteren Wirt. Die Eier im Fuchskot gehören zum anderen Beispiel des Fuchsbandwurms.", ["trich-aufnahme", "trich-darm-muskel"]),
      question("trich-foto", "Ein Wildschwein wirkt äußerlich unauffällig. Was folgt daraus?", ["Sein Wildbret ist für jede Verwendung sicher", "Eine vorgeschriebene Untersuchung entfällt", "Trichinellen sind damit nicht ausgeschlossen"], 2, "Ein äußerer Eindruck ersetzt geeignete Proben und die erforderliche Untersuchung nicht.", ["trich-kontrolle"]),
    ],
    keywords: ["Trichinen", "Trichinellen", "Trichinellose", "Wildschwein", "Muskellarven", "Fadenwürmer", "Parasiten", "Wirtswechsel", "Tiefgefrieren"], reviewedOn: parasiteReviewedOn,
  },
  {
    id: "fuchsbandwurm", title: "Fuchsbandwurm: Endwirt, Zwischenwirt und Fehlzwischenwirt", scientificName: "Echinococcus multilocularis", category: "Wildbret & Gesundheit", categorySlug: "wildbret-gesundheit",
    summary: "Derselbe Parasit hat unterschiedliche Stadien in unterschiedlichen Wirten. Den Wildtierzyklus von der Eiaufnahme durch den Menschen unterscheiden.",
    photo: media.find(item => item.id === "fuchs"),
    photoContext: "Echter Rotfuchs als Artporträt. Das Foto zeigt den möglichen Endwirt, weder Bandwürmer noch Eier. Ob dieses Tier infiziert ist, ist aus der Aufnahme nicht festzustellen.",
    facts: [
      fact("echino-endwirt", "Erwachsene Würmer im Endwirt", "Im natürlichen Wildtierzyklus ist der Rotfuchs ein Hauptendwirt. Erwachsene Fuchsbandwürmer leben im Darm. Eier gelangen mit dem Kot in die Umwelt. Hunde können ebenfalls Endwirte werden, wenn sie befallene Nagetiere fressen.", ["fli", "blvEchino", "uzhEchino"]),
      fact("echino-nager", "Larven im Zwischenwirt", "Nagetiere, besonders Wühlmäuse, nehmen Eier auf. Larvenstadien entwickeln sich vor allem in der Leber. Frisst ein Fuchs einen befallenen Nager, können sich in seinem Darm wieder erwachsene Bandwürmer entwickeln.", ["fli", "blvEchino", "uzhEchino"]),
      fact("echino-mensch", "Der Mensch nimmt Eier auf", "Der Mensch kann durch unbeabsichtigte Eiaufnahme zum Fehlzwischenwirt werden. Die Larven können eine alveoläre Echinokokkose verursachen. Diese Rolle entspricht nicht der des Fuchses; der Mensch bekommt durch Eiaufnahme keinen erwachsenen Fuchsbandwurm im Darm.", ["fli", "uzhEchino"]),
      fact("echino-hygiene", "Den Übertragungsweg unterbrechen", "Beim Umgang mit Fuchskörpern Handschuhe tragen und Kotkontamination von Kleidung und Gerät vermeiden. Nach Erdarbeiten und Tierkontakt Hände gründlich waschen. Ein gesund wirkender Fuchs ist kein negativer Parasitenbefund.", ["laves", "agesEchino", "uzhEchino"]),
    ],
    cycle: { title: "Wildtierzyklus mit menschlichem Nebenweg", sourceIds: ["fli", "uzhEchino", "blvEchino"], steps: [
      { title: "Fuchs · Endwirt", text: "Erwachsene Würmer im Darm" }, { title: "Kot → Umwelt", text: "Bandwurmeier werden ausgeschieden" }, { title: "Nager · Zwischenwirt", text: "Eier aufnehmen · Larven vor allem in der Leber" }, { title: "Fuchs frisst Nager", text: "Der Wildtierzyklus schließt sich" },
    ], branch: { title: "Mensch · Fehlzwischenwirt", text: "Unbeabsichtigte Aufnahme von Eiern aus der Umwelt; ein Nebenweg des Zyklus, keine notwendige Station zwischen Maus und Fuchs." } },
    limit: "Die Skizze zeigt einen typischen biologischen Zusammenhang und keine regionale Befallswahrscheinlichkeit. Sie beurteilt weder ein bestimmtes Tier noch persönliche Beschwerden. Ein Foto oder ein Fund allein begründet keine individuelle Diagnose.",
    questions: [
      question("echino-rollen", "Welche Zuordnung passt zum typischen Wildtierzyklus?", ["Fuchs als Endwirt, Nager als Zwischenwirt", "Fuchs als Zwischenwirt, Nager als Endwirt", "Mensch als notwendige Station zwischen Nager und Fuchs"], 0, "Im Endwirt entwickeln sich erwachsene Würmer, im Nager Larvenstadien. Der Mensch ist ein möglicher Fehlzwischenwirt.", ["echino-endwirt", "echino-nager", "echino-mensch"]),
      question("echino-ei", "Welches Stadium ist für die Infektion des Menschen entscheidend?", ["Die Larve, die ein Fuchs mit einer Maus frisst", "Das unbeabsichtigt aufgenommene Bandwurmei", "Ein direkt aufgenommener erwachsener Bandwurm"], 1, "Bei Menschen geht es um Eiaufnahme. Der Nager-Verzehr erklärt den Infektionsweg des Fuchses.", ["echino-mensch", "echino-nager"]),
    ],
    keywords: ["Fuchsbandwurm", "Echinococcus", "Echinokokkose", "Fuchs", "Maus", "Wühlmaus", "Endwirt", "Zwischenwirt", "Fehlwirt", "Fehlzwischenwirt", "Bandwurmeier", "Parasiten"], reviewedOn: parasiteReviewedOn,
  },
  {
    id: "grosser-leberegel", title: "Großer Leberegel: Schnecke, Pflanze und Säugetier", scientificName: "Fasciola hepatica", category: "Wildbret & Gesundheit", categorySlug: "wildbret-gesundheit",
    summary: "Die Schnecke ist ein Zwischenwirt. Ein an einer Pflanze haftendes Entwicklungsstadium verbindet sie mit dem nächsten geeigneten Wirt.",
    photo: media.find(item => item.id === "grosser-leberegel"),
    photoContext: "Fotografiertes Lehrpräparat von Fasciola hepatica aus der Universität Edinburgh. Ein tatsächliches Präparatfoto, kein generiertes Bild und kein Befund aus einem DACH-Wildkörper. Ohne Maßstabsangabe lässt sich seine Körpergröße hier nicht messen.",
    facts: [
      fact("fasciola-galle", "Erwachsene Egel in den Gallengängen", "Der Große Leberegel lebt als erwachsenes Stadium in Gallengängen geeigneter Säugetiere, vor allem von Wiederkäuern. Seine Eier gelangen über die Galle in den Darm und mit dem Kot nach außen.", ["meduniFluke", "nhmwFluke"]),
      fact("fasciola-schnecke", "Eine Schnecke als Zwischenwirt", "Aus den Eiern entwickeln sich Larven, die geeignete Schlammschnecken befallen. In Mitteleuropa ist die Zwergschlammschnecke Galba truncatula ein wichtiger Zwischenwirt. In der Schnecke entstehen weitere Larvenstadien.", ["meduniFluke", "nhmwFluke"]),
      fact("fasciola-pflanze", "Infektiöses Stadium an Pflanzen", "Larven verlassen die Schnecke und kapseln sich an Pflanzen als Metazerkarien ein. Werden diese von einem geeigneten Endwirt aufgenommen, entwickeln sich junge Egel und gelangen zur Leber. Auch Menschen können Metazerkarien aufnehmen.", ["meduniFluke", "nhmwFluke"]),
    ],
    cycle: { title: "Der vereinfachte Wirtswechsel", sourceIds: ["meduniFluke", "nhmwFluke"], steps: [
      { title: "Säugetier · Gallengänge", text: "Erwachsene Egel und Eier" }, { title: "Kot → feuchte Umwelt", text: "Aus Eiern entstehen Larven" }, { title: "Schlammschnecke", text: "Entwicklung im Zwischenwirt" }, { title: "Pflanze → geeigneter Endwirt", text: "Metazerkarien werden aufgenommen" },
    ] },
    limit: "Diese Einheit betrifft Fasciola hepatica. Andere Leberegelarten haben abweichende Kreisläufe. Ein heller Fleck in einer Leber erlaubt keine sichere Artbestimmung oder Entscheidung über Genusstauglichkeit; auffällige Befunde fachkundig beurteilen lassen.",
    questions: [
      question("fasciola-schnecke-frage", "Welche Rolle hat die Schlammschnecke?", ["Sie ist der Endwirt mit erwachsenen Egeln in den Gallengängen", "Sie ist ein Zwischenwirt für Larvenstadien", "Sie ist nur ein zufälliger Transportweg ohne Entwicklung des Parasiten"], 1, "Larven entwickeln sich in einer geeigneten Schnecke weiter. Damit gehört sie zum Wirtswechsel.", ["fasciola-schnecke"]),
      question("fasciola-infektioes", "Welches Stadium wird vom geeigneten Endwirt an einer Pflanze aufgenommen?", ["Ein Ei, das sich ohne Zwischenwirt zum erwachsenen Egel entwickelt", "Eine Larve, die noch in der Schnecke lebt", "Eine eingekapselte Metazerkarie"], 2, "Die Metazerkarie verbindet die Pflanzenoberfläche mit dem nächsten Wirt. Dieser Ablauf gehört zum Großen Leberegel.", ["fasciola-pflanze"]),
    ],
    keywords: ["Großer Leberegel", "Grosser Leberegel", "Fasciola hepatica", "Fasziolose", "Galba truncatula", "Zwergschlammschnecke", "Metazerkarien", "Gallengänge", "Parasiten", "Wirtswechsel"], reviewedOn: parasiteReviewedOn,
  },
];
export function getParasiteTopic(id) { return parasiteTopics.find(item => item.id === id) || parasiteTopics[0]; }
export const parasiteSearchEntries = parasiteTopics.map(topic => ({ id: `parasiten-${topic.id}`, title: topic.title, href: `/lernen/wildbret-fallwerkstatt?bereich=parasiten&thema=${topic.id}#wildbret-parasiten`, description: topic.summary, category: topic.category, categorySlug: topic.categorySlug, keywords: topic.keywords }));
export const parasiteAssetPaths = [...new Set(parasiteTopics.map(topic => topic.photo.src))];
