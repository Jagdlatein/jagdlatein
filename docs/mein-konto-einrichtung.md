# Mein Konto und Kursfortschritt einrichten

Die neue Navigation führt zu `/konto` und `/meine-kurse`. Kontodaten werden aus dem verifizierten Konto geladen. Der Kursfortschritt wird in Supabase gespeichert und ist nach der Anmeldung auf anderen Geräten verfügbar.

## Einmalige Einrichtung

1. In PowerShell den Sitzungsschlüssel anlegen:

   ```powershell
   Set-Location 'C:\Projekte\jagdlatein-github'
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-account.ps1 -Step SessionSecret
   ```

   Der Schlüssel liegt in der Zwischenablage und wird in der von Git ausgeschlossenen `.env.local` gespeichert. Im Vercel-Projekt unter **Settings → Environment Variables** die Variable **JL_SESSION_SECRET** anlegen und den Wert einfügen. Für **Production** und bei Bedarf **Preview** aktivieren. Vorhandene Variablen **SUPABASE_URL** und **SUPABASE_SERVICE_ROLE_KEY** bleiben erforderlich; alle drei Variablen sind ausschließlich serverseitig. Den Schlüssel nicht veröffentlichen. Neue Variablen gelten für nachfolgende Deployments: [Vercel-Dokumentation](https://vercel.com/docs/environment-variables).

2. Die Datenbankeinrichtung in die Zwischenablage laden:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-account.ps1 -Step DatabaseSql
   ```

   Im SQL Editor des bestehenden Supabase-Projekts einfügen und ausführen. Die Migration erstellt ausschließlich die neue Fortschrittstabelle und deren Funktionen/Trigger. Die Tabelle hat keine öffentlichen Lese- oder Schreibrechte; Zugriff erfolgt über die geschützten Serverrouten. Hintergrund zu Berechtigungen und RLS: [Supabase-Dokumentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

3. Den Build prüfen und anschließend die Änderungen über Git nach Vercel übertragen. Ein neuer Vercel-Build ist nötig, damit die neue Variable wirksam wird.

   ```powershell
   npm run build
   if ($LASTEXITCODE -ne 0) { throw 'Build fehlgeschlagen.' }
   ```

   Falls der lokale Build `supabaseUrl is required` meldet, fehlen die bisherigen Supabase-Variablen lokal. Die Kompilierungsprüfung `npm run build -- --experimental-build-mode compile` prüft den Code, ersetzt aber keinen vollständigen Produktionsbuild und keinen Datenbanktest.

4. Nach dem Deployment unter **Mein Konto** einmal **Anmeldung erneuern** auswählen und den E-Mail-Code bestätigen. Danach einen Kurs bis zum Ende bearbeiten und in **Meine Kurse → Abgeschlossen** Ergebnis und Datum prüfen. Auf einem zweiten Gerät mit derselben E-Mail anmelden und die gespeicherten Daten prüfen.

## Commit und Vercel-Deployment

Die Änderungen sind bereits für den Commit vorgemerkt. Erst Sitzungsschlüssel in Vercel hinterlegen und SQL in Supabase ausführen, dann in PowerShell:

```powershell
& {
    Set-Location 'C:\Projekte\jagdlatein-github'
    git commit -m "Mein Konto und Kursfortschritt pro Konto"
    if ($LASTEXITCODE -ne 0) { throw 'Commit fehlgeschlagen.' }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push fehlgeschlagen.' }
}
```

Der bestehende Git-Verbund löst den Vercel-Build aus. In Vercel den erfolgreichen Abschluss des Deployments prüfen.

## Verhalten

- Ein Kurs beginnt mit der ersten beantworteten Frage und ist nach allen Fragen abgeschlossen, auch wenn Antworten falsch waren. Das Ergebnis steht separat daneben.
- Wiederholungen löschen keinen Abschluss. Das beste vollständige Ergebnis und das erste Abschlussdatum bleiben erhalten.
- Der gespeicherte Fortschritt ist eine Übersicht. Das Quiz beginnt beim erneuten Öffnen wie bisher von vorne.
- Frühere Abschlüsse können nicht rekonstruiert werden, weil sie vorher nicht gespeichert wurden.
- Kontodaten und Premiumstatus sind zunächst eine Anzeige. Änderungen an der E-Mail-Adresse sowie eigene Auswertungen für Quiz und Simulator folgen separat.
- Ältere Sitzungen erhalten keine persönliche Identität aus einem unbestätigten Cookie. Die einmalige erneute Anmeldung stellt die signierte Sitzung aus.
