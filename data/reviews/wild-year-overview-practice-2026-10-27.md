# Wildjahr: Jahresübersicht, Modellesen und bewusster Einstieg

Technische Gegenprüfung am 27. Oktober 2026. Die Darstellung und Übungen werden gegen die vorhandenen verfassten Monatsmodelle geprüft. Dies ist keine neue biologische Gesamtprüfung der alten Inhalte und keine Bestätigung örtlicher Jagdzeiten.

## Darstellung und Navigation

Die Jahresübersicht bleibt auf derselben Lernseite. Sie übernimmt für jedes Monatsmodell exakt die bereits verfassten Phasenüberschriften zu Fortpflanzung und Verhalten. Zwölf native Schaltflächen führen über die bestehende Arten-/Monatsadresse zur vollständigen Erklärung. Angezeigt und hervorgehoben wird erst die tatsächlich übernommene Auswahl; fehlgeschlagene, abgelehnte oder abgebrochene Wechsel verändern die bisherigen Fakten nicht. Auswahl aus der Jahresübersicht fokussiert nach Übernahme die Inhaltsüberschrift. Der Monatsschieber behält seine getrennte bisherige Fokusregel.

Der unveränderte Bestand umfasst 114 Arten- und Vergleichseinträge. Im abschließenden lokalen Stand besitzen 30 Einträge Monatsmodelle mit insgesamt 360 Monatsansichten. Die übrigen 84 Einträge werden als Jahres- oder Artenübersicht gelesen und erhalten keine erfundenen Monatsphasen oder Kalenderübungen.

Ein Aufruf ohne Art öffnet nun bewusst die Artenauswahl. Er lädt weder serverseitig noch bei erster Clientdarstellung automatisch die Gämse. Ein ausschließlich angegebener Monat bleibt erhalten, ohne daraus eine Art abzuleiten. Ausdrückliche vorhandene Artenlinks einschließlich `art=gamswild` bleiben gültig. Auswahlhilfe-Timer dürfen nach gültiger Auswahl oder Unmount nicht wieder öffnen.

## Übungscharakter und Nachweise

Die Kalenderübung fragt nach dem Lesen des vorhandenen Modells. Richtige Antwort, andere angebotene Phasen, Erklärung, Einschränkungen und Nachweise stammen aus denselben verfassten Daten. Ein ganzjährig unverändertes Einzelband wird nicht zur künstlichen Auswahlfrage aufgefüllt. Je Art entstehen höchstens vier eigene Modellleseaufgaben; diese werden nicht als zusätzliche unabhängige amtliche Prüfungsfragen oder als Erweiterung des regionalen Rechtskatalogs gezählt.

Die Oberfläche erklärt diesen Modellcharakter unmittelbar. Auswertung, Wiederholung ausschließlich fehlerhafter Antworten und Neustart gehören zur lokalen Übungsrunde. Die Antwort wird über ihre Phasen-ID ausgewertet. Veraltete Antwort-, Weiter- und Neustartaktionen dürfen weder neue Fragen noch neue Runden verändern.

Im geschlossenen Quellenbereich am Ende ist jede verfasste Phase aller vier Felder genau einmal nachgewiesen. Das umfasst auch die nur in der Jahresübersicht oder als Antwortalternative sichtbaren Phasen. Eine eigenständige Gegenprobe verglich 268 tatsächlich angebotene Antwortmöglichkeiten aller 30 Modelle mit den wirklichen Quellenlinks im Elternbestandteil. Die zugehörigen Nachweise stimmen überein.

## Ausgeführte Prüfungen

`scripts/test-wild-year-overview-ui.cjs`: zehn bestandene unabhängige Regressionen unter Node 22. Sie führen den tatsächlichen stateless Jahresübersichtsbestandteil aus und prüfen die zwölf unveränderten Phasenpaare jedes Modells, sämtliche 114 übergeordneten Auswahlen, echte ausgehende URLs, Fokus nach Commit, Fehler-/Abbruch-/Verlauf-/Kontext-/Unmountgrenzen sowie einmalige vollständige abschließende Phasennachweise. Zwei konkrete Einstiegstests prüfen den leeren und den reinen Monatsaufruf einschließlich echter Auswahlhilfe-Timer. Sämtliche zuvor veröffentlichten 26 vollständigen Modelle, ihre 312 Monatsansichten und ihre Quellen wurden positiv gegen Commit `c27c76483e26102a073070d0ddcdf3021d520fdf` auf exakte Bewahrung verglichen.

`scripts/test-wild-year-practice.cjs`: 15 bestandene Autorregressionen, hier nochmals tatsächlich unter Node 22 ausgeführt. Sie prüfen Datenherkunft und Eindeutigkeit, die tatsächliche Kindkomponente samt Effekten, Antwort-ID und vollständige Rückmeldung, Doppelklickschutz, Fehlerwiederholung, neue Runde, Funktions-/Scopewechsel, Unmount und Fokusgrenzen. Zusammen mit den zehn unabhängigen Übersichtstests bestanden 25 Fälle ohne Überspringen.

Vier zusätzliche unabhängige Grenzproben wurden mit der tatsächlichen Kindkomponente ausgeführt: Austausch der Eltern-Prüffunktion bei noch unbeantworteter gleicher Frage; Wechsel A–B–A mit wiederverwendetem ursprünglichem Scopeobjekt; Rückkehr derselben Fragen-ID und Position in einer neuen Fehlerwiederholungsrunde; sowie ein bereits vorgemerkter Fokuseffekt nach anschließendem Austausch von Bereitschaft und Elternprüfung. Die ersten drei Proben sperren veraltete Handler und lassen aktuelle Antworten weiterhin zu.

Die vierte Probe fand zunächst einen Fehler: Ein vor dem Austausch vorgemerkter Effekt nutzte noch die ältere Bereitschaft und Prüfungsfunktion und setzte den Fokus trotz inzwischen inaktiver Ansicht. Der Autor korrigierte den Effekt auf die tatsächlich neuesten Eigenschaften sowie den konkreten Kontext-/Rundenauftrag und ergänzte die genaue Regression. Die unabhängige erneute Probe bestätigt nun null Fokusaktionen nach Entwertung. Die Elternintegration verwendet eine neue Identität je übernommener URL; ihre erfassten Prüfungen werden nach Navigation und Unmount unwirksam.

Der maschinenlesbare ergänzende Nachweis liegt außerhalb des Repositories unter `work/wild-year-oct27/practice-boundaries-independent.json` im Chat-Arbeitsordner und enthält die überprüften Dateihashes.

## Grenzen

Diese Nachweise betreffen Datenprojektion, tatsächliche isolierte React-Lebenszyklen und Navigationseigenschaften. Sie sind keine authentifizierte Produktions-Lehrtextprüfung, keine Geräte- oder Sichtprüfung und keine neue fachliche Prüfung aller 114 Arten. Die Quellenprüfung der vier ergänzten Monatsmodelle bleibt gesondert dokumentiert. Produktionsauslieferung und Veröffentlichungscommit werden erst nach tatsächlicher Veröffentlichung separat belegt.
