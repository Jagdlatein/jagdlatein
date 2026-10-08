[CmdletBinding()]
param(
    [string]$DerivedDataPath,
    [string]$OutputPath,
    [string]$RuntimeIdentifier
)

# Preparatory, unsigned native simulator captures only. No accounts, credentials,
# StoreKit purchases, signing, upload or changes to the public website.
$ErrorActionPreference = 'Stop'
if (-not $IsMacOS -or $PSVersionTable.PSVersion.Major -lt 7) {
    throw 'Echte iOS-Aufnahmen brauchen PowerShell 7 auf einem Mac mit Xcode; unter Windows kann nur der Helfer geprüft werden.'
}
foreach ($captureTool in @('xcodebuild','xcrun','plutil','node','git')) {
    if (-not (Get-Command $captureTool -ErrorAction SilentlyContinue)) { throw ('Werkzeug fehlt: ' + $captureTool) }
}
$captureProject = Split-Path -Parent $PSScriptRoot
$captureMobile = Join-Path $captureProject 'mobile'
if (-not $DerivedDataPath) { $DerivedDataPath = Join-Path $captureMobile 'DerivedData' }
$DerivedDataPath = [IO.Path]::GetFullPath($DerivedDataPath)
if (-not $OutputPath) { $OutputPath = Join-Path $DerivedDataPath 'StoreScreenshots' }
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $OutputPath) { throw 'Das Aufnahmeziel besteht bereits. Ein neues Ziel verwenden; bestehende Bilder werden nicht überschrieben.' }
$captureApp = Join-Path $DerivedDataPath 'Build/Products/Debug-iphonesimulator/App.app'
if (-not (Test-Path -LiteralPath $captureApp -PathType Container)) { throw 'Zuerst den bestehenden unsigned Simulator-Build ausführen.' }

function Invoke-CaptureProgram {
    param([string]$Program,[string[]]$ProgramArguments)
    & $Program @ProgramArguments
    if ($LASTEXITCODE -ne 0) { throw ('Aufnahmeprüfung fehlgeschlagen: ' + $Program) }
}
function Read-CaptureProgram {
    param([string]$Program,[string[]]$ProgramArguments)
    $captureText = (& $Program @ProgramArguments) -join [Environment]::NewLine
    if ($LASTEXITCODE -ne 0) { throw ('Aufnahme-Metadaten fehlen: ' + $Program) }
    return $captureText
}
function Read-CaptureNativeInfo {
    $captureInfo = (Read-CaptureProgram 'plutil' @('-convert','json','-o','-',(Join-Path $captureApp 'Info.plist'))) | ConvertFrom-Json
    if ($captureInfo.JagdlateinWebsiteEnvironment -cne 'Production' -or
        $captureInfo.CFBundleIdentifier -cne 'de.jagdlatein.preview' -or
        -not ($captureInfo.CFBundleShortVersionString -is [string]) -or
        -not ($captureInfo.CFBundleVersion -is [string])) {
        throw 'Nur der bestehende öffentliche, unsigned Preview-App-Build darf aufgenommen werden.'
    }
    return $captureInfo
}
function Read-CaptureSource {
    $captureSourceHead = (Read-CaptureProgram 'git' @('-C',$captureProject,'rev-parse','HEAD')).Trim()
    if ($captureSourceHead -notmatch '^[0-9a-f]{40}$') { throw 'Git-Quellstand kann nicht belegt werden.' }
    & git -C $captureProject diff --quiet
    $captureSourceDiff = $LASTEXITCODE
    & git -C $captureProject diff --cached --quiet
    $captureSourceStagedDiff = $LASTEXITCODE
    if ($captureSourceDiff -notin @(0,1) -or $captureSourceStagedDiff -notin @(0,1)) { throw 'Git-Änderungsstatus kann nicht gelesen werden.' }
    $captureSourceUntracked = Read-CaptureProgram 'git' @('-C',$captureProject,'ls-files','--others','--exclude-standard')
    return @{ head=$captureSourceHead; dirty=($captureSourceDiff -eq 1 -or $captureSourceStagedDiff -eq 1 -or -not [string]::IsNullOrWhiteSpace($captureSourceUntracked)) }
}

