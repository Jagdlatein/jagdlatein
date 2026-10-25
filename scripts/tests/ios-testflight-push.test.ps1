#Requires -Version 7.4
# Actual build-script functions with synthetic public plist/certificate fixtures.
# Native signing, keychains, Apple accounts and uploads are never invoked.
[CmdletBinding()]
param([string]$NodePath = 'node')
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$iosFixtureRepository=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$iosBuilder=Join-Path $iosFixtureRepository 'scripts/build-ios-testflight.ps1'
$iosProfileHelper=Join-Path $iosFixtureRepository 'mobile/scripts/testflight-profile.mjs'
$iosFixtureRoot=Join-Path ([IO.Path]::GetTempPath()) ('jagdlatein-push-build-test-'+[Guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($iosFixtureRoot)
$iosSavedEnvironment=@{}
foreach($name in @('IOS_TEAM_ID','IOS_BUNDLE_ID','IOS_BUILD_NUMBER','IOS_MARKETING_VERSION','IOS_WEBSITE_ENVIRONMENT','JL_NATIVE_PUSH_ENABLED')){$iosSavedEnvironment[$name]=[Environment]::GetEnvironmentVariable($name)}
function Assert-Fixture([bool]$Condition,[string]$Message){if(-not$Condition){throw $Message}}
function Assert-Rejected([scriptblock]$Action,[string]$Message){$rejected=$false;try{&$Action|Out-Null}catch{$rejected=$true};Assert-Fixture $rejected $Message}
try {
    $parseTokens=$null;$parseErrors=$null
    $ast=[Management.Automation.Language.Parser]::ParseFile($iosBuilder,[ref]$parseTokens,[ref]$parseErrors)
    Assert-Fixture ($parseErrors.Count-eq0) 'Buildscript enthält Syntaxfehler.'
    foreach($definition in $ast.EndBlock.Statements|Where-Object{$_-is[Management.Automation.Language.FunctionDefinitionAst]}){. ([scriptblock]::Create($definition.Extent.Text))}
    $iosMobileRoot=Join-Path $iosFixtureRoot 'mobile'
    $iosProject=Join-Path $iosFixtureRoot 'App.xcodeproj'
    $iosCalls=[Collections.Generic.List[object]]::new()
    $iosCertificateBytes=[Text.Encoding]::UTF8.GetBytes('SYNTHETIC PUBLIC CERTIFICATE ONLY')
    $iosCertificateBase64=[Convert]::ToBase64String($iosCertificateBytes)
    $iosFixtureProfile="<?xml version='1.0'?><plist version='1.0'><dict><key>UUID</key><string>12345678-1234-1234-1234-123456789012</string><key>Name</key><string>Synthetic TestFlight only</string><key>TeamIdentifier</key><array><string>ABCDE12345</string></array><key>ApplicationIdentifierPrefix</key><array><string>ABCDE12345</string></array><key>Platform</key><array><string>iOS</string></array><key>ExpirationDate</key><date>2080-10-05T12:00:00Z</date><key>DeveloperCertificates</key><array><data>$iosCertificateBase64</data></array><key>Entitlements</key><dict><key>application-identifier</key><string>ABCDE12345.de.jagdlatein.app</string><key>com.apple.developer.team-identifier</key><string>ABCDE12345</string><key>get-task-allow</key><false/><key>beta-reports-active</key><true/><key>aps-environment</key><string>production</string></dict></dict></plist>"
    $iosFixtureEntitlements="<?xml version='1.0'?><plist version='1.0'><dict><key>application-identifier</key><string>ABCDE12345.de.jagdlatein.app</string><key>com.apple.developer.team-identifier</key><string>ABCDE12345</string><key>get-task-allow</key><false/><key>aps-environment</key><string>production</string></dict></plist>"
    function Invoke-IOSPublicProgram {param([string]$Program,[string[]]$ProgramArguments);$iosCalls.Add(@{program=$Program;arguments=$ProgramArguments})}
    function Invoke-IOSPrivateProgram {
        param([string]$Program,[string[]]$ProgramArguments,[switch]$Capture,[string]$Operation)
        $iosCalls.Add(@{program=$Program;arguments=$ProgramArguments})
        if($Program-eq'node'){
            $output=&$NodePath @ProgramArguments 2>&1
            if($LASTEXITCODE-ne0){throw 'Synthetic plist metadata rejected'}
            if($Capture){return(($output|ForEach-Object{[string]$_})-join[Environment]::NewLine)}
        }elseif($Program-eq'plutil'){
            Copy-Item -LiteralPath $ProgramArguments[4] -Destination $ProgramArguments[3] -Force
        }elseif($Program-eq'codesign'-and$Operation-eq'Zertifikatsextraktion'){
            $prefix=$ProgramArguments[1].Substring('--extract-certificates='.Length)
            [IO.File]::WriteAllBytes($prefix+'0',$iosCertificateBytes)
        }elseif($Program-ne'codesign'){throw 'Unexpected synthetic command'}
    }
    function Write-IOSProfileXML {param([string]$Profile,[string]$Destination);[IO.File]::WriteAllText($Destination,$iosFixtureProfile)}
    function codesign {$global:LASTEXITCODE=0;return $iosFixtureEntitlements}
    $env:IOS_TEAM_ID='ABCDE12345';$env:IOS_BUNDLE_ID='de.jagdlatein.app';$env:IOS_BUILD_NUMBER='23';$env:IOS_MARKETING_VERSION='1.0.3';$env:IOS_WEBSITE_ENVIRONMENT='Production'
    $Step='Export';$NativePush=$false
    $metadata=Get-IOSMetadata -RequireApple
    Assert-Fixture (-not$metadata.nativePush) 'Push muss standardmäßig ausgeschaltet bleiben.'
    $env:JL_NATIVE_PUSH_ENABLED='YES'
    $metadata=Get-IOSMetadata -RequireApple
    Assert-Fixture (-not$metadata.nativePush) 'Eine geerbte Umgebungsvariable darf den bewussten Schalter nicht ersetzen.'
    $profile=@{uuid='12345678-1234-1234-1234-123456789012';certificateSha1=('A'*40)}
    Invoke-IOSArchive -Metadata $metadata -Archive (Join-Path $iosFixtureRoot 'off.xcarchive') -Signed -Profile $profile|Out-Null
    $arguments=$iosCalls[$iosCalls.Count-1].arguments
    Assert-Fixture ($arguments-contains'JL_NATIVE_PUSH_ENABLED=NO') 'Default-Archiv fordert Push an.'
    Assert-Fixture ($arguments-contains'CODE_SIGN_ENTITLEMENTS=') 'Default-Archiv fordert ungewollte APS-Rechte an.'
    $NativePush=$true
    Assert-Rejected {Get-IOSMetadata -RequireApple} 'Fehlende Firebase-Datei wurde akzeptiert.'
    $iosConfiguration=Join-Path $iosMobileRoot 'ios/App/App/GoogleService-Info.plist'
    [void][IO.Directory]::CreateDirectory((Split-Path -Parent $iosConfiguration))
    $iosSyntheticFirebase="<?xml version='1.0'?><plist version='1.0'><dict><key>BUNDLE_ID</key><string>de.jagdlatein.app</string><key>PROJECT_ID</key><string>jagdlatein-a17b1</string><key>GCM_SENDER_ID</key><string>1084120782155</string><key>GOOGLE_APP_ID</key><string>1:1084120782155:ios:1704651867d85968da44ce</string><key>API_KEY</key><string>AIza$('A'*35)</string></dict></plist>"
    [IO.File]::WriteAllText($iosConfiguration,$iosSyntheticFirebase)
    $env:IOS_WEBSITE_ENVIRONMENT='Sandbox'
    Assert-Rejected {Get-IOSMetadata -RequireApple} 'Sandbox wurde für Push akzeptiert.'
    $env:IOS_WEBSITE_ENVIRONMENT='Production';$env:IOS_BUNDLE_ID='de.jagdlatein.other'
    Assert-Rejected {Get-IOSMetadata -RequireApple} 'Andere Bundle-ID wurde für Push akzeptiert.'
    $env:IOS_BUNDLE_ID='de.jagdlatein.app'
    $metadata=Get-IOSMetadata -RequireApple
    Assert-Fixture $metadata.nativePush 'Bewusster gültiger Push-Auftrag ging verloren.'
    Assert-Rejected {Invoke-IOSArchive -Metadata $metadata -Archive (Join-Path $iosFixtureRoot 'unsigned.xcarchive')} 'Unsigniertes Push-Archiv wurde angefordert.'
    Invoke-IOSArchive -Metadata $metadata -Archive (Join-Path $iosFixtureRoot 'on.xcarchive') -Signed -Profile $profile|Out-Null
    $arguments=$iosCalls[$iosCalls.Count-1].arguments
    Assert-Fixture ($arguments-contains'JL_NATIVE_PUSH_ENABLED=YES') 'Push-Schalter fehlt beim tatsächlichen Archivaufruf.'
    Assert-Fixture ($arguments-contains'CODE_SIGN_ENTITLEMENTS=App/App.entitlements') 'Produktions-Entitlements fehlen beim Archivaufruf.'
    Assert-Fixture ($arguments-contains'CODE_SIGN_STYLE=Manual') 'Manuelle Signierung wurde geändert.'
    $iosApp=Join-Path $iosFixtureRoot 'actual-app/App.app';$iosCheck=Join-Path $iosFixtureRoot 'assertion'
    [void][IO.Directory]::CreateDirectory($iosApp);[void][IO.Directory]::CreateDirectory($iosCheck)
    $iosInfo="<?xml version='1.0'?><plist version='1.0'><dict><key>CFBundleIdentifier</key><string>de.jagdlatein.app</string><key>CFBundleVersion</key><string>23</string><key>CFBundleShortVersionString</key><string>1.0.3</string><key>CFBundleSupportedPlatforms</key><array><string>iPhoneOS</string></array><key>DTPlatformName</key><string>iphoneos</string><key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array><key>CFBundleDisplayName</key><string>Jagdlatein</string><key>JagdlateinWebsiteEnvironment</key><string>Production</string><key>JagdlateinNativePushEnabled</key><string>YES</string></dict></plist>"
    [IO.File]::WriteAllText((Join-Path $iosApp 'Info.plist'),$iosInfo)
    [IO.File]::WriteAllText((Join-Path $iosApp 'embedded.mobileprovision'),'SYNTHETIC PUBLIC PLACEHOLDER')
    [IO.File]::WriteAllText((Join-Path $iosApp 'GoogleService-Info.plist'),$iosSyntheticFirebase)
    $result=Assert-IOSApp -App $iosApp -Metadata $metadata -TemporaryDirectory $iosCheck -Signed
    Assert-Fixture ($result.signed-and$result.nativePush) 'Aktuelle exportierte App-Metadaten wurden nicht geprüft.'
    $iosFixtureEntitlements=$iosFixtureEntitlements.Replace('<key>aps-environment</key><string>production</string>','')
    Assert-Rejected {Assert-IOSApp -App $iosApp -Metadata $metadata -TemporaryDirectory $iosCheck -Signed} 'Fehlendes APS im tatsächlichen CodeSign-Ergebnis wurde akzeptiert.'
    $iosFixtureEntitlements=$iosFixtureEntitlements.Replace('</dict>','<key>aps-environment</key><string>production</string></dict>')
    $iosFixtureProfile=$iosFixtureProfile.Replace('<key>aps-environment</key><string>production</string>','')
    Assert-Rejected {Assert-IOSApp -App $iosApp -Metadata $metadata -TemporaryDirectory $iosCheck -Signed} 'Fehlendes APS im eingebetteten Profil wurde akzeptiert.'
    $iosFixtureProfile=$iosFixtureProfile.Replace('<key>beta-reports-active</key><true/>','<key>beta-reports-active</key><true/><key>aps-environment</key><string>production</string>')
    [IO.File]::WriteAllText((Join-Path $iosApp 'GoogleService-Info.plist'),$iosSyntheticFirebase.Replace('jagdlatein-a17b1','wrong-project'))
    Assert-Rejected {Assert-IOSApp -App $iosApp -Metadata $metadata -TemporaryDirectory $iosCheck -Signed} 'Fremde eingebettete Firebase-Datei wurde akzeptiert.'
    Assert-Rejected {&$iosBuilder -Step Check -NativePush} 'Push wurde für einen reinen Check akzeptiert.'
    Write-Host 'TestFlight-Push: echte PowerShell-Funktionen und Datei-CLI mit isolierten Metadaten bestanden; keine App signiert oder hochgeladen.'
} finally {
    foreach($name in $iosSavedEnvironment.Keys){[Environment]::SetEnvironmentVariable($name,$iosSavedEnvironment[$name])}
    $resolved=[IO.Path]::GetFullPath($iosFixtureRoot);$parent=[IO.Path]::GetDirectoryName($resolved)
    if($parent.TrimEnd([IO.Path]::DirectorySeparatorChar)-ne[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)-or[IO.Path]::GetFileName($resolved)-notmatch'^jagdlatein-push-build-test-[a-f0-9]{32}$'){throw 'Unsicheres synthetisches Test-Löschziel.'}
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
# Expected negative CLI cases above return nonzero. Clear that external status
# only after every assertion AND fixture cleanup succeeded; CI forwards it.
$global:LASTEXITCODE=0
