[CmdletBinding()]
param(
    [ValidateSet('Check', 'TestSql', 'LocalTests')]
    [string]$Step = 'Check',
    [switch]$NoClipboard,
    [string]$NodePath = 'node'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$migrationNames = @(
    '20261007105000_account_registration.sql',
    '20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql'
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
        & $NodePath --test scripts/test-account-generation.cjs scripts/test-account-registration.cjs scripts/test-account-deletion.cjs scripts/test-apple-subscriptions.cjs
        if ($LASTEXITCODE -ne 0) { throw 'Lokale Konto- und Apple-Pruefungen fehlgeschlagen.' }
    } finally { Pop-Location }
    return
}
# Prepares source only. No database connection, email, payment, delete or secret
# operation is performed. The operator must select the separate test project.
$sqlParts = @('-- Jagdlatein: NUR getrennte Testdatenbank xwkvrsuplytalwploebw.',
    '-- Erst nach Pruefung im Supabase SQL Editor ausfuehren. Keine Konten werden geloescht.',
    '-- Die Loeschvorbereitung deaktiviert alte Push-Tokens ohne bekannte Kontozuordnung.')
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
