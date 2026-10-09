[CmdletBinding()]
param(
    [ValidateSet('Check', 'TestSql', 'AppleRefundSql', 'ReviewLoginSql', 'LocalTests')]
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
    '20261008160000_community_premoderation.sql'
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
    Push-Location -LiteralPath $projectRoot
    try {
        & $NodePath --test scripts/test-account-generation.cjs scripts/test-account-registration.cjs scripts/test-account-deletion.cjs scripts/test-apple-subscriptions.cjs scripts/test-apple-review-policy.cjs scripts/test-apple-review-login.cjs scripts/test-community-blocks.cjs scripts/test-community-premoderation.cjs
        if ($LASTEXITCODE -ne 0) { throw 'Lokale Konto- und Apple-Pruefungen fehlgeschlagen.' }
    } finally { Pop-Location }
    return
}
# Prepares source only. No database connection, email, payment, delete or secret
# operation is performed. The operator must select the separate test project.
if ($Step -in @('AppleRefundSql','ReviewLoginSql')) {
    $migrationFile = if ($Step -eq 'ReviewLoginSql') { '20261008150000_apple_review_login_rate_limits.sql' } else { '20261008120000_apple_refund_ordering.sql' }
    $outputFile = if ($Step -eq 'ReviewLoginSql') { 'apple-review-login-rate-limits.sql' } else { 'apple-refund-ordering.sql' }
    $sql = @('-- Jagdlatein: NUR getrennte Testdatenbank xwkvrsuplytalwploebw.',
        '-- Bestehende Apple-Kaeufe bleiben erhalten; keine Konten werden geloescht.',
        [IO.File]::ReadAllText((Join-Path $projectRoot ('supabase\migrations\' + $migrationFile)))) -join [Environment]::NewLine
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
    '-- Erst nach Pruefung im Supabase SQL Editor ausfuehren. Keine Konten werden geloescht.',
    '-- Die Loeschvorbereitung deaktiviert alte Push-Tokens ohne bekannte Kontozuordnung.')
$sqlParts += [IO.File]::ReadAllText($testPushBasePath)
foreach ($name in $migrationNames) {
    $sqlParts += [IO.File]::ReadAllText((Join-Path $projectRoot ('supabase\migrations\' + $name)))
}
$sql = $sqlParts -join [Environment]::NewLine
$outputDirectory = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\ios-account'
[IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
$outputPath = Join-Path $outputDirectory 'test-setup.sql'
[IO.File]::WriteAllText($outputPath, $sql, [Text.UTF8Encoding]::new($false))
if (!$NoClipboard) { Set-Clipboard -Value $sql }
Write-Host ('Test-SQL vorbereitet: ' + $outputPath)
Write-Host 'Noch nicht ausgefuehrt. Nur im getrennten Supabase-Testprojekt verwenden.'
