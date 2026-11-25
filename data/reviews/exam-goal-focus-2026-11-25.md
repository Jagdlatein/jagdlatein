# Einzelne Prüfungsaufgaben direkt öffnen

Technischer Abgleich am 25. November 2026 gegen den produktiven Ausgang `7b69962b0fee40db63096d512b852a4241c90fcb`.

## Verhalten

Die zwölf vorhandenen Kategorie-Falleinstiege und ihre Treffer in der zentralen Suche führten bisher nur zum jeweiligen Viererblock im Prüfungsplan. Sie führen nun mit `lernziel=<bestehende ID>` zur konkreten gemeinsamen Aufgabe. Der vollständige Fall, die Nachfrage, die geschlossene Selbstkontrolle sowie die genauen Lektions-, Karten- und Übungslinks bleiben dieselben.

Die einzige vorhandene untere Auswahl erhält das Feld «Aufgabe». Es enthält die gemeinsamen Ziele des gewählten Lerngebiets; «Alle Aufgaben» stellt die bisherige gemeinsame und regionale Übersicht wieder her. Es entsteht keine neue Route, Kategorie, Suchmaske oder Dialogebene. Bare Aufrufe und bisherige Kategorie-/Lernstandlinks behalten die bisherige Auswahl. Die 48 gemeinsamen Ziele, ihre Inhalte, Quellenkontexte und IDs werden nicht geändert. Regionale Lernziele werden nicht als gemeinsame Aufgaben angeboten.

Einzelne Aufgaben werden ausschliesslich aus einem bereiten, übereinstimmenden Router-/Browserzustand übernommen. Leere, unbekannte, mehrfach angegebene oder zum Lerngebiet widersprüchliche Aufgabenwerte zeigen eine Auswahlhilfe ohne Ersatzauftrag. Die Metadatenprojektion enthält nur ID, Titel und Kategoriename; doppelte Gruppen, doppelte IDs, fremde Kategorien und ungültige IDs scheitern geschlossen. Die URL enthält keine Antwort, Markierung, Kontokennung oder Prüfungsregion.

## Navigation und persönliche Daten

Eine neue Wahl ist ein tatsächlicher Push. Bis zum Commit bleibt der bestätigte Inhalt sichtbar; neue Texte und der Fokus am Seitenanfang folgen erst dem tatsächlichen übereinstimmenden URL-Commit. Ein aufgelöstes Push-Versprechen allein ist kein Commit. Das Pendingticket bleibt bis zur nächsten tatsächlich übernommenen Ansicht erhalten. Dadurch kann die ausdrücklich erneut gewählte sichtbare Aufgabe eine noch ausstehende andere Wahl mit einem eigenen Push überholen. Alte Fortsetzungen, A-B-A-Ansichten, geänderte Raw-URLs, Queryobjekte, Hashes, Browserzustände und Unmounts reaktivieren keine alten Aktionen.

Eine Lerngebietswahl entfernt gezielt `lernziel`; Lernstand und übriger Suchkontext bleiben erhalten. Eine Lernstandwahl bewahrt die Aufgabenwahl. «Alle Aufgaben» entfernt nur das Aufgabenfeld. Der vorhandene untere Zurück-Verlauf unterscheidet dieses Feld nur auf `/lernen/pruefungsplan`; fremde Queryänderungen werden dadurch nicht global zu zusätzlichen Schritten.

Das Lesen oder Navigieren schreibt keine Markierung, keinen Wiederholungsverlauf und kein Prüfungsprofil. Die bestehenden Gesamtzähler zählen weiterhin das vollständige bestätigte Prüfungsziel. Ein gerade geänderter, fokussierter Markierungsregler bleibt bis zur erneut angewendeten Auswahl bedienbar. Unter einer einzelnen gemeinsamen Aufgabe werden keine anderen regionalen Aufgaben eingeschoben. Das regionale Recht und seine Originalquellen bleiben an das bestätigte Prüfungsprofil gebunden; generische Rechtskurschecks und Rechtskarten werden nicht freigeschaltet.

## Quellen und Prüfung

Die geschlossene letzte Quellenrubrik nennt für das sichtbare gemeinsame Ziel genau dessen bestehende Quellen und Quellenkontexte. Bestehende Datumsangaben bleiben unverändert. Dies ist eine technische Verknüpfung vorhandener Lernaufträge und keine neue fachliche Zertifizierung oder Erhöhung der amtlichen Prüfungsabdeckung.

Die echten isolierten React-/DOM-Regressionen prüfen direkte Aufgabenansicht, Auswahlhilfe, Pending-/Commit-/Gegenwahlverhalten, falsche und abgebrochene Übergänge, Quellenumfang, Markierungsbeibehaltung, Browser-/Router-Zwischenzustände, unveränderte Speicherstände, History und Unmount. Zusätzlich werden alle 48 tatsächlichen gemeinsamen Ziele und alle 51 Rechtsprofile mit dem echten Plan-/Zieldarsteller geprüft. Der untere Verlauf besitzt einen eigenen Aufgaben-/Kontext-/Native-/Immediate-Back-Test. Die unveränderten älteren Lernstand-, Fortschritts- und Themenverträge bleiben erhalten.

Eine unabhängige Gegenprüfung reproduzierte zunächst die Pendinglücke «Push schon angenommen, URL noch nicht übernommen»; sie wurde behoben und durch eine zusätzliche echte Regression abgesichert. Finale Tests, Build, Gegenprüfberichte und Auslieferungsbelege liegen ausserhalb des Repositorys unter `work/continued-learning-nov25/`. Es wurden keine echten Konten oder Browserdaten für diese Tests verwendet; keine visuelle Geräteprüfung oder angemeldete Produktions-Lehransicht wird behauptet.

Die Gegenprüfung fand ausserdem bisher nur routergebundene Markierungs- und Zurücksetzen-Handler, die eine bereits vorlaufende Browseradresse nicht sahen. Beide Mutationspfade sind nun zusätzlich an die aktuelle bereite Leseselektion gebunden. Ein alter Regler und ein während einer unvollständigen Browser-/Routerübernahme neu gerenderter Reset erzeugen keine Speicheränderung. Gültige aktuelle Markierung und ausdrücklich gewähltes Zurücksetzen funktionieren weiter. Der bestehende Konto-DOM-Harness erhält optional eine passende Startadresse; seine bisherigen Standardwerte und sämtliche Profil-/Speicherassertions bleiben erhalten.
