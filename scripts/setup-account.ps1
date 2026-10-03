[CmdletBinding()]
param(
    [ValidateSet('SessionSecret', 'DatabaseSql', 'StatisticsSql')]
    [string]$Step = 'SessionSecret'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

if ($Step -in @('DatabaseSql', 'StatisticsSql')) {
    $sqlFile = if ($Step -eq 'StatisticsSql') { '20261003160000_activity_results.sql' } else { '20261003_course_progress.sql' }
    $sqlPath = Join-Path $projectRoot "supabase\migrations\$sqlFile"
    Get-Content -LiteralPath $sqlPath -Raw -Encoding UTF8 | Set-Clipboard
    Write-Host 'Die SQL-Einrichtung liegt in der Zwischenablage. Im Supabase SQL Editor einfuegen und ausfuehren.'
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
