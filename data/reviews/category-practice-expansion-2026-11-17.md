# Kategorien: Lernziele und passende Übungen vom 17. November 2026

## Konkretes Problem

Die zwölf vorhandenen Hauptkategorien enthalten 63 redaktionell zugeordnete Unterkategorien und 198 Kurse. Die Ressourcenverweise führten bisher unabhängig von der gewählten Kategorie auf die ungewählten Startseiten für Lernkarten, Kurzübungen und Ranglistenquiz. Das gewählte Thema ging dabei verloren. Die Kurs-Themenfelder enthielten die richtigen Lektionslinks, zeigten aber weder die bereits vorhandenen Lernziele noch einen direkten passenden Kurscheck oder Kartensatz.

## Änderung ohne neue Kategorien oder Wissensbehauptungen

- Alle elf Kategorien des gemeinsamen Lernwissens behalten ihre Kategorie in den vorhandenen Lernkarten-, Fünf-Minuten- und unterstützten Quiz-Einstiegen. Die Ziele werden gegen den tatsächlichen Kartenbestand, Kurzübungskatalog und das tatsächliche gemeinsame Quizangebot geprüft. Keine neue Suche, Auswahlseite oder zusätzliche Kontrollfläche.
- Jagdrecht erhält keinen generischen gemeinsamen Quiz- oder Karteneinstieg. Das bestehende Prüfungsprofil und die vorhandenen Land-/Region-Wege bleiben zuständig; eine allgemeine Länderfrage wird nicht als lokale Prüfung ausgegeben.
- Im bestehenden geöffneten Kurs-Themenfeld stehen nun die unverändert übernommenen Lernziele vor den unveränderten Lektionslinks. Darunter folgen kurze Verweise auf einen belegten Wissenscheck und tatsächlich vorhandene kursgebundene Lernkarten.
- 180 Kurse besitzen einen verlinkbaren vollständigen gemeinsamen DACH-Check mit genau vier Antwortmöglichkeiten pro Frage. Elf Rechtskurse und sieben Kurse mit regionalen oder gemischten Fragen bekommen keinen solchen Link. Die bestehenden ausdrücklichen Jurisdiktions-Ausnahmen, etwa die DE-Frage im Grundkurs Waffensicherheit, werden berücksichtigt.
- 140 Kurse besitzen einen tatsächlich vorhandenen verknüpfbaren Kartensatz. Kartenzahlen und Lektionssummen werden nicht bloss auf plausible Grenzen geprüft: Die vorhandenen Kartenobjekte müssen zur richtigen Kursfrage, Lektion, Frageformulierung, Antwort und Erklärung passen. Doppelte oder unvollständige Metadaten erzeugen keinen Link.

Die Anzeige bleibt im selben nativen Kurs-Themenfeld. Dessen kurzer Auswahlname, einzige geöffnete native Gruppe, vorhandene tiefe Kurslinks und Quellenverweise bleiben erhalten. Bilder, Fachtexte, Fragen, Antworten, Datenstände und der Kategorienkatalog werden von diesem UI-Paket nicht bearbeitet. Parallel ergänzte Fachlektionen werden separat geprüft und dokumentiert.

## Technische Grenze

`lib/learning-category-practice-server.js` ist ausschliesslich ein Build-/Server-Helfer. Er prüft reale Kurs-, Lektions- und Frage-IDs gegen den vorhandenen Katalog sowie tatsächliche Kartensätze. An die Kategorieansicht gelangen nur originale Lernzieltexte, Zahlen und geprüfte lokale Ziele. Fragen, Antwortschlüssel, Erklärungen, Bewertungen und vollständige Karten-/Fachkorpora werden nicht in die Übersicht übertragen. Keine Browserdaten, kein Speicherzugriff und keine Netzwerkanfrage in diesem Helfer.

Ein gemeinsamer Kurscheck wird nur angeboten, wenn der gesamte tatsächliche Kurspool und die Metadaten passen. Der Helfer bildet aus einem gemischten Kurs keinen stillschweigend verengten Teilpool. Echte bestehende Umlaut-Lektionskennungen wie `gelände` bleiben gültig; sie werden nicht durch eine neue englischsprachige Kennungsregel ausgeschlossen.

Die Quellen-/Lizenzdaten der vorhandenen Ressourcen bleiben erhalten. Die Kategorienübersicht legt weder neue biologische oder rechtliche Aussagen noch neue fachliche Prüfstände an. Dies ist keine Behauptung vollständiger Jagdprüfungsabdeckung in CH/A/D.

## Prüfung

43 unterschiedliche passende Tests bestanden unter Node 22.23.3, ohne übersprungene Fälle: acht neue Projektions-/UI-Prüfungen und 35 bestehende Kategorien-, Themenbaum-, Landeswege- und Scrollprüfungen. Alle zwölf Kategorien, 63 Gruppen und 198 Kurse werden systematisch durchlaufen. Geprüft werden tatsächliche Zielauflösung, vollständige originale Lernziele und Lektionslinks, echte Vier-Antworten-Pools, exakte Kartensätze, fehlende oder fehlerhafte Metadaten, unerlaubte Ländervermischung und fehlende Client-Korpusimporte.

Der bestehende Scrolltest konnte den aktuellen `GlobalHomeButton` zunächst wegen eines im Test fehlenden `../lib/brand-config`-Imports nicht laden. Nur dieser echte relative Import wurde im isolierten Harness ergänzt. Alle zehn bisherigen Render-/Commit-/Browserframe-/Abbruch-/Unmount-Assertions bleiben erhalten und sind erfolgreich. Die Produktnavigation wurde dafür nicht verändert.

Die alten Wissensnavigationstests behalten die vollständigen Vergleiche von Titeln, Lektionen, Medien und Attributionsmetadaten. Ihre exakten Linkerwartungen berücksichtigen jetzt zusätzlich ausschliesslich den geprüften eigenen Kurscheck und die konkret kontextualisierten Ressourcen; es wurde keine allgemeine Linkprüfung entfernt oder aufgeweicht.

Keine visuelle Geräte- oder angemeldete Browserprüfung durchgeführt. Build, Gesamtintegration und tatsächliche Veröffentlichung prüft Root nach Abschluss der gemeinsamen Arbeiten separat. Fremder Nachmittag-JSON-Stand und das vorhandene unversionierte Marketingverzeichnis bleiben unberührt; dieser Agent hat nichts gestagt oder committed.
