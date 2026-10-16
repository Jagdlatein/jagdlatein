# Inhaltsprüfung: Jagdpraxis, Wildbret, Augenschutz und Schutzgebiete

Prüfdatum: 16.10.2026. Geprüft wurde ausschließlich die nachfolgende neue Datei, nicht das gesamte Jagdlatein-Wissen. Die Prüfung ist ein redaktioneller Quellenabgleich, keine medizinische, praktische oder rechtliche Zertifizierung.

Datei: `data/learning-expansion-practice-health-2026-10-16.json`

## Ergebnis und Aufbau

- 6 eigene neue Vertiefungskurse, 24 Lektionen mit jeweils 2 Absätzen, 96 eigene Fragen mit je 4 Optionen.
- Je 2 Kurse in Jagdpraxis und Wildbret & Gesundheit; je 1 in Waffen & Sicherheit und Jagdrecht. Bestehende Kategorienamen und Themen wurden verwendet.
- Jede Lektion hat eine explizite Claim-Zuordnung zu den tatsächlich eingesehenen Quellen. Jede Frage verweist auf ihre Lektion. Je Kurs liegen richtige Antworten genau viermal an jeder Position 0–3; die Position ist kein Lernhinweis.
- Eigene Lernfälle und Übungen sind ausdrücklich als solche bezeichnet. Sie sind didaktische Anwendungen und keine Originalbeobachtungen, Messungen oder behördlichen Entscheide.
- Bestehende Kategorie-Fotofallbacks werden über `imageKey` verwendet. Keine neuen Fotos, Videos, KI-Bilder oder abgeleiteten Bildbehauptungen hinzugefügt.

## Eigenständigkeit gegenüber vorhandenen Inhalten

Vor der Ausarbeitung wurden `AGENTS.md`, `KNOWLEDGE_POLICY.md`, die vorhandene Nachmittagserweiterung, `lib/learning-categories.js` und passende Teile des Bestands gelesen bzw. nach Themen durchsucht. Berücksichtigt wurden insbesondere `learning-deepening-practice.js`, `learning-deepening-care.js`, `learning-expansion-care.js`, `learning-expansion-practice.js`, `learning-practice.js`, `parasite-learning.js` und `game-meat-cases.js`.

- Trichinellen wurden als neuer Kurs verworfen, weil das Thema bereits in Parasitenlernen und Wildbrethygiene vertieft vorkommt. Stattdessen wurde HEV als zusammenhängender Kurs mit Erregergruppe, Unauffälligkeit, Expositionswegen und Präventionsgrenzen ergänzt.
- Bestehende Kühlketten- und Kreuzkontaminationsgrundlagen werden vorausgesetzt. Neu vertieft werden Gefrierbiologie, Eiskristalle/Qualität und die unterschiedlichen Quellenbedingungen zum Auftauen/Wiedereinfrieren.
- Bestehende Sicherheitsroutinen und Gehörschutz werden um Augenschutz und Schutzkombinationen ergänzt; keine Waffenhandhabung oder Schussanleitung.
- Der bestehende allgemeine Rechtsquellen-Kurs wird nicht dupliziert. Der neue Kurs übt konkret Schutzgebietskategorie, Verordnung, Status und Kartenzuordnung anhand getrennt benannter Länder-/Regionalbeispiele.
- Notruforganisation ergänzt die bisher allgemeine Outdoor- und Wildunfallplanung durch konkrete Verständigung über Ort, Koordinaten, Dialog und App-Zustände.
- Dämmerungssehen behandelt physiologische Wahrnehmungsgrenzen. Es vermittelt keine taktische Nutzung für einen Schuss und keine individuelle Seheignung.

## Quellenverfahren und Unabhängigkeit

Quellen wurden am Prüftag über Websuche und direkt geöffnete Fachseiten bzw. PDF-Abschnitte eingesehen. Bei zeitweilig blockierten Direktaufrufen (DRK, USDA, NCBI Bookshelf sowie EFSA-PDF) wurden die vom Suchdienst vollständig extrahierten einschlägigen Abschnitte gelesen; die blockierte Abrufvariante wird nicht als zusätzlich gelesene Quelle gezählt.

Unabhängige Fachgruppen: BVA / Duke-Lehrbuch / NEI / NHS für Sehen; DRK / Österreichisches Rotes Kreuz / Rega für Alarmierung; BfR / USDA / EFSA / BLV für Lebensmittelbiologie; BfR / ECDC / EFSA / BLV sowie ergänzend SFA für HEV; DGUV / Suva / österreichische Arbeitsinspektion für Augenschutz.

