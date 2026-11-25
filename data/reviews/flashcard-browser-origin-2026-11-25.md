# Lernkarten: verbindliche Browseradresse und sichere Übergänge

Technische Prüfung vom 25. November 2026. Veröffentlichte Vergleichsbasis: `5d231d94a652d0685708326f1faa6b5c22008d96`. Diese Prüfung ändert keine fachlichen Prüfdaten.

## Reproduzierter Fehler

Ein echter React-/DOM-Renderer mit isolierten Beispieldaten bestätigte: Nach einem Browser-Zurück-/Vorwärts-Ereignis konnte die Browseradresse bereits eine Hundekarte nennen, während Next-Router und Query noch eine Rehkarte führten. Ein dadurch ausgelöster neuer Render zeigte die offene alte Lösung und liess deren Bewertung zu. Das geschah auch nach einem vorausgehenden Next-`routeChangeStart`. Spiegelbildlich liess ein vorausgehender Router die neue Karte unter der alten Browseradresse beantworten. Normale, vollständig übernommene Karten-, Kategorie-, Modus- und Historywechsel waren bereits korrekt blind.

Zwei weitere kleine Fehler wurden mit tatsächlichen DOM-Callbacks belegt: Der ausdrückliche Link «Alle Lernkarten» war bei einer ungültigen Kursauswahl blockiert. Ein aufbewahrter «Erneut laden»-Callback rief seine Ladeaktion nach einer fremden Browseradresse weiter auf.

## Begrenzte Änderung

`flashcardRouteOriginIsCurrent` verlangt Übereinstimmung zwischen der vollständigen Raw-URL, allen decodierten Querywerten und der Browseradresse einschliesslich Hash. Fremde Queryfelder und die Reihenfolge mehrfacher Werte werden mitgeprüft. Serverseitige Darstellung bleibt ohne erfundene Browseradresse möglich. Auswahlvalidität wird getrennt geprüft: Eine identische, aber ausdrücklich ungültige Auswahl bleibt reparierbar; ein gemischter Browser-/Routerstand ist keine Handlungserlaubnis.

Die Leseransicht gibt in einem solchen Mischstand keine Karte, Lösung oder Bewertung frei. Bereits bewusst geöffnete Antworten und bereits angewendete Bewertungsgrenzen werden während des unverbindlichen Übergangs aufbewahrt. Eine abgelehnte Auswahl unter unveränderter bestätigter Adresse erhält die alte Antwort. Erst ein tatsächlich übernommener anderer Karten-, Kategorie- oder Moduskontext beginnt wieder blind. Eine bereits abgegebene Bewertung kann auch nach einem zwischenzeitlichen Browserziel und anschliessendem Rollback nicht nochmals angewendet werden.

URL-Synchronisierung prüft die aktuelle Identität vor Timer-, Queue-, Commit- und Folgeaktionen. Eine bestätigte Ausgangsadresse beziehungsweise das Ziel einer eigenen noch zugehörigen Navigation bindet die Arbeit an ihre Quelle. Damit reicht auch eine ohne Render vollständig fremd übernommene Browser-/Routeradresse nicht aus, um eine alte Suchabsicht erneut zu schreiben. Legitime eigene Navigation und das vollständige Abarbeiten nachfolgender Auswahlabsichten bleiben erhalten. Eine erfolgreiche Router-Promise allein übernimmt noch keine Karte.

Auch die spätere Fortsetzung eines Kurs-/Drucklinks prüft unmittelbar vor Navigation oder History-Ersatz die vollständige Identität und die erlaubte Ausgangs-/Flush-Zieladresse. Fokusaktionen verlangen erneut eine aktuelle Handlungserlaubnis. Alte Antworten, Bewertungen, Auswahl-, Such-, Formular- und Retryaktionen kehren nach Unmount oder fremdem Kontext vor ihrer Wirkung zurück.

Bei einer ungültigen Kursauswahl bleibt ausschliesslich der vorhandene ausdrückliche Link `/lernen/lernkarten?kategorie=all` als gewöhnlicher Next-Link erlaubt, wenn die vollständige Adresse aktuell ist und keine Navigation läuft. Das gibt weder Antworten noch Bewertungen oder einen ungeprüften Druckumfang frei. Der neue Umfang wird durch den bestehenden Seiten-/Zugangspfad geladen.

## Erhaltung und Prüfung

Die Route, Auswahlfelder, beiden Modi, vorhandenen Kategorien und Beschriftungen, Karten-/Kurs-/Lektionsdaten, Antworten, Erklärungen, Medien, Quellen und fachlichen Daten bleiben erhalten. Review-Speicherschlüssel, Schema und Bewertungsregeln wurden nicht geändert. Es entstehen keine neue Suche, Auswahlfenster oder Kontozugriffe.

Die neue Suite `scripts/test-flashcard-browser-origin-nov25.cjs` enthält 18 bestandene echte DOM-Regressionen. Sie prüft positive native Auswahl-/Historyabläufe, beide Übergangsrichtungen, unbekannte Queryfelder, leere/mehrfache/ungültige reparierbare Auswahlfelder, den engen Kurs-Escape, verzögerte Arbeit ohne Render oder Popstate, Queue-/Promisefortsetzungen, gültige eigene Übergänge, Rollback/Doppelbewertung und wirklichen Unmount einschliesslich Retry. Alle 153 Tests in den zehn Lernkarten-Testdateien bestanden ohne übersprungene Fälle mit lokalem Node.js 22.23.5.

Drei historische Fixtures wurden separat durch den Integrator ausschliesslich um ihre fehlenden tatsächlichen Routerquery-/Browser-/History-Übernahmen ergänzt. Bestehende Inhalts-, Druck-, Speicher-, Lade-, Fehlerrückkehr- und Lebenszeitassertions blieben erhalten. Ein unabhängiger Reviewer verwendet ausserhalb des Repos einen eigenen DOM-Renderer und einen positiven Vollobjektvergleich des vorhandenen Korpus; sein endgültiger Hashabgleich wird dort gespeichert.

Nachweise ausserhalb des Repos: `work/flashcard-ux-audit-nov25/native-probe.json` (vorher), `reload-guard-before.txt`, `native-regression-final.txt`, `all-flashcard-tests-final.txt` und der separate unabhängige Review. Kein echtes Benutzerkonto, Kundenstorage oder Gerät wurde benutzt. Eine lokal bestandene Regression beweist keine angemeldete oder visuelle Geräteansicht; der lokale Prüfer bezeichnet nicht den Node-Patchstand des verwalteten Produktionsservers.
