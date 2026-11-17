# Kursverzeichnis: verbindliche Auswahl am 17. November 2026

## Reproduzierter Ausgangszustand

Der Stand `a0b078b800c5eafd2a31fa5c6a95c0ee3718132c` enthält 232 Kurse: 34 Minikurse und 198 ausführliche Kurse. Ein gültiger Direktlink mit `kategorie=wildkunde&format=mini` wurde vom bisherigen Verzeichnis vollständig ignoriert; es blieb bei lokalen `all`-/`all`-Werten und zunächst keiner Ergebnisliste. Eine anschliessende lokale Wildkunde-Wahl zeigte 49 Kurse, ohne die URL zu ändern. Ein simulierter Browserverlauf nach Hundewesen liess dieselbe Wildkundeliste stehen. Auch bei unbereitem Router konnte die lokale Wahl bereits Inhalte wechseln. Leer, unbekannt und mehrfach angegebene Kategorien waren nicht vom ersten Einstieg unterscheidbar.

Die unabhängige Reproduktion verwendet den tatsächlichen alten Komponentenrender mit isolierten Hook-/Router-Doubles. Nachweis ausserhalb des Repositorys: `work/course-directory-nov17/independent-directory-before.json` im Chat-Arbeitsordner. Keine Aussage über eine tatsächlich angemeldete Geräteansicht.

## Umsetzung

`pages/kurse/index.js` bereitet weiterhin genau dieselben drei Props und dieselben sieben Felder je Kurs vor. IDs, Reihenfolge, Titel, Beschreibungen, Kategorien, Lernformate, Fragezahlen und Kursziele bleiben gegenüber dem bisherigen Adapter exakt erhalten. Die Darstellung liegt nun in `components/CourseDirectory.js`; der kleine Parser `lib/course-directory-selection.js` benötigt nur Kategorien-Metadaten und keine Fach-, Fragen-, Karten- oder Fortschrittskorpora.

Der Vertrag gilt ausschliesslich für `/kurse`:

- `kategorie` erlaubt die zwölf bestehenden Slugs und das ausdrücklich gewählte `all`.
- Ohne Kategorie beginnt das Verzeichnis bewusst mit der Auswahlhilfe. Auch ein allein gewähltes Lernformat öffnet noch keinen ungewählten Kurspool.
- Fehlendes `format` bedeutet `all`. Ausdrücklich erlaubt sind `all`, `mini` und `detailed`.
- Leere, unbekannte, mehrfach oder als Array gelieferte Auswahlwerte werden nicht zu einem Ersatzpool verbreitert. Ein Widerspruch zwischen Raw-URL, Router-Query oder vorhandener Browseradresse zeigt keine fremden Ergebnisse.
- Erst nach bewusstem `kategorie=all` können alle 232 Kurse erscheinen. Jede Kategorie-/Formatkombination zeigt ausschliesslich ihren tatsächlichen vorhandenen Teilbestand; ein leerer Teilbestand wird erklärt.

Kategorie, Lernformat und Zurücksetzen stehen ausschliesslich im vorhandenen unteren `PageMenu`. Es gibt keine doppelte Kategorieübersicht, keine native Select-Auswahl und keine zusätzliche Suche im Verzeichnis. Die zentrale Suche im Lernbereich bleibt erhalten und deckt weiterhin die bisherigen Suchnamen und Umlaut-/ae-/oe-/ue-Varianten ab.

## Übernahme und Lebenszeitgrenzen

Die Ergebnisliste wird ausschliesslich aus der bereit validierten, tatsächlich übernommenen URL abgeleitet. Ein echtes `router.push` mit flacher Navigation erzeugt Kategorie-/Formatschritte im Browserverlauf. Eine erfolgreiche Promise allein ändert die Liste nicht. Pending behält den alten gültigen Bestand; Ablehnung und Fehler verändern die URL-Auswahl nicht und zeigen nur für den noch aktuellen Vorgang einen Hinweis. Abgebrochene oder überholte Vorgänge beeinflussen eine spätere Wahl nicht.

Ein aktueller Pending-Zielentwurf darf schnelle Kategorie-/Formatklicks kombinieren, damit der zweite Klick die gerade intendierte Kategorie nicht wieder verliert. Er ersetzt weder die sichtbare URL-Auswahl noch die sichtbare Liste. Raw-URL, vollständige Query einschliesslich Fremdfeldern und Hash bilden zusammen den aktuellen Ursprung. Alte Handler, verspätete Abschlüsse und Unmount sind früh gesperrt.

