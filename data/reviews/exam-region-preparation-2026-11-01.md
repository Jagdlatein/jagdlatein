# Regionale Prüfungsvorbereitung – 1. November 2026

## Umfang

Der persönliche Prüfungsplan ergänzt die bereits veröffentlichte verbindliche Kontowahl um eigene Vorbereitung für alle 51 auswählbaren Regionen: 26 Schweizer Kantone, 9 österreichische und 16 deutsche Bundesländer. Ein Entwurf im Auswahlmenü verändert die angezeigte Vorbereitung nicht. Maßgeblich bleibt das tatsächlich bestätigte Profil; fehlende oder ungültige Profile erhalten keine Ersatzregion.

Die Quellenprüfung betrifft ausgewählte Prüfungsbausteine und Fachbezüge. `confirmed` bezeichnet ausdrücklich keine vollständige Prüfung sämtlicher Zulassungs-, Anerkennungs-, Bewertungs-, Ausbildungs- und Wiederholungsregeln. Es gibt keine Zusage künftiger Prüfungsfragen oder vollständiger Prüfungsreife.

| Land | Eng abgeglichener Rahmen | Weiterer Abgleich nötig | Gesonderte Einordnung |
| --- | ---: | ---: | ---: |
| Schweiz | 10 | 14 | 2 |
| Österreich | 7 | 2 | 0 |
| Deutschland | 7 | 8 | 1 |

Die 73 Lernaufträge sind eigene Übungsbeispiele. Sie sind keine zusätzlichen amtlichen Prüfungsfragen und erhöhen weder den vorhandenen Kursfragenbestand noch die Zahl freigegebener regionaler Rechtsfragen. Biologische Grundlagen bleiben länderübergreifend. Für Rechtsübungen führt weiterhin der unmittelbar folgende Abschnitt in den exakten Landes-/Kantonsleser einschließlich des vorhandenen Bundesrechts, soweit vorgesehen.

## Quellen und Freigabegrenzen

Die kuratierten Datensätze `data/exam-alignment/ch-2026-11-01.json`, `at-2026-11-01.json` und `de-2026-11-01.json` enthalten für jede Region den Geltungsumfang, sichtbare Grenzen, konkrete Quellenabschnitte und die Quellen-IDs jeder freigegebenen Form. Für die bestätigten Bausteine wurden Originalregelungen und eigenständig verfasste Erläuterungen tatsächlich gelesen. Zwei Seiten derselben Institution und bloße Gesetzesabschriften zählen nicht als unabhängige Bestätigung. Die aktuelle hessische Originalnorm in der vom Verband bereitgestellten Datei ist ausdrücklich als Normkopie von der eigenständigen Verbandserläuterung getrennt.

Suchauszüge, blockierte Abrufe und zurückgehaltene `candidateFormats` werden nicht in die Produktdaten übernommen. Unzureichend gegengeprüfte Regionen erhalten keine konkreten Formatbehauptungen in ihrer Zusammenfassung. Die Quellen stehen mit Abschnittsabgleich vom 1. November 2026 und sichtbarer Zuordnung der benannten Bausteine ausschließlich im geschlossenen letzten Quellenbereich. Bestehende Rechtsnachweise behalten ihre älteren tatsächlichen Prüfdaten; sie werden durch diesen Abschnittsabgleich nicht neu zertifiziert.

Besonders beachtet wurden:

