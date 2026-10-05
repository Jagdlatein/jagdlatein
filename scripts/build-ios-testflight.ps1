[CmdletBinding()]
param(
    [ValidateSet('Check', 'DeviceArchive', 'Export', 'Upload')]
    [string]$Step = 'Check',
    [string]$IpaPath
)

# Four distinct operations: Check reads source only; DeviceArchive is unsigned;
# Export signs an installable distribution IPA but does not upload it; Upload
# is an explicit Apple upload. None registers credentials, grants testers
# access, submits an App Store review, or changes the public website.
$ErrorActionPreference = 'Stop'
$iosProjectRoot = Split-Path -Parent $PSScriptRoot
$iosMobileRoot = Join-Path $iosProjectRoot 'mobile'
$iosProject = Join-Path $iosMobileRoot 'ios/App/App.xcodeproj'
$iosProfileHelper = Join-Path $iosMobileRoot 'scripts/testflight-profile.mjs'
$iosDeviceArchive = Join-Path $iosMobileRoot 'DerivedData/TestFlightDevice.xcarchive'
$iosSignedArchive = Join-Path $iosMobileRoot 'DerivedData/TestFlightSigned.xcarchive'
$iosExportDirectory = Join-Path $iosMobileRoot 'DerivedData/TestFlightExport'
$iosNpmProgram = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }

function Invoke-IOSPublicProgram {
    param([string]$Program, [string[]]$ProgramArguments)
    & $Program @ProgramArguments | Out-Host
    if ($LASTEXITCODE -ne 0) { throw ('iOS-Schritt fehlgeschlagen: ' + $Program) }
}

function Invoke-IOSPrivateProgram {
    param([string]$Program, [string[]]$ProgramArguments, [switch]$Capture)
    # Native errors may contain command arguments. Do not echo either stream
    # for tools that handle a private key, certificate password or keychain.
    try { $iosPrivateOutput = & $Program @ProgramArguments 2>&1 }
    catch { throw ('Vertraulicher iOS-Schritt fehlgeschlagen: ' + [IO.Path]::GetFileName($Program)) }
    if ($LASTEXITCODE -ne 0) { throw ('Vertraulicher iOS-Schritt fehlgeschlagen: ' + [IO.Path]::GetFileName($Program)) }
    if ($Capture) { return (($iosPrivateOutput | ForEach-Object { [string]$_ }) -join [Environment]::NewLine) }
}

function Assert-IOSMac {
    if ($PSVersionTable.PSVersion.Major -lt 7 -or -not $IsMacOS) { throw 'DeviceArchive, Export und Upload benötigen den Mac-Builddienst mit PowerShell 7 und Xcode.' }
    foreach ($iosTool in @('xcodebuild', 'xcrun', 'security', 'codesign', 'plutil', 'ditto', 'node')) {
        if (-not (Get-Command $iosTool -ErrorAction SilentlyContinue)) { throw ('Mac-Werkzeug fehlt: ' + $iosTool) }
    }
    $iosVersionOutput = (& xcodebuild -version) -join [Environment]::NewLine
    if ($LASTEXITCODE -ne 0 -or $iosVersionOutput -notmatch 'Xcode (\d+)' -or [int]$Matches[1] -lt 26) { throw 'Xcode 26 oder neuer auswählen.' }
}

