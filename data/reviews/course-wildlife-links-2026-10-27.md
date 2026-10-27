# Kurse mit vorhandenem Artenwissen verbinden

Technische Umsetzung und Prüfung am 27. Oktober 2026. Keine neuen biologischen Aussagen, Medien oder fachlichen Prüfdaten.

## Abgegrenzte Zuordnung

Die neue serverseitige Projektion in `lib/course-wildlife-links-server.js` kehrt ausschließlich bereits redaktionell zugewiesene Einträge aus `getWildlifeLearningGuide` mit `scope === "species"` um. Allgemeine Biologie-Grundlagen werden nicht zu vermeintlich artspezifischen Empfehlungen. Es gibt keine Stichwortsuche, Ähnlichkeitswertung oder künstlich abgeschnittene erste Artenliste.

Nach der engen neuen Ringeltauben-Zuordnung ergibt der Bestand 34 Zuordnungen in 14 Kursen zu 27 Arten. Pro Kurs entstehen höchstens sechs Artenzeilen. Die größte tatsächlich erzeugte Metadatenliste umfasst 1422 UTF-8-Bytes; sie enthält ausschließlich `slug`, `name`, `lessonIds`, `portraitHref`, `yearHref` und `modelHref`. Fachtexte, Fragen, Lösungen, Fotos und Prüfdaten werden nicht zusätzlich übertragen.

Kursweite Zuordnungen bleiben in jeder Lektion dieses Kurses sichtbar. Eine lektionsbezogene Zuordnung verlangt die exakte und im Kurs genau einmal vorhandene `lesson.id`. Konkret erscheint der Feldhase beim Verdauungsvergleich ausschließlich in `blinddarm`, die Ringeltaube ausschließlich in `kropfmilch`; beide fehlen in `caecotrophie`, `schweinemagen` und `vogelmagen`. Präfix-/Suffixähnlichkeiten reichen nicht aus. Unbekannte Kurse oder ungültige Lektionszuordnungen erhalten keine Ersatzart.

## Anzeige und Ziele

`CourseWildlifeLinks` steht genau einmal im vorhandenen unteren Kursmenü unter „Arten“. Die sichtbaren Bezeichnungen lauten „Artenwissen“, „Wildjahr“ und bei einem tatsächlich vorhandenen Modell „3D“; die zugänglichen Namen nennen zusätzlich die jeweilige Art. Es entstehen keine weiteren Fenster, Auswahlstufen oder lokalen Zustände.

„Artenwissen“ öffnet das tatsächlich registrierte Porträtziel `#art-lerntext-<moduleId>` beziehungsweise die ausdrücklich neue Kropfmilch-Ziel-ID und damit die vorhandene kursbezogene Lesestelle im Artenkontext. „Wildjahr“ übergibt nur die explizite Art und erfindet keinen Monat oder vollständigen Monatskalender. „3D“ führt ausschließlich bei einem vorhandenen zugeordneten Präparat zum Kieferatlas. Die Links laden private Ziele nicht vor und öffnen keinen neuen Tab.

Der aktuelle Lerntext mit Merkhinweis, Denkaufgabe und Wissenscheck bleibt in der Lernansicht zuerst. Die bestehenden ergänzenden Quellen bleiben geschlossen am Ende. Der Artenblock ergänzt ausschließlich die vorhandene untere Navigation. Lernkarten- und Videolinks werden nicht dupliziert.

## Server-, Offline- und Bestandsgrenzen

Nur `pages/kurse/[slug].js` importiert die Projektion für `getStaticProps`. Die neue Anzeige erhält eine optionale kleine `wildlifeLinks`-Eigenschaft; bestehende Aufrufer behalten mit `[]` ihre bisherige Darstellung. Der überprüfte Next-Clienttransform entfernt die Serverprojektion und ihre Katalog-/Curriculumimporte aus der Page-Ausgabe. Die neue Darstellung importiert selbst nur interne Links und die vorhandenen Kursstile.

Die originalen Modulobjekte und deren Fragen, Lerntexte und Quellen werden nicht verändert. Offlinepaket-Schema, gespeicherte Pakete, Offline-Leser und ihre Prüfdaten bleiben unberührt; neue Online-Ziele werden nicht als offline verfügbar ausgegeben. Es gibt keine neue Speicherung, Konto-, Zahlungs- oder Benachrichtigungsfunktion.

