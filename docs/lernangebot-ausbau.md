# Lernangebot für Deutschland, Österreich und die Schweiz

Der Lernbereich liegt unter `/lernen`. Die Startseite bietet zwölf Kategorie-Einstiege; jede Kategorie hat eine eigene Übersichtsseite.

## Umfang des zweiten Ausbaus

- 36 zusätzliche Aufbaukurse, gleichmäßig verteilt: drei neue Kurse je Kategorie.
- Jeder Aufbaukurs enthält sechs ausführliche Lektionen, Merksätze, Denkaufgaben und zwölf Fragen mit Erklärungen: zusammen 216 neue Lektionen und 432 neue Fragen.
- Zusammen mit den bisherigen 24 ausführlichen Kursen umfasst der Lernbereich 60 Kurse, 288 Lektionen und 624 Fragen.
- Die bisherigen 34 Mini-Kurse bleiben erreichbar; ihre IDs und insgesamt 122 Fragen ändern sich nicht. Der gesamte Kurskatalog enthält 94 Kurse.
- Fünf grundlegende Lernpfade und zwölf aufklappbare Vertiefungspfade helfen bei der Reihenfolge. Suche und Länderwahl gelten auch für die angezeigten Lernpfade.
- Die Übersichten laden Zusammenfassungen. Ausführliche Texte stehen auf den einzelnen Kursseiten.

| Kategorie | Übersichtsseite |
| --- | --- |
| Wildkunde | `/lernen/wildkunde` |
| Waffen & Sicherheit | `/lernen/waffen-sicherheit` |
| Jagdpraxis | `/lernen/jagdpraxis` |
| Natur & Revier | `/lernen/natur-revier` |
| Hundewesen | `/lernen/hundewesen` |
| Wildbret & Gesundheit | `/lernen/wildbret-gesundheit` |
| Jagdrecht | `/lernen/jagdrecht` |
| Prüfung & Sprache | `/lernen/pruefung-sprache` |
| Wald & Pflanzen | `/lernen/wald-pflanzen` |
| Landwirtschaft & Lebensräume | `/lernen/landwirtschaft-lebensraeume` |
| Ausrüstung & Technik | `/lernen/ausruestung-technik` |
| Tierschutz & Verantwortung | `/lernen/tierschutz-verantwortung` |

Die neuen Aufbaukurse haben Hinweise für alle drei Länder. Regionale Rechtsfragen werden als Prüfung der zuständigen Rechtsquelle behandelt. Die bestehenden drei Rechtsgrundlagenkurse und ihre Fragen bleiben ihrem Land zugeordnet. Jeder Länderpool enthält 608 Fragen aus dem ausführlichen Lernbereich.

## Fachliche Überprüfung am 4. Oktober 2026

Lerntexte, Antwortschlüssel und Erklärungen der 60 ausführlichen Kurse wurden redaktionell gelesen. Biologische, rechtliche, gesundheitliche und sicherheitsbezogene Aussagen wurden gezielt anhand von Primärquellen überprüft: Behörden, Originalforschung, Fachverbände und deren Ausbildungsunterlagen. Quellen stehen auf den jeweiligen Kursseiten; neue Aufbaukurse haben mindestens drei Quellenlinks.

Zusätzlich wurden die 122 Mini-Kursfragen und die 328 eindeutigen bisherigen Hauptquizfragen geprüft. 23 Mini-Kursfragen wurden präzisiert, unter anderem zu Nachsuche, Fallenüberwachung, Waffensicherheit, Nachtjagd und Wildbrethygiene. Ihre bisherigen Fragenzahlen bleiben erhalten, damit gespeicherte Ergebnisse vergleichbar bleiben.

Im gemeinsamen Haupt- und Tagesquiz werden 33 bisherige Fragen beziehungsweise Erklärungen durch belegte Korrekturen ersetzt. 97 alte Fragen mit falschen, widersprüchlichen, unbelegten oder unzureichend abgegrenzten Aussagen werden aus dem aktiven Pool genommen. Die ursprünglichen Datensätze bleiben für eine spätere Überarbeitung erhalten. Der aktive gemeinsame Pool umfasst jetzt 855 eindeutige Fragen. Bereits zuvor wurden 20 identische importierte Kopien entfernt und eine weitere Kühlungsfrage korrigiert.

Beispiele für geprüfte Korrekturen:

