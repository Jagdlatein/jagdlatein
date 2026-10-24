# Gezielte Prüfung der Themenführung am 24. Oktober 2026

## Verändertes Verhalten

- Pflanzenatlas: Auswahl, Suche, Pflanzengruppe, Jahreszeit und Lernweise stehen im vorhandenen unteren Seitenmenü. Erst eine gültige Pflanzenwahl öffnet deren vollständigen Text. Alte Pflanzen-, Jahreszeiten- und Fotoreihenlinks bleiben erhalten. Die URL bestimmt die sichtbare Auswahl; Zurück und Vorwärts stellen sie wieder her.
- Lebensraum-Werkstatt: Wissen lesen, Landschaft gestalten und Quiz sind getrennte Lernangebote im unteren Menü. Der Leser zeigt genau einen Baustein oder eine Art. Das Modell mit acht Bausteinen, drei Vorlagen, acht Arten und vier Beobachtungsschritten bleibt erhalten. Seine Funktionsanzeige bleibt ausdrücklich ein qualitatives Lernmodell. Bestehende Hashlinks erhalten einen passenden Fokus und Scroll nach dem Rendern; Verlaufsschritte ändern die Modellbearbeitung nicht rückwirkend.
- Dokumentierte Eichenfotoreihe: Aussagen und Grenzen sind unmittelbar lesbar. Wissenschaftliche Belege stehen zusammengefasst am Ende; bildbezogene Urheber- und Lizenzangaben bleiben am Foto sichtbar.
- Spuren, Wildbret, Pflanzen und Jagdhundvideos: Ein verspäteter fehlgeschlagener Seitenwechsel darf eine inzwischen über den Verlauf gewählte Ansicht nicht mit einem alten Fehler überlagern oder deren Menü öffnen. Der Schutz berücksichtigt auch Weg- und Rücknavigation zur identischen Auswahl. Die passende aktuelle Fehlermeldung bleibt erhalten.

## Abgrenzung

Dieses Paket fügt diesen naturkundlichen Komponenten keine neuen Sachbehauptungen, Messdaten, Lehrbilder oder fachlichen Prüfdaten hinzu. Bestehende Texte, Einschränkungen, Mediennachweise und Fragen bleiben erhalten. Die parallele Erweiterung des niedersächsischen Rechts hat einen eigenen fachlichen Prüfbericht. Hier wird keine vollständige Prüfung der gesamten App behauptet.

## Technische und unabhängige Prüfung

- 116 passende Tests bestanden: globale und fachliche Navigation, Pflanzen, Lebensräume, Bewegung/Fotoreihe, Spuren/Wildbret, Hundevideos sowie regionale Rechtsauswahl, Daten und Oberfläche.
- Die Regressionen prüfen gültige, unbekannte und mehrfache URL-Werte, verzögerte Routerbereitschaft, echte Verlaufsschritte, Fokus, abgebrochene und verspätete Navigation sowie Unmount-Verhalten.
- Zwei unabhängige Code-Gegenprüfungen fanden nach der Korrektur keine weiteren konkreten Fehler in den geprüften Änderungen. Insbesondere wurde der zuvor reproduzierte Fehler bei externen Verlaufsschritten erneut geprüft.
- `git diff --check` ohne Fehler. Tests und Codeprüfung sind keine neue fachliche Zertifizierung und keine visuelle Prüfung auf sämtlichen Endgeräten.
- Vollständige Produktions-Erstellung mit Next.js 15.5.24 erfolgreich: 504 statische Seiten erzeugt, Typ-/Kompilierungsprüfung ohne Fehler.

Die Veröffentlichung wird zusätzlich anhand des tatsächlich ausgelieferten Vercel-Standes geprüft; ein erfolgreicher Push allein genügt dafür nicht.
