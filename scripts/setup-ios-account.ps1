[CmdletBinding()]
param(
    [ValidateSet('Check', 'TestSql', 'CompleteDeletionSql', 'AppleRefundSql', 'ReviewLoginSql', 'LocalTests')]
    [string]$Step = 'Check',
    [switch]$NoClipboard,
    [string]$NodePath = 'node'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$migrationNames = @(
    '20261007105000_account_registration.sql',
    '20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql',
    '20261008120000_apple_refund_ordering.sql',
    '20261008140000_community_blocks.sql',
    '20261008150000_apple_review_login_rate_limits.sql',
    '20261008160000_community_premoderation.sql',
    '20261008170000_community_moderators.sql',
    '20261009210000_paypal_account_generation.sql',
    '20261009220000_complete_account_deletion.sql'
)
foreach ($name in $migrationNames) {
    if (!(Test-Path -LiteralPath (Join-Path $projectRoot ('supabase\migrations\' + $name)))) {
        throw ('Migration fehlt: ' + $name)
    }
}
if ($Step -eq 'Check') {
    Write-Host 'Konto-, Registrierungs- und Apple-Schema vorhanden. Noch nichts ausgefuehrt oder freigeschaltet.'
    Write-Host 'Testprojekt: Supabase xwkvrsuplytalwploebw; Vercel jagdlatein-sandbox.'
    Write-Host 'Apple braucht einen separaten In-App-Purchase-Schluessel; der TestFlight-Schluessel wird nicht verwendet.'
    return
}
if ($Step -eq 'LocalTests') {
    $previousRuntime = $env:JL_PAYPAL_TEST_PGLITE_PATH
    $runtimePath = if ($previousRuntime) { $previousRuntime } else {
        Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\paypal-sandbox\test-runtime\node_modules\@electric-sql\pglite'
    }
    if (!(Test-Path -LiteralPath (Join-Path $runtimePath 'package.json'))) {
        throw 'Isolierte SQL-Testbibliothek fehlt. Vorhandenen PGlite-Pfad mit JL_PAYPAL_TEST_PGLITE_PATH angeben oder setup-paypal-sandbox LocalTests vorbereiten.'
    }
    Push-Location -LiteralPath $projectRoot
    try {
        $env:JL_PAYPAL_TEST_PGLITE_PATH = $runtimePath
        & $NodePath --test scripts/test-account-generation.cjs scripts/test-account-registration.cjs scripts/test-account-deletion.cjs scripts/test-apple-subscriptions.cjs scripts/test-apple-review-policy.cjs scripts/test-apple-review-login.cjs scripts/test-community-blocks.cjs scripts/test-community-premoderation.cjs scripts/test-sandbox-checkout.cjs scripts/tests/paypal-sandbox-lifecycle.test.cjs
        if ($LASTEXITCODE -ne 0) { throw 'Lokale Konto- und Apple-Pruefungen fehlgeschlagen.' }
    } finally {
        $env:JL_PAYPAL_TEST_PGLITE_PATH = $previousRuntime
        Pop-Location
    }
    return
}
# Prepares source only. No database connection, email, payment, delete or secret
# operation is performed. Applying the complete migration can permanently purge
# provider records already marked deleted; it does not delete an active account.
# The operator must review affected counts and select the separate test project.
if ($Step -eq 'CompleteDeletionSql') {
    $bodies = foreach ($name in $migrationNames[-2..-1]) {
        $source = [IO.File]::ReadAllText((Join-Path $projectRoot ('supabase\migrations\' + $name)))
        $envelope = [regex]::Match($source, '(?s)\A(?:\s|--[^\r\n]*(?:\r?\n|\z))*BEGIN;\s*(?<body>.*?)\s*COMMIT;\s*\z')
        if (!$envelope.Success) { throw ('Unerwartete SQL-Transaktion: ' + $name) }
        $envelope.Groups['body'].Value
    }
    $sql = @('-- NUR getrennte, bereits vorbereitete Testdatenbank. Loeschflag bleibt aus.',
        '-- Betreiberpruefung: vorhandene Bindungen, Abhaengigkeiten und bereits geloescht markierte Datensaetze.',
        '-- Keine aktiven Konten werden geloescht. Markierte Zahlungsdaten koennen dauerhaft entfernt werden.',
        'BEGIN;', ($bodies -join [Environment]::NewLine), 'COMMIT;') -join [Environment]::NewLine
    $outputDirectory = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\ios-account'
    [IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
    $outputPath = Join-Path $outputDirectory 'complete-account-deletion.sql'
    [IO.File]::WriteAllText($outputPath, $sql, [Text.UTF8Encoding]::new($false))
    if (!$NoClipboard) { Set-Clipboard -Value $sql }
    Write-Host ('SQL zur Betreiberpruefung vorbereitet: ' + $outputPath)
    Write-Host 'Noch nicht ausgefuehrt. Bereits geloescht markierte Zahlungsdaten koennen dauerhaft entfernt werden.'
    return
}
if ($Step -in @('AppleRefundSql','ReviewLoginSql')) {
    $migrationFile = if ($Step -eq 'ReviewLoginSql') { '20261008150000_apple_review_login_rate_limits.sql' } else { '20261008120000_apple_refund_ordering.sql' }
    $outputFile = if ($Step -eq 'ReviewLoginSql') { 'apple-review-login-rate-limits.sql' } else { 'apple-refund-ordering.sql' }
    $source = [IO.File]::ReadAllText((Join-Path $projectRoot ('supabase\migrations\' + $migrationFile)))
    if ($Step -eq 'AppleRefundSql') {
        # Keep the current live-generation guard: the old refund migration alone
        # would replace it with the superseded detached-owner implementation.
        $schemaPrefix = [regex]::Match($source, '(?s)\A(?<prefix>.*?)CREATE OR REPLACE FUNCTION public\.apply_apple_subscription_snapshot\(p_snapshot jsonb\)')
        if (!$schemaPrefix.Success) { throw 'Apple-Erstattungsschema fehlt. Nichts kopiert.' }
        $source = [IO.File]::ReadAllText((Join-Path $projectRoot 'supabase\migrations\20261009220000_complete_account_deletion.sql'))
        $currentFunction = [regex]::Match($source, '(?s)CREATE OR REPLACE FUNCTION public\.apply_apple_subscription_snapshot\(p_snapshot jsonb\).*?GRANT EXECUTE ON FUNCTION public\.apply_apple_subscription_snapshot\(jsonb\) TO service_role;')
        if (!$currentFunction.Success) { throw 'Aktuelle Apple-Funktion fehlt. Nichts kopiert.' }
        $source = $schemaPrefix.Groups['prefix'].Value + $currentFunction.Value + "`r`nCOMMIT;"
    } else {
        # The standalone historical limiter must not remove the current
        # moderator exclusion when repeated after the complete schema setup.
        $currentReviewSource = [IO.File]::ReadAllText((Join-Path $projectRoot 'supabase\migrations\20261008170000_community_moderators.sql'))
        $currentReviewFunction = [regex]::Match($currentReviewSource, '(?s)CREATE OR REPLACE FUNCTION public\.reserve_apple_review_login_attempt\(.*?END \$\$;')
        if (!$currentReviewFunction.Success) { throw 'Aktuelle Review-Begrenzung fehlt. Nichts kopiert.' }
        $source = [regex]::Replace($source, 'COMMIT;\s*\z', '')
        $columnGuard = 'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = ''public.userprofile''::regclass AND attname = ''is_community_moderator'' AND NOT attisdropped) THEN RAISE EXCEPTION ''JL_REVIEW_SETUP: prepare the complete current test schema first''; END IF; END $$;'
        $source += $columnGuard + [Environment]::NewLine + $currentReviewFunction.Value + "`r`nCOMMIT;"
    }
    $sql = @('-- Jagdlatein: NUR getrennte Testdatenbank xwkvrsuplytalwploebw.',
        '-- Bestehende Apple-Kaeufe bleiben erhalten; keine Konten werden geloescht.',
        $source) -join [Environment]::NewLine
    $outputDirectory = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\ios-account'
    [IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
    $outputPath = Join-Path $outputDirectory $outputFile
    [IO.File]::WriteAllText($outputPath, $sql, [Text.UTF8Encoding]::new($false))
    if (!$NoClipboard) { Set-Clipboard -Value $sql }
    Write-Host ('Apple-SQL vorbereitet: ' + $outputPath)
    Write-Host 'Noch nicht ausgefuehrt. Nur im getrennten Supabase-Testprojekt verwenden.'
    return
}
$testPushBasePath = Join-Path $PSScriptRoot 'sql\ios-test-push-base.sql'
if (!(Test-Path -LiteralPath $testPushBasePath)) {
    throw 'Getrennte Testbasis fehlt: scripts/sql/ios-test-push-base.sql'
}
$sqlParts = @('-- Jagdlatein: NUR getrennte Testdatenbank xwkvrsuplytalwploebw.',
    '-- Erst nach Betreiberpruefung im Supabase SQL Editor ausfuehren. Keine aktiven Konten werden geloescht.',
    '-- Bereits geloescht markierte Apple-/PayPal-Datensaetze koennen dauerhaft entfernt werden.',
    '-- Die Loeschvorbereitung deaktiviert alte Push-Tokens ohne bekannte Kontozuordnung.')
$sqlParts += 'BEGIN;'
$sources = @($testPushBasePath)
foreach ($name in $migrationNames) {
    $sources += Join-Path $projectRoot ('supabase\migrations\' + $name)
}
foreach ($sourcePath in $sources) {
    $source = [IO.File]::ReadAllText($sourcePath)
    $envelope = [regex]::Match($source, '(?s)\A(?:\s|--[^\r\n]*(?:\r?\n|\z))*BEGIN;\s*(?<body>.*?)\s*COMMIT;\s*\z')
    if (!$envelope.Success) { throw ('Unerwartete SQL-Transaktion: ' + [IO.Path]::GetFileName($sourcePath)) }
    $sqlParts += $envelope.Groups['body'].Value
}
$sqlParts += 'COMMIT;'
$sql = $sqlParts -join [Environment]::NewLine
$outputDirectory = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\ios-account'
[IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
$outputPath = Join-Path $outputDirectory 'test-setup.sql'
[IO.File]::WriteAllText($outputPath, $sql, [Text.UTF8Encoding]::new($false))
if (!$NoClipboard) { Set-Clipboard -Value $sql }
Write-Host ('Test-SQL vorbereitet: ' + $outputPath)
Write-Host 'Noch nicht ausgefuehrt. Nur im getrennten Supabase-Testprojekt verwenden.'