Mehrere Seiten derselben Einrichtung zählen zusammen als eine Fachgruppe. Insbesondere BfR-FAQ und ihr PDF sind dieselbe Publikation. EFSA-Gutachten können Originalarbeiten nationaler Institute gemeinsam auswerten; sie werden nicht als unabhängige Wiederholung jeder darin genannten Studie ausgegeben. Die separate SFA-Fachinformation bestätigt ausdrücklich den eng begrenzten biologischen Punkt, dass auch infizierte Wildschweine unauffällig sein können. Ihre asiatischen Häufigkeiten, Risikogruppenformulierungen und Kochwerte werden nicht nach DACH übertragen.

Im Recht ist das Verfahren anders als bei empirischer Forschung: Eine Originalnorm wird mit zuständiger amtlicher Erläuterung und Ortsbezug gelesen. § 23 BNatSchG plus BfN bzw. § 21 Tiroler TNSchG plus Landesportal sind Norm/Erläuterungspaare, keine zwei unabhängig erlassenen Rechtsnormen. Für Schweizer Begriffsabgrenzung wurden BAFU, swisstopo und die unabhängige Fachorganisation SAC verglichen. Ein konkreter heutiger kantonaler Schutzbeschluss wird weder behauptet noch durch diese Seiten ersetzt.

## Aufgelöste Unterschiede und zurückgehaltene Aussagen

1. **Wiedereinfrieren:** USDA beschreibt unter bestimmten durchgängigen Kühlbedingungen Möglichkeiten zum erneuten Einfrieren; EFSA/BLV geben vorsichtige allgemeine Hinweise dagegen, BfR unterscheidet Produktzustände. Veröffentlicht wird deshalb keine pauschale Freigabe für eine unklare Partie und kein allgemeiner Ausnahme-Stundenwert. Die Lektion benennt die unterschiedlichen Bedingungen ausdrücklich.
2. **Verpackung beim Auftauen:** BfR erläutert für rohe Produkte Entfernen der Verpackung und abgedeckte Schale; EFSA nennt Originalverpackung oder geeignetes Gefäß. Gemeinsamer belastbarer Kern ist kühles Auftauen, geeignete Auffang-/Schutzlösung und Vermeidung von Kontakten. Keine universelle Verpackungsanweisung hinzugefügt; konkrete Produktangaben beachten.
3. **HEV und Krankheitssymptome:** BfR formuliert für Tiere eine generell unauffällige Infektion; wissenschaftliche Arbeiten kennen auch milde experimentelle Veränderungen. Verwendet wird die engere Aussage „können ohne erkennbare Krankheitszeichen bleiben“, nicht „niemals Symptome“. Ein unauffälliges Foto schließt HEV nicht aus.
4. **HEV-Risikogruppen:** Quellen unterscheiden Genotypen und regionale Zusammenhänge. Keine pauschale Übertragung schwerer Schwangerschaftsrisiken bestimmter tropischer Genotypen auf jede europäische Infektion. Nur mehrfach bestätigte Immunsuppression/Lebervorschädigung wird als Beispiel vertieft; keine Behandlung, Diagnose, Häufigkeitszahl oder allgemeine Inkubationszahl.
5. **Dunkeladaptation:** NEI erläutert einen molekularen Mechanismus anhand von Mäusen. Keine individuelle menschliche Wartezeit, kein allgemeiner Nachtseh-Test und keine Freigabe aus Pupillenweite abgeleitet. Bildschirmübungen sind ausdrücklich keine standardisierte Nachtsichtmessung.
6. **Historische Schweizer Artikelnummer:** Das Markierungshandbuch von 2016 nennt damalige Artikelnummern. Neuere Änderungsunterlagen zeigen eine Umnummerierung der Wildruhezonenbestimmung. Veröffentlicht wird deshalb keine historische Nummer als heutige Rechtsbehauptung. Das Handbuch dient nur Status-/Begriffserklärung, nicht aktuellen örtlichen Rechten.
7. **Gebietsregeln:** Keine Aussage „alle Naturschutzgebiete haben dasselbe Wegegebot“, kein allgemeines Jagd-/Fahrverbot oder eine allgemeine Jagdausnahme. Das Tiroler Beispiel bleibt ausdrücklich Tirol. Konkrete örtliche Texte und deren Voraussetzungen sind nötig.
8. **Augenschutz:** Keine EN-Nummer, Herstellerfreigabe, universelle Lebensdauer, Widerstandszahl oder konkrete Eignung gegen Schussbelastung behauptet. Keine eigenmächtigen Umbauten und keine Belastungsversuche.
9. **Notruf:** Produktbeispiel Rega gilt nicht als DACH-Einheitslösung. Keine Behauptung, Ortung funktioniere immer; Standortanzeige, Datenübertragung und Sprechkontakt werden getrennt. Kein echter Probealarm und keine klinischen Erste-Hilfe-Manöver als Texttraining.

