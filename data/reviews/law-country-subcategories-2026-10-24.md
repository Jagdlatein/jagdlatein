# Regionales Jagdrecht in der vorhandenen Kategorie

## Auftrag

Die Länderwahl und der bisher separate Einstieg „Jagdrecht nach Region“ gehören unter die bestehende Kategorie Jagdrecht. Kurze Stichworte, direkte Auswahl und die untere Navigation bleiben maßgeblich.

## Umsetzung

- `/lernen/jagdrecht` zeigt unter „Unterkategorien“ zuerst „Land & Region“ und die drei vorhandenen Länder Schweiz, Deutschland und Österreich. Die Reihenfolge und Namen stammen aus `legalCountries`.
- Jedes Land führt direkt zu seinem bestehenden regionalen Lernbereich. Dessen vorhandenes unteres Menü bietet weiterhin Kanton beziehungsweise Bundesland. Eine zusätzliche Länder-Zwischenseite ist für diese direkte Auswahl nicht erforderlich.
- Die kurze verlinkte Überschrift „Land & Region“ erhält den bisherigen Zugang zu `/jagdrecht`. Alte Länder-, Regionen-, Themen- und Kursadressen bleiben unverändert.
- Danach folgen unter „Grundlagen“ sämtliche bisherigen allgemeinen Rechtszweige. Bereits gewählte Grundlagenzweige und alte Kurslinks erhalten ihre genaue aufklappbare Auswahl und ihre Lektionsziele.
- Der doppelte oberste Menüpunkt „Jagdrecht nach Region“ entfällt. Die vorhandene kanonische Kategorie Jagdrecht bleibt an ihrer bisherigen Position und wird auch auf den regionalen Rechtsseiten als aktiv markiert.
- Andere Lernkategorien erhalten keine Länderwahl. Es entsteht keine weitere Hauptkategorie.

## Prüfung und Grenzen

Eigene Komponenten-/SSR-Regressionen prüfen die direkte sichtbare Länderwahl vor den Grundlagen, die unveränderten alten Grundlagen- und Kursziele und die Abwesenheit dieser Länderunterteilung in den übrigen elf Kategorien. Die bestehende Menüsuite prüft zusätzlich den einzigen aktiven Jagdrecht-Kategorieeintrag auf allen drei Länderpfaden und der bisherigen Länderübersicht. Bestehende Wissensnavigation, Regionsoberfläche, Rechtsdaten, Rechtsauswahl und das Zurück-/Scrollverhalten bleiben mitgeprüft.

Keine Rechtsdaten, Fragen, Freigaben oder fachlichen Prüfdaten wurden geändert. Die Prüfung betrifft Navigation und Struktur; sie bestätigt keine neue Rechtsvollständigkeit und keine visuelle Prüfung auf einem physischen Gerät.
