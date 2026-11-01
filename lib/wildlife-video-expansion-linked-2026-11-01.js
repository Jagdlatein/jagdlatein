// Original source metadata, contact sheets and all question-time frames were
// read for these scenes. This does not claim uninterrupted playback or audio
// review. The existing linked courses explain the separate biological context.
const directory = "/lernen/videos-wildarten-2026-11-01";
const modifications = "Vollständige Originalaufnahme als MP4/H.264 neu kodiert und auf codecgeeignete Bildmaße bis 1280 Pixel Breite skaliert; ursprüngliche Abspielgeschwindigkeit, kein Zuschnitt und keine zusätzlichen Schnitte oder Montage von Jagdlatein. Vorhandene positive Startzeitstempel werden auf 0 normalisiert; alle dekodierten Videobilder bleiben erhalten. Einstellungswechsel der Originalquelle bleiben erhalten. Vorhandener Originalton als AAC. Vorschaubild: Standbild derselben Aufnahme.";
const media = id => ({ src: `${directory}/${id}.mp4`, poster: `${directory}/${id}-vorschau.jpg`, mimeType: "video/mp4", reviewedOn: "2026-11-01", modifications });

export const wildlifeVideoLinkedExpansionNov01Cases = [
  {
    id: "muffelwild-granat", title: "Muffelwild im Naturwildpark", speciesSlug: "muffelwild", species: "Muffelwild – Ovis musimon", ...media("muffelwild-granat"),
    location: "Naturwildpark Granat, Haltern am See, Deutschland · Aufnahmedatum nicht belegt", duration: 43,
    author: "Frank Vincentz", source: "https://commons.wikimedia.org/wiki/File:Haltern_-_Naturwildpark_Granat_-_Ovis_orientalis_musimon_03_(1)_ies.webm",
    license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    knowledgeSources: [
      { label: "Wildtierportal Bayern: Gehörnentwicklung und Jägersprache", url: "https://www.wildtierportal.bayern.de/wildtiere_bayern/096779/index.php", supports: "Schnecken als Hörner des Widders; kein regelmäßiger Geweihabwurf. Keine Alters-, Längen- oder Wachstumswerte übernommen." },
      { label: "Deutscher Jagdverband: Mufflon, Kennzeichen des Widders", url: "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/mufflon-ovis-ammon-musimon", supports: "Eigenständig verfasste fachliche Bestätigung von Schnecken und fehlendem regelmäßigem Abwurf; keine zusätzlichen Aussagen über Herkunft oder Wachstum übernommen." },
    ],
    tags: ["Muffelwild", "Mufflon", "Widder", "Hörner", "Schnecken", "Körperansicht", "Wildpark"], course: "/kurse/wissen-ausbau-jaegersprache#lesson-kopfschmuck",
    transcript: "Ein Muffelwidder bewegt sich auf einem Weg zwischen Bäumen. Im Vordergrund fallen zwei kräftige, stark gebogene Hörner am Kopf auf. Die spätere Seitenansicht zeigt braunes Fell, einen dunkleren Halsbereich und helleres Fell an der Unterseite des Rumpfes. Bei Muffelwiddern heißen diese Hörner Schnecken; anders als Geweihe werden sie nicht regelmäßig abgeworfen. Das erklärt der verknüpfte Lernkurs – ein kurzer Film kann den jährlichen Wechsel nicht nachweisen. Im Hintergrund sind Menschen und weitere Tiere zu sehen. Die Quelle benennt Muffelwild als Ovis orientalis musimon beziehungsweise Ovis musimon im Naturwildpark Granat in Haltern am See. Das genaue Aufnahmedatum ist nicht belegt. Alter, Gesundheitszustand und die vollständige Tierzahl bleiben offen.",
    observations: [
      "Die kräftigen, gebogenen Hörner in der frühen Frontalansicht betrachten.",
      "In der späteren Seitenansicht hellere Rumpfunterseite und dunkleren Hals vergleichen.",
      "Den sichtbaren Parkkontext von Aussagen über freilebende Bestände trennen; das Aufnahmedatum bleibt offen.",
    ],
    questions: [
      { id: "gebogene-hoerner", at: 3, question: "Welche Form zeigt der Kopfschmuck des näheren Muffelwidders in der frühen Frontalansicht?", choices: ["Zwei kräftige, bogenförmig eingerollte Hörner seitlich am Kopf.", "Verzweigte Stangen mit mehreren geraden Enden über dem Kopf.", "Zwei kurze, nahezu gerade Spitzen ohne erkennbare Krümmung."], answer: 0, explanation: "Die Frontalansicht zeigt kräftige, gebogene Hörner auf beiden Kopfseiten. Beim Muffelwidder heißen sie Schnecken. Der verknüpfte Kurs unterscheidet diese bleibenden Hörner vom regelmäßig erneuerten Geweih; der Film allein belegt keinen Jahreszyklus und kein genaues Alter." },
      { id: "fellverteilung", at: 40, question: "Wie verteilt sich die Fellhelligkeit am größeren, seitlich sichtbaren Muffelwidder links der Wegmitte?", choices: ["Ein breites schneeweißes Feld reicht über die obere Flanke bis zum Rücken.", "Rumpfunterseite und Hals erscheinen gleichmäßig dunkel; nur die Läufe sind heller.", "Die Rumpfunterseite erscheint heller als Rücken und Halsbereich."], answer: 2, explanation: "In der Seitenansicht ist die Unterseite des Rumpfes heller als der braune Rücken und der dunklere Hals. Ein deutlich abgegrenztes weißes Sattelfeld wird in dieser Ansicht nicht behauptet. Die sichtbare Fellverteilung liefert keinen genauen Alters- oder Gesundheitsnachweis." },
    ],
  },
  {
    id: "graugans-dresden", title: "Graugänse am Dresdner Ufer", speciesSlug: "graugans", species: "Graugans – Anser anser", ...media("graugans-dresden"),
    location: "Terrassenufer Dresden, Deutschland · 1. April 2024", duration: 11,
    author: "Fiver, der Hellseher", source: "https://commons.wikimedia.org/wiki/File:Mehere_Graug%C3%A4nse_am_Terrassenufer_in_Dresden_(1).webm",
    license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    tags: ["Graugans", "Gänse", "Wasservögel", "Schnabel", "Gefieder", "Körperansicht"], course: "/kurse/wissen-vertiefung-wild-wasservoegel-jahreslauf",
    soundHref: "/lernen/tierstimmen?stimme=graugans#tierstimme-title",
    transcript: "Drei Graugänse schwimmen vor einem steinigen, mit trockenen Stängeln und Gras bewachsenen Ufer. Die Seitenansichten zeigen einen grauen Hals und Rücken, hellere Körperunterseiten sowie dunklere, hell gesäumte Federflächen am angelegten Flügel. Die Schnäbel heben sich hell und warmfarbig vom grauen Kopfgefieder ab. In der mittleren Phase zeigen zwei Vögel stärker ihre Vorderseite, während der rechte Vogel seitlich zu sehen ist. Später liegen wieder deutlichere Seitenansichten vor. Nutze diese Merkmalskombination, statt die Art allein aus dem Schwimmen abzuleiten. Die Originalquelle nennt Graugänse, Anser anser, das Terrassenufer in Dresden und den 1. April 2024. Die Füße sind unter Wasser nicht erkennbar. Geschlecht, Alter, Verwandtschaft und der Grund gemeinsamer Bewegung werden aus dem kurzen Ausschnitt nicht bestimmt.",
    observations: [
      "Helle, warmfarbige Schnäbel vom grauen Kopf- und Halsgefieder unterscheiden.",
      "Dunklere Federflächen am angelegten Flügel mit der helleren Körperunterseite vergleichen.",
      "Frontalere und seitliche Ansichten vergleichen; die Füße bleiben unter Wasser unsichtbar.",
    ],
    questions: [
      { id: "schnabel-hals-kombination", at: 1, question: "Welche Kombination von Schnabel und Kopfgefieder ist an den seitlich sichtbaren Graugänsen erkennbar?", choices: ["Dunkle Schnäbel mit schmalem hellem Mittelband vor durchgehend dunklen Hälsen.", "Helle, warmfarbige Schnäbel vor grauem Kopf- und Halsgefieder.", "Schwarze Schnäbel und breite weiße Wangenfelder an schwarzen Hälsen."], answer: 1, explanation: "Die Schnäbel erscheinen deutlich heller und warmfarbiger als das graue Kopf- und Halsgefieder. Breite weiße Wangenfelder an schwarzen Hälsen sind hier nicht zu sehen. Die Quelle benennt Anser anser; die beobachteten Merkmale ergänzen diese Artangabe, während Schwimmen allein keine Artbestimmung trägt." },
      { id: "fluegel-unterseite", at: 9, question: "Welcher Helligkeitsunterschied ist am seitlich sichtbaren mittleren Vogel zu erkennen?", choices: ["Dunklere Federflächen am angelegten Flügel liegen über einer helleren Körperunterseite.", "Ein breites weißes Flügelfeld liegt über einer gleichmäßig schwarzen Körperunterseite.", "Flügel und Körperunterseite sind gleichmäßig dunkel; nur ein weißer Halsring hebt sich ab."], answer: 0, explanation: "Am mittleren Vogel sind dunklere, hell gesäumte Flügelfedern über dem helleren unteren Rumpf sichtbar. Ein weißer Halsring oder eine schwarze Körperunterseite passen nicht zu dieser Ansicht. Der angelegte Flügel zeigt dabei kein Flugbild; Aussagen über helle Vorderflügel im Flug werden aus dieser Aufnahme nicht abgeleitet." },
    ],
  },
];