- Genfs staatlicher Sonderrahmen; kein erfundener gewöhnlicher Genfer Prüfungsablauf. Für Basel-Stadt wird kein eigener üblicher Prüfungsturnus unterstellt. Prüfungserwerb und örtliche Berechtigung bleiben getrennt.
- Aargaus getrennte Reglemente bis Ende 2026 und ab 2027. Der unabhängige AJV-Text war nur als Suchauszug lesbar; Aargau bleibt deshalb teilweise abgeglichen. Die Fassungen werden nicht vermischt.
- Aktuelle statt historischer Normversionen für Bern, Glarus und Thurgau; Graubündner Katalogjahrgänge bleiben erkennbar. Die bestehenden BE-/GL-Übersichtsressourcen sind dadurch nicht als falsch bestätigt und bleiben unverändert.
- Baden-Württembergs abweichende Reihenfolgedarstellungen sowie Bremens unterschiedliche Gliederung praktischer und mündlicher Anforderungen. Keine pauschale Drei-Teile-/Reihenfolgenübertragung auf alle Länder.
- Der positiv gelesene aktuelle Rheinland-Pfälzer § 26 und seine ausgewiesene zeitliche Grenze; angekündigte spätere Neuregelungen werden nicht vorzeitig angewandt.
- Salzburg und Steiermark ohne unbelegte schriftliche/mündliche Unterform der Theorie; Vorarlberg mit sichtbarer bedingter Nachweisanerkennung; Wien ohne feste Reihenfolge und ohne Übertragung der Jagdaufseherprüfung. Tirols unabhängiger Beleg ist ausdrücklich eine Schwazer Ausschreibung für 2027, keine landesweit identische Organisation.
- Österreichische Burgenland-/Kärnten-Nachweise bleiben bei den konkreten Prüfungsformen unzureichend unabhängig; bestehende gesperrte Rechtsfragen werden nicht freigegeben.

## Verknüpfung und Darstellung

Der ausschließlich beim Build geladene Adapter projiziert 17 vorhandene gemeinsame Kursstarts mit tatsächlichen Lektionsankern, `#wissenscheck` und passenden Wiederholungskategorien. Er überträgt keine Antworten, vollständigen Lehrtexte oder Forschungsnotizen in die Plan-Props. Drei Links zum Prüfungsgespräch erfordern zusätzlich eine exakte Kurs- und Kategoriezuordnung und nennen den konkreten vorhandenen Frageeintrag. Ein bloß ähnlicher Fachbereich reicht dafür nicht.

Die neue Darstellung verwendet die bestehenden Menükategorien und die vorhandene volle Lernseite. Sie fügt keine Auswahlfenster, Speicherung, API, Zugriffsrechte oder Datenbankänderung hinzu. Das bisherige untere Auswahlmenü, die Bestätigung nach Serverübernahme, Fokus und Seitenanfang bleiben erhalten. Die erste Kontowahl fragt neutral nach der Vorbereitungsregion und verweist auf Besonderheiten im Prüfungsplan.

## Gegenprüfung und technische Nachweise

Unabhängige Agenten haben die CH-Produktdatensätze sowie die DE-/AT-Produktdatensätze und Originalnachweise gegen die Veröffentlichung geprüft. Dabei wurden ein zu allgemeiner Gesprächslink auf exakte Kursbindung begrenzt und der OÖ-Quellenzeiger zur praktischen Handhabung um § 6 Abs. 4 ergänzt.

Neue Regressionen prüfen alle 51 Profilpaare, echte Lernziele, fehlende/fehlerhafte Regionen ohne Fallback, nicht übernommene Entwürfe, fehlgeschlagene und noch nicht tatsächlich übernommene Speicherungen, Quellenzuordnung und geschlossene Endquellen. Die bestehenden Konto-, Datenschutz-, Zugriffs- und Rechtsfragenprüfungen bleiben erhalten.

Zusätzlich wurde die echte React-SSR-Ausgabe mit den Originalstyles in einer ausdrücklich isolierten lokalen Browserdarstellung mit synthetischen Profilen überprüft: schmales Layout ohne horizontales Überlaufen, breite Lernstartliste mit zwei Spalten und sichtbarer Teilnachweis. Das ist keine Prüfung eines angemeldeten Produktivkontos oder eines physischen Geräts. Es wurden keine Kundendaten gelesen oder geändert.

Quellenoriginale, Kandidaten, unabhängige Prüfberichte sowie endgültige Test-/Build-/Auslieferungsnachweise liegen im Chat-Workspace unter `work/exam-alignment-nov01/` außerhalb des Repositories. Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` bleibt unberührt und wird nicht gestagt.