$captureXcode = Read-CaptureProgram 'xcodebuild' @('-version')
if ($captureXcode -notmatch 'Xcode (\d+)' -or [int]$Matches[1] -lt 26) { throw 'Xcode 26 oder neuer auswählen.' }
# Ask the selected Xcode for supported arguments. Never fall back to deprecated
# object exports or guess a CLI variant when this command is unavailable.
$captureExportHelp = Read-CaptureProgram 'xcrun' @('xcresulttool','help','export','attachments')
if ($captureExportHelp -notmatch '(?<!\S)--path\b' -or $captureExportHelp -notmatch '(?<!\S)--output-path\b') {
    throw 'Dieses xcresulttool bietet keinen geprüften Attachment-Export. CLI-Hilfe prüfen.'
}
$captureSource = Read-CaptureSource
if ($captureSource.dirty) { throw 'Native Aufnahmen benötigen einen sauberen, belegbaren Git-Quellstand.' }
$captureHead = $captureSource.head
$captureInfo = Read-CaptureNativeInfo
$captureRuntimeData = (Read-CaptureProgram 'xcrun' @('simctl','list','runtimes','--json')) | ConvertFrom-Json
$captureRuntimes = @($captureRuntimeData.runtimes | Where-Object {
    $_.isAvailable -eq $true -and $_.identifier -match '^com\.apple\.CoreSimulator\.SimRuntime\.iOS-' -and
    $_.version -match '^\d+(?:\.\d+){1,3}$' -and [Version]$_.version -ge [Version]'26.0'
})
if ($RuntimeIdentifier) { $captureRuntimes = @($captureRuntimes | Where-Object { $_.identifier -ceq $RuntimeIdentifier }) }
$captureRuntime = $captureRuntimes | Sort-Object { [Version]$_.version } -Descending | Select-Object -First 1
if (-not $captureRuntime -or $captureRuntime.identifier -notmatch '^com\.apple\.CoreSimulator\.SimRuntime\.iOS-[0-9-]+$') {
    throw 'Kein passendes verfügbares iOS-26+-Simulatorruntime gefunden.'
}
$captureTypeData = (Read-CaptureProgram 'xcrun' @('simctl','list','devicetypes','--json')) | ConvertFrom-Json
$captureTargets = @(
    @{ key='iphone16pro'; name='iPhone 16 Pro'; width=1206; height=2622 },
    @{ key='iphone16promax'; name='iPhone 16 Pro Max'; width=1320; height=2868 },
    @{ key='ipadpro13m4'; name='iPad Pro 13-inch (M4)'; width=2064; height=2752 }
)
foreach ($captureTarget in $captureTargets) {
    $captureTypes = @($captureTypeData.devicetypes | Where-Object { $_.name -ceq $captureTarget.name })
    if ($captureTypes.Count -ne 1 -or $captureTypes[0].identifier -notmatch '^com\.apple\.CoreSimulator\.SimDeviceType\.[A-Za-z0-9.-]+$') {
        throw ('Der exakte Simulator-Gerätetyp fehlt oder ist mehrdeutig: ' + $captureTarget.name)
    }
    $captureTarget.typeIdentifier = $captureTypes[0].identifier
}
$captureEvidence = Join-Path $DerivedDataPath ('StoreScreenshotEvidence-' + [Guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $captureEvidence)
$captureCreated = [Collections.Generic.List[string]]::new()
$captureEntries = [Collections.Generic.List[object]]::new()
$captureRunnerVariables = @('TEST_RUNNER_JL_PUBLIC_STORE_CAPTURE','TEST_RUNNER_JL_STORE_CAPTURE_WIDTH','TEST_RUNNER_JL_STORE_CAPTURE_HEIGHT')
$capturePreviousRunnerVariables = @{}
foreach ($captureVariable in $captureRunnerVariables) { $capturePreviousRunnerVariables[$captureVariable] = [Environment]::GetEnvironmentVariable($captureVariable) }
Push-Location -LiteralPath $captureMobile
try {
    foreach ($captureTarget in $captureTargets) {
        Write-Host ('Native Aufnahme: ' + $captureTarget.name + ', iOS ' + $captureRuntime.version + ', ' + $captureTarget.width + ' x ' + $captureTarget.height)
        $captureUDID = (Read-CaptureProgram 'xcrun' @('simctl','create',
            ('Jagdlatein capture ' + $captureTarget.key + ' ' + [Guid]::NewGuid().ToString('N')),
            $captureTarget.typeIdentifier,$captureRuntime.identifier)).Trim()
        if ($captureUDID -notmatch '^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$') { throw 'Neue Simulator-UUID ist ungültig.' }
        $captureCreated.Add($captureUDID)
        Invoke-CaptureProgram 'xcrun' @('simctl','boot',$captureUDID)
        Invoke-CaptureProgram 'xcrun' @('simctl','bootstatus',$captureUDID,'-b')
        Write-Host ('Aufnahme-Simulator bereit: ' + $captureTarget.name)
        Invoke-CaptureProgram 'xcrun' @('simctl','ui',$captureUDID,'appearance','light')
        # Apple's documented TEST_RUNNER_ prefix passes values solely to XCTest;
        # no test-only launch arguments or environment are injected into the app.
        [Environment]::SetEnvironmentVariable('TEST_RUNNER_JL_PUBLIC_STORE_CAPTURE','1')
        [Environment]::SetEnvironmentVariable('TEST_RUNNER_JL_STORE_CAPTURE_WIDTH',[string]$captureTarget.width)
        [Environment]::SetEnvironmentVariable('TEST_RUNNER_JL_STORE_CAPTURE_HEIGHT',[string]$captureTarget.height)
        $captureResult = Join-Path $captureEvidence ($captureTarget.key + '.xcresult')
        Invoke-CaptureProgram 'xcodebuild' @(
            '-project','ios/App/App.xcodeproj','-scheme','App','-configuration','Debug','-sdk','iphonesimulator',
            '-destination',('platform=iOS Simulator,id=' + $captureUDID),'-destination-timeout','120',
            '-derivedDataPath',$DerivedDataPath,'-resultBundlePath',$captureResult,
            '-only-testing:AppUITests/WebsiteAppUITests/testPreparatoryPublicHomepageStoreScreenshot',
            '-parallel-testing-enabled','NO','-test-timeouts-enabled','YES','-maximum-test-execution-time-allowance','180',
            'CODE_SIGNING_ALLOWED=NO','CODE_SIGNING_REQUIRED=NO','IOS_WEBSITE_ENVIRONMENT=Production','test'
        )
        $captureCurrentInfo = Read-CaptureNativeInfo
        Write-Host ('Nativer UI-Aufnahmetest abgeschlossen: ' + $captureTarget.name)
        if ($captureCurrentInfo.CFBundleShortVersionString -cne $captureInfo.CFBundleShortVersionString -or
            $captureCurrentInfo.CFBundleVersion -cne $captureInfo.CFBundleVersion) { throw 'Native App-Version änderte sich während der Aufnahme.' }
        $captureExport = Join-Path $captureEvidence ($captureTarget.key + '-attachments')
        Invoke-CaptureProgram 'xcrun' @('xcresulttool','export','attachments','--path',$captureResult,'--output-path',$captureExport)
        # Validate each actual export before spending time on the next device.
        # Unknown schemas remain rejected, with bounded redacted diagnostics.
        Invoke-CaptureProgram 'node' @('scripts/validate-store-screenshots.mjs',
            '--check-attachment-manifest',(Join-Path $captureExport 'manifest.json'))
        $captureEntries.Add([ordered]@{
            key=$captureTarget.key; deviceName=$captureTarget.name; deviceTypeIdentifier=$captureTarget.typeIdentifier
            simulatorUDID=$captureUDID; runtimeIdentifier=$captureRuntime.identifier; runtimeVersion=$captureRuntime.version
            width=$captureTarget.width; height=$captureTarget.height; exportDirectory=$captureExport
            attachmentName='Jagdlatein.Preparatory.PublicHomepage.jpeg'
            testIdentifier='WebsiteAppUITests/testPreparatoryPublicHomepageStoreScreenshot'
        })
        Invoke-CaptureProgram 'xcrun' @('simctl','shutdown',$captureUDID)
    }
    $captureFinalSource = Read-CaptureSource
    if ($captureFinalSource.dirty -or $captureFinalSource.head -cne $captureHead) { throw 'Der Git-Quellstand änderte sich während der Aufnahmen.' }
    $captureInput = Join-Path $captureEvidence 'capture-input.json'
    [ordered]@{
        schemaVersion=1; purpose='preparatory-not-release-1.0'; source='native-ios-simulator'
        website='https://jagdlatein.de/'; signedOut=$true; checkoutOpened=$false; codeSigned=$false; appStoreReady=$false
        gitHead=$captureHead; sourceDirty=$false; xcode=$captureXcode
        nativeAppVersion=$captureInfo.CFBundleShortVersionString; nativeBuildNumber=$captureInfo.CFBundleVersion
        bundleId=$captureInfo.CFBundleIdentifier; capturedAtUtc=[DateTime]::UtcNow.ToString('o'); captures=$captureEntries.ToArray()
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $captureInput -Encoding utf8
    Invoke-CaptureProgram 'node' @('scripts/validate-store-screenshots.mjs','--input',$captureInput,'--output',$OutputPath)
    Write-Host 'Drei echte öffentliche Simulator-Aufnahmen geprüft. Vorbereitung; kein freigegebener Produktionsbuild 1.0.'
} finally {
    Pop-Location
    foreach ($captureVariable in $captureRunnerVariables) {
        [Environment]::SetEnvironmentVariable($captureVariable,$capturePreviousRunnerVariables[$captureVariable])
    }
    # These are solely the fresh UUIDs created by this invocation. Never erase
    # or delete a shared simulator, another app installation or workspace files.
    foreach ($captureUDID in $captureCreated) {
        & xcrun simctl delete $captureUDID
        if ($LASTEXITCODE -ne 0) { Write-Warning ('Eigener Aufnahme-Simulator konnte nicht entfernt werden: ' + $captureUDID) }
    }
}