## Prüfung des Bestands auf Widersprüche

Die gezielten Suchen verglichen Dämmerungssehen, Nachtsehen, Blendung, Schutzbrille, Gehörschutz-Kombination, HEV, Trichinellen, Gefrieren/Auftauen, Notruf und Schutzgebiets-/Quellenmethodik mit dem genannten Bestand. Es wurde kein eindeutig bestätigter Bestandsfehler festgestellt, der für diese neue Erweiterung eine Fremddateiänderung erfordert. Diese begrenzte Aussage ist keine vollständige Inhaltsrevision. Neue Fakten widersprechen insbesondere nicht den vorhandenen Grundsätzen: unauffällige Oberfläche ist keine Untersuchung, spezielle Freigabe ist kein Gesamturteil, Kühlung ist Prozesswissen und aktuelle Ortsregel wird getrennt geprüft.

## Claim-Zuordnung je Lektion

### Dämmerungssehen: Farbe, Kontrast und Blendung

Kategorie: Jagdpraxis; Modul-ID: `wissen-ausbau-daemmerungssehen-2026`.

- **Zwei Systeme, verschiedene Leistungen** (`rezeptoren`): Stäbchen und Zapfen unterscheiden sich in Lichtempfindlichkeit, Farb- und Detailleistungen; schwache Beleuchtung begrenzt die Merkmalsbestimmung.
  Quellen: [Purves et al. · Functional Specialization of the Rod and Cone Systems](https://www.ncbi.nlm.nih.gov/books/NBK10850/); [BVA · Wenn das Licht schwindet](https://www.augeninfo.de/offen/pressetext.php?meldung=156); [National Eye Institute · Anpassung an Dunkelheit](https://www.nei.nih.gov/research-and-training/research-news/scientists-shine-light-how-eyes-adapt-dark).
- **Dunkeladaptation ist ein Vorgang** (`anpassung`): Die Empfindlichkeit passt sich nach Beleuchtungswechseln an; Dunkeladaptation umfasst Rezeptorvorgänge. Die genannte NEI-Studie ist mechanistische Mausforschung, keine menschliche Zeitvorgabe.
  Quellen: [National Eye Institute · Anpassung an Dunkelheit](https://www.nei.nih.gov/research-and-training/research-news/scientists-shine-light-how-eyes-adapt-dark); [BVA · Wenn das Licht schwindet](https://www.augeninfo.de/offen/pressetext.php?meldung=156); [Purves et al. · Functional Specialization of the Rod and Cone Systems](https://www.ncbi.nlm.nih.gov/books/NBK10850/).
- **Farbe und Kontrast nicht verwechseln** (`kontrast`): Mit sinkender Beleuchtung ändern sich Farb- und Detailleistungen; Lichtempfindlichkeit und räumliche Auflösung sind nicht dasselbe.
  Quellen: [Purves et al. · Functional Specialization of the Rod and Cone Systems](https://www.ncbi.nlm.nih.gov/books/NBK10850/); [BVA · Wenn das Licht schwindet](https://www.augeninfo.de/offen/pressetext.php?meldung=156).
- **Blendung und neue Beschwerden ernst nehmen** (`beschwerden`): Nachtsehprobleme und Blendung können bei unterschiedlichen Augenproblemen auftreten; fachliche Untersuchung ist nötig, Symptome allein sind keine Diagnose.
  Quellen: [BVA · Wenn das Licht schwindet](https://www.augeninfo.de/offen/pressetext.php?meldung=156); [National Eye Institute · Cataracts](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/cataracts); [NHS · Cataracts in adults](https://www.nhs.uk/conditions/cataracts/).

### Notruf im Revier: Ort nennen, Rückfragen beantworten

Kategorie: Jagdpraxis; Modul-ID: `wissen-ausbau-notruf-revier-2026`.

- **Ein Reviername reicht Ortsfremden oft nicht** (`ort`): Genauer Notfallort, Ortsbezeichnungen und Zugangs-/Geländeinformationen unterstützen Rettung; die frühe Alarmierung wird nicht für vollständige Unterlagen verzögert.
  Quellen: [DRK · Notruf 112](https://www.drk.de/hilfe-in-deutschland/erste-hilfe/notruf-112/); [Rega · Alarmnummern und Alarmierung](https://www.rega.ch/ueber-uns/alarmnummern); [Österreichisches Rotes Kreuz · Notruf](https://www.roteskreuz.at/erste-hilfe-videos/notruf).
- **Zahlen brauchen Format und Bezug** (`koordinaten`): Koordinaten unterstützen Rettung; vorbereitete Anzeige, korrektes Ablesen und Ergänzung durch Ortsangaben vermeiden Missverständnisse.
  Quellen: [Rega · Alarmnummern und Alarmierung](https://www.rega.ch/ueber-uns/alarmnummern); [DRK · Notruf 112](https://www.drk.de/hilfe-in-deutschland/erste-hilfe/notruf-112/).
- **Die Leitstelle führt durch die Fragen** (`dialog`): Leitstellen fragen relevante Angaben ab und können anleiten; Fragen beantworten und auf Rückfragen warten ist wichtiger als eine starre Merkspruch-Reihenfolge.
  Quellen: [DRK · Notruf 112](https://www.drk.de/hilfe-in-deutschland/erste-hilfe/notruf-112/); [Österreichisches Rotes Kreuz · Notruf](https://www.roteskreuz.at/erste-hilfe-videos/notruf); [Rega · Alarmnummern und Alarmierung](https://www.rega.ch/ueber-uns/alarmnummern).
- **Positionsübermittlung ist noch keine Sprechverbindung** (`app`): App-Unterstützung benötigt technische Voraussetzungen; Koordinatenübermittlung, Verbindung und Leitstellendialog sind getrennte Schritte. Örtliche Notrufnummern vorab kennen.
  Quellen: [Rega · App](https://www.rega.ch/im-einsatz/so-helfen-wir-ihnen/rega-app); [Rega · Alarmnummern und Alarmierung](https://www.rega.ch/ueber-uns/alarmnummern); [DRK · Notruf 112](https://www.drk.de/hilfe-in-deutschland/erste-hilfe/notruf-112/); [Österreichisches Rotes Kreuz · Notruf](https://www.roteskreuz.at/erste-hilfe-videos/notruf).

### Gefrieren und Auftauen: Mikroben und Fleischqualität

Kategorie: Wildbret & Gesundheit; Modul-ID: `wissen-ausbau-gefrieren-auftauen-2026`.

- **Gefroren bedeutet nicht steril** (`mikroben`): Gefrieren beseitigt Mikroorganismen nicht vollständig; überlebende Keime können nach Auftauen wieder wachsen. Gefrierzustand ersetzt keinen Nachweis des vorangegangenen Prozesses.
  Quellen: [USDA FSIS · Freezing and Food Safety](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety); [EFSA · Defrosting food safely](https://www.efsa.europa.eu/en/infographics/defrosting-food-safely); [BfR · Fragen und Antworten zu verdorbenem Fleisch](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch).
- **Eiskristalle und Saftverlust** (`qualitaet`): Gefriergeschwindigkeit beeinflusst Eiskristallgröße; Kristallbildung kann Gewebe beeinträchtigen und Flüssigkeitsverlust beim Auftauen begünstigen. Qualitätsbeobachtung und mikrobieller Status sind zu trennen.
  Quellen: [USDA FSIS · Freezing and Food Safety](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety); [EFSA BIOHAZ · Guidance on date marking and related food information, Part 2 (2021), S. 29](https://www.efsa.europa.eu/sites/default/files/2021-04/6510.pdf).
- **Kühl auftauen und Flüssigkeit auffangen** (`auftauen`): Kühles Auftauen, geeignete Auffanggefäße und saubere Hände/Geräte begrenzen Keimwachstum und Kreuzkontamination; produktspezifische Hinweise beachten.
  Quellen: [BfR · Korrektes Kühlen von Lebensmitteln im Privathaushalt](https://www.bfr.bund.de/fragen-und-antworten/thema/korrektes-kuehlen-von-lebensmitteln-im-privathaushalt/); [EFSA · Defrosting food safely](https://www.efsa.europa.eu/en/infographics/defrosting-food-safely); [BLV · Hygiene im Umgang mit Lebensmitteln](https://www.blv.admin.ch/de/hygiene-im-umgang-mit-lebensmitteln).
- **Gefrierbrand und unklarer Verlauf** (`lagerfragen`): Austrocknung/Gefrierbrand betrifft Qualität; Verpackung und Lagerbedingungen sind relevant. Empfehlungen zum Wiedereinfrieren unterscheiden sich, deshalb keine allgemeine Freigabe übernommen.
  Quellen: [USDA FSIS · Freezing and Food Safety](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety); [BfR · Korrektes Kühlen von Lebensmitteln im Privathaushalt](https://www.bfr.bund.de/fragen-und-antworten/thema/korrektes-kuehlen-von-lebensmitteln-im-privathaushalt/); [BfR · Fragen und Antworten zu verdorbenem Fleisch](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch); [BLV · Hygiene im Umgang mit Lebensmitteln](https://www.blv.admin.ch/de/hygiene-im-umgang-mit-lebensmitteln).

### Hepatitis E: unsichtbares Risiko verstehen

Kategorie: Wildbret & Gesundheit; Modul-ID: `wissen-ausbau-hepatitis-e-2026`.

- **Ein Virus ist kein Muskelwurm** (`virus`): HEV verursacht Hepatitis E; europäische zoonotische Zusammenhänge umfassen Haus-/Wildschweine. Virus und Parasiten sind verschiedene Erregergruppen; spezifische Untersuchungen haben einen begrenzten Prüfgegenstand.
  Quellen: [BfR · Hepatitis E: Übertragung durch Haus- und Wildschweine vermeiden, FAQ 03.03.2025](https://www.bfr.bund.de/fragen-und-antworten/thema/hepatitis-e-virus-uebertragung-durch-haus-und-wildschweine-und-daraus-gewonnene-lebensmittel-vermeiden/); [ECDC · Disease information about hepatitis E](https://www.ecdc.europa.eu/en/hepatitis-e/facts); [BLV · Viren in Lebensmitteln](https://www.blv.admin.ch/de/viren-in-lebensmitteln).
- **Ein unauffälliges Tier ist kein Virentest** (`unauffaellig`): Infizierte Schweine/Wildschweine können ohne erkennbare Symptome bleiben; klinische Unauffälligkeit ist kein HEV-Nachweis. Populationsergebnisse beweisen keinen Einzelstatus.
  Quellen: [BfR · Hepatitis E: Übertragung durch Haus- und Wildschweine vermeiden, FAQ 03.03.2025](https://www.bfr.bund.de/fragen-und-antworten/thema/hepatitis-e-virus-uebertragung-durch-haus-und-wildschweine-und-daraus-gewonnene-lebensmittel-vermeiden/); [BfR · HEV-FAQ 03.03.2025, vollständiges Dokument](https://www.bfr.bund.de/assets/01_Ver%C3%B6ffentlichungen/FAQ_deutsch/hepatitis-e-virus-uebertragung-durch-haus-und-wildschweine-und-daraus-gewonnene-lebensmittel-vermeiden.pdf); [ECDC · Disease information about hepatitis E](https://www.ecdc.europa.eu/en/hepatitis-e/facts); [EFSA BIOHAZ · Public health risks associated with HEV as a food-borne pathogen (2017), Abschnitte 3.8–3.9](https://pmc.ncbi.nlm.nih.gov/articles/PMC7010180/); [Singapore Food Agency · Hepatitis E virus and food safety](https://www.sfa.gov.sg/food-safety-tips/food-risk-concerns/risk-at-a-glance/hepatitis-e).
- **Kontakt und Verzehr sind verschiedene Wege** (`wege`): Tierkontakt und Lebensmittelverzehr sind unterschiedliche HEV-Expositionen; geeignete Schutzhandschuhe und Hygiene werden empfohlen, rohe/unzureichend gegarte Schweine-/Wildschweinprodukte sind relevante Lebensmittelrisiken.
  Quellen: [BfR · HEV-FAQ 03.03.2025, vollständiges Dokument](https://www.bfr.bund.de/assets/01_Ver%C3%B6ffentlichungen/FAQ_deutsch/hepatitis-e-virus-uebertragung-durch-haus-und-wildschweine-und-daraus-gewonnene-lebensmittel-vermeiden.pdf); [ECDC · Disease information about hepatitis E](https://www.ecdc.europa.eu/en/hepatitis-e/facts); [EFSA BIOHAZ · Public health risks associated with HEV as a food-borne pathogen (2017), Abschnitte 3.8–3.9](https://pmc.ncbi.nlm.nih.gov/articles/PMC7010180/); [EFSA · Hepatitis E: raw pork is main cause of infection in EU](https://www.efsa.europa.eu/en/press/news/170711); [BLV · Hygiene im Umgang mit Lebensmitteln](https://www.blv.admin.ch/de/hygiene-im-umgang-mit-lebensmitteln).
- **Durchgaren und besondere Empfindlichkeit** (`praevention`): Ausreichendes Durchgaren reduziert das lebensmittelbedingte HEV-Risiko; Immunsuppression und Lebervorschädigung sind relevante Faktoren für schwere Verläufe. Keine universelle Erhitzungsdauer oder Therapie abgeleitet.
  Quellen: [BfR · HEV-FAQ 03.03.2025, vollständiges Dokument](https://www.bfr.bund.de/assets/01_Ver%C3%B6ffentlichungen/FAQ_deutsch/hepatitis-e-virus-uebertragung-durch-haus-und-wildschweine-und-daraus-gewonnene-lebensmittel-vermeiden.pdf); [ECDC · Disease information about hepatitis E](https://www.ecdc.europa.eu/en/hepatitis-e/facts); [EFSA · Hepatitis E: raw pork is main cause of infection in EU](https://www.efsa.europa.eu/en/press/news/170711); [BLV · Viren in Lebensmitteln](https://www.blv.admin.ch/de/viren-in-lebensmitteln).

### Augenschutz: Gefährdung, Passform und Sichtprüfung

Kategorie: Waffen & Sicherheit; Modul-ID: `wissen-ausbau-augenschutz-2026`.

- **Die Aufgabe bestimmt die Schutzanforderung** (`gefaehrdung`): Mechanische, chemische und optische Gefährdungen erfordern passende Auswahl nach Einsatzbedingungen; äußere Tönung beweist keine allgemeine Schutzfunktion.
  Quellen: [Österreichische Arbeitsinspektion · Augen- und Gesichtsschutz](https://www.arbeitsinspektion.gv.at/arbeitsschutz/arbeitsstaette_baustelle/persoenliche_schutzausruestung/Arten/augen_gesicht_schutz.html); [Suva · Augen- und Gesichtsschutz bei der Arbeit](https://www.suva.ch/de-ch/praevention/lebenswichtige-regeln-und-bestimmungen/gut-geschuetzt-mit-persoenlicher-schutzausruestung/augenschutz-und-gesichtsschutz-bei-der-arbeit); [Suva · Arten des Augen- und Gesichtsschutzes](https://www.suva.ch/de-ch/praevention/lebenswichtige-regeln-und-bestimmungen/gut-geschuetzt-mit-persoenlicher-schutzausruestung/augenschutz-und-gesichtsschutz-bei-der-arbeit/welche-arten-von-augenschutz-und-gesichtsschutz-gibt-es); [DGUV · Sachgebiet Augenschutz, FAQ](https://www.dguv.de/fb-psa/sachgebiete/sachgebiet-augenschutz/faq-zum-sachgebiet/index.jsp).
- **Sehkorrektur und Schutz sind zwei Aufgaben** (`sehkorrektur`): Gewöhnliche Korrektionsbrille ist kein automatisch geeigneter Augenschutz; Korrektionsschutzbrille verbindet Sehkorrektur und Schutz, Überbrillen brauchen passende Einsatzprüfung.
  Quellen: [DGUV · Sachgebiet Augenschutz, FAQ](https://www.dguv.de/fb-psa/sachgebiete/sachgebiet-augenschutz/faq-zum-sachgebiet/index.jsp); [Suva · Kriterien bei der Wahl des Augen- und Gesichtsschutzes](https://www.suva.ch/de-ch/praevention/lebenswichtige-regeln-und-bestimmungen/gut-geschuetzt-mit-persoenlicher-schutzausruestung/augenschutz-und-gesichtsschutz-bei-der-arbeit/wichtige-kriterien-bei-der-wahl-des-augenschutzes-und-gesichtsschutzes); [Suva · Arten des Augen- und Gesichtsschutzes](https://www.suva.ch/de-ch/praevention/lebenswichtige-regeln-und-bestimmungen/gut-geschuetzt-mit-persoenlicher-schutzausruestung/augenschutz-und-gesichtsschutz-bei-der-arbeit/welche-arten-von-augenschutz-und-gesichtsschutz-gibt-es); [Österreichische Arbeitsinspektion · Augen- und Gesichtsschutz](https://www.arbeitsinspektion.gv.at/arbeitsschutz/arbeitsstaette_baustelle/persoenliche_schutzausruestung/Arten/augen_gesicht_schutz.html).
- **Ausrüstung gemeinsam prüfen** (`kombination`): PSA-Kombinationen können sich beeinträchtigen; Passform, Sicht und Komfort werden zusammen mit weiterer benötigter Ausrüstung geprüft.
  Quellen: [IFA/DGUV · Kombinationen persönlicher Schutzausrüstung](https://dguv.de/ifa/praxishilfen/practical-solutions-for-personal-protective-equipment/combinations-of-personal-protective-equipment/index.jsp); [Suva · Kriterien bei der Wahl des Augen- und Gesichtsschutzes](https://www.suva.ch/de-ch/praevention/lebenswichtige-regeln-und-bestimmungen/gut-geschuetzt-mit-persoenlicher-schutzausruestung/augenschutz-und-gesichtsschutz-bei-der-arbeit/wichtige-kriterien-bei-der-wahl-des-augenschutzes-und-gesichtsschutzes); [Österreichische Arbeitsinspektion · Augen- und Gesichtsschutz](https://www.arbeitsinspektion.gv.at/arbeitsschutz/arbeitsstaette_baustelle/persoenliche_schutzausruestung/Arten/augen_gesicht_schutz.html).
- **Sichtprüfung, Pflege und Ersatz** (`zustand`): Sichtprüfung vor Gebrauch, ausreichende Sicht und Schutzfunktion sowie Pflege/Wartung sind erforderlich; beschädigte oder unzureichende PSA nicht weiterbenutzen.
  Quellen: [DGUV · Sachgebiet Augenschutz, FAQ](https://www.dguv.de/fb-psa/sachgebiete/sachgebiet-augenschutz/faq-zum-sachgebiet/index.jsp); [DGUV · Sonnenbrillen als PSA regelmäßig austauschen?](https://aug.dguv.de/ihre-fragen/sonnenbrillen-austauschen/); [Suva · Checkliste Persönliche Schutzausrüstungen, Ausgabe 05.09.2024](https://www.suva.ch/de-ch/download/checklisten/checkliste--persoenliche-schutzausruestungen--psa/checkliste--persoenliche-schutzausruestungen--psa--67091.D); [Österreichische Arbeitsinspektion · Augen- und Gesichtsschutz](https://www.arbeitsinspektion.gv.at/arbeitsschutz/arbeitsstaette_baustelle/persoenliche_schutzausruestung/Arten/augen_gesicht_schutz.html).

### Schutzgebiete: Karte, Verordnung und eigene Aktivität

Kategorie: Jagdrecht; Modul-ID: `wissen-ausbau-schutzgebietspruefung-2026`.

- **Deutschland: § 23 ist der Rahmen, nicht die ganze Ortsprüfung** (`deutschland`): Deutschland: § 23 BNatSchG ist Schutzgebietsrahmen mit näheren Bestimmungen und Landesrechtsbezug; BfN erläutert die Kategorie. Keine örtliche Freigabe allein aus dem Kategorienamen.
  Quellen: [Deutschland · § 23 Bundesnaturschutzgesetz](https://www.gesetze-im-internet.de/bnatschg_2009/__23.html); [BfN · Naturschutzgebiete](https://www.bfn.de/naturschutzgebiete).
- **Österreich: ein genau benanntes Landesbeispiel** (`tirol`): Tirol: § 21 TNSchG und gebietsbezogene Verordnung gemeinsam prüfen; Land Tirol verlangt Zusammenschau. Diese Regelbeispiele nicht auf andere Bundesländer übertragen.
  Quellen: [Tirol · § 21 TNSchG 2005, konsolidierte Fassung](https://www.ris.bka.gv.at/geltendefassung.wxe?abfrage=lrt&gesetzesnummer=20000252); [Land Tirol · Naturschutzrecht](https://www.tirol.gv.at/umwelt/umweltrecht/naturschutzrecht/).
- **Schweiz: empfohlen und rechtsverbindlich unterscheiden** (`schweiz`): Schweizer Wildruhezonen können empfohlen oder rechtsverbindlich sein. Status und gebiets-/zeitbezogene Angaben sind zu prüfen; alte allgemeine Markierungshilfe ersetzt keinen aktuellen örtlichen Beschluss.
  Quellen: [BAFU · Tourismus, Sport und Freizeit in der Natur](https://www.bafu.admin.ch/de/tourismus-sport-und-freizeit-in-der-natur); [BAFU · Wildruhezonen: Markierungshandbuch 2016, S. 7–8](https://www.bafu.admin.ch/dam/it/sd-web/Sn-yWdJkjK2V/wildruhezonen_markierungshandbuch.pdf); [swisstopo · Schutzgebiete und Wildtiere](https://www.swisstopo.admin.ch/de/schutzgebiete-und-wildtiere); [SAC · Bergsport und Schutzgebiete](https://www.sac-cas.ch/de/umwelt/freier-zugang/bergsport-und-schutzgebiete/).
- **Eine kleine Prüfakte statt einer pauschalen Antwort** (`fallakte`): Gebietsregeln brauchen Orts-, Zeit- und Aktivitätsbezug; Karten sind eine Zuordnungshilfe. Die drei benannten Rechts-/Fachquellenketten sind nicht austauschbar und enthalten keine individuelle Erlaubnis.
  Quellen: [Deutschland · § 23 Bundesnaturschutzgesetz](https://www.gesetze-im-internet.de/bnatschg_2009/__23.html); [BfN · Naturschutzgebiete](https://www.bfn.de/naturschutzgebiete); [Tirol · § 21 TNSchG 2005, konsolidierte Fassung](https://www.ris.bka.gv.at/geltendefassung.wxe?abfrage=lrt&gesetzesnummer=20000252); [Land Tirol · Naturschutzrecht](https://www.tirol.gv.at/umwelt/umweltrecht/naturschutzrecht/); [BAFU · Tourismus, Sport und Freizeit in der Natur](https://www.bafu.admin.ch/de/tourismus-sport-und-freizeit-in-der-natur); [swisstopo · Schutzgebiete und Wildtiere](https://www.swisstopo.admin.ch/de/schutzgebiete-und-wildtiere); [SAC · Bergsport und Schutzgebiete](https://www.sac-cas.ch/de/umwelt/freier-zugang/bergsport-und-schutzgebiete/).

## Technische Prüfung

Ein lokaler, schreibfreier Strukturcheck nach der Erstellung prüfte erfolgreich: 6 eindeutige Modul-IDs; 4 Lektionen/16 Fragen pro Kurs; 2 Absätze pro Lektion; 4 Fragen pro Lektion; insgesamt 96 unterschiedliche Frageformulierungen; je Frage 4 verschiedene Optionen, gültigen Antwortindex und eine Erklärung; 24 eindeutig zugeordnete Evidence-Blöcke mit mindestens 2 registrierten Quell-URLs; exakt 4 richtige Antworten je Position und Kurs. Insgesamt 38 unterschiedliche Quell-URLs. Bei 62 Fragen wurden die Ablenker nochmals von erkennbar abwegigen zu fachlich naheliegenden Verwechslungen überarbeitet.

Dieser Check prüft Struktur und Referenzen, nicht automatisch die wissenschaftliche Richtigkeit. Integration, Seitendarstellung und Gesamttests erfolgen durch den Hauptagenten. Keine anderen Repository-Dateien, keine Zugangsdaten und keine Kontoeinstellungen geändert; kein Commit oder Push durch diesen Teilauftrag.

## Unabhängige Gegenprüfung und Korrektur

Eine zweite Bearbeitung hat alle 24 Lektionen und 96 Antwortschlüssel gelesen und kritische Originalquellen zu Gefrieren, HEV, Notruf, Augenschutz und Recht erneut geprüft. Die zwölf lokalen Schutzgebietsfragen sind jetzt ausdrücklich DE (q1–q4), AT mit Tiroler Beispiel (q5–q8) beziehungsweise CH (q9–q12) zugeordnet. Der zentrale Quizfilter übernimmt diese Zuständigkeit. Die gemeinsame Methodenlektion bleibt DACH-übergreifend. Die HEV-Frage q11 fragt nun eindeutig nach der konkreten Fleischproduktgruppe; ein unscharfer Kühlungsablenker wurde ersetzt.

## Redaktionelle Fragenkontrolle am 16. Oktober 2026

Alle 288 neuen Fragen der drei Erweiterungsdateien wurden zusätzlich mit sämtlichen Antwortoptionen und Schlüsseln gelesen. Richtige Positionen: je 72 A/B/C/D, je vier pro Kurs. Acht auffällige Fragen wurden enger formuliert oder erhielten fachlich naheliegende falsche Antwortmöglichkeiten (Gewässer q11, Gefrieren q4, Augenschutz q14, Schutzgebiete q6, Genetik qualitaet-q1, Federaufbau pflege-q1, Hundeschlaf messung-q2, Boden q9). IDs und richtige Positionen bleiben erhalten. Richtige Sachangaben und zugeordnete Nachweise wurden dabei nicht erweitert. Dies ist eine redaktionelle Kontrolle der Fragen, keine erneute Vollprüfung aller Originalquellen und kein gemessener Lernerfolgstest.
