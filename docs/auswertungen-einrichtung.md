# Persönliche Auswertungen

Unter **Mein Konto → Auswertungen** erscheinen abgeschlossene Quizrunden und Ansitzdurchläufe. Die vorhandene Kontoeinrichtung mit `JL_SESSION_SECRET` wird weiterverwendet.

## Einmalig in Supabase einrichten

In PowerShell:

```powershell
Set-Location 'C:\Projekte\jagdlatein-github'
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-account.ps1 -Step StatisticsSql
```

Die Zwischenablage im SQL Editor des bestehenden Supabase-Projekts einfügen und ausführen. Die SQL-Migration erstellt die neue Tabelle `activity_results` und die Auswertungsfunktion. Sie verarbeitet ausschließlich diese neue Ergebnisablage. Die persönliche Identität wird auf dem Server aus der signierten Sitzung bestimmt.

Die Gesamtwerte werden in einer Datenbankfunktion über sämtliche gespeicherten Runden berechnet. Die Funktion ist ausschließlich für den Serverzugriff freigegeben. [Supabase-Dokumentation zu Datenbankfunktionen](https://supabase.com/docs/guides/database/functions).

## Commit und Vercel

Nach der SQL-Einrichtung die vorbereiteten Änderungen übertragen:

```powershell
& {
    Set-Location 'C:\Projekte\jagdlatein-github'
    git commit -m "Persönliche Auswertungen für Quiz und Ansitz"
    if ($LASTEXITCODE -ne 0) { throw 'Commit fehlgeschlagen.' }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push fehlgeschlagen.' }
}
```

Das bestehende Vercel-Projekt führt den neuen Build aus. Sobald das Deployment erfolgreich ist, eine Quizrunde oder einen Ansitzdurchlauf vollständig bearbeiten und **Mein Konto → Auswertungen** öffnen. Nach einer Anmeldung mit derselben E-Mail auf einem zweiten Gerät erscheinen dort dieselben Ergebnisse.

## Anzeige und Speicherung

- Die Trefferquote ist die Zahl richtiger Antworten geteilt durch die gesamte Fragenzahl. Quiz-Zeitüberschreitungen zählen als nicht richtig beantwortet.
- Die beste Runde wird über die Trefferquote verglichen. Quizpunkte enthalten den bestehenden Zeitbonus und werden getrennt von den Ansitzentscheidungen angezeigt.
- Quiz-Themen beziehen sich auf das für die Runde ausgewählte Thema und Land.
- Der Verlauf zeigt die neuesten 20 Runden. Die Gesamtwerte umfassen alle gespeicherten Runden.
- Jede neue Runde hat eine eigene Kennung. Ein erneuter Speicherversuch zählt dieselbe Runde nur einmal. Bereits gespeicherte Runden werden nicht überschrieben.
- Ein Abschluss wird nach der letzten Antwort erfasst. Beim Ansitz bleiben Erklärung und Rückmeldung weiterhin 10 Sekunden sichtbar.
- Falls die Speicherung fehlschlägt, erscheint am Ergebnis ein Hinweis mit **Erneut speichern** oder **Anmeldung erneuern**.
- Auswertungen beginnen mit neu gespeicherten Runden. Alte Highscores enthalten keine Kontozuordnung oder Angaben zu richtigen Antworten und werden deshalb weiterhin in der bestehenden Rangliste angezeigt.

## Lokale Prüfung

`npm run build` wurde ausgeführt und kompiliert erfolgreich. Der vollständige Build benötigt weiterhin die vorhandenen lokalen Supabase-Variablen; in der Codex-Shell fehlt `SUPABASE_URL`. Die zusätzliche Prüfung `npm run build -- --experimental-build-mode compile` prüft die Kompilierung und ersetzt keinen vollständigen Produktionsbuild. Die neue SQL-Migration wurde in einer isolierten PostgreSQL-Testdatenbank geprüft, nicht in der echten Supabase-Datenbank.
