// Original source descriptions/licences, both contact sheets and every supplied
// question-time frame were read. No uninterrupted playback, listening or device
// check is claimed. The linked courses provide separate anatomical context.
const directory = "/lernen/videos-wildkunde-2026-11-01";
const modifications = "Vollständige Originalaufnahme als MP4/H.264 neu kodiert und auf codecgeeignete Bildmaße bis 1280 Pixel Breite skaliert; ursprüngliche Abspielgeschwindigkeit, kein Zuschnitt und keine zusätzlichen Schnitte oder Montage von Jagdlatein. Vorhandene positive Startzeitstempel werden auf 0 normalisiert; alle dekodierten Videobilder bleiben erhalten. Einstellungswechsel der Originalquelle bleiben erhalten. Vorhandener Originalton als AAC. Vorschaubild: Standbild derselben Aufnahme.";
const media = id => ({ src: `${directory}/${id}.mp4`, poster: `${directory}/${id}-vorschau.jpg`, mimeType: "video/mp4", reviewedOn: "2026-11-01", modifications });

export const wildlifeVideoFieldExpansionNov01Cases = [
  {
    id: "steinwild-ljubljana", title: "Steinwild im Zoo Ljubljana", speciesSlug: "steinwild", species: "Alpensteinbock – Capra ibex", ...media("steinwild-ljubljana"),
    location: "Zoo Ljubljana, Slowenien · 2023, genaues Aufnahmedatum ungeklärt", duration: 29,
    author: "NaIzletuSi ™", source: "https://commons.wikimedia.org/wiki/File:2023-08-18_ZOO_LJUBLJANA_-_Capra_ibex_ibex.webm",
    license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    knowledgeSources: [
      { label: "Schweizerischer Nationalpark und SCNAT: Focus Steinbock, Entwicklung der Hörner", url: "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Steinbock.pdf", supports: "Wülste an der Hornvorderkante und Jahresringe an der Hornhinterseite sind verschiedene Strukturen. Keine Altersformel oder Wachstumswerte übernommen." },
      { label: "Naturpark Beverin: Wissensheft Steinbock, Imposante Hörner", url: "https://www.naturpark-beverin.ch/sites/naturpark_beverin/files/2021-10/Wissensheft_Der%20Steinbock%20im%20Naturpark%20Beverin.pdf", supports: "Eigenständig formulierte Bestätigung: vordere Schmuckknoten stimmen nicht mit Jahresringen überein und erlauben keine sichere Altersbestimmung. Keine Zahlen oder Leistungsangaben übernommen." },
    ],
    tags: ["Steinwild", "Alpensteinbock", "Hörner", "Hornbogen", "Querwülste", "Zoo"], course: "/kurse/wissen-gams-steinbock#lesson-berg-merkmale",
    transcript: "Ein Alpensteinbock liegt auf steinigem Boden. Zwei lange Hörner verlaufen in deutlichen Bögen nach hinten. Auf ihrer Vorderseite sind kräftige Querwülste zu erkennen. Die Seitenansicht zeigt diese Erhebungen besonders deutlich. Das Tier verändert die Kopf- und Beinhaltung. Die Querwülste an der Vorderseite sind von den Jahresringen an der Hornrückseite zu unterscheiden. Im Film werden die Wülste deshalb nicht als gezählte Lebensjahre ausgegeben. Die Originalquelle bezeichnet das Tier als Capra ibex ibex im Zoo Ljubljana in Slowenien. Ihr Titel nennt den 18. August 2023, das Datumsfeld dagegen den 20. August. Das genaue Aufnahmedatum bleibt ungeklärt. Die Zooaufnahme belegt keine freilebende Population und erlaubt keine sichere Gesundheitsbeurteilung.",
    observations: [
      "Die langen, nach hinten verlaufenden Hornbögen in der frühen Ansicht betrachten.",
      "Die kräftigen Querwülste auf den Hornvorderseiten als sichtbare Oberflächenform beschreiben.",
      "Zoo und widersprüchliche Datumsangaben der Quelle ausdrücklich von freilebendem Vorkommen und gesichertem Aufnahmedatum trennen.",
    ],
    questions: [
      { id: "hornboegen", at: 3, question: "Welchen Verlauf zeigen die langen Hörner des liegenden Alpensteinbocks?", choices: ["Sie ziehen in deutlichen Bögen nach hinten.", "Sie verzweigen sich in mehrere gerade Enden über dem Kopf.", "Sie bleiben kurz und fast gerade; nur die äußersten Spitzen sind gekrümmt."], answer: 0, explanation: "Beide Hörner verlaufen als lange, unverzweigte Bögen nach hinten. Eine verzweigte Stangenform oder nur kurze Spitzen passen nicht zur sichtbaren Ansicht. Der verknüpfte Kurs vergleicht solche Hornmerkmale, ohne aus einer Silhouette ein genaues Alter abzuleiten." },
      { id: "hornoberflaeche", at: 13, question: "Welche Oberflächenform ist an den Vorderseiten der langen Hornbögen deutlich erkennbar?", choices: ["Eine gleichmäßig glatte Fläche ohne erkennbare Erhebungen.", "Eine Folge kräftiger, quer verlaufender Wülste.", "Mehrere lange Seitenäste, die sich vom Horn abzweigen."], answer: 1, explanation: "Auf den Hornvorderseiten treten kräftige Querwülste hervor. Sie sind Erhebungen der Oberfläche und keine seitlichen Verzweigungen. Ihre sichtbare Zahl wird hier nicht in Lebensjahre umgerechnet; der kurze Ausschnitt liefert keine belastbare Altersbestimmung." },
    ],
  },
  {
    id: "reiherente-petrosawodsk", title: "Reiherente auf dem Wasser", speciesSlug: "reiherente", species: "Reiherente – Aythya fuligula", ...media("reiherente-petrosawodsk"),
    location: "Französischer Teich, Petrosawodsk, Republik Karelien, Russland · 7. Mai 2025", duration: 28,
    author: "Olksolo", source: "https://commons.wikimedia.org/wiki/File:%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B7%D0%B0%D0%B2%D0%BE%D0%B4%D1%81%D0%BA%2C_%D0%A4%D1%80%D0%B0%D0%BD%D1%86%D1%83%D0%B7%D1%81%D0%BA%D0%B8%D0%B9_%D0%BF%D1%80%D1%83%D0%B4%2C_%D1%85%D0%BE%D1%85%D0%BB%D0%B0%D1%82%D0%B0%D1%8F_%D1%87%D0%B5%D1%80%D0%BD%D0%B5%D1%82%D1%8C_%282%29.webm",
    license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    tags: ["Reiherente", "Tauchenten", "Wasservögel", "Flanke", "Gefieder", "Sichtgrenze"], course: "/kurse/wissen-federwild-beobachtung#lesson-vogel-merkmale",
    soundHref: "/lernen/tierstimmen?stimme=reiherente#tierstimme-title",
    transcript: "Eine Reiherente schwimmt auf einer Wasserfläche. In der frühen Seitenansicht hebt sich die weiße Flanke deutlich vom dunklen Rücken und dunklen Kopf ab. Bei einer stärker von hinten gesehenen Haltung wirkt diese helle Fläche schmaler. Später ist der Körper wieder seitlicher zu sehen; hinter dem Vogel bleibt eine Spur bewegten Wassers. Vergleiche Gefiederbereiche und Ansichten, statt aus jedem veränderten Umriss ein anderes Tiermerkmal abzuleiten. Die Originalquelle nennt Aythya fuligula, den Französischen Teich in Petrosawodsk in der russischen Republik Karelien und den 7. Mai 2025. Die Füße bleiben unter Wasser; Zehenform und Gelenkfolge können hier nicht beurteilt werden. Schwimmen allein belegt weder einen Tauchgang noch eine bestimmte aufgenommene Nahrung. Alter und Gesundheitszustand bleiben offen.",
    observations: [
      "Die helle Flanke vom dunklen Kopf und Rücken der frühen Seitenansicht unterscheiden.",
      "Die sichtbare Flankenfläche bei seitlicherer und stärkerer Rückansicht vergleichen.",
      "Füße und Zehenform als unter Wasser verborgene Merkmale offenlassen; Schwimmen nicht mit einem beobachteten Tauchgang gleichsetzen.",
    ],
    questions: [
      { id: "gefiederkontrast", at: 3, question: "Welche Gefiederkombination zeigt die Reiherente in der frühen Seitenansicht?", choices: ["Einen hellen Kopf und Rücken über einer dunklen Flanke.", "Ein durchgehend dunkles Gefieder ohne abgegrenzte helle Seitenfläche.", "Eine helle Flanke unter dunklem Rücken bei ebenfalls dunklem Kopf."], answer: 2, explanation: "Die weiße Flanke hebt sich deutlich von Rücken und Kopf ab, die dunkel erscheinen. Das ist ein konkreter Gefiederkontrast der sichtbaren Ansicht. Die Quelle nennt Aythya fuligula; aus dem Schwimmen allein oder einer unklaren kleinen Kopfkontur werden keine zusätzlichen Merkmale und kein genaues Alter ergänzt." },
      { id: "fuesse-sichtgrenze", at: 11, question: "Welche Aussage zur anatomischen Ansicht der Füße passt zu diesem schwimmenden Vogel?", choices: ["Die Füße liegen unter Wasser; ihre Zehenform ist nicht erkennbar.", "Beide Füße stehen seitlich aus dem Wasser; die Zehen lassen sich deutlich unterscheiden.", "Ein nach hinten gehaltener Fuß ist sichtbar, nur der andere bleibt verdeckt."], answer: 0, explanation: "Die Füße sind unter der Wasseroberfläche verborgen. Ihre Zehenform und die Gelenkfolge können an dieser Aufnahme nicht überprüft werden. Die sichtbaren Gefiederflächen ersetzen keine Fußansicht; eine allgemeine anatomische Erklärung muss deshalb von dem getrennt bleiben, was dieser Film tatsächlich zeigt." },
    ],
  },
];
