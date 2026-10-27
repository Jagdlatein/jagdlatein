# Wildjahr: einfache Artenwahl und verlässlicher Seitenanfang

Technische Gegenprüfung am 27. Oktober 2026. Die Änderung betrifft Auswahl und Scrollverhalten; sie fügt keine biologischen Fakten, Jagdzeiten, Prüfdaten oder Medien hinzu.

## Reproduzierter bisheriger Ablauf

`scripts/test-wild-year-top-scroll.cjs` lädt den veröffentlichten Elternbestandteil ausdrücklich aus Commit `477c10e9f64a23d1dadf3663158ef53f62be9708`. Die isolierte Komponenten-Lebenszeit verwendet dabei die wirklichen gemeinsamen Menü- und Single-View-Funktionen sowie DOM-Fokus in jsdom.

Beim tatsächlichen Artenwechsel schreibt der alte Bestandteil `#wildjahr-current` in die URL, schließt das Menü und führt `scrollIntoView({ block: "start", behavior: "auto" })` an genau dieser Inhaltsüberschrift aus. Diese steht im DOM nach dem Seitentitel und nach der Monatssteuerung. Ein absoluter Aufruf zum Seitenanfang fehlt. Damit ist der unerwünschte Sprung unter den eigentlichen Seitenanfang konkret reproduziert; die Entfernung bis zu einem physischen Bildschirmende wird dadurch nicht gemessen.

Die Gegenprobe hat keine zusätzliche spätere Fokusverschiebung durch das gemeinsame Menü ergeben. Seine Schließfunktion hebt `inert` und die Überlaufbegrenzung synchron auf. Nachfolgende Observer-/Toggle-Zustellungen verschieben den bereits außerhalb des Menüs liegenden Inhaltsfokus nicht zurück zum unteren Menü. Der globale Kategorien-Reset ist für `/lernen/wildjahr` nicht zuständig. Eine native Android-Auswahlfenster-Rückkehr ist nicht nachgestellt und wird nicht als bewiesene Ursache behauptet.

## Begrenzte Korrektur

Die Artenwahl verwendet im bestehenden unteren Menü die 114 vorhandenen Namen und Gruppen als normale Schaltflächen. Es entsteht kein zusätzliches Fenster, und eine getrennte Monatsauswahl im Menü entfällt. Ein bewusster Artenklick darf einen ungültigen Monatsparameter mit dem bereits gelieferten Kalendermonat reparieren. Die Monatssteuerung bleibt anschließend am ausgewählten Modell.

Ein neuer Fokuspunkt `wildjahr-top` steht vor der Monatssteuerung. Nach übernommener Auswahl, Verlaufsschritt oder erneuter Wahl wird das gemeinsame Menü zuerst synchron freigegeben, dann der Seitenanfang mit `preventScroll` fokussiert und das Fenster absolut auf Position null gesetzt. Ein einzelner geschützter Animationsframe bestätigt diese Position nach dem Layout. Veraltete Frames dürfen weder einen späteren Schritt verschieben noch dessen Abbruchauftrag verlieren. Der Monatsschieber behält bei seinem eigenen Commit seine bisherige lokale Fokusregel und erzeugt keinen solchen Rücksprung.

Ausgehende Adressen verwenden `#wildjahr-top`. Das bisherige Ziel `#wildjahr-current` bleibt im Inhalt vorhanden. Auswahl und Lerntext bleiben von der tatsächlich übernommenen URL abhängig; fehlgeschlagene oder abgebrochene Wechsel schalten keine Fakten vorzeitig um.

## Tatsächlich ausgeführte neue Regressionen

Die sechs Fälle in `scripts/test-wild-year-top-scroll.cjs` bestanden unter Node 22:

1. Positiver Reproduktionsvergleich gegen den veröffentlichten Commit einschließlich des tieferen Zielankers; keine erfundene globale Scrollwiederherstellung.
2. Wirkliche gemeinsame Menüfreigabe vor DOM-Fokus und `window.scrollTo`, neue Zieladresse sowie genau eine ausstehende Framekorrektur.
3. Ein zurückbehaltener abgebrochener Frame kann den neueren Auftrag weder ausführen noch dessen Handle löschen; dessen späterer Unmount-Abbruch bleibt wirksam.
4. Eine Schieberaktion entwertet eine ausstehende Seitenanfangskorrektur und bewahrt bei Übernahme den vorhandenen Schieberpfad ohne neue Top-Fokusaktion.
5. Fehler, veraltete Artenaktionen und Unmount verursachen keine nachträgliche Seitenanfangskorrektur.
6. Abgrenzung zum globalen Kategorien-Reset und zur tatsächlich unveränderten gemeinsamen Menülogik.

