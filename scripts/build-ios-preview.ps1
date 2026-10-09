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
    # Keep the same iPhone type and iOS 26.2 runtime as the existing baseline,
    # but isolate XCTest's launch/accessibility state in a fresh owned device.
    # The real public WebKit/payment/bookmark checks remain unchanged.
    $iosDeviceJSON = (& xcrun simctl list devices available --json) -join [Environment]::NewLine
    if ($LASTEXITCODE -ne 0) { throw 'Simulator-Liste konnte nicht gelesen werden.' }
    $iosDeviceList = $iosDeviceJSON | ConvertFrom-Json
    $iosRuntime = $iosDeviceList.devices.PSObject.Properties |
        Where-Object { $_.Name -ceq 'com.apple.CoreSimulator.SimRuntime.iOS-26-2' } |
        Where-Object { @($_.Value | Where-Object { $_.isAvailable -and $_.name -like 'iPhone*' }).Count -gt 0 } |
        Select-Object -First 1
    if (-not $iosRuntime) { throw 'Kein verfügbarer iPhone-Simulator mit iOS 26.2 gefunden.' }
    $iosDevice = $iosRuntime.Value | Where-Object { $_.isAvailable -and $_.name -like 'iPhone*' } | Select-Object -First 1
    $iosDeviceTypeJSON = (& xcrun simctl list devicetypes --json) -join [Environment]::NewLine
    if ($LASTEXITCODE -ne 0) { throw 'Simulator-Gerätetypen konnten nicht gelesen werden.' }
    $iosDeviceTypes = @((($iosDeviceTypeJSON | ConvertFrom-Json).devicetypes) | Where-Object { $_.name -ceq $iosDevice.name })
    if ($iosDeviceTypes.Count -ne 1 -or $iosDeviceTypes[0].identifier -notmatch '^com\.apple\.CoreSimulator\.SimDeviceType\.[A-Za-z0-9.-]+$') {
        throw 'Der ausgewählte iPhone-Gerätetyp fehlt oder ist mehrdeutig.'
    }
    $iosUITestResult = Join-Path $mobileRoot ('DerivedData/WebsiteUITests-' + [Guid]::NewGuid().ToString('N') + '.xcresult')
    $iosOwnedSimulatorId = ((& xcrun simctl create ('Jagdlatein UI ' + [Guid]::NewGuid().ToString('N')) $iosDeviceTypes[0].identifier $iosRuntime.Name) -join [Environment]::NewLine).Trim()
    if ($LASTEXITCODE -ne 0 -or $iosOwnedSimulatorId -notmatch '^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$') {
        throw 'Eigener UI-Simulator konnte nicht eindeutig erstellt werden.'
    }
    $iosSimulatorReleased = $false
    try {
        Write-Host ('iOS-Bedienprüfung: ' + $iosDevice.name + ' / ' + $iosRuntime.Name)
        Invoke-IOSProgram -Program 'xcrun' -ProgramArguments @('simctl', 'boot', $iosOwnedSimulatorId)
        Invoke-IOSProgram -Program 'xcrun' -ProgramArguments @('simctl', 'bootstatus', $iosOwnedSimulatorId, '-b')
        Invoke-IOSProgram -Program 'xcodebuild' -ProgramArguments @(
            '-project', 'ios/App/App.xcodeproj', '-scheme', 'App',
            '-configuration', 'Debug', '-sdk', 'iphonesimulator', '-destination', ('platform=iOS Simulator,id=' + $iosOwnedSimulatorId),
            '-destination-timeout', '120', '-derivedDataPath', 'DerivedData',
            '-resultBundlePath', $iosUITestResult,
            '-parallel-testing-enabled', 'NO', '-test-timeouts-enabled', 'YES', '-maximum-test-execution-time-allowance', '180',
            'CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO', 'test'
        )
    } finally {
        # Never remove a runner-provided/shared device. Cleanup must preserve a
        # failing test and its native exit code; delete is tried even if shutdown fails.
        $iosExitBeforeCleanup = $LASTEXITCODE
        try {
            & xcrun simctl shutdown $iosOwnedSimulatorId
            if ($LASTEXITCODE -ne 0) { Write-Warning 'Eigener UI-Simulator konnte nicht angehalten werden; Entfernen wird trotzdem versucht.' -WarningAction Continue }
        } catch { Write-Warning 'Eigener UI-Simulator konnte nicht angehalten werden; Entfernen wird trotzdem versucht.' -WarningAction Continue }
        try {
            & xcrun simctl delete $iosOwnedSimulatorId
            $iosSimulatorReleased = $LASTEXITCODE -eq 0
            if (-not $iosSimulatorReleased) { Write-Warning 'Eigener UI-Simulator konnte nicht entfernt werden.' -WarningAction Continue }
        } catch { Write-Warning 'Eigener UI-Simulator konnte nicht entfernt werden.' -WarningAction Continue }
        $global:LASTEXITCODE = $iosExitBeforeCleanup
    }
    if (-not $iosSimulatorReleased) { throw 'Eigener UI-Simulator blieb nach erfolgreicher Prüfung bestehen.' }
    Invoke-IOSProgram -Program 'ditto' -ProgramArguments @('-c', '-k', '--sequesterRsrc', '--keepParent', $iosSimulatorApp, (Join-Path $mobileRoot 'DerivedData/Jagdlatein-Simulator.zip'))
    [ordered]@{
        checkedAtUtc = [DateTime]::UtcNow.ToString('o')
        website = 'https://www.jagdlatein.de/'
        xcode = $iosXcodeVersion
        swiftTestsPassed = $true
        simulatorCompiled = $true
        simulatorUITestsPassed = $true
        simulatorDevice = $iosDevice.name
        simulatorDeviceId = $iosOwnedSimulatorId
        simulatorDeviceReleased = $iosSimulatorReleased
        simulatorRuntime = $iosRuntime.Name
        codeSigned = $false
        iphoneRuntimeTested = $false
        appStoreReady = $false
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $mobileRoot 'ios-preview-result.json') -Encoding utf8
    Write-Host 'Unsigned Simulator-Build erstellt. Noch keine installierbare iPhone- oder App-Store-Version.'
} finally {
    Pop-Location
}
