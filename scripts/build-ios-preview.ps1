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
    # Test the real WebKit app on an available iPhone simulator, including Next's
    # client-side links; no account, purchase or production data is created.
    $iosDeviceJSON = (& xcrun simctl list devices available --json) -join [Environment]::NewLine
    if ($LASTEXITCODE -ne 0) { throw 'Simulator-Liste konnte nicht gelesen werden.' }
    $iosDeviceList = $iosDeviceJSON | ConvertFrom-Json
    $iosRuntime = $iosDeviceList.devices.PSObject.Properties |
        Where-Object { $_.Name -match 'SimRuntime\.iOS-' } |
        Sort-Object Name -Descending |
        Where-Object { @($_.Value | Where-Object { $_.isAvailable -and $_.name -like 'iPhone*' }).Count -gt 0 } |
        Select-Object -First 1
    if (-not $iosRuntime) { throw 'Kein verfügbarer iPhone-Simulator gefunden.' }
    $iosDevice = $iosRuntime.Value | Where-Object { $_.isAvailable -and $_.name -like 'iPhone*' } | Select-Object -First 1
    $iosUITestResult = Join-Path $mobileRoot ('DerivedData/WebsiteUITests-' + [Guid]::NewGuid().ToString('N') + '.xcresult')
    Write-Host ('iOS-Bedienprüfung: ' + $iosDevice.name + ' / ' + $iosRuntime.Name)
    # Wait for this exact simulator to finish booting before XCTest launches the app.
    if ($iosDevice.state -eq 'Shutdown') {
        Invoke-IOSProgram -Program 'xcrun' -ProgramArguments @('simctl', 'boot', $iosDevice.udid)
    }
    Invoke-IOSProgram -Program 'xcrun' -ProgramArguments @('simctl', 'bootstatus', $iosDevice.udid, '-b')
    Invoke-IOSProgram -Program 'xcodebuild' -ProgramArguments @(
        '-project', 'ios/App/App.xcodeproj', '-scheme', 'App',
        '-configuration', 'Debug', '-sdk', 'iphonesimulator', '-destination', ('platform=iOS Simulator,id=' + $iosDevice.udid),
        '-destination-timeout', '120', '-derivedDataPath', 'DerivedData',
        '-resultBundlePath', $iosUITestResult,
        '-parallel-testing-enabled', 'NO', '-test-timeouts-enabled', 'YES', '-maximum-test-execution-time-allowance', '180',
        'CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO', 'test'
    )
    Invoke-IOSProgram -Program 'ditto' -ProgramArguments @('-c', '-k', '--sequesterRsrc', '--keepParent', $iosSimulatorApp, (Join-Path $mobileRoot 'DerivedData/Jagdlatein-Simulator.zip'))
    [ordered]@{
        checkedAtUtc = [DateTime]::UtcNow.ToString('o')
        website = 'https://www.jagdlatein.de/'
        xcode = $iosXcodeVersion
        swiftTestsPassed = $true
        simulatorCompiled = $true
        simulatorUITestsPassed = $true
        simulatorDevice = $iosDevice.name
        simulatorRuntime = $iosRuntime.Name
        codeSigned = $false
        iphoneRuntimeTested = $false
        appStoreReady = $false
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $mobileRoot 'ios-preview-result.json') -Encoding utf8
    Write-Host 'Unsigned Simulator-Build erstellt. Noch keine installierbare iPhone- oder App-Store-Version.'
} finally {
    Pop-Location
}
