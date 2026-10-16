# Fachprüfung: Angewandtes Grundlagenwissen, 16. Oktober 2026

## Umfang und Arbeitsgrenze

6 neue Kurse, 24 Lektionen, 192 eigene Single-Choice-Fragen. Jeder Kurs enthält vier Lektionen und 32 Fragen, je acht richtige Positionen A/B/C/D. Je Lektion gibt es acht Fragen. Texte, Zahlenfolgen und Übungsfälle wurden eigens für Jagdlatein geschrieben. Das Paket benutzt vorhandene Kategorie-Medien als Fallback; es wurden keine Bilder oder Videos importiert.

Der Prüfstand bezeichnet den tatsächlichen fachlichen Abgleich am 16.10.2026, keine automatische Zertifizierung der ganzen App. Nur die zwei zugewiesenen neuen Dateien wurden bearbeitet. Integration, UI und Veröffentlichung übernimmt Root.

## Abgleich mit vorhandenem Wissen

- `lib/learning-practice.js`, `wissen-orientierung`, und `lib/learning-expansion-practice.js`, `wissen-ausbau-karten-gps`: Grundlagen Maßstab/Konturen bereits vorhanden. Neue Vertiefung konzentriert sich auf Rückrechnung, Maßstabsänderung, Zahl der Intervalle statt Linien, Nettohöhe gegenüber Gesamtanstieg und eigene Profile. Grundbegriffe werden für die neuen Rechnungen kurz wieder eingeführt, nicht als unbekanntes Alleinstellungsmerkmal gezählt.
- Vorhandene Wildbret-Hygienekette und `lib/parasite-learning.js`: Lebenszyklus, Foto-Grenzen und Untersuchungspflicht sind schon Thema. Neuer Fleischkurs behandelt mikroskopischen Aufbau, ATP/Glykogen/pH und Reifung. Neuer Trichinellenkurs erklärt Laborziel, Probenidentität, Poolauflösung und unabhängige Ringversuche; kein zweites allgemeines Parasitenporträt.
- Vorhandener Wildkamera-Technikkurs: Neuer Rechtskurs verwendet konkrete Art.-/§-Bezüge und getrennte private Fallgruppen in DE/AT/CH statt erneut allgemeiner Technik-/Datenschutz-Checkliste.
- Bestehende Sicherheit behandelt Schutzmittel und Organisation. Neuer Kurs behandelt Bedeutung und Grenzen von Warn-/Verbots-/Gebots-/Rettungs-/Brandschutzzeichen und CE. Keine Schussausführung, Waffenreparatur oder taktische Anleitung.
- Kein strukturierter Grundlagenkurs für Zelle/Gewebe/Organ/Stoffwechsel in den abgeglichenen Dateien gefunden. Einzelne bekannte Begriffe aus Arten-/Ökologieartikeln werden zu einem konsistenten Grundkurs zusammengeführt.

Es wurde bei diesem Abgleich kein sicher belegter Altfehler festgestellt. Das ist keine Aussage, dass sämtliche Altinhalte vollständig geprüft oder fehlerfrei seien.

## Quellenzugang und Unabhängigkeit

Die in den Modulen und unten dokumentierten Originalquellen wurden inhaltlich geöffnet oder in substanziellen, von der Primärquelle gelieferten Inhaltsauszügen gelesen. Quellen mit bloßem Titel oder blockiertem Zugang ohne verwertbaren Text tragen keine alleinige Aussage. Die amtliche BfDI-PDF wurde nach Browserabruffehlern lokal im Arbeitsspeicher mit `urllib`/`pypdf` tatsächlich gelesen, insbesondere Seiten143–149,157–158 und176 (Artikel4/5/6/13/32). Auch die BAuA-ASR-PDF wurde auf diesem Weg gelesen. Keine dieser Quellen wurde als Mediendatei in das Repository übernommen.

