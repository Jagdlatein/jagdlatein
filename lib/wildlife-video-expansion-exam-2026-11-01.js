// Source metadata and distributed MP4 frame samples were read for these scenes,
// including the three question times. No uninterrupted playback or new general
// biology review is claimed; the linked courses supply the separate depth.
const directory = "/lernen/videos-pruefungswissen-2026-11-01";
const modifications = "Vollständige Originalaufnahme als MP4/H.264 neu kodiert und auf codecgeeignete Bildmaße bis 1280 Pixel Breite skaliert; ursprüngliche Abspielgeschwindigkeit, kein Zuschnitt und keine zusätzlichen Schnitte oder Montage von Jagdlatein. Vorhandene positive Startzeitstempel werden auf 0 normalisiert; alle dekodierten Videobilder bleiben erhalten. Einstellungswechsel der Originalquelle bleiben erhalten. Vorhandener Originalton als AAC. Vorschaubild: Standbild derselben Aufnahme.";
const media = id => ({ src: `${directory}/${id}.mp4`, poster: `${directory}/${id}-vorschau.jpg`, mimeType: "video/mp4", reviewedOn: "2026-11-01", modifications });

export const wildlifeVideoExamExpansionNov01Cases = [
  {
    id: "damwild-dyrehaven", title: "Damwild zwischen Bäumen", speciesSlug: "damwild", species: "Damwild – Dama dama", ...media("damwild-dyrehaven"),
    location: "Dyrehaven, Dänemark · 8. November 2015", duration: 22,
    author: "Thue", source: "https://commons.wikimedia.org/wiki/File:Fallow_deer_in_Dyrehaven_1.webm",
    license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    tags: ["Damwild", "Damhirsch", "Bäume", "Verdeckung", "Körperansicht"], course: "/kurse/wissen-vertiefung-wild-hirsche-vergleichen",
    soundHref: "/lernen/tierstimmen?stimme=damhirsch#tierstimme-title",
    transcript: "Mehrere Tiere des Damwilds stehen und bewegen sich zwischen Bäumen auf einem mit Laub bedeckten Boden. Dicke Stämme im Vordergrund und dünnere Äste verdecken wiederholt Teile ihrer Körper. In einer mittleren Phase ist ein Tier seitlich zwischen den Stämmen zu sehen; später zeigen einige Tiere der Kamera die Hinterseite. Dabei treten helle Fellflächen am Hinterkörper hervor. Vergleiche diese Ansichten mit den festen Stämmen als Bezugspunkten. Eine veränderte Sichtbarkeit bedeutet nicht automatisch, dass ein Tier die gesamte Umgebung verlassen hat. Die Quelle bezeichnet die Tiere als Dama dama und nennt Dyrehaven in Dänemark sowie den 8. November 2015. Der Ausschnitt belegt weder die vollständige Gruppengröße noch ein genaues Alter. Eine bestimmte aufgenommene Nahrung ist ebenfalls nicht erkennbar.",
    observations: [
      "Stämme und Äste vor den Tieren als konkrete Verdeckung benennen.",
      "Die seitliche Körperansicht in der mittleren Phase von späteren Rückansichten unterscheiden.",
      "Helle Fellflächen am Hinterkörper beschreiben, ohne daraus ein genaues Alter abzuleiten.",
    ],
    questions: [
      { id: "stammverdeckung", at: 2, question: "Was begrenzt im frühen Ausschnitt den Blick auf Teile der Damwildkörper?", choices: ["Stämme und Äste liegen zwischen Kamera und Tieren.", "Nur die ähnlichen Fell- und Bodenfarben; kein Gegenstand liegt vor den Tieren.", "Nur die Bildgröße; die Körper sind durchgehend unverdeckt zu sehen."], answer: 0, explanation: "Die Stämme und quer verlaufenden Äste verdecken tatsächlich Körperbereiche. Verdeckung ist von geringer Bildgröße oder ähnlichen Farben zu unterscheiden; fehlende Körperteile werden nicht als sichtbare Beobachtung ergänzt." },
      { id: "seitenansicht", at: 9, question: "Welche Ansicht zeigt das größere, zwischen den Stämmen erkennbare Tier in dieser mittleren Phase?", choices: ["Eine Frontalansicht, bei der Kopf und Brust zur Kamera weisen.", "Eine seitliche Rumpfansicht mit dem Kopf nach rechts.", "Eine Rückansicht, bei der der Kopf vollständig von der Kamera wegweist."], answer: 1, explanation: "Der Rumpf ist seitlich zu sehen, der Kopf liegt rechts davon. Andere Tiere und Äste bleiben im Hintergrund beziehungsweise davor sichtbar. Diese Ansicht wird beschrieben, ohne daraus ein genaues Lebensalter zu bestimmen." },
      { id: "rueckansicht", at: 17, question: "Welchen Körperbereich zeigt das größer erkennbare Tier in der rechten Bildhälfte gegen Ende besonders deutlich?", choices: ["Die Vorderseite mit Brust und frontal zur Kamera gerichtetem Kopf.", "Die gesamte Flanke in einer reinen Seitenansicht.", "Die Hinterseite mit einer hellen Fellfläche."], answer: 2, explanation: "Das deutlich erkennbare Tier in der rechten Bildhälfte zeigt der Kamera vor allem seine Hinterseite mit heller Fellfläche. Das ist eine andere Körperansicht als die seitliche Ansicht zuvor; die sichtbare Anzahl ist kein Gesamtbestand." },
    ],
  },
  {
    id: "blaesshuhn-bled", title: "Blässhühner auf dem Wasser", speciesSlug: "blaesshuhn", species: "Blässhuhn – Fulica atra", ...media("blaesshuhn-bled"),
    location: "Bleder See, Bled, Slowenien · 8. Januar 2022", duration: 26,
    author: "NaIzletuSi ™", source: "https://commons.wikimedia.org/wiki/File:2022-01-08_BLED_GRUIFORMES_Fulica_atra_LISKA.webm",
    license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    tags: ["Blässhuhn", "Rallen", "Wasser", "Kopfmerkmale", "Reflexion", "Beobachtungsgrenze"], course: "/kurse/wissen-ausbau-biologie-vogelkoerper-2026#lesson-schwimmlappen",
    soundHref: "/lernen/tierstimmen?stimme=blaesshuhn#tierstimme-title",
    transcript: "Im Ausschnitt sind zwei Blässhühner auf einer Wasserfläche sichtbar. Ihr Gefieder erscheint überwiegend dunkel; am Kopf heben sich helle Schnäbel und vordere Stirnpartien ab. Die Vögel verändern ihre Lage zueinander und zur Kamera. In der mittleren Phase ist einer stärker von hinten zu sehen, während der andere seitlicher im Bild bleibt. Später fallen sehr helle Sonnenreflexe in den linken Bildbereich und überstrahlen Teile der Wasseroberfläche sowie die Ansicht eines Vogels. Vergleiche diese Ansichten, statt jede Helligkeitsänderung dem Gefieder zuzuschreiben. Die Quelle nennt Fulica atra, den Bleder See in Slowenien und den 8. Januar 2022. Füße und Schwimmlappen sind hier nicht erkennbar. Eine bestimmte Nahrung oder der Gesundheitszustand werden aus dem Schwimmen nicht bestimmt.",
    observations: [
      "Die hellen Schnäbel und vorderen Stirnpartien vom dunklen Gefieder unterscheiden.",
      "Seitliche Ansicht und Rückansicht der beiden sichtbaren Vögel vergleichen.",
      "Starke Wasserreflexe als Grenze der Merkmalsansicht berücksichtigen; die Füße bleiben unsichtbar.",
    ],
    questions: [
      { id: "helle-kopfpartien", at: 2, question: "Welche hellen Partien heben sich in der frühen Ansicht vom dunklen Gefieder der Blässhühner ab?", choices: ["Ein geschlossener heller Ring rund um den Hals.", "Schnäbel und vordere Stirnpartien.", "Breite helle Wangenfelder an beiden Kopfseiten."], answer: 1, explanation: "Helle Schnäbel und vordere Stirnpartien sind vor dem dunkleren Kopfgefieder zu erkennen. Ein durchgehender Halsring oder breite helle Wangenfelder sind in diesen Ansichten nicht sichtbar. Mehrere tatsächlich sichtbare Merkmale werden gemeinsam beschrieben." },
      { id: "unterschiedliche-ansichten", at: 9, question: "Wie unterscheiden sich die Körperansichten der beiden Blässhühner in diesem mittleren Abschnitt?", choices: ["Beide zeigen ihre Brust frontal zur Kamera.", "Beide zeigen dieselbe Seitenansicht und weisen mit dem Kopf in dieselbe Richtung.", "Der obere Vogel zeigt stärker seine Hinterseite, der andere bleibt seitlicher sichtbar."], answer: 2, explanation: "Der Vogel oben rechts ist stärker von hinten zu sehen, der andere bietet eine seitlichere Ansicht. Unterschiedliche Ansichten derselben Art können deshalb verschiedene Gefiederflächen zeigen. Die Füße sind daraus nicht zu beurteilen." },
      { id: "wasserreflexe", at: 17, question: "Was erschwert im späteren Abschnitt besonders die Ansicht des Vogels im linken Bildbereich?", choices: ["Sehr helle Reflexe auf der Wasseroberfläche überstrahlen Teile der Ansicht.", "Der Vogel taucht vollständig unter, sodass nur Wasser zu sehen bleibt.", "Dunkle Schatten der Ufervegetation verdecken seinen ganzen Körper."], answer: 0, explanation: "Die hellen Sonnenreflexe auf dem Wasser beeinträchtigen die Ansicht des linken Vogels. Sein Körper ist nicht vollständig abgetaucht. Die Helligkeitsänderung wird deshalb als Aufnahmebedingung und nicht als veränderte Gefiederfarbe beschrieben." },
    ],
  },
];