function Get-IOSMetadata {
    param([switch]$RequireApple, [switch]$ForUpload)
    $iosTeam = [Environment]::GetEnvironmentVariable('IOS_TEAM_ID')
    $iosBundle = [Environment]::GetEnvironmentVariable('IOS_BUNDLE_ID')
    $iosBuild = [Environment]::GetEnvironmentVariable('IOS_BUILD_NUMBER')
    $iosVersion = [Environment]::GetEnvironmentVariable('IOS_MARKETING_VERSION')
    if (-not $iosVersion -and -not $ForUpload) { $iosVersion = '0.1.0' }
    if (-not $RequireApple) {
        if (-not $iosBundle) { $iosBundle = 'de.jagdlatein.preview' }
        if (-not $iosBuild) { $iosBuild = '1' }
    }
    if ($RequireApple -and $iosTeam -notmatch '^[A-Z0-9]{10}$') { throw 'IOS_TEAM_ID muss die zehnstellige Apple-Team-ID enthalten.' }
    if ($iosBundle -notmatch '^[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)+$') { throw 'IOS_BUNDLE_ID muss die registrierte feste Bundle-ID enthalten.' }
    if ($RequireApple -and $iosBundle -eq 'de.jagdlatein.preview') { throw 'Für TestFlight zuerst eine endgültige Bundle-ID bei Apple registrieren.' }
    if ((-not $ForUpload -or $iosBuild) -and $iosBuild -notmatch '^[1-9][0-9]{0,3}(?:\.[0-9]{1,2}){0,2}$') { throw 'IOS_BUILD_NUMBER muss eine neue positive Apple-Build-Nummer wie 2 oder 2.1 enthalten (maximal 4/2/2 Ziffern).' }
    if ((-not $ForUpload -or $iosVersion) -and $iosVersion -notmatch '^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,2}$') { throw 'IOS_MARKETING_VERSION muss eine Version wie 0.1.0 enthalten.' }
    return @{ team = $iosTeam; bundle = $iosBundle; build = $iosBuild; version = $iosVersion }
}

function New-IOSPrivateDirectory {
    $iosTempRoot = if ($env:RUNNER_TEMP) { [IO.Path]::GetFullPath($env:RUNNER_TEMP) } else { [IO.Path]::GetFullPath([IO.Path]::GetTempPath()) }
    $iosTempDirectory = Join-Path $iosTempRoot ('jagdlatein-signing-' + [Guid]::NewGuid().ToString('N'))
    if (Test-Path -LiteralPath $iosTempDirectory) { throw 'Temporäres Signierungsverzeichnis existiert bereits.' }
    New-Item -ItemType Directory -Path $iosTempDirectory | Out-Null
    Invoke-IOSPrivateProgram -Program '/bin/chmod' -ProgramArguments @('700', $iosTempDirectory)
    return $iosTempDirectory
}

function Remove-IOSPrivateDirectory {
    param([string]$Directory)
    if (-not $Directory -or -not (Test-Path -LiteralPath $Directory)) { return }
    # Delete only this invocation's exclusive random directory, after verifying
    # its absolute location under the actual runner/system temporary directory.
    $iosTempRoot = if ($env:RUNNER_TEMP) { [IO.Path]::GetFullPath($env:RUNNER_TEMP) } else { [IO.Path]::GetFullPath([IO.Path]::GetTempPath()) }
    $iosFullDirectory = [IO.Path]::GetFullPath($Directory)
    if ([IO.Path]::GetDirectoryName($iosFullDirectory).TrimEnd([IO.Path]::DirectorySeparatorChar) -ne $iosTempRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) -or [IO.Path]::GetFileName($iosFullDirectory) -notmatch '^jagdlatein-signing-[a-f0-9]{32}$') { throw 'Temporäres Löschziel liegt außerhalb des vorgesehenen Verzeichnisses.' }
    Remove-Item -LiteralPath $iosFullDirectory -Recurse -Force
}

function Write-IOSProfileXML {
    param([string]$Profile, [string]$Destination)
    $iosProfileXML = Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('cms', '-D', '-i', $Profile) -Capture
    if ($iosProfileXML -notmatch '<plist') { throw 'Apple-Profil konnte nicht sicher gelesen werden.' }
    [IO.File]::WriteAllText($Destination, $iosProfileXML, [Text.UTF8Encoding]::new($false))
}

function Get-IOSProfile {
    param([string]$ProfileXML, [hashtable]$Metadata)
    $iosProfileJSON = Invoke-IOSPrivateProgram -Program 'node' -ProgramArguments @($iosProfileHelper, 'profile', $ProfileXML, $Metadata.team, $Metadata.bundle) -Capture
    return $iosProfileJSON | ConvertFrom-Json
}

