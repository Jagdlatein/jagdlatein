# Lektionsübung im bestehenden Wissenscheck

Technische Prüfung am 27. Oktober 2026. Es werden vorhandene eigene Kursfragen wiederverwendet; die Funktion erzeugt keine neuen fachlichen Aussagen oder amtlichen Prüfungsfragen.

## Verhalten

Die bestehende untere Lektionsauswahl bietet „Lektion üben“, sofern der aktuell angezeigten Lektion tatsächlich Fragen zugeordnet sind. Der Beginn verwendet ausschließlich deren exakte `lessonId`. Der vorhandene Wissenscheck öffnet sich auf derselben Seite und erhält den Fokus; es gibt keinen zweiten Dialog, keine zusätzliche Kategorie und keine neue Route. Der vollständige Lerntext bleibt vor dem Wissenscheck, der Quellenbereich geschlossen am Schluss.

Die Runde benennt ihre Ausgangslektion. Der Fehlerdurchgang enthält ausschließlich ihre falsch beantworteten Fragen. „Lektion wiederholen“ stellt den ursprünglichen Lektionspool wieder her, auch wenn währenddessen eine andere Lektion zum Nachlesen gewählt wurde. Bereits bestehende Vollkursrunden und deren Wiederholungsverhalten bleiben erhalten. Die Antworten werden weiterhin nach unveränderten Antwort-IDs beurteilt; die vorhandene Anzeigevariation und Tageswiederholung bleiben aktiv.

Lektionsrunden verändern weder Vollkursabschluss noch dessen gespeichertes Ergebnis. Sie verändern dafür nicht einmal das an den vorhandenen Fortschrittshook übergebene Vollkursobjekt. Ein absichtlicher Neubeginn ersetzt nur die aktuelle Übungsrunde.

## Lebenszeit und Auswahl

Der Start prüft Bereitschaft, Mountzustand, die konkrete angezeigte Lektion, den aktuellen URL-Kontext und den aktuellen Rundenzustand. Ein schon übernommener anderer Lektionshash kann nicht vor seinem Leseeffekt den alten Fragenpool starten. Aufbewahrte Start-, Antwort-, Weiter- und Wiederholungsaktionen können keine ersetzte Runde verändern. Antworten und Review-Einträge nach Unmount werden früh abgewiesen. Ein ausdrücklich ungültiger Lektionshash startet keinen fremden Ersatzpool.

## Nachweis

Neun neue Tests in `scripts/test-course-lesson-practice.cjs` verwenden tatsächliches React-DOM mit isolierten Kurs-, Router-, Fortschritts- und Review-Doubles. Sie prüfen den unteren Menüort, denselben Wissenscheck und den vollständigen Lerntext vor geschlossenen Quellen, Fokus, genaue Lektionspools und fehlende Fragen, Fehlertraining und vollständige Wiederholung, erhaltenen Vollkursabschluss, Bereitschaft, alte Handler, echten Unmount und einen bereits übernommenen Hash vor Neuzeichnung. Zwei Fälle entstanden aus einer unabhängigen Gegenprüfung. Der erste Fortschrittstest wurde eng am tatsächlichen Hookeingang statt an den anders aufgebauten Anzeigeprops ausgerichtet; dafür war keine Produktkorrektur nötig.

Die unabhängige Code- und Lebenszyklusprüfung fand keine wesentlichen offenen Befunde. Struktur- und DOM-Prüfungen sind kein Nachweis einer angemeldeten Geräteansicht. Produktionsbuild und tatsächliche Auslieferung werden im gemeinsamen Paket zusätzlich geprüft.

Gemeinsamer Abschlusslauf: 211 unterschiedliche passende Tests in 27 Dateien bestanden, ohne übersprungene Fälle. Der vollständige Produktionsbuild mit 509 Seiten wurde erfolgreich abgeschlossen. Die Protokolle liegen außerhalb des Repositories im Chat-Arbeitsordner unter `work/regional-law-qa/tests-oct27-linked-learning.txt` und `build-oct27-linked-learning.txt`. Die beiden neuen Fachlektionen wurden separat anhand konkreter Original- und unabhängiger Erläuterungsquellen gegengeprüft; dieser technische Bericht erweitert deren fachlichen Aussageumfang nicht.
