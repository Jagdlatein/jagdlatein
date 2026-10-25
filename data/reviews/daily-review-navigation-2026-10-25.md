# Kurze Wiederholung: verbindliche Auswahl und gezielte Runden

Technische Prüfung am 25. Oktober 2026. Keine neue fachliche Prüfung von
Kursinhalten, Quellen oder Wiederholungsabständen; keine neuen Fragen.

## Verhalten

Die bestehende Seite `/lernen/fuenf-minuten` verwendet das vorhandene untere
`PageMenu`, ohne zusätzliche obere Auswahlleiste. Ein Bereich enthält die kurzen
Modusnamen Gemischt, Fällig und Fehler sowie die unveränderten kanonischen
Kategorien des vorhandenen Katalogs. Die nackte Adresse behält den gemischten
Einstieg. Explizit unbekannte, leere oder mehrfache `modus`-/`kategorie`-Werte
zeigen eine Auswahlhilfe, statt still eine andere Runde zu laden. Vor bereitem
Router wird kein Ersatzpool angezeigt oder abgefragt.

- Gemischt verwendet die bisherige Sortierung, Kategorienverteilung und Grenze
  von bis zu acht Fragen unverändert.
- Fällig nimmt nur vorhandene Verlaufseinträge mit `due <= now`; neue oder noch
  nicht fällige Fragen füllen eine kurze oder leere Runde nicht auf.
- Fehler enthält nur aktuelle offene Fehler (`streak === 0`), auch vor ihrer
  Fälligkeit. Historische Fehler nach einer später richtigen Antwort sind kein
  offener Fehler. Der Hinweis auf bewusst früheres Üben ist direkt im Menü und
  bei der Erläuterung der Wiederholung sichtbar.

Eine leere strikte Auswahl nennt den tatsächlichen lokalen Zustand und stellt
keinen unnötigen Fragenabruf. Es werden keine Fragenzahlen aufgefüllt.

## Navigation und Lebenszeit

Die bereite validierte Router-URL bestimmt Modus und Kategorie. Ein Wechsel
schreibt einen echten `push`-Verlaufsschritt und erhält weitere öffentliche
Kontextfelder. Neue Aktionen kombinieren mit der angezeigten Auswahl, nicht mit
einem noch ausstehenden Ziel. Der untere Zurück-Pfeil behandelt ausschließlich
`modus` und `kategorie` dieser konkreten Route als zusätzliche Auswahlstufen.
Andere Such-/Kontextfelder bleiben innerhalb desselben Stopps.

Kein optimistischer Fragentextwechsel: erst die tatsächliche URL-Übernahme
wechselt den passenden Runden-Mount. Bei Fehler, `false`, Abbruch oder erneuter
Wahl der aktuellen Auswahl bleiben beantwortete Fragen erhalten. Eine bereits
angenommene Navigation hält die bisherige Runde gesperrt, solange der tatsächliche
Ziel-Commit noch fehlt. Fokus und Scroll gehen nach Übernahme zur neuen Frage;
die lokale Frageweitersteuerung fokussiert ebenso die aktuelle Frage.

Origin-, Pending-, Mounted-, Request- und Rundenidentitäten sperren alte
Auswahl-, Antwort-, Weiter-, Retry-, Neustart- und Verlauf-löschen-Handler. Ein
später früherer Fragenabruf kann einen neu ausgewählten Pool nicht ersetzen.
Kontext-/Hash-Verlauf bei gleicher Auswahl bewahrt die Runde, entwertet jedoch
alte Raw-URL-Handler. Beim Unmount wird der konkrete Fragenabruf abgebrochen.

## Bewahrte Grenzen

Fragenkatalog, Originalfragen, Antwort-ID-Auswertung, Antwortrotation, passende
Lektionsabsätze, Quellen und der serverseitige Zugriffsschutz bleiben erhalten.
Speicherkey, DTO, Begrenzung, Zeitregeln und lokale Antwortzählung wurden nicht
geändert. Die Auswahl erzeugt keine Ranglistenpunkte. Nur die vorhandenen
ausgewählten Fragenkennungen werden an die vorhandene Fragen-API gesendet;
Verlauf, Antworten und andere private Angaben kommen weder in die URL noch in
ein zusätzliches Konto-/Netzwerkprotokoll.

## Prüfungen

Unter Node 22.23.3 bestanden 83 unterschiedliche passende Tests ohne
übersprungene Fälle: DailyReview-Datenlogik, bestehende Lade-/API-Prüfungen,
kompakter Katalog, zwölf neue echte React-/Portal-/Router-Lebenszyklustests,
GlobalHomeButton und Kategorie-Scroll. Die älteren Lade-Tests führen weiterhin
die tatsächliche Fragerunde aus; ihr Harness berücksichtigt jetzt den getrennten
Auswahl- und Runden-Mount.

Ein unabhängiger Agent bestätigte die strikten Pools und den unteren
Zurück-Verlauf. Seine zusätzliche echte React-Probe fand die angenommene
Navigation vor tatsächlicher URL-Übernahme; der Fund wurde behoben und dauerhaft
abgesichert. Weitere isolierte Proben zu Cancel, Retry vor Neuzeichnung und alten
Clear-/Answer-Handlern bestanden. Es wurden ausschließlich synthetische
Speicher-, Router- und Fragenantworten verwendet, keine echten Konten oder
Browserdaten.

Eine zusätzliche fremde Foto-Testdatei enthält bereits im unveränderten
Vor-Paket-HEAD `950747f333bc61c9f9d67cfb7e518f75126beb35` einen unabhängigen
Erwartungsfehler: `scripts/test-learning-photo-purpose.cjs:47` erwartet 14
`photoLink`-Elemente in der Übersicht und erhält 0. Der identische Fehler wurde
mit ausschließlich aus HEAD geladenen Quelldateien rein im Speicher bestätigt.
Diese Erwartung und ihre Produktdateien wurden nicht Teil dieses Pakets.

Die abschließende Gegenprüfung durch den Hauptagenten bestätigte dieselben
83 Tests unter Node 22.23.3. Der lokale Produktionsbuild bestand mit 509
statischen Seiten. Protokolle und die gesonderte Auslieferungsprüfung liegen im
Chat-Workspace unter `work/regional-law-qa/`.
Die fremde Afternoon-JSON-Datei blieb unberührt. Firebase-, Konto- und native
Produktdateien wurden nicht geändert. Keine visuelle Geräteprüfung.