Die drei bestehenden Navigations-/Katalog-/Jahresübersichtssuiten wurden eng auf tatsächliche Schaltflächenaktionen und den neuen Fokuspunkt umgestellt. Aussagen zu Originaldaten, Quellen, URL-Verbindlichkeit, Fehler-/Pending-/Origin-/Unmountgrenzen, Serverdarstellung und allen 114 Einträgen bleiben erhalten. Eine explizite Prüfung verhindert die Rückkehr einer Monatsauswahl im Menü. Die bestehenden breiten Suiten werden im abschließenden Veröffentlichungslauf zusätzlich ausgeführt.

## Grenzen

jsdom besitzt keinen physischen Viewport und keine Betriebssystem-Auswahlfenster. Die Nachweise betreffen wirkliche isolierte Komponenteneffekte, Menüfreigabe, DOM-Fokus und aufgezeichnete Scrollaufrufe. Sie sind keine Android-/iOS-Sichtprüfung, keine authentifizierte Produktions-Lehrtextprüfung und keine neue fachliche Gesamtprüfung. Auslieferungskennung, Veröffentlichungscommit und bereitgestellte Dateien werden nach Veröffentlichung separat geprüft.

## Abschließende Prüfung des Veröffentlichungspakets

In 16 passenden Testdateien bestanden insgesamt 164 unterschiedliche Fälle unter Node 22, ohne übersprungene Fälle. Der erste gemeinsame Lauf führte 146 Fälle erfolgreich aus; eine weitere Datei konnte zunächst ihre ausdrücklich extern bereitzustellende DOM-Testbibliothek nicht laden. Nach Setzen von `JAGDLATEIN_TEST_DOM` auf die bereits vorhandene Installation bestanden deren zwölf echten React-/Portal-Lebenszyklusfälle ohne Produktänderung. Die sechs neuen Scrollfälle wurden zusätzlich vom Hauptbearbeiter ausgeführt und bestanden. Die vollständige Produktionskompilierung erzeugte erfolgreich 509 statische Seiten. `git diff --check` ist fehlerfrei. Die vollständigen Protokolle liegen im Chat-Arbeitsordner außerhalb des Repositories unter `work/regional-law-qa/tests-oct27-wildyear-choice-scroll-{main,menu,focus}.txt` und `build-oct27-wildyear-choice-scroll.txt`.

Eine ausdrücklich isolierte lokale Browseransicht verwendete außerdem die tatsächliche neue Auswahlkomponente, ihre unveränderten CSS-Regeln und ein einfaches Umschaltdouble. Bei 390 Pixeln Breite wurden die zweispaltigen Schaltflächen, die Auswahl aus der langen Liste und der sichtbare Monatsbalken betrachtet. Ein Klick auf Biber zeigte das Modell ab Seitenposition null; der Balken wechselte Juni zu Juli ohne Positionsänderung. Das bestätigt Layout und Bedienbarkeit dieses Testaufbaus, nicht die vollständige Komponenten-Navigation im Browser. Diese wird durch die getrennten tatsächlichen Komponenten-/Menü-/DOM-Regressionen geprüft. Der öffentliche Lernlink führte ohne Anmeldung regulär zur Zugangsseite; es wurde keine Sperre umgangen. Browsergröße wurde zurückgesetzt und die lokale Vorschau beendet.

Alle 114 Katalogeinträge, die 30 Monatsmodelle mit 360 Ansichten, 84 weiteren Übersichten, Lerntexte, Übungsdaten, Medien und fachlichen Prüfdaten bleiben unverändert. Der fremde Stand in `data/learning-expansion-afternoon-2026-10-16.json` wurde nicht verändert oder gestagt; sein SHA256 bleibt `23E6E8FC8FD6C3E1B5AD115B92036B901D0DC3613332D4EDD0DEB0C283A607C9`. Es gibt keine Änderungen an Benutzer-, Zahlungs- oder Zugangsrechten.
