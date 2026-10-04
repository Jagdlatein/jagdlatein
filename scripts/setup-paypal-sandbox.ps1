[CmdletBinding()]
param(
    [ValidateSet('Prepare', 'Check', 'LocalTests', 'TestDatabaseSql')]
    [string]$Step = 'Check',
    [string]$OutputDirectory = '',
    [string]$NodePath = 'node',
    [switch]$Online,
    [switch]$InstallTestRuntime,
    [switch]$NoClipboard,
    [System.Security.SecureString]$PayPalSecret,
    [System.Security.SecureString]$TestDatabaseKey
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoDirectory = Split-Path -Parent $PSScriptRoot
if (!$OutputDirectory) {
    $OutputDirectory = Join-Path ([System.Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\paypal-sandbox'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
$repoFullPath = [System.IO.Path]::GetFullPath($repoDirectory).TrimEnd('\', '/')
if ($OutputDirectory -eq $repoFullPath -or $OutputDirectory.StartsWith($repoFullPath + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Die Sandbox-Konfiguration muss ausserhalb des Git-Projekts gespeichert werden.'
}
[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$configPath = Join-Path $OutputDirectory 'config.json'
$reportPath = Join-Path $OutputDirectory 'check-report.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)

function Save-PendingReport([string]$Reason) {
    $report = [ordered]@{
        checkedAt = [datetimeoffset]::UtcNow.ToString('o')
        mode = 'local-prerequisites-only'
        setup = 'pending'
        providerLifecycle = 'pending'
        paymentsCreated = 0
        databaseWrites = 0
        reason = $Reason
    }
    [System.IO.File]::WriteAllText($reportPath, ($report | ConvertTo-Json), $utf8)
    Write-Host $Reason
    Write-Host "Pruefbericht: $reportPath"
}

if ($Step -eq 'Prepare') {
    if ([System.IO.File]::Exists($configPath)) {
        Write-Host "Vorhandene Vorlage bleibt erhalten: $configPath"
        return
    }
    $config = [ordered]@{
        version = 1
        apiBase = 'https://api-m.sandbox.paypal.com'
        testUrl = ''
        publicUrl = 'https://jagdlatein.vercel.app'
        testSupabaseUrl = ''
        publicSupabaseUrl = ''
        clientId = ''
        regularPlanId = ''
        trialPlanId = ''
        webhookId = ''
        separateDatabaseConfirmed = $false
        mailSinkConfirmed = $false
    }
    [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), $utf8)
    Save-PendingReport 'Vorlage vorbereitet. Noch keine getrennte Testumgebung eingerichtet und kein PayPal-Aufruf ausgefuehrt.'
    Write-Host "Die nicht geheime Konfiguration ausfuellen: $configPath"
    Write-Host 'Anleitung: docs\paypal-sandbox-pruefung.md. Live-Konfiguration bleibt unveraendert.'
    return
}

if ($Step -in @('Check', 'TestDatabaseSql') -and ![System.IO.File]::Exists($configPath)) {
    Save-PendingReport 'Noch keine getrennte Testumgebung konfiguriert. Zuerst -Step Prepare ausfuehren.'
    return
}
try { $nodeVersion = & $NodePath -p 'process.versions.node' }
catch { throw 'Node 22 fehlt. NodePath kann auf eine vorhandene node.exe aus Node 22 zeigen.' }
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^\d+\.' -or [int]($nodeVersion.Split('.')[0]) -lt 22) { throw 'Node 22 oder neuer wird benoetigt.' }
if ($Step -eq 'LocalTests' -and $nodeVersion -notmatch '^22\.') { throw 'Fuer die reproduzierbaren lokalen Pruefungen Node 22 verwenden.' }

if ($Step -eq 'LocalTests') {
    $runtimeDirectory = Join-Path $OutputDirectory 'test-runtime'
    $pgliteDirectory = Join-Path $runtimeDirectory 'node_modules\@electric-sql\pglite'
    if (![System.IO.File]::Exists((Join-Path $pgliteDirectory 'package.json'))) {
        if (!$InstallTestRuntime) {
            throw 'Isolierte Testbibliothek fehlt. Einmal LocalTests mit -InstallTestRuntime ausfuehren; es wird nur PostgreSQL fuer lokale Tests vorbereitet.'
        }
        $nodeResolved = (Get-Command $NodePath -ErrorAction Stop).Source
        $npmPath = Join-Path (Split-Path -Parent $nodeResolved) 'npm.cmd'
        if (![System.IO.File]::Exists($npmPath)) { throw 'npm.cmd muss neben der Node-22-node.exe vorhanden sein.' }
        & $npmPath install --prefix $runtimeDirectory --no-audit --no-fund --ignore-scripts --package-lock=false '@electric-sql/pglite@0.3.14'
        if ($LASTEXITCODE -ne 0) { throw 'Die isolierte lokale PostgreSQL-Testbibliothek konnte nicht installiert werden.' }
    }
    $previousRuntime = $env:JL_PAYPAL_TEST_PGLITE_PATH
    try {
        $env:JL_PAYPAL_TEST_PGLITE_PATH = $pgliteDirectory
        $testOutput = & $NodePath --test (Join-Path $PSScriptRoot 'test-paypal-sandbox-guards.cjs') (Join-Path $PSScriptRoot 'tests\paypal-sandbox-lifecycle.test.cjs')
        $testExit = $LASTEXITCODE
        $testOutput | Write-Host
        $testsPassed = [regex]::Match(($testOutput -join "`n"), '(?m)^# pass (\d+)\r?$')
        $localReport = [ordered]@{
            checkedAt = [datetimeoffset]::UtcNow.ToString('o')
            mode = 'isolated-local-app-and-postgresql'
            result = if ($testExit -eq 0 -and $testsPassed.Success) { 'passed' } else { 'failed' }
            testsPassed = if ($testsPassed.Success) { [int]$testsPassed.Groups[1].Value } else { 0 }
            paypalResponses = 'simulated'
            providerLifecycle = 'pending'
            remotePaymentsCreated = 0
            remoteDatabaseWrites = 0
        }
        [System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'local-tests-report.json'), ($localReport | ConvertTo-Json), $utf8)
        if ($testExit -ne 0 -or !$testsPassed.Success) { throw 'Lokale PayPal-Vertragspruefungen fehlgeschlagen.' }
        Write-Host 'Lokale App-Routen und echte SQL-Migrationen geprueft. PayPal-Antworten sind simuliert; kein Anbieter-Zahlungsnachweis.'
    } finally { $env:JL_PAYPAL_TEST_PGLITE_PATH = $previousRuntime }
    return
}

$validation = & $NodePath (Join-Path $PSScriptRoot 'paypal-sandbox-check.cjs') --validate $configPath 2>&1
if ($LASTEXITCODE -ne 0) {
    Save-PendingReport 'Sandbox-Voraussetzungen fehlen oder die Isolation ist nicht bestaetigt. Keine Zugangsdaten abgefragt und keine Netzwerkaufrufe ausgefuehrt.'
    Write-Host ($validation | Out-String).Trim()
    return
}
if ($Step -eq 'TestDatabaseSql') {
    $sqlBodies = foreach ($relative in @(
        'supabase\test-only\paypal-sandbox-bootstrap.sql',
        'supabase\migrations\20261003_course_progress.sql',
        'supabase\migrations\20261003160000_activity_results.sql',
        'supabase\migrations\20261004100000_ranked_quiz.sql',
        'supabase\migrations\20261004110000_subscription_access.sql',
        'supabase\migrations\20261004120000_secure_private_tables.sql',
        'supabase\migrations\20261004130000_subscription_trial.sql',
        'supabase\migrations\20261004190000_learning_community.sql'
    )) {
        $sql = [System.IO.File]::ReadAllText((Join-Path $repoDirectory $relative))
        $envelope = [regex]::Match($sql, '(?s)\A(?:\s|--[^\r\n]*(?:\r?\n|\z))*BEGIN;\s*(?<body>.*?)\s*COMMIT;\s*\z')
        if (!$envelope.Success) { throw "Unerwartete SQL-Transaktion in $relative. Nichts kopiert." }
        $envelope.Groups['body'].Value
    }
    $config = [System.IO.File]::ReadAllText($configPath) | ConvertFrom-Json
    $bundle = '-- SANDBOX ONLY. Run in the NEW EMPTY test project: ' + $config.testSupabaseUrl + "`r`nBEGIN;`r`n" +
        ($sqlBodies -join "`r`n`r`n") + "`r`nCOMMIT;`r`n"
    [System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'test-database.sql'), $bundle, $utf8)
    if (!$NoClipboard) { Set-Clipboard -Value $bundle }
    Write-Host ('Testschema gespeichert: ' + (Join-Path $OutputDirectory 'test-database.sql'))
    if (!$NoClipboard) { Write-Host 'Testschema liegt auch in der Zwischenablage.' }
    Write-Host 'Nur im neuen, leeren Supabase-TEST-Projekt ausfuehren.'
    Write-Host 'Kein Datenbankaufruf ausgefuehrt. Der SQL-Text lehnt vorhandene Tabellen ab und kopiert keine Kundendaten.'
    return
}
if (!$Online) {
    Save-PendingReport 'Isolierte Ziele lokal geprueft. Rein lesende Anbieterpruefung steht aus; dazu Check mit -Online verwenden.'
    return
}

$ownsPayPalSecret = $false
$ownsDatabaseKey = $false
$previousPayPalSecret = $env:JL_SANDBOX_PAYPAL_SECRET
$previousDatabaseKey = $env:JL_SANDBOX_DATABASE_KEY
try {
    if (!$PayPalSecret) { $ownsPayPalSecret = $true; $PayPalSecret = Read-Host 'Secret derselben SANDBOX-App (verborgen)' -AsSecureString }
    if (!$TestDatabaseKey) { $ownsDatabaseKey = $true; $TestDatabaseKey = Read-Host 'Service-Role-Key NUR der getrennten TEST-Datenbank (verborgen)' -AsSecureString }
    if (!$PayPalSecret.Length -or !$TestDatabaseKey.Length) { throw 'Sandbox-Secret und Testdatenbankschluessel duerfen nicht leer sein.' }
    $payPalPointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PayPalSecret)
    try { $env:JL_SANDBOX_PAYPAL_SECRET = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($payPalPointer) }
    finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($payPalPointer) }
    $databasePointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($TestDatabaseKey)
    try { $env:JL_SANDBOX_DATABASE_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($databasePointer) }
    finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($databasePointer) }
    & $NodePath (Join-Path $PSScriptRoot 'paypal-sandbox-check.cjs') --check $configPath $reportPath
    if ($LASTEXITCODE -ne 0) {
        Save-PendingReport 'Rein lesende Sandbox-Anbieterpruefung noch nicht erfolgreich. Live-Einstellungen unveraendert.'
        throw 'Sandbox-Pruefung nicht bestanden.'
    }
    Write-Host "Pruefbericht ohne Secrets oder Kundendaten: $reportPath"
} finally {
    $env:JL_SANDBOX_PAYPAL_SECRET = $previousPayPalSecret
    $env:JL_SANDBOX_DATABASE_KEY = $previousDatabaseKey
    if ($ownsPayPalSecret -and $null -ne $PayPalSecret) { $PayPalSecret.Dispose() }
    if ($ownsDatabaseKey -and $null -ne $TestDatabaseKey) { $TestDatabaseKey.Dispose() }
}
