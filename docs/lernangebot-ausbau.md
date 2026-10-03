# Lernangebot für Deutschland, Österreich und die Schweiz

Der neue Einstieg liegt unter **Lernbereich & Lernpfade** auf der Startseite (`/lernen`).

## Inhalt dieses Ausbaus

- 24 zusätzliche Kurse mit jeweils drei Lektionen und acht Fragen: insgesamt 72 Lektionen und 192 neue Übungsfragen.
- Acht Kategorien: Wildkunde, Waffen & Sicherheit, Jagdpraxis, Natur & Revier, Hundewesen, Wildbret & Gesundheit, Jagdrecht sowie Prüfung & Sprache.
- Fünf Lernpfade, Suche, Kategorie- und Länderwahl.
- Merksätze, Denkaufgaben und Quellenlinks in jedem neuen Kurs.
- Erklärungen nach jeder richtigen oder falschen Antwort; im Kurs bestimmst du selbst, wann es weitergeht.
- Vollständige Wiederholung und separates Fehlertraining. Fehlertraining verändert den gespeicherten Abschluss nicht.
- Die bestehenden 34 Mini-Kurse behalten ihre IDs und Fragenzahlen. Insgesamt gibt es jetzt 58 Kurse.
- Die neuen Fragen sind auch im Hauptquiz und Tagesquiz verfügbar. Der aktive Hauptpool enthält 520 eindeutige Fragen; 20 identische alte Kopien mit derselben ID wurden entfernt.
- Eine alte Kühlungsfrage wurde fachlich korrigiert: Kühlung hemmt viele Keime, ersetzt aber keine hygienische Verarbeitung und beseitigt Krankheitserreger nicht zuverlässig.
- Im Hauptquiz erscheinen Erklärung und richtige Antwort auch bei einem Zeitablauf. Die Rückmeldung bleibt zehn Sekunden sichtbar; „Weiter“ beendet sie auf Wunsch früher. Eine neue Runde lädt neue Fragen.

Die allgemeinen Lernmodule passen zu allen drei Ländern. Die drei Rechtsmodule und ihre Fragen sind ausschließlich ihrem jeweiligen Land zugeordnet. Jeder Länderpool erhält 176 neue Fragen: 168 allgemeine Fragen plus acht passende Rechtsfragen. Die Appfragen sind eigene Übungsfragen und kein amtlicher Prüfungsfragenkatalog.

## Fortschritt und Einrichtung

Neue Vollkurse speichern den Fortschritt und das beste vollständige Quiz-Ergebnis in „Meine Kurse“. Die bestehenden Kontoeinstellungen, Session und Supabase-Tabelle werden weiterverwendet. Dieser Ausbau benötigt **keine neue SQL-Migration und keinen neuen Sitzungsschlüssel**. Wenn Mein Konto, Meine Kurse und Auswertungen bereits funktionieren, ist dafür keine weitere Einrichtung nötig.

„Abgeschlossen“ bedeutet weiterhin, dass alle Quizfragen eines Kurses beantwortet wurden. Es ist keine Bescheinigung über eine amtliche Prüfung oder praktische Ausbildung.

## In PowerShell veröffentlichen

Nach der lokalen Prüfung sind nur die zugehörigen Projektänderungen für Git vorgemerkt. Vor dem Commit kannst du sie ansehen:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
git diff --cached --stat
```

Dann:

```powershell
& {
    Set-Location 'C:\Projekte\jagdlatein-github'

    git commit -m "Lernbereich mit 24 Kursen und 192 Fragen erweitern"
    if ($LASTEXITCODE -ne 0) { throw 'Commit fehlgeschlagen.' }

    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push fehlgeschlagen.' }
}
```

Bei einer aktiven Git-Verknüpfung startet Vercel nach dem Push den Build. Prüfe den Deploymentstatus in deinem Vercel-Projekt. Lokale Tests oder ein Push bestätigen allein noch kein erfolgreiches Deployment.

Für einen vollständigen lokalen Build müssen die vorhandenen Supabase-Umgebungsvariablen des Projekts verfügbar sein. `npm run build -- --experimental-build-mode compile` ist lediglich eine Kompilierungsprüfung; sie ersetzt nicht den vollständigen Build.

## Nach dem Deployment ausprobieren

1. Startseite → Lernbereich & Lernpfade öffnen.
2. Land wählen, ein Thema suchen und einen neuen Kurs öffnen.
3. Eine richtige und eine falsche Antwort geben: beide zeigen eine Erklärung.
4. Den Wissenscheck vollständig beantworten und den Abschluss in „Meine Kurse“ prüfen.
5. „Nur Fehler üben“ nutzen und kontrollieren, dass der vollständige Kursabschluss erhalten bleibt.
6. Im Quiz Land und Thema wählen, eine Runde spielen und anschließend die Auswertungen öffnen.

## Inhalte später ergänzen

Die gemeinsamen Lerntexte liegen in `lib/learning-wildlife.js` und `lib/learning-practice.js`. `lib/learning-curriculum.js` verbindet sie mit Lernpfaden, Kursseiten und Hauptquiz. Quellen und Länderhinweise gehören zu jedem Modul. Neue Inhalte bekommen neue stabile Kurs- und Frage-IDs.

Ändere den Fragenumfang eines bereits gespeicherten Kurses nicht unter derselben ID: vorhandene Ergebnisse beziehen sich auf den bisherigen Umfang. Lege für einen veränderten Abschlussumfang eine neue Kursversion mit eigener ID an oder passe die Fortschrittsverwaltung ausdrücklich mit an.