function Assert-IOSApp {
    param([string]$App, [hashtable]$Metadata, [string]$TemporaryDirectory, [switch]$Signed, [object]$ExpectedProfile)
    if (-not (Test-Path -LiteralPath (Join-Path $App 'Info.plist') -PathType Leaf)) { throw 'Gerätearchiv enthält keine App mit Info.plist.' }
    $iosInfoXML = Join-Path $TemporaryDirectory 'app-info.plist'
    Invoke-IOSPrivateProgram -Program 'plutil' -ProgramArguments @('-convert', 'xml1', '-o', $iosInfoXML, (Join-Path $App 'Info.plist'))
    if ($Signed) {
        Invoke-IOSPrivateProgram -Program 'codesign' -ProgramArguments @('--verify', '--deep', '--strict', $App)
        $iosEmbeddedProfile = Join-Path $App 'embedded.mobileprovision'
        if (-not (Test-Path -LiteralPath $iosEmbeddedProfile -PathType Leaf)) { throw 'Signierte App enthält kein Apple-Profil.' }
        $iosEmbeddedXML = Join-Path $TemporaryDirectory 'embedded-profile.plist'
        Write-IOSProfileXML -Profile $iosEmbeddedProfile -Destination $iosEmbeddedXML
        $iosEmbedded = Get-IOSProfile -ProfileXML $iosEmbeddedXML -Metadata $Metadata
        if ($ExpectedProfile -and ($iosEmbedded.uuid -ne $ExpectedProfile.uuid -or $iosEmbedded.certificateSha1 -ne $ExpectedProfile.certificateSha1)) { throw 'Exportiertes Apple-Profil stimmt nicht mit dem geprüften Profil überein.' }
        $iosEntitlementsXML = Join-Path $TemporaryDirectory 'app-entitlements.plist'
        # codesign writes the plist to stdout and descriptive text to stderr.
        $iosEntitlements = (& codesign -d --entitlements :- $App 2>$null) -join [Environment]::NewLine
        if ($LASTEXITCODE -ne 0 -or $iosEntitlements -notmatch '<plist') { throw 'App-Signierungsrechte konnten nicht geprüft werden.' }
        [IO.File]::WriteAllText($iosEntitlementsXML, $iosEntitlements, [Text.UTF8Encoding]::new($false))
        $iosCertificatePrefix = Join-Path $TemporaryDirectory 'app-certificate-'
        Invoke-IOSPrivateProgram -Program 'codesign' -ProgramArguments @('-d', '--extract-certificates', $iosCertificatePrefix, $App)
        $iosSigningCertificate = $iosCertificatePrefix + '0'
        if (-not (Test-Path -LiteralPath $iosSigningCertificate -PathType Leaf)) { throw 'App-Verteilungszertifikat konnte nicht geprüft werden.' }
        $iosCertBytes = [IO.File]::ReadAllBytes($iosSigningCertificate)
        $iosCertHash = [Convert]::ToHexString([Security.Cryptography.SHA1]::HashData($iosCertBytes))
        if ($iosCertHash -ne $iosEmbedded.certificateSha1) { throw 'App wurde nicht mit dem Zertifikat ihres Apple-Profils signiert.' }
        $iosAppJSON = Invoke-IOSPrivateProgram -Program 'node' -ProgramArguments @($iosProfileHelper, 'signed', $iosInfoXML, $Metadata.team, $Metadata.bundle, $Metadata.build, $Metadata.version, $iosEntitlementsXML, $iosEmbeddedXML) -Capture
    } else {
        $iosAppJSON = Invoke-IOSPrivateProgram -Program 'node' -ProgramArguments @($iosProfileHelper, 'device', $iosInfoXML, '', $Metadata.bundle, $Metadata.build, $Metadata.version) -Capture
    }
    return $iosAppJSON | ConvertFrom-Json
}