- Kartographie: swisstopo, Ordnance Survey und USGS sind unabhängige nationale Vermessungs-/Kartographieinstitutionen. Britische und US-Signaturen, feste Indexfolgen und nationale Gitternetze werden nicht als DACH-Norm übernommen.
- Fleisch: Texas A&M, FAO und BfR sind getrennte Fachinstitutionen; Rice/OpenStax bestätigt zusätzlich die Muskelstruktur und ATP-Querbrückenmechanik. Zwei TAMU-Seiten allein gelten nicht als zwei unabhängige Quellen.
- Trichinellen: CDC, österreichische zuständige Gesundheitsinformation sowie BfR, ICT und das polnische NRL wurden verglichen. Die ICT-Autorenliste umfasst auch BfR-Beteiligung und wird deshalb nicht künstlich als zweite unabhängige Bestätigung des BfR gezählt. Für Laborleistung liegen getrennte Original-Ringversuche des BfR2014 und des polnischen NRL2014–2019 (publiziert2022) vor. Weder deren Zahlen noch die Pferdefleisch-Matrix werden auf heutige Wildschweinbefunde übertragen.
- Zeichenkunde: BAuA-ASR und österreichische KennV/Arbeitsinspektion bestätigen die Formen/Farben; DGUV bestätigt Einsatzgrenzen. Europäische Kommission, BAuA und SECO erklären unterschiedliche Kennzeichnungs-/Bewertungsverfahren. Mehrere Stellen derselben Organisation zählen nicht mehrfach.
- Datenschutz: Die Gesetzgeber-Normtexte sind die normative Grundlage. Nationale unabhängige Aufsichtsbehörden liefern den konkreten Anwendungsbezug. Es wird nicht behauptet, eine Behördenerläuterung sei ein zweiter Gesetzestext oder eine gerichtliche Standortfreigabe.
- Biologie: NIH/NCI, University of Leeds und Rice/OpenStax sind unabhängig verantwortete Ausbildungsquellen. Menschliche Größen-/Temperaturwerte, Organzahlen und Lehrbuchabbildungen wurden nicht auf Wildtiere übertragen.

## Quellenversionen, Konflikte und bewusst nicht übernommene Aussagen

1. **Karten:** swisstopo führt bei1:25000 unterschiedliche Höhenintervalle für Mittelland/Jura und Alpen auf. Deshalb keine universelle Äquidistanz aus dem Maßstab. Das swisstopo-Zählbeispiel lässt sprachlich offen, ob Linien oder Höhenstufen gezählt werden. Eigene Aufgaben verwenden ausdrücklich aufeinanderfolgende reguläre Konturen mit Zahlen: fünf Linien begrenzen vier Intervalle. Prozentsteigung ist kein Gradwinkel.
2. **Fleisch:** Ältere FAO-Lehre enthält vereinfachte Formulierungen zu Glykogen und eine pauschale Verzehr-Unbedenklichkeitsformulierung für PSE/DFD. Diese wurden nicht übernommen. TAMU-Zeit-/pH-Beispiele und vereinfachte Homöostase-Formulierungen dienen ebenfalls nicht als allgemeine Wildbretgrenzen. Kein „ein pH-Wert beweist sicher“, keine universellen Reifetage. PSE/DFD bleiben beschränkte Qualitätsbeschreibungen.
3. **Labor:** Ältere Ringversuche nennen frühere Verordnungen und konkrete technische Laborparameter. Das neue Paket leitet daraus weder aktuelle DACH-Pflichten noch Probenmengen, Entnahmeberechtigung, Verfahrenszulassung oder Laborrezepte ab. Nichtnachweis bleibt an Probe, Ziel und Verfahren gebunden; fehlendes Ergebnis ist kein Negativbefund.
4. **Zeichen:** Deutsche ASR und österreichische KennV haben unterschiedliche Rechtsgrundlagen und Geltungsbereiche. Lehrgegenstand ist die übereinstimmende Zeichensystematik, nicht eine pauschale Ausstattungspflicht für jede private Hütte in DACH. CE wird für den europäischen Harmonisierungsrahmen erklärt; keine allgemeine Schweizer CE-Pflicht und keine Aussage, jede Waffe sei GS-fähig.
5. **Recht DE/AT:** DSGVO-Normtext aus amtlicher BfDI-Ausgabe inhaltlich gelesen. DSK-Orientierung trägt Stand17.07.2020, ist am Prüfdatum weiterhin auf der Behördenseite verfügbar; der Kurs benennt diesen Stand und vermeidet alte Montagebeispiele als Freigaben. Österreichisches DSG wurde im RIS mit Fassung16.10.2026 eingesehen.72Stunden sind in der aktuellen DSB-FAQ ein Richtwert, ausdrücklich keine allgemeine gesetzliche Höchst-/Mindestfrist und keine spezielle Wildkamerafreigabe. Hausfassaden-Ausnahmen werden nicht auf Waldkameras übertragen.
6. **Recht CH:** Zunächst eingesehene Fedlex-Ausgabe Stand01.09.2023 wurde durch die tatsächlich gelesene neuere Original-PDF Stand07.07.2025 ersetzt. Die hier verwendeten Art.2/5/6/7/8/19/31 wurden mit dem aktuell eingesehenen EDÖB-Fotofallenhinweis und BJ-Einordnung vom18.03.2026 verglichen. Das ist keine Vollprüfung aller seitdem möglichen Spezialänderungen oder sämtlicher Kantone. Private Betreiber, kantonale Behörden und kantonale Universitäten werden getrennt. „Sofort vernichten/anonymisieren“ wird ausdrücklich auf die vom EDÖB beschriebene nichtpersonenbezogene Fotofallen-Rechtfertigung bezogen und nicht zu einer Regel für jeden beliebigen Sachverhalt verallgemeinert.
7. **Quellenrechte:** OpenStax zeigt auf den aktuellen Seiten CC-BY-NC-SA und zusätzliche Beschränkungen für Wiederverwendung. Das Paket beansprucht daraus keine kommerzielle Nachdrucklizenz. Keine Lehrbuchformulierungen, Bilder, Aktivitäten, Assessments oder bestehende Fragen wurden übernommen. Die Quellen dienen als fachlicher Abgleich allgemeiner biologischer Fakten; sämtliche Lernfälle und Frageformulierungen sind eigene. Auch für andere Quellen ist die Zitierung keine pauschale Mediennutzungslizenz.
8. **Biologie:** Allgemeine Zellmodelle haben Ausnahmen; daher „typische kernhaltige Tierzelle“ statt Behauptung eines Zellkerns in jeder Tierzelle. Homöostase ist relative Stabilität durch fortlaufende Regulation. Keine menschlichen physiologischen Sollwerte oder klinischen Empfehlungen.