Nach einer tatsächlichen Auswahlübernahme führt der vorhandene `useSelectionPageStart` an die Seitenüberschrift und ganz nach oben. Das gilt auch für einen eigenen echten Rückkehr-Commit zum schon zuvor sichtbaren Teilbestand nach einem überholten Zwischenwunsch. Hierzu ist ein reiner Fokusmarker von den bereits verworfenen Actionrechten getrennt: Er darf nur erkennbare Mischstände zwischen vollständiger Source- und Target-Identität überleben, während Next Router und Browser in getrennten Phasen übernimmt. Fremde Query-, Hash- oder Pfadänderungen, ein neuer Wunsch, Fehler und Unmount löschen ihn. Der exakt bereit validierte Zielcommit konsumiert ihn einmal; eine erfolgreiche Promise allein genügt nicht. Spätere Übereinstimmung darf keinen zuvor wegen Fremdkontext verworfenen Marker wiederbeleben. Der Effect prüft die vollständige aktuelle Live-Identität unmittelbar vor Fokus und Menümutation.

Kontextänderungen bei derselben inhaltlichen Auswahl erzeugen keinen zusätzlichen globalen Scrollmechanismus. Bare Einstieg, ungültige Auswahl und Zurücksetzen führen zur selben unteren Auswahlhilfe. Zurücksetzen ist ein eigener URL-Schritt und entfernt nur `kategorie` und `format`; sonstiger öffentlicher URL-Kontext bleibt erhalten.

Erst nach dieser Umsetzung wurden die bestehenden Kategorie-Ressourcen als `/kurse?kategorie=<slug>` kontextualisiert. Der untere Zurück-Pfeil unterscheidet genau auf `/kurse` die Felder `kategorie` und `format`. Andere Queryänderungen bleiben ein Halt; andere Routen erhalten keine neue allgemeine Queryregel.

## Datenschutz und Bestand

Der neue Verzeichnisleser importiert keinen Kursfortschritt, greift auf keinen Browser- oder Kundenspeicher zu und sendet keine Lern- oder Fortschrittsdaten an eine API. Die ursprünglichen Kursziele bleiben unverändert; Kurskarten werden nicht vorsorglich auf allen Auswahlseiten vorab geladen. Gespeicherte Fortschritte und persönliche Kursansichten sind separate bestehende Funktionen und werden nicht bearbeitet.

Dieses Paket ändert keine Fachtexte, Fragen, Antwortschlüssel, Quellen, Medien, biologischen Prüfstände oder Rechtsfreigaben. Parallel autorisierte fachliche Erweiterungen werden separat geprüft. Fremder Nachmittag-JSON-Stand und das vorhandene unversionierte Marketingverzeichnis bleiben unberührt.

## Prüfung

110 unterschiedliche passende Tests bestanden unter Node 22.23.3 ohne übersprungene Fälle. Darin zehn neue Verzeichnisprüfungen sowie die passenden bestehenden Mini-/Kategorie-/UI-/Navigations-/Scrollprüfungen. Der positive Vergleich mit dem alten statischen Adapter schützt alle 232 Kursobjekte und den unveränderten Props-Vertrag. Jede der 13 ausdrücklichen Kategorieoptionen einschliesslich `all` wird mit allen drei Formaten gegen den tatsächlichen Katalog geprüft.

Die Tests erfassen insbesondere Bereitheit und volle URL-/Query-/Browseridentität, Fehler-/Pending-/Supersede-/Historygrenzen, Kombinieren aktueller Pending-Felder, echte untere native Auswahl-Schaltflächen, Zurücksetzen von Format-only-URLs, Herkunfts- und Unmountgrenzen und genaue Dock-Back-Schritte. Die alten Filtertests wurden eng an den tatsächlichen Router und den unteren Menüort angepasst. Suchprüfungen wurden zur weiterhin vorhandenen zentralen Kurssuche verlagert; Originalfragen-/Titel-/Katalog-/Clienttransformprüfungen bleiben erhalten.

Root führt die unabhängige getrennte Render-/Host-Commit-/Effect-/Browserframe-Gegenprüfung, den abschliessenden Gesamtbuild und die tatsächliche Produktionsauslieferungsprüfung separat aus. Keine visuelle Geräte- oder angemeldete Lehransichtprüfung behauptet. Dieser Agent hat nichts gestagt, committed oder veröffentlicht.