function Expand-IOSCheckedIPA {
    param([string]$Source, [string]$Destination)
    if (-not (Test-Path -LiteralPath $Source -PathType Leaf) -or [IO.Path]::GetExtension($Source) -ne '.ipa') { throw 'Eine vorhandene IPA-Datei angeben.' }
    $iosZip = [IO.Compression.ZipFile]::OpenRead($Source)
    try {
        foreach ($iosEntry in $iosZip.Entries) {
            if ($iosEntry.FullName.StartsWith('/') -or $iosEntry.FullName.Contains('\') -or $iosEntry.FullName -match '(^|/)\.\.(/|$)' -or $iosEntry.FullName -match '^[A-Za-z]:' -or (($iosEntry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'IPA enthält unsichere Archivpfade oder symbolische Links.' }
        }
    } finally { $iosZip.Dispose() }
    New-Item -ItemType Directory -Path $Destination | Out-Null
    Invoke-IOSPrivateProgram -Program 'ditto' -ProgramArguments @('-x', '-k', $Source, $Destination)
    $iosPayload = Join-Path $Destination 'Payload'
    $iosApps = @(Get-ChildItem -LiteralPath $iosPayload -Directory -Filter '*.app')
    if ($iosApps.Count -ne 1) { throw 'IPA muss genau eine App enthalten.' }
    return $iosApps[0].FullName
}

function Invoke-IOSArchive {
    param([hashtable]$Metadata, [string]$Archive, [switch]$Signed, [object]$Profile)
    if (Test-Path -LiteralPath $Archive) { throw 'Zielarchiv existiert bereits. Für einen neuen Lauf einen frischen Builddienst verwenden.' }
    $iosArchiveArguments = @(
        '-project', $iosProject, '-scheme', 'App', '-configuration', 'Release',
        '-sdk', 'iphoneos', '-destination', 'generic/platform=iOS',
        '-archivePath', $Archive, '-derivedDataPath', (Join-Path $iosMobileRoot ('DerivedData/TestFlightBuild-' + [Guid]::NewGuid().ToString('N'))),
        ('PRODUCT_BUNDLE_IDENTIFIER=' + $Metadata.bundle), ('CURRENT_PROJECT_VERSION=' + $Metadata.build), ('MARKETING_VERSION=' + $Metadata.version)
    )
    if ($Signed) {
        $iosArchiveArguments += @('CODE_SIGN_STYLE=Manual', ('DEVELOPMENT_TEAM=' + $Metadata.team), ('CODE_SIGN_IDENTITY=' + $Profile.certificateSha1), ('PROVISIONING_PROFILE_SPECIFIER=' + $Profile.uuid))
    } else { $iosArchiveArguments += @('CODE_SIGNING_ALLOWED=NO', 'CODE_SIGNING_REQUIRED=NO') }
    $iosArchiveArguments += 'archive'
    Invoke-IOSPublicProgram -Program 'xcodebuild' -ProgramArguments $iosArchiveArguments
    return (Join-Path $Archive 'Products/Applications/App.app')
}

Push-Location -LiteralPath $iosMobileRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Test-Path -LiteralPath $iosProfileHelper) -or -not (Test-Path -LiteralPath $iosProject)) { throw 'Node.js oder vorbereitete iOS-Projektdateien fehlen.' }
    if ($Step -eq 'Check') {
        Invoke-IOSPublicProgram -Program 'node' -ProgramArguments @('--check', $iosProfileHelper)
        Invoke-IOSPublicProgram -Program $iosNpmProgram -ProgramArguments @('run', 'build')
        Invoke-IOSPublicProgram -Program $iosNpmProgram -ProgramArguments @('test')
        Write-Host 'TestFlight-Quelldateien geprüft. Keine Apple-Zugangsdaten gelesen, keine App signiert oder hochgeladen.'
        return
    }
    Assert-IOSMac
    if ($Step -eq 'DeviceArchive') {
        $iosMetadata = Get-IOSMetadata
        Invoke-IOSPublicProgram -Program $iosNpmProgram -ProgramArguments @('ci', '--no-fund')
        Invoke-IOSPublicProgram -Program $iosNpmProgram -ProgramArguments @('run', 'ios:assets')
        Invoke-IOSPublicProgram -Program $iosNpmProgram -ProgramArguments @('run', 'build')
        Invoke-IOSPublicProgram -Program $iosNpmProgram -ProgramArguments @('test')
        Invoke-IOSPublicProgram -Program 'swift' -ProgramArguments @('test', '--package-path', 'core')
        $iosTemporary = New-IOSPrivateDirectory
        try {
            $iosApp = Invoke-IOSArchive -Metadata $iosMetadata -Archive $iosDeviceArchive
            $iosResult = Assert-IOSApp -App $iosApp -Metadata $iosMetadata -TemporaryDirectory $iosTemporary
            [ordered]@{ deviceArchiveCompiled = $true; signed = $false; uploaded = $false; bundle = $iosResult.bundle; build = $iosResult.build } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $iosMobileRoot 'ios-testflight-result.json') -Encoding utf8
        } finally { Remove-IOSPrivateDirectory -Directory $iosTemporary }
        Write-Host 'Gerätearchiv erfolgreich kompiliert. Es ist unsigniert und noch nicht auf dem iPad installierbar.'
        return
    }

    $iosMetadata = Get-IOSMetadata -RequireApple -ForUpload:($Step -eq 'Upload')
    if ($Step -eq 'Export') {
        foreach ($iosSecretName in @('IOS_CERTIFICATE_BASE64', 'IOS_CERTIFICATE_PASSWORD', 'IOS_PROFILE_BASE64')) {
            if (-not [Environment]::GetEnvironmentVariable($iosSecretName)) { throw ('TestFlight-Signierungswert fehlt: ' + $iosSecretName) }
        }
        if (Test-Path -LiteralPath $iosExportDirectory) { throw 'IPA-Ausgabeverzeichnis existiert bereits; frischen Builddienst verwenden.' }
        $iosTemporary = New-IOSPrivateDirectory
        $iosInstalledProfiles = [Collections.Generic.List[string]]::new()
        $iosOriginalKeychains = @()
        $iosKeychainCreated = $false
        $iosKeychainChanged = $false
        try {
            $iosP12 = Join-Path $iosTemporary 'certificate.p12'
            $iosProfileFile = Join-Path $iosTemporary 'profile.mobileprovision'
            try {
                [IO.File]::WriteAllBytes($iosP12, [Convert]::FromBase64String($env:IOS_CERTIFICATE_BASE64))
                [IO.File]::WriteAllBytes($iosProfileFile, [Convert]::FromBase64String($env:IOS_PROFILE_BASE64))
            } catch { throw 'Signierungsdateien sind nicht gültig Base64-kodiert.' }
            Invoke-IOSPrivateProgram -Program '/bin/chmod' -ProgramArguments @('600', $iosP12, $iosProfileFile)
            $iosProfileXML = Join-Path $iosTemporary 'profile.plist'
            Write-IOSProfileXML -Profile $iosProfileFile -Destination $iosProfileXML
            $iosProfile = Get-IOSProfile -ProfileXML $iosProfileXML -Metadata $iosMetadata
            $iosKeychainPath = Join-Path $iosTemporary 'signing.keychain-db'
            $iosKeychainPassword = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
            $iosKeychainOutput = Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('list-keychains', '-d', 'user') -Capture
            $iosOriginalKeychains = @($iosKeychainOutput -split '\r?\n' | ForEach-Object { if ($_ -match '^\s*"(.+)"\s*$') { $Matches[1] } })
            if ($iosOriginalKeychains.Count -eq 0) { throw 'Vorhandene Schlüsselbundliste konnte nicht sicher gelesen werden.' }
            $iosKeychainCreated = $true
            Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('create-keychain', '-p', $iosKeychainPassword, $iosKeychainPath)
            Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('set-keychain-settings', '-lut', '3600', $iosKeychainPath)
            Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('unlock-keychain', '-p', $iosKeychainPassword, $iosKeychainPath)
            Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('import', $iosP12, '-P', $env:IOS_CERTIFICATE_PASSWORD, '-T', '/usr/bin/codesign', '-T', '/usr/bin/security', '-t', 'cert', '-f', 'pkcs12', '-k', $iosKeychainPath)
            Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-s', '-k', $iosKeychainPassword, $iosKeychainPath)
            $iosKeychainChanged = $true
            Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments (@('list-keychains', '-d', 'user', '-s', $iosKeychainPath) + $iosOriginalKeychains)
            $iosIdentities = Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('find-identity', '-v', '-p', 'codesigning', $iosKeychainPath) -Capture
            if ($iosIdentities -notmatch ($iosProfile.certificateSha1 + '\s+"Apple Distribution:')) { throw 'Profil und gültiges Apple-Distribution-Zertifikat mit privatem Schlüssel stimmen nicht überein.' }
            $iosUserDirectory = [Environment]::GetFolderPath([Environment+SpecialFolder]::UserProfile)
            foreach ($iosProfileDirectory in @((Join-Path $iosUserDirectory 'Library/MobileDevice/Provisioning Profiles'), (Join-Path $iosUserDirectory 'Library/Developer/Xcode/UserData/Provisioning Profiles'))) {
                New-Item -ItemType Directory -Path $iosProfileDirectory -Force | Out-Null
                $iosInstalledProfile = Join-Path $iosProfileDirectory ($iosProfile.uuid + '.mobileprovision')
                if (Test-Path -LiteralPath $iosInstalledProfile) { throw 'Dieses Apple-Profil ist auf dem Runner bereits vorhanden; vorhandene Dateien werden nicht überschrieben.' }
                $iosInstalledProfiles.Add($iosInstalledProfile)
                Copy-Item -LiteralPath $iosProfileFile -Destination $iosInstalledProfile
            }
            # The unsigned archive is a separate check. A fresh manually signed
            # archive avoids depending on re-signing an unsigned Xcode archive.
            Invoke-IOSArchive -Metadata $iosMetadata -Archive $iosSignedArchive -Signed -Profile $iosProfile | Out-Host
            $iosApp = Join-Path $iosSignedArchive 'Products/Applications/App.app'
            Assert-IOSApp -App $iosApp -Metadata $iosMetadata -TemporaryDirectory $iosTemporary -Signed -ExpectedProfile $iosProfile | Out-Null
            $iosExportOptions = Join-Path $iosTemporary 'ExportOptions.plist'
            $iosExportXML = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>export</string>
<key>signingStyle</key><string>manual</string>
<key>signingCertificate</key><string>$($iosProfile.certificateSha1)</string>
<key>teamID</key><string>$($iosMetadata.team)</string>
<key>provisioningProfiles</key><dict><key>$($iosMetadata.bundle)</key><string>$($iosProfile.uuid)</string></dict>
<key>manageAppVersionAndBuildNumber</key><false/>
<key>uploadSymbols</key><false/>
</dict></plist>
"@
            [IO.File]::WriteAllText($iosExportOptions, $iosExportXML, [Text.UTF8Encoding]::new($false))
            Invoke-IOSPublicProgram -Program 'xcodebuild' -ProgramArguments @('-exportArchive', '-archivePath', $iosSignedArchive, '-exportPath', $iosExportDirectory, '-exportOptionsPlist', $iosExportOptions)
            $iosIPAs = @(Get-ChildItem -LiteralPath $iosExportDirectory -File -Filter '*.ipa')
            if ($iosIPAs.Count -ne 1) { throw 'Der Export hat keine eindeutige IPA-Datei erzeugt.' }
            $iosExpanded = Join-Path $iosTemporary 'exported-ipa'
            $iosExportedApp = Expand-IOSCheckedIPA -Source $iosIPAs[0].FullName -Destination $iosExpanded
            Assert-IOSApp -App $iosExportedApp -Metadata $iosMetadata -TemporaryDirectory $iosTemporary -Signed -ExpectedProfile $iosProfile | Out-Null
            [ordered]@{ deviceArchiveCompiled = $true; signed = $true; uploaded = $false; bundle = $iosMetadata.bundle; build = $iosMetadata.build; ipa = $iosIPAs[0].FullName } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $iosMobileRoot 'ios-testflight-result.json') -Encoding utf8
            Write-Host 'Signierte IPA geprüft und exportiert. Keine Übertragung zu Apple; Upload ist ein eigener ausdrücklicher Schritt.'
        } finally {
            if ($iosKeychainChanged) {
                try { Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments (@('list-keychains', '-d', 'user', '-s') + $iosOriginalKeychains) }
                catch { Write-Warning 'Ursprüngliche Schlüsselbundliste konnte nicht wiederhergestellt werden; der GitHub-Runner wird nach dem Job verworfen.' }
            }
            if ($iosKeychainCreated) {
                try { Invoke-IOSPrivateProgram -Program 'security' -ProgramArguments @('delete-keychain', $iosKeychainPath) }
                catch { Write-Warning 'Temporärer Schlüsselbund konnte nicht regulär entfernt werden; der GitHub-Runner wird nach dem Job verworfen.' }
            }
            foreach ($iosInstalledProfile in $iosInstalledProfiles) { Remove-Item -LiteralPath $iosInstalledProfile -Force -ErrorAction SilentlyContinue }
            $iosKeychainPassword = $null
            Remove-IOSPrivateDirectory -Directory $iosTemporary
        }
        return
    }

    # Upload is selected separately. A signature alone does not grant tester
    # access. Apple processing, export-compliance answers and manual assignment
    # to the user's internal TestFlight group still follow in App Store Connect.
    foreach ($iosSecretName in @('ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY_BASE64')) {
        if (-not [Environment]::GetEnvironmentVariable($iosSecretName)) { throw ('Apple-Uploadwert fehlt: ' + $iosSecretName) }
    }
    if ($env:ASC_KEY_ID -notmatch '^[A-Z0-9]{10}$' -or $env:ASC_ISSUER_ID -notmatch '^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$') { throw 'Apple-Key-ID oder Issuer-ID ist ungültig.' }
    if (-not $IpaPath) {
        $iosIPAs = @(Get-ChildItem -LiteralPath $iosExportDirectory -File -Filter '*.ipa')
        if ($iosIPAs.Count -ne 1) { throw 'Mit -IpaPath die zuvor geprüfte signierte IPA angeben.' }
        $IpaPath = $iosIPAs[0].FullName
    }
    $IpaPath = [IO.Path]::GetFullPath($IpaPath)
    $iosTemporary = New-IOSPrivateDirectory
    $iosPreviousKeyDirectory = [Environment]::GetEnvironmentVariable('API_PRIVATE_KEYS_DIR')
    try {
        $iosApp = Expand-IOSCheckedIPA -Source $IpaPath -Destination (Join-Path $iosTemporary 'upload-ipa')
        $iosActualApp = Assert-IOSApp -App $iosApp -Metadata $iosMetadata -TemporaryDirectory $iosTemporary -Signed
        $iosMetadata.build = $iosActualApp.build
        $iosMetadata.version = $iosActualApp.version
        $iosAPIKey = Join-Path $iosTemporary ('AuthKey_' + $env:ASC_KEY_ID + '.p8')
        try { $iosAPIBytes = [Convert]::FromBase64String($env:ASC_PRIVATE_KEY_BASE64) }
        catch { throw 'Apple-API-Schlüssel ist nicht gültig Base64-kodiert.' }
        $iosAPIText = [Text.Encoding]::UTF8.GetString($iosAPIBytes)
        if ($iosAPIText -notmatch '^-----BEGIN PRIVATE KEY-----\r?\n' -or $iosAPIText -notmatch '-----END PRIVATE KEY-----\s*$') { throw 'Apple-API-Schlüssel hat kein gültiges p8-Format.' }
        [IO.File]::WriteAllBytes($iosAPIKey, $iosAPIBytes)
        Invoke-IOSPrivateProgram -Program '/bin/chmod' -ProgramArguments @('600', $iosAPIKey)
        [Environment]::SetEnvironmentVariable('API_PRIVATE_KEYS_DIR', $iosTemporary)
        Invoke-IOSPrivateProgram -Program 'xcrun' -ProgramArguments @('altool', '--validate-app', '-f', $IpaPath, '-t', 'ios', '--apiKey', $env:ASC_KEY_ID, '--apiIssuer', $env:ASC_ISSUER_ID)
        Invoke-IOSPrivateProgram -Program 'xcrun' -ProgramArguments @('altool', '--upload-app', '-f', $IpaPath, '-t', 'ios', '--apiKey', $env:ASC_KEY_ID, '--apiIssuer', $env:ASC_ISSUER_ID)
        [ordered]@{ signed = $true; uploaded = $true; appleProcessed = $false; testerAccessGranted = $false; appStoreSubmitted = $false; bundle = $iosMetadata.bundle; build = $iosMetadata.build } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $iosMobileRoot 'ios-testflight-result.json') -Encoding utf8
        Write-Host 'Upload von Apple angenommen. Verarbeitung, Exportangaben und interne TestFlight-Zuordnung bleiben in App Store Connect zu prüfen.'
    } finally {
        [Environment]::SetEnvironmentVariable('API_PRIVATE_KEYS_DIR', $iosPreviousKeyDirectory)
        $iosAPIBytes = $null
        $iosAPIText = $null
        Remove-IOSPrivateDirectory -Directory $iosTemporary
    }
} finally { Pop-Location }
