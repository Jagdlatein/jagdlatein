[CmdletBinding()]
param(
    [ValidateSet('Prepare', 'Create', 'Status')]
    [string]$Step = 'Prepare',
    [string]$ClientId = '',
    [string]$OutputDirectory = '',
    [string]$NodePath = 'node',
    [System.Security.SecureString]$Secret,
    [string]$ProductId = '',
    [string]$RegularPlanId = '',
    [string]$TrialPlanId = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoDirectory = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\', '/')
if (!$OutputDirectory) {
    $OutputDirectory = Join-Path ([System.Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\paypal-sandbox'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
if ($OutputDirectory -eq $repoDirectory -or $OutputDirectory.StartsWith($repoDirectory + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Sandbox-Vorbereitung und Werte muessen ausserhalb des Git-Projekts bleiben.'
}
if (($ProductId -or $RegularPlanId -or $TrialPlanId) -and $Step -ne 'Status') {
    throw 'Wiedergefundene IDs nur mit Status pruefen; sie sind kein neuer Anlageschritt.'
}
[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$statePath = Join-Path $OutputDirectory 'plans-state.json'
$reportPath = Join-Path $OutputDirectory 'plans-report.json'
$configPath = Join-Path $OutputDirectory 'config.json'
$lockPath = Join-Path $OutputDirectory '.plans-setup.lock'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$lock = $null
$ownsSecret = $false
$previousSetupSecret = $env:JL_SANDBOX_PLAN_SETUP_SECRET
$config = $null

function Write-PublicFile([string]$Path, [string]$Contents) {
    $temporaryPath = $Path + '.' + [guid]::NewGuid().ToString('N') + '.writing'
    try {
        [System.IO.File]::WriteAllText($temporaryPath, $Contents, $utf8)
        if ([System.IO.File]::Exists($Path)) {
            [System.IO.File]::Replace($temporaryPath, $Path, [System.Management.Automation.Language.NullString]::Value)
        } else {
            [System.IO.File]::Move($temporaryPath, $Path)
        }
    } finally {
        if ([System.IO.File]::Exists($temporaryPath)) { [System.IO.File]::Delete($temporaryPath) }
    }
}

try {
    $lock = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    if ([System.IO.File]::Exists($configPath)) {
        $config = [System.IO.File]::ReadAllText($configPath) | ConvertFrom-Json
        if ($config.apiBase -cne 'https://api-m.sandbox.paypal.com') { throw 'Die lokale Konfiguration ist keine PayPal-Sandbox.' }
        if (!$ClientId) { $ClientId = [string]$config.clientId }
        elseif ($config.clientId -and $config.clientId -cne $ClientId) { throw 'Die Client-ID passt nicht zur bestehenden Sandbox-Vorlage.' }
    }
    if (!$ClientId) { $ClientId = Read-Host 'Client-ID der SANDBOX-App in PayPal' }
    $ClientId = $ClientId.Trim()
    if ($ClientId -notmatch '^[A-Za-z0-9_-]{20,256}$') { throw 'Die vollstaendige Client-ID der Sandbox-App wird benoetigt.' }
    $nodeVersion = & $NodePath -p 'process.versions.node'
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^\d+\.' -or [int]($nodeVersion.Split('.')[0]) -lt 22) { throw 'Node 22 oder neuer wird benoetigt.' }
    $core = Join-Path $PSScriptRoot 'paypal-sandbox-plans.cjs'
    if (![System.IO.File]::Exists($core)) { throw 'Der Sandbox-Anlagehelfer fehlt im Projekt.' }
    $arguments = @($core, ('--' + $Step.ToLowerInvariant()), '--client-id', $ClientId, '--state-path', $statePath)
    foreach ($pair in @(@('--product-id', $ProductId), @('--regular-plan-id', $RegularPlanId), @('--trial-plan-id', $TrialPlanId))) {
        if ($pair[1]) { $arguments += $pair }
    }
    # Never reuse live environment variables or credentials from .env files.
    if ($Step -ne 'Prepare') {
        if (![System.IO.File]::Exists($statePath)) { throw 'Zuerst Prepare ausfuehren und die gespeicherten Bedingungen pruefen.' }
        if (!$Secret) {
            $ownsSecret = $true
            $Secret = Read-Host 'Secret derselben SANDBOX-App (Eingabe verborgen)' -AsSecureString
        }
        if (!$Secret.Length) { throw 'Das Secret der Sandbox-App fehlt.' }
        $secretPointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
        try { $env:JL_SANDBOX_PLAN_SETUP_SECRET = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) }
        finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    } else {
        $env:JL_SANDBOX_PLAN_SETUP_SECRET = $null
    }
    $output = & $NodePath @arguments
    $coreExit = $LASTEXITCODE
    try { $result = ($output -join "`n") | ConvertFrom-Json }
    catch { throw 'Der Sandbox-Helfer hat keine gueltige Antwort geliefert. Kein Antwortinhalt ausgegeben.' }
    if ($coreExit -ne 0) { throw ([string]$result.error) }
    Write-PublicFile $reportPath ($result | ConvertTo-Json -Depth 16)
    if ($Step -eq 'Prepare') {
        Write-Host 'Vorbereitet: eigenes Sandbox-Produkt und zwei Testtarife.'
        Write-Host 'Tarife: 5 EUR monatlich sowie einmal 3 Tage kostenlos, danach 5 EUR monatlich.'
        Write-Host 'Keine Einrichtungsgebuehren oder Steuerzuschlaege. Prepare sendet keine Anbieteranfrage.'
        if ($result.productId -or $result.regularPlanId -or $result.trialPlanId) {
            Write-Host 'Bereits gespeicherte Anbieterkennungen bleiben erhalten; Status prueft sie erneut bei PayPal.'
        } else {
            Write-Host 'Noch keine bestaetigten Anbieterkennungen gespeichert.'
        }
        Write-Host "Bedingungen pruefen: $statePath"
        Write-Host 'Create legt ausschliesslich diese Sandbox-Ressourcen an; es schliesst kein Abo ab.'
        return
    }
    Write-Host ('Sandbox-Pruefstatus: ' + $result.status)
    Write-Host ('Produkt: ' + $result.productId)
    Write-Host ('Monatsplan: ' + $result.regularPlanId)
    Write-Host ('Testplan: ' + $result.trialPlanId)
    if ($result.regularPlanId -and $result.trialPlanId) {
        $values = @(
            'PAYPAL_API_BASE=https://api-m.sandbox.paypal.com',
            ('PAYPAL_CLIENT_ID=' + $ClientId),
            ('NEXT_PUBLIC_PAYPAL_CLIENT_ID=' + $ClientId),
            ('NEXT_PUBLIC_PAYPAL_PLAN_ID=' + $result.regularPlanId),
            ('NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID=' + $result.trialPlanId),
            ('PAYPAL_PLAN_IDS=' + $result.regularPlanId + ',' + $result.trialPlanId),
            ('PAYPAL_TRIAL_PLAN_IDS=' + $result.trialPlanId)
        )
        Write-PublicFile (Join-Path $OutputDirectory 'paypal-values.txt') (($values -join "`r`n") + "`r`n")
        if ($null -ne $config) {
            $config.clientId = $ClientId
            $config.regularPlanId = $result.regularPlanId
            $config.trialPlanId = $result.trialPlanId
            Write-PublicFile $configPath ($config | ConvertTo-Json -Depth 12)
        }
        Write-Host ('Nicht geheime Werte fuer das getrennte Vercel-Testprojekt: ' + (Join-Path $OutputDirectory 'paypal-values.txt'))
    }
    Write-Host "Pruefbericht: $reportPath"
    Write-Host 'PayPal-Abo- und Zahlungstest stehen weiterhin aus. Ein Sandbox-Webhook benoetigt die separate Testadresse.'
} finally {
    $env:JL_SANDBOX_PLAN_SETUP_SECRET = $previousSetupSecret
    if ($ownsSecret -and $null -ne $Secret) { $Secret.Dispose() }
    if ($null -ne $lock) { $lock.Dispose() }
}
