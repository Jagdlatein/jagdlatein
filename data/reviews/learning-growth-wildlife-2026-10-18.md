# Quellenprüfung: Erfolgskontrolle von Wildtierquerungen

Stand: 18.10.2026. Umfang: ein neuer Vertiefungskurs, drei Lektionen und zwölf Fragen. Keine Gesamtzertifizierung des Jagdlatein-Wissens.

## Abgrenzung und Bestandsprüfung

Die vorhandene Einheit `wissen-ausbau-oekologie-tierbewegungen-2026` erklärt bereits Korridor, Passage, Leitzaun und die begrenzte Aussage eines einzelnen Nutzungsbilds. Der neue Kurs vertieft deshalb die konkrete Erfolgskontrolle: räumlich vergleichbare Bewegungszählungen, BACI-Unfallvergleiche sowie genetische Individual- und Elternschaftsdaten. Die Namen Sawaya, Rytwinski und Soanes waren in den geprüften bisherigen Kurs-JSON-Dateien nicht enthalten. Allgemeine Grünbrücken-Grundlagen werden nicht als neues Wissen vervielfacht.

## Gelesene Primärarbeiten und Grenzen

- [Ballók, Náhlik & Tari 2010, Original-PDF](https://real.mtak.hu/188652/1/Acta-Silvatica-Lignaria-Hungarica-2010-Vol06-067-074.pdf): Methoden ab gedruckter S. 69 und Ergebnisse. Rotwildspuren vor, während und nach dem Bau eines M7-Abschnitts in Ungarn. Keine lokale Prozentzahl als universelle Wirkung oder Populationsabnahme übernommen.
- [Ford et al. 2022, Original-Volltext](https://www.frontiersin.org/journals/conservation-science/articles/10.3389/fcosc.2022.935420/full): Methoden, Ergebnisse und Diskussion. Vier BACI-Gruppen, unterschiedliche Straßenlängen und Beobachtungszeiten sowie zeitliche Änderungen der Referenzstrecken. Maßnahmenstandorte nicht zufällig verteilt. Keine Verallgemeinerung des unsicheren Carnivorenbefunds auf Wirkungslosigkeit. Autor heißt Benjamin Dorsey. Nordamerikanischer Elk wird nicht als europäisches Rotwild übernommen.
- [Sawaya, Kalinowski & Clevenger 2014, Originaldatensatz und Publikationsnachweis](https://pubmed.ncbi.nlm.nih.gov/24552834/): Originalartikel zusätzlich als [Verlags-PDF im ARC-Archiv](https://arc-solutions.org/wp-content/uploads/2014/03/Proc.-R.-Soc.-B-2014-Sawaya-.pdf) gelesen, insbesondere Methoden zu DNA-Erfassung, Individualidentifikation, genetischer Zuordnung und Elternschaft. Dieselbe Publikation in zwei Archiven ist eine Quelle. Untersuchung 2006–2008 bei Grizzly- und Schwarzbären in Banff. Kein gegenwärtiger Bestand, keine DACH-Genflussquote.
- [Hepenstrick et al. 2012, institutioneller Publikationsdatensatz](https://digitalcollection.zhaw.ch/items/d63598a1-4d8a-4166-b557-ed3b0c1f6f6c): Originalzusammenfassung gelesen. Genetische Gruppierung und Landschaftsvergleich beim Reh in einem Schweizer Korridor. Kein ungelesenes Volltextdetail, kein Vorher-Nachher-Erfolg einer neuen Passage, keine experimentell bewiesene Alleinursache behauptet.

## Ergänzende Forschungsübersichten

- [Soanes et al. 2024](https://besjournals.onlinelibrary.wiley.com/doi/10.1111/1365-2664.14582): Volltext mit Erfolgszielen und Diskussion des fence-funnelling-Effekts gelesen. Forschungsübersicht mit unzureichend vergleichbaren Daten für die ursprünglich geplante Metaanalyse; hier nicht als Metaanalyse bezeichnet.
- [Rytwinski et al. 2016](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0166941): Original-Metaanalyse zur Wildunfallvermeidung; Methoden- und Designabgleich. Keine pauschalen Prozentwerte oder allgemeine Mindeststudienzeit übernommen.

Die Übersichten haben teilweise gemeinsame Autoren und können einzelne Originalarbeiten enthalten. Sie sind keine unabhängige Wiederholung derselben Felddaten. Ford und Sawaya teilen einen Koautor und Teile der Untersuchungslandschaft; ihre verschiedenen Endpunkte sind keine Replikationen. Die Schweizer Rehwild- und ungarische Rotwildarbeit stammen aus anderen Teams und Untersuchungsgebieten. Konkrete lokale Ergebnisse werden nur dem jeweiligen Originalprojekt zugeschrieben; unabhängige Quellen prüfen die Abgrenzung der Messgrößen, statt ein scheinbares zweimaliges Bestätigen desselben Resultats zu behaupten.

## Didaktik und Qualitätsgrenzen

- Vier Antworten je Frage, genau eine richtige; zwölf eigenständige Fragen, vier je Lektion.
- Positive allein verständliche Wissensfragen zu Zähleinheiten, BACI, Genfluss und Elternschaft eignen sich für Lernkarten. Keine Frage verlangt nur das Wiedererkennen eines Abschnittstitels.
- Die richtigen Positionen sind gleich verteilt: je drei auf Index 0, 1, 2 und 3. Die bestehende Quizmischung kann die Reihenfolge zusätzlich verändern.
- Keine neuen Fotos, keine KI-Abbildungen, keine Bau- oder Handlungsanleitung.
- Quellen liegen je Lektion über `evidence` vor. `sourceReview` nennt Umfang und Grenzen. Quellenabgleich und Strukturprüfung sind keine wissenschaftliche Zertifizierung.
- Keine gemeinsamen Curriculum- oder UI-Dateien geändert, kein Build, Commit oder Push. Einbindung erfolgt durch den Hauptagenten.

## Validierung

Bestanden: JSON-Lesbarkeit, eindeutige Kennungen, drei Lektionen, zwölf vollständige Fragen (vier je Lektion), vier unterschiedliche Optionen, gültige Antwortpositionen und mindestens zwei registrierte Quellen je Evidenzaussage. Richtige Positionen ausgewogen und ohne einfaches zyklisches Muster angeordnet. Keine exakt normalisierten Fragen-Dubletten mit den anderen vorhandenen Modul-JSON-Dateien. Der bestehende `prepareEvidenceModules`-Adapter reichert alle drei Lektionen erfolgreich an; die Rohdaten enthalten zusätzlich bereits die vollständige `lesson.evidence`-Zuordnung. Diese technischen Prüfungen belegen Form und Zuordnung; die inhaltliche Einordnung steht oben. Kein Build ausgeführt.
