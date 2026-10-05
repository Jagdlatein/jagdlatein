[CmdletBinding()]
param(
    [ValidateSet('Prepare', 'Preview', 'Check', 'MacCheck', 'ReleaseCheck')]
    [string]$Step = 'Prepare'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot 'mobile'
if (-not (Test-Path -LiteralPath (Join-Path $mobileRoot 'package.json'))) {
    throw 'Das iOS-Projekt wurde nicht gefunden.'
}
$npmExecutable = if ($env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }
if (-not (Get-Command $npmExecutable -ErrorAction SilentlyContinue)) {
    throw 'Node.js und npm fehlen. Node.js 22 ab Version 22.12 installieren.'
}

function Invoke-MobileNpm {
    param([string[]]$NpmArguments)
    & $npmExecutable @NpmArguments
    if ($LASTEXITCODE -ne 0) {
        throw ('iOS-Schritt fehlgeschlagen: npm ' + ($NpmArguments -join ' '))
    }
}

Push-Location -LiteralPath $mobileRoot
try {
    if ($Step -eq 'Prepare') {
        Invoke-MobileNpm -NpmArguments @('ci', '--no-fund')
        Invoke-MobileNpm -NpmArguments @('run', 'ios:assets')
        Invoke-MobileNpm -NpmArguments @('run', 'build')
        Invoke-MobileNpm -NpmArguments @('test')
        Write-Host 'Website-basierte iOS-Entwicklungsversion vorbereitet. Noch kein signierter iPhone-Build.'
    } elseif ($Step -eq 'Preview') {
        Write-Host 'Website-Vorschau: http://127.0.0.1:4180/ -- mit Strg+C beenden.'
        Invoke-MobileNpm -NpmArguments @('run', 'preview')
    } elseif ($Step -eq 'Check') {
        Invoke-MobileNpm -NpmArguments @('run', 'build')
        Invoke-MobileNpm -NpmArguments @('test')
        Invoke-MobileNpm -NpmArguments @('audit', '--audit-level=moderate')
    } elseif ($Step -eq 'MacCheck') {
        & (Join-Path $PSScriptRoot 'build-ios-preview.ps1')
    } else {
        Invoke-MobileNpm -NpmArguments @('run', 'check:release')
    }
} finally {
    Pop-Location
}