## Claim-Zuordnung je Lektion

### Kartenprofile: Gelände rechnen und lesen

Kategorie: Jagdpraxis. Vier Lektionen, 32 Fragen; Antworten A/B/C/D jeweils8.

- **Maßstab rückwärts lesen und Darstellungen vergleichen** (`massstabsrechnung`): Maßstab als Verhältnis gleicher Längeneinheiten, Balkenmessung und Verlaufsmessung. Zahlenfälle sind eigene, nachgerechnete Anwendungen, keine zitierten Geländeangaben.
  - [swisstopo · Höhenlinien und Äquidistanz](https://www.swisstopo.admin.ch/de/hoehenlinien) — Bundesamt für Landestopografie swisstopo.
  - [Ordnance Survey · Map reading made easy](https://www.ordnancesurvey.co.uk/documents/resources/map-reading-made-easy.pdf) — Ordnance Survey.
- **Höhenunterschiede ohne Zählfehler** (`hoehenintervalle`): Gleichhöhe der Konturen, kartenspezifisches Höhenintervall und hervorgehobene Indexlinien. Eigene Zahlenfolgen geben reguläre, fortlaufende Konturen ausdrücklich vor.
  - [swisstopo · Höhenlinien und Äquidistanz](https://www.swisstopo.admin.ch/de/hoehenlinien) — Bundesamt für Landestopografie swisstopo.
  - [Ordnance Survey · Map reading made easy](https://www.ordnancesurvey.co.uk/documents/resources/map-reading-made-easy.pdf) — Ordnance Survey.
  - [USGS · Cartographic Specifications – Elevation](https://www.usgs.gov/ngp-standards-and-specifications/us-topo-cartographic-specifications-elevation) — U.S. Geological Survey.
- **Aus Höhenpunkten ein Geländeprofil bauen** (`hoehenprofil`): Konturabstand und Hangneigung unter gleichen Darstellungsbedingungen; Höhenpunkte und Konturformen als Profilinformation. Aufsummierung und Prozentrechnung sind eigene elementare Rechenbeispiele.
  - [swisstopo · Höhenlinien und Äquidistanz](https://www.swisstopo.admin.ch/de/hoehenlinien) — Bundesamt für Landestopografie swisstopo.
  - [Ordnance Survey · Map reading made easy](https://www.ordnancesurvey.co.uk/documents/resources/map-reading-made-easy.pdf) — Ordnance Survey.
  - [USGS · Cartographic Specifications – Elevation](https://www.usgs.gov/ngp-standards-and-specifications/us-topo-cartographic-specifications-elevation) — U.S. Geological Survey.
- **Legende, Höhenpunkt und Kartenausschnitt zusammenlesen** (`legende`): Zeichenerklärung bestimmt kartenspezifische Symbolik; Höhenpunkt und Kontur beschreiben unterschiedliche Darstellungen von Höhe. Vergrößerung ist keine neue Messung.
  - [swisstopo · Höhenlinien und Äquidistanz](https://www.swisstopo.admin.ch/de/hoehenlinien) — Bundesamt für Landestopografie swisstopo.
  - [Ordnance Survey · Map reading made easy](https://www.ordnancesurvey.co.uk/documents/resources/map-reading-made-easy.pdf) — Ordnance Survey.

### Muskelbiologie: Wie aus Muskel Fleisch wird

Kategorie: Wildbret & Gesundheit. Vier Lektionen, 32 Fragen; Antworten A/B/C/D jeweils8.

- **Von der Muskelfaser zum ganzen Muskel** (`muskelaufbau`): Muskelzelle, Myofibrille, Sarkomer, Aktin/Myosin und Endo-/Peri-/Epimysium; anatomische Ebenen statt Foto-Ferndiagnose.
  - [Texas A&M · Structure and Composition of Muscle](https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/structure-and-composition-of-muscle/) — Texas A&M University.
  - [OpenStax · Skeletal Muscle](https://openstax.org/books/anatomy-and-physiology-2e/pages/10-2-skeletal-muscle) — Rice University / OpenStax.
- **Energiereserve, Lactat und pH-Verlauf** (`glykogen`): Muskelglykogen als Reserve, anaerober Abbau, Lactat und postmortaler pH-Verlauf; begrenzte Ansäuerung bei geringen Reserven. Keine pH-Grenzwerte oder universelle Stressdiagnose.
  - [Texas A&M · Conversion of Muscle to Meat](https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/conversion-of-muscle-to-meat/) — Texas A&M University.
  - [FAO · Meat production and quality](https://www.fao.org/4/T0562E/T0562E02.htm) — Food and Agriculture Organization of the United Nations.
- **Totenstarre und enzymatische Reifung** (`rigor`): ATP-Abhängigkeit des Querbrückenzyklus, Rigorbindungen und enzymatische Strukturveränderung bei Reifung; kein starrer Zeitplan oder Keimfreiheitsversprechen.
  - [Texas A&M · Conversion of Muscle to Meat](https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/conversion-of-muscle-to-meat/) — Texas A&M University.
  - [FAO · Meat production and quality](https://www.fao.org/4/T0562E/T0562E02.htm) — Food and Agriculture Organization of the United Nations.
  - [BfR · Fragen und Antworten zu verdorbenem Fleisch](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch/) — Bundesinstitut für Risikobewertung.
  - [OpenStax · Muscle Fiber Contraction and Relaxation](https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation) — Rice University / OpenStax.
- **Wasserbindung, Tropfsaft und Qualitätsgrenzen** (`wasserhaltevermoegen`): Protein-/pH-abhängige Wasserhaltung, Tropfsaft und PSE/DFD als Qualitätsbeschreibungen; Zartheit und Wasserhaltung sind keine hygienische Freigabe.
  - [Texas A&M · Conversion of Muscle to Meat](https://meat.tamu.edu/meat-science/teaching/ansc-307-meats/conversion-of-muscle-to-meat/) — Texas A&M University.
  - [FAO · Meat production and quality](https://www.fao.org/4/T0562E/T0562E02.htm) — Food and Agriculture Organization of the United Nations.
  - [BfR · Fragen und Antworten zu verdorbenem Fleisch](https://www.bfr.bund.de/fragen-und-antworten/thema/fragen-und-antworten-zu-verdorbenem-fleisch/) — Bundesinstitut für Risikobewertung.

### Trichinellenlabor: Von der Probe zum Befund

Kategorie: Wildbret & Gesundheit. Vier Lektionen, 32 Fragen; Antworten A/B/C/D jeweils8.

- **Warum die passende Muskelprobe entscheidend ist** (`probe-und-ziel`): Muskellarven als Ziel der Fleischprobe; passende Matrix, Entnahmestelle und Kennung. Keine klinische Ersatzdiagnostik, universellen Mengen oder Entnahmeberechtigungen.
  - [CDC · DPDx Trichinellosis](https://www.cdc.gov/dpdx/trichinellosis/) — Centers for Disease Control and Prevention.
  - [BfR · Trichinen](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/parasiten-in-lebensmitteln/trichinen-trichinella/) — Bundesinstitut für Risikobewertung.
  - [Österreichisches Gesundheitsressort · Trichinellose](https://www.verbrauchergesundheit.gv.at/tiere/zoonosen/Trichinellose.html) — Bundesministerium für Arbeit, Soziales, Gesundheit, Pflege und Konsumentenschutz Österreich.
  - [ICT · Quality assurance in digestion testing](https://pmc.ncbi.nlm.nih.gov/articles/PMC7033998/) — International Commission on Trichinellosis, Qualitätsausschuss; Fachpublikation 2019.
  - [Polnisches NRL · Validation parameters from proficiency tests](https://pmc.ncbi.nlm.nih.gov/articles/PMC9655762/) — National Veterinary Research Institute, Puławy; Originalstudie 2022.
- **Was Verdauung und Sammelprobe bedeuten** (`verdauung-und-pool`): Künstlicher Gewebeaufschluss, mikroskopischer Nachweis und geregelte Poolrückverfolgung; technische Auswertbarkeit statt privater Laboranleitung.
  - [Österreichisches Gesundheitsressort · Trichinellose](https://www.verbrauchergesundheit.gv.at/tiere/zoonosen/Trichinellose.html) — Bundesministerium für Arbeit, Soziales, Gesundheit, Pflege und Konsumentenschutz Österreich.
  - [ICT · Quality assurance in digestion testing](https://pmc.ncbi.nlm.nih.gov/articles/PMC7033998/) — International Commission on Trichinellosis, Qualitätsausschuss; Fachpublikation 2019.
  - [Polnisches NRL · Validation parameters from proficiency tests](https://pmc.ncbi.nlm.nih.gov/articles/PMC9655762/) — National Veterinary Research Institute, Puławy; Originalstudie 2022.
- **Wie Labore ihre Nachweisleistung prüfen** (`qualitaetskontrolle`): Codierte Kontrollproben, Qualitätsmanagement, falsch-positive/negative Befunde sowie getrennte qualitative und quantitative Bewertung. BfR2014 und polnische Originaldaten2014–2019 sind unabhängige Programme; keine Übertragung ihrer Quoten.
  - [ICT · Quality assurance in digestion testing](https://pmc.ncbi.nlm.nih.gov/articles/PMC7033998/) — International Commission on Trichinellosis, Qualitätsausschuss; Fachpublikation 2019.
  - [BfR · Originalbericht Ringversuch 2014](https://www.bfr.bund.de/cm/343/ringversuch-zum-nachweis-von-trichinellen-in-fleisch-2014.pdf) — Bundesinstitut für Risikobewertung.
  - [Polnisches NRL · Validation parameters from proficiency tests](https://pmc.ncbi.nlm.nih.gov/articles/PMC9655762/) — National Veterinary Research Institute, Puławy; Originalstudie 2022.
- **Einen Befund mit seinem Geltungsbereich lesen** (`befundgrenzen`): Ziel-/Proben-/Verfahrensbindung des Befundes, Identitätsfehler und Nachweisgrenzen; ein gezielter Parasitenbefund ist keine Untersuchung auf sämtliche Gefahren.
  - [CDC · DPDx Trichinellosis](https://www.cdc.gov/dpdx/trichinellosis/) — Centers for Disease Control and Prevention.
  - [BfR · Trichinen](https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/parasiten-in-lebensmitteln/trichinen-trichinella/) — Bundesinstitut für Risikobewertung.
  - [ICT · Quality assurance in digestion testing](https://pmc.ncbi.nlm.nih.gov/articles/PMC7033998/) — International Commission on Trichinellosis, Qualitätsausschuss; Fachpublikation 2019.
  - [Polnisches NRL · Validation parameters from proficiency tests](https://pmc.ncbi.nlm.nih.gov/articles/PMC9655762/) — National Veterinary Research Institute, Puławy; Originalstudie 2022.

### Sicherheitszeichen und Produktkennzeichnung verstehen

Kategorie: Waffen & Sicherheit. Vier Lektionen, 32 Fragen; Antworten A/B/C/D jeweils8.

- **Warnung und Verbot unterscheiden** (`warnung-verbot`): Warn-, Verbotszeichen, Grundgestaltung und getrennte Sicherheitsaussagen; allgemeine Warnung braucht konkretisierende Erläuterung.
  - [BAuA · ASR A1.3 Sicherheits- und Gesundheitsschutzkennzeichnung](https://www.baua.de/DE/Angebote/Regelwerk/ASR/pdf/ASR-A1-3.pdf?__blob=publicationFile&v=3) — Bundesanstalt für Arbeitsschutz und Arbeitsmedizin / Ausschuss für Arbeitsstätten.
  - [RIS · KennV Anhang 1 Schilder](https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40172680/II_101_1997_Anlage_1.pdf) — Rechtsinformationssystem des Bundes Österreich.
  - [DGUV · Arten von Sicherheitskennzeichen](https://aug.dguv.de/arbeitssicherheit/arten-von-sicherheitskennzeichen/) — Deutsche Gesetzliche Unfallversicherung.
- **Gebotszeichen benennen eine Schutzhandlung** (`gebot`): Blaue Gebotszeichen, Schutzhandlung, verständliche Unterweisung und Ergänzung statt Ersatz technischer/organisatorischer Schutzmaßnahmen.
  - [BAuA · ASR A1.3 Sicherheits- und Gesundheitsschutzkennzeichnung](https://www.baua.de/DE/Angebote/Regelwerk/ASR/pdf/ASR-A1-3.pdf?__blob=publicationFile&v=3) — Bundesanstalt für Arbeitsschutz und Arbeitsmedizin / Ausschuss für Arbeitsstätten.
  - [Arbeitsinspektion Österreich · Sicherheitskennzeichnung](https://www.arbeitsinspektion.gv.at/arbeitsschutz/arbeitsstaette_baustelle/allgemeines/sicherheits_gesundheitsschutz_kennzeichnung.html) — Zentral-Arbeitsinspektorat Österreich.
  - [RIS · KennV Anhang 1 Schilder](https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40172680/II_101_1997_Anlage_1.pdf) — Rechtsinformationssystem des Bundes Österreich.
  - [DGUV · Arten von Sicherheitskennzeichen](https://aug.dguv.de/arbeitssicherheit/arten-von-sicherheitskennzeichen/) — Deutsche Gesetzliche Unfallversicherung.
- **Hilfe und Löscheinrichtung schnell zuordnen** (`rettung-brandschutz`): Grüne Rettungs-/rote Brandschutzzeichen mit unterschiedlicher Form zu Verboten, Richtungskombination und freie Erkennbarkeit; Planstandort.
  - [BAuA · ASR A1.3 Sicherheits- und Gesundheitsschutzkennzeichnung](https://www.baua.de/DE/Angebote/Regelwerk/ASR/pdf/ASR-A1-3.pdf?__blob=publicationFile&v=3) — Bundesanstalt für Arbeitsschutz und Arbeitsmedizin / Ausschuss für Arbeitsstätten.
  - [RIS · KennV Anhang 1 Schilder](https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40172680/II_101_1997_Anlage_1.pdf) — Rechtsinformationssystem des Bundes Österreich.
  - [DGUV · Arten von Sicherheitskennzeichen](https://aug.dguv.de/arbeitssicherheit/arten-von-sicherheitskennzeichen/) — Deutsche Gesetzliche Unfallversicherung.
- **CE erklärt Konformität, nicht beliebige Eignung** (`ce-konformitaet`): CE-Herstellerverantwortung und Geltung nur nach einschlägigen Produktregeln; keine Herkunft/behördliche Einzelzulassung. Konformitätsverfahren und GS-Abgrenzung; keine pauschale CH-CE-Pflicht.
  - [Europäische Kommission · CE marking](https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking_en) — Europäische Kommission, DG GROW.
  - [BAuA · GS-Zeichen](https://www.baua.de/DE/Die-BAuA/Aufgaben/Gesetzliche-und-hoheitliche-Aufgaben/Produktsicherheitsgesetz/GS-Zeichen) — Bundesanstalt für Arbeitsschutz und Arbeitsmedizin.
  - [SECO · Konformitätsbewertung und Akkreditierung](https://www.seco.admin.ch/de/konformitaetsbewertung-und-akkreditierung) — Staatssekretariat für Wirtschaft SECO.

### Biologie verstehen: Zelle, Gewebe, Organ und Stoffwechsel

Kategorie: Prüfung & Sprache. Vier Lektionen, 32 Fragen; Antworten A/B/C/D jeweils8.

- **Zellbauteile ohne Größenverwechslung** (`zelle`): Zelle, Membran, Cytoplasma, typische kernhaltige Zelle, Ribosom und Mitochondrium. Keine universelle Kernbehauptung oder menschlichen Größenwerte.
  - [NIH/NCI · Cell Structure](https://training.seer.cancer.gov/anatomy/cells_tissues_membranes/cells/structure.html) — National Institutes of Health / National Cancer Institute.
  - [OpenStax · Eukaryotic Cells](https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells) — Rice University / OpenStax.
  - [University of Leeds · Organelles](https://histology.leeds.ac.uk/home/cell/cell_organelles/) — University of Leeds, Histology Guide.
- **Vier Grundgewebe und ihre Aufgaben** (`gewebe`): Vier Grundgewebe, extrazelluläre Matrix, Epithel-/Stütz-/Kontraktions-/Informationsfunktion; Knorpel als Binde-/Stützgewebe.
  - [NIH/NCI · Body Tissues](https://training.seer.cancer.gov/anatomy/cells_tissues_membranes/tissues/) — National Institutes of Health / National Cancer Institute.
  - [University of Leeds · Basic Tissue Types](https://histology.leeds.ac.uk/home/tissue_types/) — University of Leeds, Histology Guide.
- **Vom Gewebe zum Organsystem** (`organ-system`): Gewebe, Organ und System; Magen aus mehreren Gewebetypen; Anatomie/Physiologie/Histologie und Differenzierung. Keine artspezifischen Organzahlen.
  - [University of Leeds · Basic Tissue Types](https://histology.leeds.ac.uk/home/tissue_types/) — University of Leeds, Histology Guide.
  - [NIH/NCI · Introduction to the Human Body](https://training.seer.cancer.gov/anatomy/body/?view=searchengine) — National Institutes of Health / National Cancer Institute.
  - [OpenStax · Structural Organization](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body) — Rice University / OpenStax.
  - [NIH/NCI · Body Functions and Life Process](https://training.seer.cancer.gov/anatomy/body/functions.html) — National Institutes of Health / National Cancer Institute.
- **Aufbau, Abbau und dynamisches Gleichgewicht** (`stoffwechsel`): Stoffwechsel umfasst Aufbau und Abbau; Enzymkatalyse und ATP-Kopplung; Homöostase ist dynamisch, negative Rückkopplung wirkt Abweichungen entgegen.
  - [NIH/NCI · Body Functions and Life Process](https://training.seer.cancer.gov/anatomy/body/functions.html) — National Institutes of Health / National Cancer Institute.
  - [OpenStax · Energy and Metabolism](https://openstax.org/books/biology-2e/pages/6-1-energy-and-metabolism) — Rice University / OpenStax.
  - [OpenStax · Enzymes](https://openstax.org/books/biology-2e/pages/6-5-enzymes) — Rice University / OpenStax.
  - [OpenStax · ATP](https://openstax.org/books/biology-2e/pages/6-4-atp-adenosine-triphosphate) — Rice University / OpenStax.
  - [OpenStax · Homeostasis](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-5-homeostasis) — Rice University / OpenStax.
  - [NCI · Definition of enzyme](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/enzyme) — National Cancer Institute, NIH.
  - [University of Leeds · Organelles](https://histology.leeds.ac.uk/home/cell/cell_organelles/) — University of Leeds, Histology Guide.

### Wildkameras: Personendaten in Deutschland, Österreich und der Schweiz

Kategorie: Jagdrecht. Vier Lektionen, 32 Fragen; Antworten A/B/C/D jeweils8.

- **Deutschland und Österreich: Personenbezug zuerst prüfen** (`eu-grundlagen`): DE/AT: DSGVO Art.4 Nr.1/7 Personenbezug und Verantwortlicher; Art. 5 Grundsätze, Art. 6 Abs.1 lit.fDreischritt, Art. 13 Information und Art. 32 Sicherheit. Fallgruppe ausdrücklich nicht rein häusliche Personenaufnahme.
  - [DSGVO · Amtlicher Abdruck bei der BfDI](https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Broschueren/INFO1.pdf?__blob=publicationFile&v=61) — Gesetzgeber der Europäischen Union; amtlicher Abdruck der Bundesbeauftragten für den Datenschutz und die Informationsfreiheit.
  - [DSK · Orientierungshilfe Videoüberwachung, insbesondere5.8 Wildkameras](https://www.baden-wuerttemberg.datenschutz.de/orientierungshilfe-videoueberwachung-nicht-oeffentlich/) — Konferenz der unabhängigen Datenschutzaufsichtsbehörden des Bundes und der Länder; LfDI Baden-Württemberg.
  - [DSB Österreich · Foto und Video](https://dsb.gv.at/faqs/foto-video) — Österreichische Datenschutzbehörde.
- **Deutschland: Waldbesucher und mildere Mittel** (`de-wald`): DE: DSK5.8 Wildkameras im öffentlich zugänglichen Wald, Waldbesucherinteressen, mildere Mittel und möglichst ausgeschlossene Personenaufnahme; Hinweise ersetzen keine Art. 6-Grundlage. Keine universelle Montagehöhe.
  - [DSGVO · Amtlicher Abdruck bei der BfDI](https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Broschueren/INFO1.pdf?__blob=publicationFile&v=61) — Gesetzgeber der Europäischen Union; amtlicher Abdruck der Bundesbeauftragten für den Datenschutz und die Informationsfreiheit.
  - [DSK · Orientierungshilfe Videoüberwachung, insbesondere5.8 Wildkameras](https://www.baden-wuerttemberg.datenschutz.de/orientierungshilfe-videoueberwachung-nicht-oeffentlich/) — Konferenz der unabhängigen Datenschutzaufsichtsbehörden des Bundes und der Länder; LfDI Baden-Württemberg.
- **Österreich: Geheimhaltung, Aufnahmeumfang und Speicherzweck** (`at-vorpruefung`): AT: § 1 DSG Geheimhaltung und gelindester Eingriff; DSGVO und DSB-Vorprüfung, Livebild, Transparenz, Zugriff und zweckbezogene Speicherung.72 h als Richtwert, nicht als allgemeine Gesetzesfrist oder Erlaubnis.
  - [DSGVO · Amtlicher Abdruck bei der BfDI](https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Broschueren/INFO1.pdf?__blob=publicationFile&v=61) — Gesetzgeber der Europäischen Union; amtlicher Abdruck der Bundesbeauftragten für den Datenschutz und die Informationsfreiheit.
  - [DSB Österreich · Foto und Video](https://dsb.gv.at/faqs/foto-video) — Österreichische Datenschutzbehörde.
  - [RIS · Datenschutzgesetz, geltende Fassung](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001597) — Österreichischer Bundesgesetzgeber; Rechtsinformationssystem des Bundes.
- **Schweiz: Private Fotofalle nach DSG** (`ch-privat`): CH: Bundes-DSGArt.2/5/6/19/31 Abs.2 lit.eund aktuelle EDÖB-Fotofalleneinordnung, private/kantonale Betreiber und begrenzte nichtpersonenbezogene Rechtfertigung; sofortige Vernichtung/Anonymisierung erkennbarer Personenbilder in dieser Fallgruppe. Keine Prüfung sämtlicher kantonaler Jagdregelungen.
  - [Fedlex · Bundesgesetz über den Datenschutz](https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/de/pdf-a/fedlex-data-admin-ch-eli-cc-2022-491-20250707-de-pdf-a.pdf) — Schweizerische Bundesversammlung; Bundeskanzlei Fedlex.
  - [EDÖB · Fotofallen und Wildtierkameras](https://www.edoeb.admin.ch/de/fotofallen-und-wildtierkameras) — Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter.
  - [Bundesamt für Justiz · Neues Datenschutzrecht](https://www.bj.admin.ch/de/neues-datenschutzrecht) — Bundesamt für Justiz Schweiz.

## Technische Eigenprüfung

JSON geparst; sechs eindeutige Modul-IDs mit vorgegebenem Präfix, vier Lektionen und32Fragen je Kurs geprüft. Jede Frage hat vier verschiedene Optionen, einen gültigen Index0–3und die passende Lesson-ID. Je Lektion acht Fragen, je Kurs A/B/C/Djeacht.24Evidence-Blöcke; sämtliche verknüpften Source-URLs sind als Modulquellen enthalten. Fragen und Erklärungen manuell gelesen, eigene Rechnungen separat nachvollzogen. Trichinellen-Distraktoren an vier Stellen nach Root-Rückmeldung auf sachnähere Dokumentations-/Probenalternativen verbessert.

Keine Root-Tests erneut gestartet und keine bestandenen Testzahlen als fachlichen Beweis ausgegeben. Fachliche unabhängige Kreuzprüfung und UI-/Zugangsprüfung sind getrennte nachfolgende Schritte.

## Gezielte redaktionelle Nachprüfung

Nach Peer-Hinweis die Erklärung von Wildkamera-Frage q6 auf den selbstständig verständlichen Art.-32-Satz gekürzt. Wiederholte Aussagen darüber, welche Anleitungen der Kurs nicht gibt, aus vier Lektionen entfernt; tatsächliche Grenzen zu Probenzuordnung, örtlichen Vorgaben, Produkt/Reifung und länderspezifischem Datenschutz bleiben erhalten. Auslassungen bleiben im Prüfbericht dokumentiert.

Zweite Peer-Präzisierung: Kartenprofile/q31 fragt jetzt die im Lektionstext erklärte Flächensignatur gegenüber dem Höhenpunkt ab, ohne zusätzlich ungelehrte swisstopo-Farbzuordnung. Trichinellenlabor/q7 fragt nach der Klärung örtlich geltender Vorgaben bei der zuständigen Stelle; ein Labor wird nicht als eigenständiger Rechtsetzer beschrieben.

- Abschließende Typografieprüfung: fehlende Leerzeichen in Rechtsnormverweisen, Zahleneinheiten und Quellenständen ergänzt. Keine IDs, Quellen-URLs, Antwortpositionen oder fachlichen Aussagen geändert.