- Feldhase: Ruheplatz **Sasse**, nicht Kessel; Paarungszeit beim Rehwild: Brunft beziehungsweise Blattzeit. Quellen: [DJV, Feldhase](https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/feldhase-lepus-europaeus) und [DJV, Reh](https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/reh-capreolus-capreolus).
- Kühlung hemmt die Vermehrung vieler Keime und ersetzt keine hygienische Verarbeitung. Quelle: [BfR, Wildbret](https://www.bfr.bund.de/presse/infografiken/lebensmittelsicherheit-wildbret/).
- Ein einzelner hundeartiger Pfotenabdruck oder ein gerader Spurverlauf beweist keinen Wolf. Quelle: [BfN, Monitoring von Großraubtieren](https://www.bfn.de/sites/default/files/BfN/service/Dokumente/skripten/skript201.pdf).
- Der meckernde Balzlaut der Bekassine entsteht durch äußere Schwanzfedern. Quelle: [Landesjagdverband Baden-Württemberg](https://www.landesjagdverband.de/projekte/naturland/detail/trittsteine-fuer-die-bekassine).
- **Gebrech** bezeichnet Maul und Rüssel des Schwarzwildes. Quelle: [OÖ Landesjagdverband, Fachausdrücke](https://www.ooeljv.at/wp-content/uploads/2026/04/7_jagdliche-Fachausdruecke-und-Jagdgebraeuche.pdf).
- Fährtenlaut und Spurlaut werden im Prüfungsgebrauch unterschieden. Quelle: [JGHV, Verbandsstöberprüfungsordnung](https://jghv.de/images/managed/dateien/2025/service/pruefungsordnungen-des-jghv/Verbandsstoberprufungsordnung_2025_1.pdf).
- Schweizer Jagdsysteme: Genf ist ein Sonderfall mit staatlicher Bestandsregulierung. Quelle: [BAFU, Jagd](https://www.bafu.admin.ch/de/jagd).

Die Liste korrigierter und zurückgezogener Fragen einschließlich der Gründe liegt in `lib/quiz-content-review.js`. Sie wird vor der Aufnahme in beide Quizvarianten angewandt. Korrigierte Hauptquizfragen bieten einen Quellenlink in der Rückmeldung.

Die Überprüfung bezieht sich auf diesen Lern- und Quizbestand. Sie ist keine amtliche Zertifizierung und keine vollständige Prüfung aller anderen Texte, Glossare, Videos oder Gesetzesseiten der App. Die Appfragen sind eigene Übungsfragen; regionale Regeln müssen bei Änderungen erneut geprüft werden.

## Fortschritt und Einrichtung

Erklärungen erscheinen nach richtigen und falschen Antworten. Im ausführlichen Kurs bestimmt die lernende Person den nächsten Schritt selbst. Im Hauptquiz dauert die Rückmeldung weiterhin zehn Sekunden; „Weiter“ beendet sie früher. Ein Zeitablauf zeigt ebenfalls Erklärung und richtige Antwort.

Vollständige Kursrunden speichern Fortschritt und bestes Ergebnis unter „Meine Kurse“. Separates Fehlertraining überschreibt keinen vollständigen Abschluss. Kontoeinstellungen und persönliche Auswertungen werden weiterverwendet. Dieser Ausbau benötigt keine neue SQL-Migration und keinen neuen Sitzungsschlüssel.

„Abgeschlossen“ bedeutet weiterhin, dass alle Quizfragen eines Kurses beantwortet wurden. Es ist keine Bescheinigung über eine amtliche Prüfung oder praktische Ausbildung.

## Build und Veröffentlichung in PowerShell

Der bekannte Abbruch `supabaseUrl is required` beim Sammeln der Seitendaten wurde behoben: acht vorhandene API-Routen erzeugen ihren Datenbankclient erst bei einer tatsächlichen Anfrage nach der Eingabeprüfung. Die veraltete Konfiguration `experimental.appDir` wurde entfernt. Datenbankfunktionen benötigen zur Laufzeit weiterhin die gültigen Umgebungsvariablen des Projekts; es wurden keine Ersatzwerte oder neuen Geheimnisse eingetragen.

Nach der Prüfung sind ausschließlich die zugehörigen Änderungen für Git vorgemerkt. Du kannst sie vor dem Commit ansehen:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
git diff --cached --stat
```

Veröffentlichen:

```powershell
& {
    Set-Location 'C:\Projekte\jagdlatein-github'

    git commit -m "12 Lernkategorien vertiefen und Jagdwissen fachlich prüfen"
    if ($LASTEXITCODE -ne 0) { throw 'Commit fehlgeschlagen.' }

    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push fehlgeschlagen.' }
}
```

Bei aktiver Git-Verknüpfung startet Vercel nach dem Push den Build. Ein erfolgreicher lokaler Build bestätigt noch kein erfolgreiches Vercel-Deployment. Prüfe dessen Status im Vercel-Projekt.

## Nach dem Deployment ausprobieren

1. Auf der Startseite Hundewesen und die vier neuen Kategorien Wald & Pflanzen, Landwirtschaft & Lebensräume, Ausrüstung & Technik sowie Tierschutz & Verantwortung öffnen.
2. Im Lernbereich Land und Suchbegriff auswählen; Filter zurücksetzen und einen Vertiefungspfad aufklappen.
3. Einen Aufbaukurs öffnen, eine richtige und eine falsche Antwort geben und jeweils die Erklärung lesen.
4. Alle zwölf Fragen beantworten und den Abschluss unter „Meine Kurse“ prüfen.
5. Nur die Fehler üben und kontrollieren, dass das vollständige Ergebnis erhalten bleibt.
6. Hauptquiz und Tagesquiz mit unterschiedlichen Ländern spielen und die Auswertungen öffnen.

## Inhalte später ergänzen

Ausführliche Inhalte liegen in `lib/learning-wildlife.js`, `lib/learning-practice.js` und den drei Dateien `lib/learning-expansion-*.js`. `lib/learning-curriculum.js` verbindet sie mit Kursseiten, Lernpfaden und Quiz. Kategorien werden in `lib/learning-categories.js` beschrieben.

Neue Inhalte brauchen stabile, eindeutige IDs, geprüfte richtige Antworten, verständliche Erklärungen, Länderhinweise und belastbare Quellen. Verändere den Fragenumfang eines bereits gespeicherten Kurses nicht unter derselben ID. Lege für einen geänderten Abschlussumfang eine eigene Kursversion an oder passe die Fortschrittsverwaltung ausdrücklich an.
