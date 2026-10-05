[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
if (-not (Get-Command xcodebuild -ErrorAction SilentlyContinue)) {
    throw 'Dieser Schritt braucht einen Mac mit Xcode. Unter Windows sind Prepare und Check verfügbar.'
}
$projectRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $projectRoot 'mobile'

function Invoke-IOSProgram {
    param([string]$Program, [string[]]$ProgramArguments)
    & $Program @ProgramArguments
    if ($LASTEXITCODE -ne 0) { throw ('iOS-Prüfung fehlgeschlagen: ' + $Program) }
}

Push-Location -LiteralPath $mobileRoot
try {
    $iosXcodeVersion = (& xcodebuild -version) -join [Environment]::NewLine
    if ($LASTEXITCODE -ne 0 -or $iosXcodeVersion -notmatch 'Xcode (\d+)' -or [int]$Matches[1] -lt 26) {
        throw 'Xcode 26 oder neuer auswählen, damit der aktuelle Apple-SDK verwendet wird.'
    }
    Invoke-IOSProgram -Program 'npm' -ProgramArguments @('ci', '--no-fund')
    Invoke-IOSProgram -Program 'npm' -ProgramArguments @('run', 'ios:assets')
    Invoke-IOSProgram -Program 'npm' -ProgramArguments @('run', 'build')
    Invoke-IOSProgram -Program 'npm' -ProgramArguments @('test')
    Invoke-IOSProgram -Program 'swift' -ProgramArguments @('test', '--package-path', 'core')
    Invoke-IOSProgram -Program 'xcodebuild' -ProgramArguments @(
        '-project', 'ios/App/App.xcodeproj', '-scheme', 'App',
        '-configuration', 'Debug', '-sdk', 'iphonesimulator',
        '-destination', 'generic/platform=iOS Simulator',
        '-derivedDataPath', 'DerivedData',
        'CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO', 'build'
    )
    $iosSimulatorApp = Join-Path $mobileRoot 'DerivedData/Build/Products/Debug-iphonesimulator/App.app'
    if (-not (Test-Path -LiteralPath $iosSimulatorApp)) { throw 'Simulator-App wurde nicht gefunden.' }
    Invoke-IOSProgram -Program 'ditto' -ProgramArguments @('-c', '-k', '--sequesterRsrc', '--keepParent', $iosSimulatorApp, (Join-Path $mobileRoot 'DerivedData/Jagdlatein-Simulator.zip'))
    [ordered]@{
        checkedAtUtc = [DateTime]::UtcNow.ToString('o')
        website = 'https://www.jagdlatein.de/'
        xcode = $iosXcodeVersion
        swiftTestsPassed = $true
        simulatorCompiled = $true
        codeSigned = $false
        iphoneRuntimeTested = $false
        appStoreReady = $false
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $mobileRoot 'ios-preview-result.json') -Encoding utf8
    Write-Host 'Unsigned Simulator-Build erstellt. Noch keine installierbare iPhone- oder App-Store-Version.'
} finally {
    Pop-Location
}
