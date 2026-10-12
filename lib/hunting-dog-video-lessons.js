const mediaRoot = "/lernen/hundevideos-2026";

export const dogVideoSources = {
  fciBasset: { organization: "FCI", label: "Basset Hound – Rassestandard 163", url: "https://www.fci.be/Nomenclature/Standards/163g06-en.pdf" },
  fciGolden: { organization: "FCI", label: "Golden Retriever – Rassestandard 111", url: "https://www.fci.be/Nomenclature/Standards/111g08-en.pdf" },
  fciLabrador: { organization: "FCI", label: "Labrador Retriever – Rassestandard 122", url: "https://www.fci.be/Nomenclature/Standards/122g08-en.pdf" },
  jghv: { organization: "JGHV", label: "Verbandszuchtprüfungen: Nasengebrauch, Spur und Zusammenarbeit", url: "https://jghv.de/images/managed/dateien/2024/service/pruefungsordnungen-des-jghv/VZPO_2018_Druck_3.pdf" },
  avsab: { organization: "AVSAB", label: "Tierärztliche Stellungnahme zu belohnungsbasiertem Hundetraining", url: "https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf" },
  rspcaTraining: { organization: "RSPCA", label: "Wie Hunde lernen: Belohnung, kurze Einheiten und wenig Ablenkung", url: "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training" },
  rspcaBody: { organization: "RSPCA", label: "Körpersprache im Zusammenhang betrachten", url: "https://www.rspca.org.uk/en/adviceandwelfare/pets/dogs/behaviour/understanding" },
  dogsTrustBody: { organization: "Dogs Trust", label: "Rutenbewegung anhand der gesamten Körpersprache einordnen", url: "https://www.dogstrust.org.uk/dog-advice/understanding-your-dog/body-language" },
  pdsaWater: { organization: "PDSA", label: "Schwimmen, Beaufsichtigung und sichere Gewässer", url: "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/water-safety" },
};

