[CmdletBinding()]
param(
    [ValidateSet('SessionSecret', 'DatabaseSql', 'StatisticsSql', 'RankedQuizSql', 'SubscriptionSql', 'TrialSubscriptionSql', 'CleanupCheck', 'CleanupDetails', 'SecureTablesSql', 'RemoveLegacyQuizSql', 'RemoveEmptyPaymentsSql', 'CleanupSql')]
    [string]$Step = 'SessionSecret'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

if ($Step -eq 'CleanupSql') {
    $cleanupBodies = foreach ($cleanupRelativePath in @(
        'supabase\maintenance\remove_legacy_quiz.sql',
        'supabase\maintenance\remove_empty_legacy_payments.sql'
    )) {
        $cleanupPart = Get-Content -LiteralPath (Join-Path $projectRoot $cleanupRelativePath) -Raw -Encoding UTF8
        $cleanupEnvelope = [regex]::Match($cleanupPart, '(?s)\A(?:\s|--[^\r\n]*(?:\r?\n|\z))*BEGIN;\s*(?<body>.*?)\s*COMMIT;\s*\z')
        if (!$cleanupEnvelope.Success) { throw "Unerwartete SQL-Transaktion in $cleanupRelativePath. Keine Bereinigung kopiert." }
        $cleanupEnvelope.Groups['body'].Value
    }
    $cleanupResultSql = @'
SELECT jsonb_build_object(
  'quiz_users_removed', to_regclass('public.quiz_users') IS NULL,
  'quiz_scores_removed', to_regclass('public.quiz_scores') IS NULL,
  'old_week_function_removed', to_regprocedure('public.get_week_scores()') IS NULL,
  'paymentlog_removed', to_regclass('public.paymentlog') IS NULL,
  'subscription_removed', to_regclass('public.subscription') IS NULL,
  'reserved_names', (SELECT count(*) FROM public.quiz_reserved_names),
  'accounts_present', to_regclass('public.userprofile') IS NOT NULL,
  'payments_present', to_regclass('public.paypal_subscription_payments') IS NOT NULL,
  'subscriptions_present', to_regclass('public.paypal_subscriptions') IS NOT NULL,
  'course_progress_present', to_regclass('public.course_progress') IS NOT NULL,
  'activity_results_present', to_regclass('public.activity_results') IS NOT NULL
) AS cleanup_result;
'@
    $cleanupSql = "-- MANUAL: confirmed legacy cleanup. Back up old quiz data before running.`r`nBEGIN;`r`n" +
        ($cleanupBodies -join "`r`n`r`n") + "`r`nCOMMIT;`r`n" + $cleanupResultSql
    Set-Clipboard -Value $cleanupSql
    Write-Host 'Die gepruefte Bereinigung liegt in der Zwischenablage: nur Altquiz, alte Wochenfunktion und die zwei leeren Zahlungstabellen.'
    Write-Host 'Nach Sicherung der Quiztabellen im Supabase SQL Editor einfuegen und ausfuehren. Alle Loeschschritte laufen gemeinsam in einer Transaktion.'
    Write-Host 'Das Ergebnis cleanup_result zeigt anschliessend den erreichten Zustand.'
    return
}

if ($Step -ne 'SessionSecret') {
    $sqlFile = switch ($Step) {
        'DatabaseSql' { 'supabase\migrations\20261003_course_progress.sql' }
        'StatisticsSql' { 'supabase\migrations\20261003160000_activity_results.sql' }
        'RankedQuizSql' { 'supabase\migrations\20261004100000_ranked_quiz.sql' }
        'SubscriptionSql' { 'supabase\migrations\20261004110000_subscription_access.sql' }
        'TrialSubscriptionSql' { 'supabase\migrations\20261004130000_subscription_trial.sql' }
        'CleanupCheck' { 'supabase\diagnostics\cleanup-preflight.sql' }
        'CleanupDetails' { 'supabase\diagnostics\legacy-cleanup-detail.sql' }
        'SecureTablesSql' { 'supabase\migrations\20261004120000_secure_private_tables.sql' }
        'RemoveLegacyQuizSql' { 'supabase\maintenance\remove_legacy_quiz.sql' }
        'RemoveEmptyPaymentsSql' { 'supabase\maintenance\remove_empty_legacy_payments.sql' }
    }
    $sqlPath = Join-Path $projectRoot $sqlFile
    Get-Content -LiteralPath $sqlPath -Raw -Encoding UTF8 | Set-Clipboard
    switch ($Step) {
        'CleanupCheck' {
            Write-Host 'Der rein lesende Datenbankcheck liegt in der Zwischenablage.'
            Write-Host 'Im Supabase SQL Editor einfuegen und ausfuehren. Das Ergebnis cleanup_report fuer die weitere Pruefung kopieren.'
        }
        'CleanupDetails' {
            Write-Host 'Die rein lesende Detailpruefung fuer den bestaetigten Altbestand liegt in der Zwischenablage.'
            Write-Host 'Im Supabase SQL Editor ausfuehren und das Ergebnis legacy_detail_report fuer die weitere Pruefung kopieren.'
        }
        'SecureTablesSql' {
            Write-Host 'Die Absicherung der Kontotabellen liegt in der Zwischenablage. Sie loescht keine Daten.'
            Write-Host 'Nach Pruefung der Abhaengigkeiten im Supabase SQL Editor einfuegen und ausfuehren.'
        }
        'RemoveLegacyQuizSql' {
            Write-Host 'Die manuelle Loeschdatei fuer quiz_users, quiz_scores und die exakt gepruefte alte Wochenfunktion liegt in der Zwischenablage.'
            Write-Host 'Erst nach erfolgreichem Datenbankcheck, neuer Ranglistenmigration und Sicherung dieser beiden Tabellen ausfuehren.'
        }
        'RemoveEmptyPaymentsSql' {
            Write-Host 'Die Loeschdatei fuer die bestaetigten leeren Zahlungstabellen paymentlog und subscription liegt in der Zwischenablage.'
            Write-Host 'Im Supabase SQL Editor ausfuehren. Bei Daten oder unbekannten Abhaengigkeiten wird nichts geloescht.'
        }
        default {
            Write-Host 'Die SQL-Einrichtung liegt in der Zwischenablage. Im Supabase SQL Editor einfuegen und ausfuehren.'
        }
    }
    return
}

$envPath = Join-Path $projectRoot '.env.local'
Push-Location -LiteralPath $projectRoot
try {
    git check-ignore --quiet -- .env.local
    if ($LASTEXITCODE -ne 0) { throw '.env.local muss von Git ausgeschlossen sein.' }
} finally {
    Pop-Location
}

$envText = if (Test-Path -LiteralPath $envPath) {
    [System.IO.File]::ReadAllText($envPath)
} else { '' }

$matchesForSecret = [regex]::Matches($envText, '(?m)^\s*JL_SESSION_SECRET\s*=\s*(.*?)\s*$')
if ($matchesForSecret.Count -gt 1) { throw 'JL_SESSION_SECRET ist mehrfach eingetragen. Bitte die lokalen Eintraege bereinigen.' }
if ($matchesForSecret.Count -eq 1) {
    $accountSecret = $matchesForSecret[0].Groups[1].Value.Trim().Trim('"').Trim("'")
    if ([System.Text.Encoding]::UTF8.GetByteCount($accountSecret) -lt 32) {
        throw 'Der vorhandene JL_SESSION_SECRET ist zu kurz. Den Eintrag entfernen und dieses Skript erneut starten.'
    }
} else {
    $randomBytes = New-Object byte[] 32
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($randomBytes) } finally { $generator.Dispose() }
    $accountSecret = [Convert]::ToBase64String($randomBytes)
    $separator = if ($envText.Length -gt 0 -and !$envText.EndsWith("`n")) { "`r`n" } else { '' }
    [System.IO.File]::AppendAllText($envPath, "$separator" + "JL_SESSION_SECRET=$accountSecret`r`n", (New-Object System.Text.UTF8Encoding($false)))
}

$env:JL_SESSION_SECRET = $accountSecret
Set-Clipboard -Value $accountSecret
$accountSecret = $null
$envText = $null
Write-Host 'Der Sitzungsschluessel ist lokal gespeichert und liegt in der Zwischenablage.'
Write-Host 'In Vercel unter Settings > Environment Variables als JL_SESSION_SECRET einfuegen (Production und bei Bedarf Preview).'
