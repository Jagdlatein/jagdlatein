# Lernstand im Web-Kursbereich – 26. Oktober 2026

## Ergebnis

Die bestehende Selbstlernliste lässt sich direkt im unteren Menü nach
Alle, Offen, Begonnen und Abgeschlossen auswählen. Dazu wird derselbe geprüfte
Fortschritts-Helper wie auf „Meine Kurse“ verwendet. Es entsteht keine weitere
Seite oder Kategorie. Die Liste beschreibt gespeicherte Quizantworten und
Wissenschecks, keine gelesenen Lektionen oder Prüfungsqualifikation.

Der Parameter `lernstand=offen|begonnen|abgeschlossen` gehört ausschließlich zu
`ansicht=kurse` ohne konkretes Schulangebot. Ein fehlender Parameter bedeutet
Alle; ausdrücklich leere, mehrfache, unbekannte oder widersprüchliche Angaben
führen zur vorhandenen Auswahlhilfe. Alte Links bleiben gültig.

Kategorieänderungen innerhalb Selbstlernen behalten den ausdrücklich gewählten
Lernstand. Andere Ansichten oder das Öffnen eines konkreten Schulangebots
entfernen ihn gezielt. Schulangebote und Live-Termine werden durch den
persönlichen Fortschrittsfilter nicht ausgeblendet.

## Grenzen und Navigation

Ausstehender oder fehlgeschlagener Fortschrittsabruf erzeugt weder eine scheinbar
offene Kursliste noch einen falschen Null-Treffer-Stand. Kursanzahl und Liste
erscheinen erst nach bestätigtem Laden. Konten, gespeicherter Fortschritt,
API-Nutzlasten, Berechtigungen und Unterrichtsräume werden nicht geändert.

Die tatsächliche übernommene URL bestimmt den Inhalt. Fehlgeschlagene Wechsel
lassen die vorherige Liste bestehen. Nach Übernahme werden Menüabschluss,
Überschriftenfokus, Scrollen zum Inhaltsanfang und Zurücksetzen der Seitenlänge
ausgeführt. Frühe Origin-Prüfungen sperren alte Handler bereits vor einem
Rerender, auch nach einem Hin-und-zurück-Wechsel. Die konkrete Auswahlfeldliste
des unteren Zurück-Pfeils enthält zusätzlich `lernstand`; Kontextänderungen
werden weiter nicht als zusätzliche Lernschritte angelegt.

## Prüfungen

Der Hauptagent bestand unter Node 22 insgesamt 110 unterschiedliche Tests für
Academy-UI, Server-/Zugriffsgrenzen, Meine Kurse, Kontoladen und untere Navigation,
ohne übersprungene Fälle. Darunter sind sechs neue Academy-Regressionen und eine
neue Regression für den unteren Zurück-Verlauf. Eine unabhängige Prüfung mit
sechs eigenen ReactDOM/JSDOM-Proben bestätigte Status-/Kategorie-Schnittmengen,
Ladefehler, tatsächliche URL-Übernahme, Fokus/Scrollen, Angebotsgrenzen und alte
Handler bis zum Unmount. Diese Proben verwenden ausschließlich synthetische
Konten und Unterrichtsdaten. Sie sind keine Geräte- oder Konferenzprüfung.

Externe Nachweise liegen im Chat-Arbeitsordner unter
`work/regional-law-qa/tests-oct26-academy-root.txt` und
`work/regional-law-qa/academy-progress-peer-2026-10-26.json`.
