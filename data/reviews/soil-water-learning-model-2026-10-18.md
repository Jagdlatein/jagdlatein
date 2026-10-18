# Interaktives Bodenwasser-Lernmodell

Stand: 18. Oktober 2026. Ergänzt ausschließlich die Lektion `wurzelraumspeicher` des neuen Bodenwasserkurses. Kein Messinstrument und keine Bewässerungsplanung.

## Fachliche Herleitung

- [FAO 56, Kapitel 8, Gleichung 82](https://www.fao.org/4/X0490E/x0490e0e.htm): eingesehen. Nutzbarer Wurzelraumspeicher = 1000 × Differenz der volumetrischen Wassergehalte in m³/m³ × Wurzeltiefe in Metern; Ergebnis Millimeter.
- [LfL, Tropfbewässerung und Fertigation bei Hopfen](https://www.lfl.bayern.de/mam/cms07/publikationen/daten/informationen/tropfbewaesserung-fertigation-hopfen_lfl-information.pdf), gedruckte Seiten 54–55: eingesehen. nFK als Volumenanteil beziehungsweise Millimeter pro zehn Zentimeter Bodentiefe; Gesamtmenge abhängig von durchwurzelter Tiefe. Standort- und Hopfenwerte werden nicht übernommen.

Beide unabhängigen Fachinstitutionen tragen die Einheitenumrechnung. Für Eingaben in Volumenprozent und Zentimetern lautet sie `(FK − PWP) × Tiefe / 10 = mm`. Die Vorgaben 30, 10 und 50 sind eigene Lernwerte; daraus folgen 100 mm. Halbierte Tiefe ergibt bei gleichem Anteil 50 mm. Keine echten Felddaten, keine Leistungsmessung eines bestimmten Bodens.

Die Balkengrafik zeigt nur Volumenanteile im gedachten Zustand bei Feldkapazität: Wasser am Welkepunkt, rechnerisch nutzbarer Wasseranteil, übriges Bodenvolumen. Sie zeigt weder Porenformen noch einen aktuellen Füllstand oder eine Wasserstressgrenze. Ihre Summe beträgt 100 Prozent des Bodenvolumens. Die Tiefe verändert die Menge bei positivem nutzbarem Anteil, nicht diese Anteile.

## Darstellung und Grenzen

Drei direkt bedienbare Zahlenfelder, sofortige Berechnung und textliche Ergebnisse; keine zusätzliche Startschaltfläche. Der Eingabebereich für Tiefe ist eine technische Begrenzung dieses Lehrbeispiels, keine allgemeine Wurzeltiefengrenze. Ungültige, leere und umgekehrte Angaben zeigen eine Erklärung und keine alte Zahl. Der sichtbare Hinweis unterscheidet Kapazität von aktuellem Vorrat und Bewässerungsbedarf.

Das bestehende `LessonDiagram` rendert dasselbe Modell online und beim gespeicherten Offline-Kurs. Das Diagramm behält zusätzlich drei schriftliche Schritte im bestehenden Offline-Datenformat. Keine neuen Rasterbilder oder externen Widgets, keine Telemetrie oder Eingabespeicherung. Automatisierte Einheiten-, Eingabe-, Zustands- und Renderprüfungen sind getrennt von diesem fachlichen Abgleich.

Unabhängige Gegenprüfung am selben Tag: Formel, Einheiten, Referenzzustand und alle drei Balkenbeschriftungen erneut mit FAO/LfL abgeglichen. Kein offener fachlicher Einwand; 70 Prozent Restvolumen werden ausdrücklich nicht mit Luft- oder Porenvolumen gleichgesetzt.
