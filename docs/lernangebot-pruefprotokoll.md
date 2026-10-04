# Prüfprotokoll zum Lernangebot

Stand: 4. Oktober 2026

Der Kurskatalog enthält 94 Kurse. Der ausführliche Lernbereich umfasst 60 Kurse mit 288 Lektionen und 624 Fragen. Haupt- und Tagesquiz nutzen gemeinsam 855 eindeutige aktive Fragen.

33 bisherige Quizfragen beziehungsweise Erklärungen korrigiert; 97 unzureichend belegte oder falsche Altfragen aus dem aktiven Pool entfernt. Die 23 korrigierten Mini-Kursfragen behalten ihre IDs und Abschlussumfänge.

## Umfang der Vertiefungen

| Kategorie | Ausführliche Kurse gesamt | Davon neu | Neue Themen |
| --- | ---: | ---: | --- |
| Wildkunde | 8 | 3 | Feldhase und Wildkaninchen im Vergleich; Raubwildökologie ohne einfache Feindbilder; Wildtierbeobachtung und Jungtierfunde |
| Waffen & Sicherheit | 6 | 3 | Sicherheit durch klare Kommunikation; Schießstandtraining planen und auswerten; Waffenpflege, Verwahrung und Wege planen |
| Jagdpraxis | 5 | 3 | Pirsch und störungsarme Beobachtung planen; Jagdorganisation und Rollen abstimmen; Anschuss dokumentieren und Nachsuche abstimmen |
| Natur & Revier | 8 | 3 | Gewässer und Feuchtgebiete als Lebensraum; Biotopgestaltung und Pflegeplanung; Monitoring und Datenauswertung verstehen |
| Hundewesen | 5 | 3 | Jagdhundetypen und eine passende Aufgabenwahl; Welpe, Alltag und positives Lernverhalten; Zusammenarbeit, Nasenarbeit und Einsatzbeobachtung |
| Wildbret & Gesundheit | 5 | 3 | Wildbret: Prozesshygiene und Rückverfolgbarkeit; Wildkrankheiten, Zoonosen und Biosicherheit; Wildbretqualität, Küchenablauf und Lagerplanung |
| Jagdrecht | 6 | 3 | Jagdrecht: Quellen, Berechtigung und Grundbesitz; Artenschutz, Jagdzeiten und Schutzgebiete vergleichen; Verantwortung, Nachweise und Gesellschaftsjagd |
| Prüfung & Sprache | 5 | 3 | Prüfungsfälle verknüpfen und sicher begründen; Jägersprache: Körperteile, Wildbezeichnungen und Spuren; Systematisch lernen, Fehler analysieren und wiederholen |
| Wald & Pflanzen | 3 | 3 | Baumarten erkennen und Waldaufbau verstehen; Sträucher und saisonale Nahrung im Jahreslauf; Waldverjüngung und Verbiss sachlich beurteilen |
| Landwirtschaft & Lebensräume | 3 | 3 | Das Agrarjahr als wechselnden Lebensraum verstehen; Mahd und Wildtierrettung gemeinsam vorbereiten; Feldraine, Hecken und Übergänge bewerten |
| Ausrüstung & Technik | 3 | 3 | Ausrüstung für Wetter, Wege und Aufenthaltsdauer; Karte, Koordinaten und digitale Orientierung; Wildkameras, Datenqualität und Privatsphäre |
| Tierschutz & Verantwortung | 3 | 3 | Waidgerecht entscheiden und Grenzen anerkennen; Wildunfälle und vermeintlich hilflose Tiere; Jagd, Naturnutzung und Konflikte sachlich besprechen |

## Technische Prüfung

- Vollständiges `npm run build`: erfolgreich, einschließlich Typ-/Lintprüfung, Sammlung der Seitendaten, Erzeugung von 233 statischen Seiten und Build-Traces.
- 25 Tests für Kursoberfläche, Filter, Rückmeldungen, Zehn-Sekunden-Anzeige, Quiz/Ansitz und Auswertungen: bestanden.
- 141 Tests für signierten Kontozugang, Kursfortschritt, gespeicherte Ergebnisse, Wiederholungen und Datenbankfehler: bestanden.
- 25 Integrationstests für alle Kurs-/Kategorierouten, Inhaltsstruktur, Landesfilter, Quizpool und Quiz-Einstieg: bestanden.
- 24 Tests für verzögerte Datenbankinitialisierung, fehlende Konfiguration und Eingabe-/Berechtigungsprüfung der betroffenen API-Routen: bestanden.
- 61 Tests für Kontomenü, Startseitenstatus und Anmeldung: bestanden.
- Alle 36 neuen Kurse: sechs eigenständige Lektionen und zwölf eindeutig zugeordnete Fragen; je zwei Fragen pro Lektion, vier unterschiedliche Antwortoptionen und ein gültiger Lösungsschlüssel.
- Kein identischer vollständiger Lektionstext in den 216 neuen Lektionen.

Die Verhaltenstests verwenden kontrollierte React-Zustandswechsel und nachgebildete Datenbankantworten. Es fand keine neue Prüfung an einer Live-Datenbank und keine Browser-Sichtprüfung statt. Der lokale Build und die Tests bestätigen noch kein Vercel-Deployment.

## Fachliche Prüfung

Alle ausführlichen Lerntexte, Antwortschlüssel und Erklärungen sowie die bisherigen Mini-Kurs- und Hauptquizfragen wurden redaktionell gelesen. Recht, Sicherheit, Hygiene, Hundewesen, Tierbiologie und ökologische Aussagen wurden gezielt anhand von Primärquellen abgeglichen. Quellenlinks stehen in den Kursen beziehungsweise bei den korrigierten Hauptquizfragen. Die neuen Inhalte wurden zusätzlich nach Zuständigkeiten gegengeprüft.

Diese Prüfung umfasst den Lern- und Quizbestand dieses Ausbaus. Sie ist keine amtliche Zertifizierung und keine vollständige Prüfung aller übrigen Glossare, Medien und Gesetzesseiten der App. Rechtsquellen bleiben länder-, regions- und situationsabhängig.

## Veröffentlichung

Die geprüften Änderungen werden für Git vorgemerkt. Commit und Push erfolgen über den PowerShell-Block in der Ausbauanleitung; ein erfolgreiches Vercel-Deployment ist anschließend im Projekt zu kontrollieren.