## Tests

Acht neue Fälle in `scripts/test-course-wildlife-links.cjs` prüfen alle vorhandenen SSG-Kurse und sämtliche 34 positiven Zuordnungen gegen die tatsächlich vorhandenen Guideeinträge; genaue Lektionsgrenzen und ungültige/doppelte IDs; minimale serialisierbare Felder und Metadatenbudget; reale Porträt-Topicanker; vorhandene Modelle; SSR und kurze interne Bezeichnungen; tatsächlichen Next-Clienttransform sowie die Einbindung und aktuelle Lektionsauswahl des bestehenden Kursbesitzers. Die originalen Modulobjekte und Lernkarten-Zusammenfassungen werden positiv erhalten geprüft. Der Kursbesitzertest bestätigt die unveränderten vollständigen Lektionsabsätze, vorhandenen Wissenscheck und die letzte geschlossene Quellensektion.

## Zwei Lesestellen desselben Kurses im Ringeltaubenporträt

Die Ringeltaube behält ihre bisherige Vogelfundament-Zuordnung zur Lektion `vogelmagen`. Nur das ausdrücklich neue Kropfmilch-Ziel erhält eine separate `topicId` und die optionale API-Auswahl `lektion=kropfmilch`. Die alten Modulanker, clientseitigen Schlüssel, Anfragen ohne `lektion` und deren Rücksprungbedeutung bleiben erhalten. Ohne explizite Auswahl wird weiterhin der bisher erste redaktionelle Guideeintrag des Moduls verwendet.

Die Lesestellen-API prüft weiterhin zuerst den lebenden Zugang. Die zusätzliche Auswahl muss genau einmal vorkommen, nicht leer und höchstens 140 Zeichen lang sein. Sie darf nur eine tatsächlich zu dieser Art und diesem Kurs redaktionell zugewiesene `target.lessonId` auswählen; bloße Zugehörigkeit irgendeiner Lektion zum Kurs genügt nicht. Nur eine ausdrücklich lektionsbezogene Anfrage erhält zusätzlich `lessonId` im Ergebnis. Neue Schlüssel, Requests, Antwortvalidierung und Rücksprunglinks des Readers unterscheiden die neue Lesestelle auch bei gleicher Art und gleichem Kurs. Mounted-/Origin-/Anfragetickets erhalten die Abbruch-, Unmount-, Retry- und Timeout-Grenzen. Die Quellenüberschrift nennt das historische Kursdatum neutral „Übernommener Kursprüfstand“; der Lektionsnachweis übernimmt weiterhin das gültige neue Lektionsdatum 27. Oktober anstelle des Kursdatums 16. Oktober. Keine Datierung wird verändert.

Acht weitere neue Fälle in `scripts/test-wildlife-study-lesson-identity.cjs` prüfen altes Vogelmagen-Ergebnis gegen neue Kropfmilch-Auswahl, API-Zugang vor Eingabeprüfung, mehrfache/leere/überlange sowie sachfremde Lektionsangaben, tatsächliche eindeutige Porträtziele, Same-Art-/Same-Kurs-A–B–A, falsch zugeordnete Antworten, Login-Rücksprung, frühere Retryhandler, Unmount und den bestehenden begrenzten Timeout. Sie vergleichen außerdem sämtliche vollständigen alten Guideobjekte und alle alten Übungslinks für 114 Arten positiv mit dem direkt aus Git geladenen Stand `6860695`: nur die Ringeltaube bekommt genau ihr viertes Ziel; ihre alten drei Objekte bleiben vollständig gleich. Der vorhandene Gesamtguide-Studientest berücksichtigt ausschließlich beim neuen expliziten Ziel die neue Lektionsauswahl.

29 unterschiedliche Fälle in fünf Dateien bestanden ohne übersprungene Fälle: acht neue Kursverknüpfungsfälle, acht neue Lektionsidentitätsfälle sowie 13 bestehende Kurs-URL/Commit-, Guide- und Inhalts-/Zugangsfälle. Die Prüfungen verwenden lokale Quellmodule und isolierte Renderer; Daten und Requests sind Doubles. Sie behaupten keine visuelle Geräteprüfung oder bereits angemeldete Produktionsansicht. Produktionsbuild und tatsächliche Auslieferung werden im Hauptarbeitsabschnitt separat geprüft.
