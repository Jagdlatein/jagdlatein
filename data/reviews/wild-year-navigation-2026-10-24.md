# Wildjahr: verbindliche Art- und Monatsnavigation

## Umfang am 24. Oktober 2026

Die Auswahl folgt der tatsächlich übernommenen Adresse. Art- und Monatswechsel schreiben `art` und `monat` mit einem echten Verlaufsschritt, erhalten weitere Such-/Kontextfelder und das Ergebnisziel `wildjahr-current`. Die untere Zurück-Navigation berücksichtigt beide Felder ausdrücklich; daraus wird keine allgemeine Regel für sämtliche Query-Felder der App.

Der Artwechsel liegt im bestehenden unteren Menü. Der Monatsschieber bleibt als echte Modellsteuerung beim Jahresmodell. Bei seinem erfolgreichen Monatswechsel bleibt der Tastaturfokus am bestehenden Schieber. Artwechsel, direkte Einstiege und wiederhergestellte Verlaufsschritte fokussieren die Ergebnisüberschrift erst nach der Übernahme.

Während eines ausstehenden Wechsels ändern sich Text, Foto und Monatsanzeige nicht optimistisch. Ein echter Fehler öffnet eine erneute Auswahl; ein abgebrochener, überholter oder erst nach Unmount beantworteter Wechsel darf keine nachträgliche Fehlermeldung oder Fokusübernahme verursachen. Jede neue Aktion kombiniert mit dem anderen **gerade angezeigten** Feld: Wird unter Monat 6 zunächst Monat 7 angefordert und noch vor dessen Übernahme die Art gewechselt, verwendet dieser Artwechsel Monat 6 und ersetzt die unbestätigte Anforderung.

## Erstaufruf und fehlerhafte Links

Der Server berechnet den Schweizer Kalendermonat einmal und liefert außerdem die anhand derselben Anfrage validierte Anfangsauswahl. Server-HTML und erste Hydration zeigen deshalb dieselbe Phase, auch solange der Clientrouter noch nicht bereit ist. Ohne diese Serverauswahl zeigt ein unbereiter Client keinen zufälligen Standardtiertext.

Fehlende Felder behalten den bisherigen dokumentierten Einstieg Gams / Schweizer Kalendermonat. Gültige alte Art-/Monatslinks funktionieren weiter. Ein ausdrücklich falscher, leerer oder mehrfacher Wert zeigt eine Auswahlhilfe, statt unbemerkt eine andere biologische Phase auszugeben. Die beiden Felder lassen sich im unteren Menü reparieren.

## Bewahrt und abgegrenzt

Alle zehn Arten mit ihren 120 Monatsansichten und vier fachlichen Abschnitten, sämtliche Sachtexte, Zuordnungen, Fotodateien und fachlichen Prüfdaten bleiben unverändert. Jahreszeitliche Unsicherheit und der Hinweis, dass ein Artporträt weder den ausgewählten Monat noch eine Fortpflanzungsphase belegt, bleiben unmittelbar sichtbar. Die bestehenden Belege stehen nun gesammelt und geschlossen am Ende, weiterhin eindeutig jedem der vier Abschnitte zugeordnet, zusammen mit dem Bildnachweis.

Dies ist eine Navigations- und Darstellungsprüfung. Es wird keine neue fachliche Gesamtprüfung des Wildjahres oder visuelle Geräteprüfung behauptet. Eine geschützte Live-Seite, die ohne Anmeldung zur Preisseite weiterleitet, ist kein Nachweis des angezeigten Lehrtextes.

## Gezielte technische Prüfung

Die Server-/Hydrationstests prüfen die echte Serverausgabe, explizite alte Links, Bereitschaft, ungültige/mehrfache Felder sowie Schweizer Monatsgrenzen mit Sommerzeit und Jahreswechsel. Sie prüfen nun auch eine ausgehende URL-Schreiboperation; der frühere Test hatte lediglich Query-Werte von außen ersetzt.

Zusätzliche Navigationstests untersuchen tatsächliche ausstehende Wechsel, Fehlversuche, Kontextfelder, Abbruch-/Unmount-/Origin-Grenzen und Ergebnisfokus gegenüber Schieberfokus. Bestehende Detailtests schützen alle 120 Ansichten und die Quellen-/Fotozuordnung. Die untere Navigation wird für Art- und Monatsverlauf sowie Suchkontext geprüft. Testergebnisse und Produktionsnachweise werden getrennt außerhalb des Repositorys im Arbeitsnachweis dieser Lieferung gespeichert.

Die unabhängige technische Gegenprüfung ergänzte zehn eigenständige Navigationstests und fand keinen konkreten Restfehler. Ihr enger Lauf mit Monats-, Detail- und unterer Navigation bestand 49 Tests. Der abschließende gemeinsame Lauf dieser Lieferung bestand **198 unterschiedliche passende Tests**, einschließlich der parallel eng abgeglichenen Biber- und Salzburg-Ergänzungen sowie bestehender Porträt-/Rechts-/Lernwerkzeuge. Der lokale Produktionsbuild erzeugte erfolgreich **508 statische Seiten**. Diese Prüfungen bescheinigen weder sämtliche Inhalte der App noch eine visuelle Prüfung auf realen Geräten.