// The timed observations were checked against frames of these exact recordings.
// Breed and recording context come from the original file descriptions; they do
// not establish the individual dog's qualification, training history or emotions.
export const huntingDogVideoLessons = [
  {
    id: "basset-faehrtenende", title: "Basset: Was ein Fährtenende zeigt", breed: "Basset Hound", duration: 27.74,
    src: `${mediaRoot}/basset-faehrtenende.mp4`, poster: `${mediaRoot}/basset-faehrtenende-vorschau.jpg`, captions: `${mediaRoot}/basset-faehrtenende.de.vtt`,
    tags: ["Basset", "Fährte", "Nase", "Spur", "Schweiß", "Laufhund", "Beobachtung"],
    media: { author: "Cali1008", source: "https://commons.wikimedia.org/wiki/File:Viltspar_skank.ogv", original: "https://upload.wikimedia.org/wikipedia/commons/9/97/Viltspar_skank.ogv", license: "Gemeinfrei – vom Urheber freigegeben", licenseUrl: "https://commons.wikimedia.org/wiki/File:Viltspar_skank.ogv#Licensing", recordingDate: "Aufnahmedatum nicht angegeben; Upload am 6. August 2010", changes: "In MP4 umgewandelt, Ton entfernt, deutsche Handlungstexte ergänzt. Vorschau: Bild aus derselben Aufnahme." },
    transcript: "Ein kurzbeiniger, weiß-brauner Hund mit langen Hängeohren steht zwischen Pflanzen. Sein Kopf ist mehrfach nach oben zur Kamera gerichtet; das Maul öffnet sich. Später dreht er sich und senkt den Kopf in Richtung Boden. Die Kamera bewegt sich mit. Die Aufnahme zeigt den Fährtenverlauf vor dieser Szene nicht. Die hier bereitgestellte Fassung hat keinen Ton.",
    observations: [
      { at: "0–10 s", text: "Der Hund steht in der Vegetation und richtet den Kopf mehrfach nach oben. Diese Kopfhaltung ist in diesem Abschnitt sichtbar." },
      { at: "15–25 s", text: "Er verändert seine Position und senkt den Kopf. Ein zusammenhängender Weg entlang einer markierten Fährte ist nicht dokumentiert." },
    ],
    context: "Der Urheber beschreibt den Basset als Hund nach einer erfolgreichen Fährtenarbeit. Das ist der Quellenkontext. Die vorangegangene Suche und der Aufbau der Fährte sind im Clip nicht zu sehen.",
    lesson: "Der Basset Hound gehört laut FCI zu den kleinen Laufhunden. Beim Lernen über Nasenarbeit lohnt sich die Unterscheidung zwischen der Rassebeschreibung und einer beobachteten Arbeitsleistung. Der JGHV beurteilt unter anderem Nasengebrauch und Spurarbeit anhand des Arbeitsverlaufs. Eine einzelne Kopfhaltung am Ende ersetzt diese Beobachtung nicht.",
    practice: "Halte in einem Beobachtungsprotokoll fest, welcher Abschnitt tatsächlich vorliegt: Beginn, Verlauf oder Ende. Notiere Kopfhaltung, Weg und Unterbrechungen getrennt. Aus einem hoch getragenen Kopf folgt weder ‚schlechte Nase‘ noch ‚Spur verloren‘. Eine echte Nachsuche gehört in die Hände eines dafür geeigneten, ausgebildeten Teams.",
    sources: ["fciBasset", "jghv", "rspcaBody"],
    questions: [
      { id: "quellenkontext", question: "Was lässt sich über die erfolgreiche Fährtenarbeit sagen?", choices: ["Der Urheber nennt diesen Kontext; der vorangegangene Fährtenverlauf ist im Clip nicht sichtbar.", "Die Aufnahme zeigt die gesamte Suche vom Ansatz bis zum Fund.", "Jeder hoch gehaltene Kopf beweist eine verlorene Spur."], answer: 0, explanation: "Die Dokumentation beginnt nach der vom Urheber beschriebenen Arbeit. Beschreibe den sichtbaren Abschnitt und kennzeichne zusätzliche Quellenangaben als Kontext." },
      { id: "kopfhaltung", question: "Welche Notiz ist eine direkte Beobachtung?", choices: ["Der Hund hat die beste Nase aller Laufhunde.", "Der Hund richtet im ersten Abschnitt den Kopf nach oben.", "Der Hund hat an jeder Abzweigung die richtige Entscheidung getroffen."], answer: 1, explanation: "Die Kopfhaltung ist erkennbar. Vergleichsleistung, Fährtenentscheidungen und die davor liegende Suche sind durch diese Szene nicht nachgewiesen." },
    ],
  },
  {
    id: "labrador-signal", title: "Labrador: Ein gelerntes Lautsignal", breed: "Labrador Retriever", duration: 8.38,
    src: `${mediaRoot}/labrador-signal.mp4`, poster: `${mediaRoot}/labrador-signal-vorschau.jpg`, captions: `${mediaRoot}/labrador-signal.de.vtt`,
    tags: ["Labrador", "Retriever", "Signal", "Lautgeben", "Bellen", "Training", "Belohnung", "Gehorsam"],
    media: { author: "Sadie Campbell", source: "https://commons.wikimedia.org/wiki/File:Labrador_barking_on_command.theora.ogv", original: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Labrador_barking_on_command.theora.ogv", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", recordingDate: "13. August 2011", changes: "In MP4 umgewandelt, Ton entfernt, deutsche Handlungstexte ergänzt. Video, Vorschau und Handlungstexte werden unter CC BY-SA 3.0 bereitgestellt." },
    transcript: "Ein schwarzer Labrador sitzt auf einem Teppich und ist zur Kamera ausgerichtet. Sein Maul öffnet und schließt sich während des kurzen Ausschnitts. Die Quelle beschreibt die Aufnahme als Lautgeben auf Signal. Die Person und der vorausgehende Lernaufbau sind nicht zu sehen. Die hier bereitgestellte Fassung hat keinen Ton.",
    observations: [
      { at: "0–8 s", text: "Der Hund bleibt vor der Kamera sitzen. Seine Position und die Ausrichtung des Kopfes lassen sich direkt beschreiben." },
      { at: "Während des Clips", text: "Das Maul öffnet und schließt sich. Der Trainingsweg, die Zahl früherer Wiederholungen und die gewählte Belohnung sind nicht sichtbar." },
    ],
    context: "Die Urheberin ordnet das Verhalten als gelerntes Lautgeben auf Kommando ein. Im Ausschnitt ist das Verhalten zu sehen; der Aufbau des Signals ist nicht vollständig dokumentiert.",
    lesson: "Ein Alltagssignal zum Lautgeben ist etwas anderes als jagdlicher Spurlaut oder Sichtlaut. Diese Begriffe beziehen sich auf den Zusammenhang mit einer Spur beziehungsweise sichtbarem Wild. Ein Bellclip im Wohnzimmer belegt daher keinen Lautnachweis. Der Labrador ist ein Retriever; ein gelerntes Signal sagt für sich allein noch nichts über seine Apportierleistung aus.",
    practice: "Für den Signalaufbau empfehlen AVSAB und RSPCA belohnungsbasierte Methoden. Zuerst wird ein kleines, klar erkennbares Zielverhalten zuverlässig gelernt; kurze Einheiten und wenige Ablenkungen erleichtern den Einstieg. Belohnung muss zum Hund passen. Ein kurzer Film kann weder die gesamte Ausbildungsmethode noch die Zuverlässigkeit in anderen Umgebungen beweisen.",
    sources: ["fciLabrador", "jghv", "avsab", "rspcaTraining"],
    questions: [
      { id: "lautnachweis", question: "Belegt dieses Lautsignal jagdlichen Spurlaut?", choices: ["Ja, jedes Bellen ist Spurlaut.", "Ja, bei einem Retriever genügt eine Innenaufnahme.", "Nein, der Zusammenhang mit einer Wildspur wird hier nicht gezeigt."], answer: 2, explanation: "Spurlaut ist an die Arbeit auf einer Spur gebunden. Ein gelerntes Alltagssignal belegt diesen Zusammenhang nicht." },
      { id: "lernen", question: "Was ist eine fachlich gestützte Grundlage für neue Signale?", choices: ["Verständliche kleine Lernschritte mit passender Belohnung.", "So viel Ablenkung wie möglich gleich in der ersten Einheit.", "Ein kurzer Clip beweist, dass der Hund überall zuverlässig reagiert."], answer: 0, explanation: "AVSAB und RSPCA empfehlen Belohnung und überschaubare Lernschritte. Können in einer ruhigen Umgebung und Können bei Ablenkung sind getrennt zu prüfen." },
    ],
  },
  {
    id: "golden-wasser", title: "Golden Retriever: Schwimmen und Tragen", breed: "Golden Retriever", duration: 34.06,
    src: `${mediaRoot}/golden-wasser.mp4`, poster: `${mediaRoot}/golden-wasser-vorschau.jpg`, captions: `${mediaRoot}/golden-wasser.de.vtt`,
    tags: ["Golden Retriever", "Wasser", "Schwimmen", "Apport", "Tragen", "Schwimmhilfe", "Wasserarbeit"],
    media: { author: "Golden Woofs", source: "https://commons.wikimedia.org/wiki/File:Golden_retriever_swimming_the_doggy_paddle.webm", original: "https://vimeo.com/70668511", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/", recordingDate: "19. Juli 2013", changes: "Bereits gekürzte Commons-Fassung; in MP4 umgewandelt, Tonspur entfernt und deutsche Handlungstexte ergänzt. Vorschau: Bild aus derselben Aufnahme. Die ursprüngliche Lizenz wurde auf Commons am 27. Juli 2016 geprüft." },
    transcript: "Ein Golden Retriever mit gelber Schwimmhilfe bewegt sich schwimmend durch ein Becken. Kopf und ein Teil des Rückens bleiben über der Wasseroberfläche. Er schwimmt in verschiedene Richtungen. Im späteren Abschnitt hält er einen blau-orangefarbenen Gegenstand im Maul. Ein vollständiger Ablauf vom Wurf über die Suche bis zur Abgabe an eine Person ist nicht im Bild. Die Fassung hat keinen Ton.",
    observations: [
      { at: "0–20 s", text: "Der Hund bewegt sich im Becken und ändert die Richtung. Die gelbe Schwimmhilfe ist deutlich sichtbar." },
      { at: "Ab etwa 24 s", text: "Ein blau-orangefarbener Gegenstand ist im Maul zu sehen. Die Aufnahme zeigt Tragen im Wasser, aber keine vollständige Abgabe." },
    ],
    context: "Die Originalquelle benennt einen Golden Retriever beim Schwimmen. Es handelt sich um eine Beckenaufnahme, nicht um eine dokumentierte Jagd oder eine bestandene Wasserprüfung.",
    lesson: "Der Golden Retriever gehört zur FCI-Gruppe der Retriever. Für eine vollständige Apportieraufgabe muss man mehr betrachten als das Halten eines Gegenstands: etwa Hinweg, Finden, Aufnehmen, Rückweg und Abgabe. Im Clip ist nur ein Teil davon sichtbar. Aus dem Schwimmen im Becken ergibt sich keine automatische Eignung für Strömung, Kälte oder dicht bewachsene Gewässer.",
    practice: "PDSA weist darauf hin, dass auch wasserfreudige Hunde das Schwimmen lernen müssen und beaufsichtigt bleiben sollen. Sicherer Zugang, erreichbarer Ausstieg und passende Bedingungen gehören vor jede Wasserübung. Ein Hund wird nicht ins Wasser gedrängt. Eine Schwimmhilfe ergänzt die Vorbereitung; sie ersetzt weder Aufsicht noch die Prüfung von Strömung und Hindernissen.",
    sources: ["fciGolden", "jghv", "pdsaWater", "avsab"],
    questions: [
      { id: "apport", question: "Was zeigt der späte Abschnitt sicher?", choices: ["Eine bestandene jagdliche Wasserprüfung.", "Der Hund trägt einen sichtbaren Gegenstand im Wasser.", "Die vollständige Abgabe des Gegenstands an den Führer."], answer: 1, explanation: "Der Gegenstand ist im Maul erkennbar. Weder Prüfung noch vollständige Abgabe sind dokumentiert." },
      { id: "wasserplanung", question: "Was folgt aus dem Clip für die Vorbereitung einer Wasserübung?", choices: ["Jedes Gewässer ist für jeden Retriever geeignet.", "Eine Schwimmhilfe macht Aufsicht unnötig.", "Zugang, Ausstieg, Gewässerbedingungen und den individuellen Hund vorab prüfen."], answer: 2, explanation: "PDSA nennt Aufsicht und passende Gewässer als wichtige Voraussetzungen. Ein kurzer Beckenclip belegt die Sicherheit eines anderen Gewässers nicht." },
    ],
  },
  {
    id: "rute-kontext", title: "Körpersprache: Die Rute im Zusammenhang", breed: "Hund – Rasse in der Quelle nicht angegeben", duration: 3.6,
    src: `${mediaRoot}/rute-kontext.mp4`, poster: `${mediaRoot}/rute-kontext-vorschau.jpg`, captions: `${mediaRoot}/rute-kontext.de.vtt`,
    tags: ["Körpersprache", "Rute", "Schwanz", "Wedeln", "Beobachtung", "Kommunikation", "Hundeverhalten"],
    media: { author: "Liannadavis", source: "https://commons.wikimedia.org/wiki/File:Dog_wagging_tail.webm", original: "https://upload.wikimedia.org/wikipedia/commons/3/38/Dog_wagging_tail.webm", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", recordingDate: "11. Juni 2017", changes: "In MP4 umgewandelt, deutsche Handlungstexte ergänzt. Video, Vorschau und Handlungstexte werden unter CC BY-SA 4.0 bereitgestellt." },
    transcript: "Ein brauner Hund steht auf einem Holzboden. Die Rute bewegt sich seitlich, der Kopf ist zur Kamera ausgerichtet und das Maul ist teilweise geöffnet. Die Aufnahme dauert weniger als vier Sekunden. Die Umgebung außerhalb des Bildes und das vorausgehende Geschehen sind unbekannt. Der Clip hat keinen Ton.",
    observations: [
      { at: "0–3,6 s", text: "Seitliche Rutenbewegung, stehende Körperhaltung und ein zur Kamera gerichteter Kopf sind sichtbar." },
      { at: "Gesamter Ausschnitt", text: "Auslösender Reiz und vorausgehende Interaktion bleiben außerhalb der Aufnahme. Die Quelle belegt keine bestimmte Jagdhunderasse." },
    ],
    context: "Die Urheberin beschreibt einen Hund mit wedelnder Rute. Dieser ergänzende Verhaltensclip zeigt keinen jagdlichen Arbeitseinsatz.",
    lesson: "Körpersprache wird anhand mehrerer Merkmale und ihrer Veränderung beurteilt. RSPCA beschreibt verschiedene Kombinationen aus Körperhaltung, Kopf, Ohren, Maul und Rute. Dogs Trust erklärt, dass Hunde aus unterschiedlichen Gründen wedeln und dass die gesamte Körperhaltung berücksichtigt werden muss. Rutenbewegung allein zeigt daher nicht sicher, ob ein Hund entspannt, angespannt oder unsicher ist.",
    practice: "Beschreibe zuerst, was du siehst: Haltung, Bewegung, Abstand und Verlauf. Frage anschließend, welche Umstände fehlen. Wiederholte Beobachtung im bekannten Alltag liefert mehr Kontext als dieser Mini-Clip. Bei auffälligen Veränderungen ist eine tierärztliche Abklärung sinnvoll; aus einem einzelnen Video entsteht keine verlässliche Gesundheits- oder Verhaltensdiagnose.",
    sources: ["rspcaBody", "dogsTrustBody"],
    questions: [
      { id: "wedeln", question: "Welche Aussage bleibt bei den sichtbaren Fakten?", choices: ["Die Rute bewegt sich; die Gefühlslage ist daraus allein nicht sicher bestimmbar.", "Der Hund ist sicher mit allem in der Umgebung einverstanden.", "Der Hund leidet nachweislich an einer Verhaltensstörung."], answer: 0, explanation: "Eine Rutenbewegung lässt sich beobachten. Für eine weitergehende Einordnung fehlen unter anderem Auslöser, Vorgeschichte und Verlauf." },
      { id: "mehrmerkmale", question: "Welche Beobachtung verbessert die Einordnung?", choices: ["Nur die Fellfarbe beachten.", "Körperhaltung, Kopf, Ohren, Maul, Abstand und zeitlichen Verlauf zusammen betrachten.", "Die Rasse allein entscheidet über jede Gefühlslage."], answer: 1, explanation: "Mehrere Merkmale und der Situationskontext sind aussagekräftiger als ein isoliertes Zeichen. Auch dann bleibt eine Interpretation als solche zu kennzeichnen." },
    ],
  },
].map(item => ({ ...item, reviewedOn: "2026-10-12" }));

export const huntingDogVideoAssetPaths = huntingDogVideoLessons.flatMap(item => [item.src, item.poster, item.captions]);
export const huntingDogVideoSearchEntries = huntingDogVideoLessons.map(item => ({
  id: `hundevideo-${item.id}`, title: item.title, description: item.lesson,
  href: `/lernen/jagdhund-videos?eintrag=${item.id}`, category: "Hundewesen", categorySlug: "hundewesen", type: "Video", keywords: item.tags,
}));
