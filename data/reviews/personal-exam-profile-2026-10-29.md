# Persönliches Prüfungsziel für CH, AT und DE

## Umfang

Ein bewusst gespeichertes Prüfungsziel verbindet den bestehenden Lernbereich mit den vorhandenen regionalen Rechtslesern und Rechtsübungen. Es enthält genau ein Land und eine echte Prüfungsregion: 26 Schweizer Kantone, neun österreichische oder 16 deutsche Bundesländer. Bund ist keine wählbare Prüfungsregion. Die zwölf Lernkategorien behalten ihre bisherigen Namen und Reihenfolge.

Die neue Seite `/lernen/pruefungsplan` ist im Menü, der gemeinsamen Suche und den Bereichen Prüfung und Jagdrecht verknüpft. Zusammenfassungen erscheinen im Lernbereich, Kursmenü, Konto, Jagdrecht und Quizsetup. Allgemeine Biologie wird nicht künstlich nach Ländern getrennt. Der Plan ist eine Lernhilfe, kein amtlicher Lehrplan, Zulassungsnachweis oder Nachweis vollständiger Prüfungsabdeckung.

## Auswahl und Datenschutz

- `jl_exam_profile_v1` speichert ausschließlich die validierten Felder `country` und `region`. Es werden keine Namen, Termine, Notizen, Antworten oder Zugangsdaten übernommen.
- Die Auswahl wird ausdrücklich bestätigt. Ein ungespeicherter Entwurf bleibt bei einem Profilwechsel in einem anderen Tab erhalten. Alte Aktionen nach Entwurfsersatz oder Unmount dürfen nichts übernehmen.
- Das Profil gilt für diesen Browser bzw. Webspeicher auf diesem Gerät. Es wird nicht mit einem Konto oder anderen Geräten synchronisiert. Blockierter Speicher führt zu einem ausdrücklich gekennzeichneten Sitzungsprofil. Auf gemeinsam genutzten Geräten ist die Auswahl für andere Benutzer desselben Browsers sichtbar.
- Die letzte betrachtete Rechtsregion (`jl_legal_region_v1`) und das öffentliche Ranglistenland bleiben separate Einstellungen. Rechtsleser und History ändern das persönliche Prüfungsziel nicht.
- Ein ausdrücklich aufgerufener Rechtslink hat Vorrang, auch wenn seine Region ungültig ist. Nur beim ersten fehlenden Regionsfeld kann ein passendes Profil ergänzt werden. Ein expliziter Länderpfad wird niemals in ein anderes Land umgeleitet. Ein späterer Profilwechsel schreibt keine bestehende Lese-URL um.
- Das Quizsetup übernimmt das Profilland nur ohne ausdrückliches URL-Land und ohne eigene Landeswahl. Regionale Rechtsübungen haben einen getrennten Link. Das bestehende Ranglistenquiz bleibt ein Länderquiz; Serverrunden, Wertung, Identitäten und laufende Antworten werden nicht umgestellt.
- Gemischte Rechtskurse übernehmen das Profilland für ihren vorhandenen Länderhinweis. Eine ausdrückliche lokale Kurswahl hat Vorrang und verändert das Prüfungsziel nicht. Einlandkurse behalten ihren ausdrücklichen Geltungsbereich. Während der Profilwiederherstellung erscheint bei einem Mehrlandkurs kein ersatzweiser Deutschland-Hinweis. Die bestehenden gemischten Kursfragen werden nicht als regional gefilterter Pool ausgegeben; jede Frage behält ihren eigenen sichtbaren Geltungsbereich.

## Quellen und fachliche Grenzen

Es wurden keine Rechtsfragen freigegeben, Gesetzesauszüge verändert oder alten Inhaltsprüfungen neue Daten gegeben. Der freigegebene regionale Bestand bleibt bei 496 unterschiedlichen eigenen Fragen (CH 195, DE 224, AT 77; Bundesfragen je Land einmal). Die Projektion liefert ausschließlich Metadaten, keine Gesetzesvolltexte, Antwortschlüssel oder vollständigen regionalen Datensätze.

Im neuen Plan stehen ergänzende Originalquellen und Prüfungsunterlagen geschlossen am Ende. Die Herausgeber werden anhand eines expliziten Inventars begrenzt. Zwei LJV-Hessen-Rehosts von Gesetzesausdrucken sind dort ausgeschlossen; ihre bisherigen transparenten Nachweise im Rechtsleser bleiben erhalten. Amtliche Sonderwege werden präzise behandelt: Genfer Gesetzessammlung bei `silgeneve.ch/legis/`, Hamburger Landesrecht bei `juris.de/bsha/` und die eigene Prüfungsverordnung der zuständigen Kärntner Jägerschaft. Eine Quelle mit `kind: law` allein genügt nicht, um einen Drittanbieter-Rehost als Original auszugeben.

Root und unabhängiger Reviewer haben die folgenden Originalpublikationen als konkrete Beispiele für unterschiedliche örtliche Prüfungsanforderungen gelesen. Die Links begründen keine pauschale Übertragung auf andere Regionen und keine vollständige neue Inhaltsprüfung des bestehenden Katalogs:

- Kanton Zürich, Reglement vom 9. Dezember 2024, insbesondere S. 2 sowie getrennte spätere praktische Jagdprüfung: https://www.zh.ch/content/dam/zhweb/bilder-dokumente/themen/umwelt-tiere/tiere/fischerei-und-jagd/jagd/wie_werde_ich_jaegerin_oder_jaeger_im_kanton_zuerich/Reglement%20mit%20Unterschrift.pdf
- Niederösterreich, Originalnorm § 60 NÖ Jagdgesetz, insbesondere Abs. 4 und 5; vom Reviewer auf Fassung 29. Oktober 2026 geprüft: https://ris.bka.gv.at/eli/lgbl/NI/6500/P60/LNO40082414
- Bayerisches Landesamt für Maß und Gewicht, eigene Prüfungsinformation und Originalangebote: https://www.lmg.bayern.de/aufgaben_leistungen/jaegerpruefung/index.html ; Original-Prüfungsstoff vom Reviewer zusätzlich unter https://www.gesetze-bayern.de/Content/Document/BayJFPO-10 gelesen.

Diese Dokumente enthalten unterschiedliche Aufteilungen und praktische Anforderungen. Der gemeinsame Lernweg übernimmt deshalb die bestehenden App-Kategorien, ohne sie als identische offizielle Prüfungsfächer aller 51 Regionen auszugeben. Der heutige direkte Hamburger Juris-Abruf war für den Reviewer nicht lesbar; Fedlex lieferte nur einen JS-Fallback. Dafür wird keine neue fachliche Prüfung behauptet. Bestehende Prüfstände bleiben sichtbar.

## Technischer Nachweis

Neue isolierte Prüfungen erfassen den vollständigen Regionskatalog, ungültige und landesfremde Werte, SSR/Hydration, tatsächliche React-Mounts, gemeinsame Store-Benachrichtigung, Cross-Tab-Ereignisse, Speicherfehler, Unmount, Entwurfserhalt und tatsächliche explizite Übernahme. Bestehende Rechts-, Quiz-, Konto-, Kurs-, Menü-, Zugangs- und Datenschutzprüfungen werden mitgeprüft. Enge Harnessanpassungen isolieren nur die neue Zusammenfassung und bewahren die ursprünglichen Zugangs- und Rundenaussagen.

Unabhängige Quellen-, Projektions- und UI-Nachweise liegen außerhalb des Repos im Chat-Workspace unter `work/regional-law-qa/exam-profile-*-independent.json`. Alle 51 Profile wurden dort mit den tatsächlichen Komponenten gerendert und auf zwölf Kategorien, Quellenposition und geschlossenen Quellenzustand geprüft. Keine visuelle Geräteprüfung oder authentifizierte Produktionsdarstellung wird daraus abgeleitet.

Die fremde Datei `data/learning-expansion-afternoon-2026-10-16.json` bleibt unverändert und unstaged. Es werden keine Benutzer- oder Zahlungsdaten geändert, keine neuen Dienste eingerichtet und keine Nachrichten verschickt.

Der abschließende passende Testlauf umfasst 789 bestandene unterschiedliche Fälle aus 81 Dateien, ohne Fehler oder übersprungene Fälle. Der neue Prüfungsplan, der Profilstore und dessen Integration einschließlich der Kurs-Länderhinweise wurden zusätzlich unabhängig gegengeprüft. Ein schon auf dem unveränderten Vorgänger `74dfb34` reproduzierter historischer Navigationstest wurde ausschließlich durch Kombination der vorhandenen präzisen Additionsfixtures repariert: Der alte Soll-Hash bleibt bestehen, und alle 198 historischen vollständigen Kursobjekte wurden zusätzlich positiv gegen den historischen Commit verglichen. Produktinhalte wurden dafür nicht geändert.
