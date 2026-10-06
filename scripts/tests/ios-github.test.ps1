#Requires -Version 7.4
# Synthetic local fixtures only: no network, authentication, Apple files or uploads.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$iosGitHubHelper = Join-Path (Split-Path -Parent $PSScriptRoot) 'setup-ios-github.ps1'
$iosFixtureParent = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
$iosFixtureRoot = Join-Path $iosFixtureParent ('jagdlatein-ios-github-test-' + [Guid]::NewGuid().ToString('N'))
$iosOriginalLocalAppData = $env:LOCALAPPDATA
$iosTestsPassed = 0

function Assert-IosGitHubFixture {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
    $script:iosTestsPassed++
}
function Assert-IosGitHubFixtureRejected {
    param([scriptblock]$Action, [string]$Message)
    $iosRejected = $false
    try { & $Action } catch { $iosRejected = $true }
    Assert-IosGitHubFixture -Condition $iosRejected -Message $Message
}

try {
    # Use an absent, isolated LOCALAPPDATA. Default Check must not create it,
    # authenticate, launch native tools, or inspect supplied signing files.
    $env:LOCALAPPDATA = Join-Path $iosFixtureRoot 'absent-local-data'
    . $iosGitHubHelper
    Assert-IosGitHubFixture -Condition (-not (Test-Path -LiteralPath $env:LOCALAPPDATA)) -Message 'Standard-Check hat Dateien oder Ordner angelegt.'
    Assert-IosGitHubFixtureRejected -Action { & $iosGitHubHelper -P8Path (Join-Path $iosFixtureRoot 'never-created.p8') } -Message 'Check hat einen privaten Dateiparameter akzeptiert.'
    Assert-IosGitHubFixtureRejected -Action { & $iosGitHubHelper -Step SaveSecrets } -Message 'Speicherschritt ohne ausdrueckliche Dateien akzeptiert.'
    Assert-IosGitHubFixture -Condition (-not (Test-Path -LiteralPath $iosFixtureRoot)) -Message 'Abgewiesener Aufruf hat ein Verzeichnis angelegt.'

    [void][IO.Directory]::CreateDirectory($iosFixtureRoot)
    $iosWorker = Join-Path $iosFixtureRoot 'read-synthetic-stdin.ps1'
    [IO.File]::WriteAllText($iosWorker, @'
$stream = [Console]::OpenStandardInput()
$memory = [IO.MemoryStream]::new()
try {
    $stream.CopyTo($memory)
    $bytes = $memory.ToArray()
    [ordered]@{
        length = $bytes.Length
        sha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes))
        arguments = [Environment]::GetCommandLineArgs() -join ' '
        tokenSha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes([Environment]::GetEnvironmentVariable('GH_TOKEN'))))
        debugDisabled = [string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable('GH_DEBUG'))
    } | ConvertTo-Json -Compress
    [Array]::Clear($bytes, 0, $bytes.Length)
} finally { $memory.Dispose(); $stream.Dispose() }
'@, [Text.UTF8Encoding]::new($false))
    $iosSyntheticMarker = 'SYNTHETIC-STDIN-ONLY-' + [Guid]::NewGuid().ToString('N')
    $iosSyntheticPayload = [Text.Encoding]::UTF8.GetBytes($iosSyntheticMarker + "`0`r`n" + [char]0x00e4)
    $iosSyntheticToken = 'synthetic-child-token-only'
    $iosPowerShell = (Get-Process -Id $PID).Path
    $iosChild = [Jagdlatein.IosGitHubPrivateProcess]::Run($iosPowerShell, @('-NoLogo', '-NoProfile', '-NonInteractive', '-File', $iosWorker), $iosSyntheticPayload, $iosSyntheticToken, 10000)
    $iosChildReport = $iosChild.Output | ConvertFrom-Json
    Assert-IosGitHubFixture -Condition ($iosChild.ExitCode -eq 0 -and $iosChildReport.length -eq $iosSyntheticPayload.Length -and $iosChildReport.sha256 -ceq [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($iosSyntheticPayload))) -Message 'Native stdin-Pipe hat die synthetischen Bytes veraendert.'
    Assert-IosGitHubFixture -Condition (-not $iosChildReport.arguments.Contains($iosSyntheticMarker) -and -not $iosChildReport.arguments.Contains($iosSyntheticToken)) -Message 'Synthetischer Wert ist in Prozessargumente geraten.'
    Assert-IosGitHubFixture -Condition ($iosChildReport.tokenSha256 -ceq [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($iosSyntheticToken))) -and $iosChildReport.debugDisabled) -Message 'Token wurde nicht ausschliesslich im vorgesehenen Kindprozess bereitgestellt.'
    [Array]::Clear($iosSyntheticPayload, 0, $iosSyntheticPayload.Length)

    # This worker never reads stdin. The timeout covers a full-size pipe write,
    # process exit and redirected stream drains together.
    $iosNonReader = Join-Path $iosFixtureRoot 'never-read-stdin.ps1'
    [IO.File]::WriteAllText($iosNonReader, 'Start-Sleep -Seconds 20', [Text.UTF8Encoding]::new($false))
    $iosFullPayload = [byte[]]::new(48KB)
    $iosElapsed = [Diagnostics.Stopwatch]::StartNew()
    Assert-IosGitHubFixtureRejected -Action { [void][Jagdlatein.IosGitHubPrivateProcess]::Run($iosPowerShell, @('-NoLogo', '-NoProfile', '-NonInteractive', '-File', $iosNonReader), $iosFullPayload, $iosSyntheticToken, 1000) } -Message 'Nicht lesender Kindprozess wurde nicht beendet.'
    $iosElapsed.Stop()
    Assert-IosGitHubFixture -Condition ($iosElapsed.Elapsed.TotalSeconds -lt 6) -Message 'stdin-Timeout hat den gesamten Prozess nicht begrenzt.'

    $iosFixtureBytes = [byte[]]@(0, 10, 13, 127, 128, 255)
    $iosFixtureFile = Join-Path $iosFixtureRoot 'synthetic-bytes.bin'
    [IO.File]::WriteAllBytes($iosFixtureFile, $iosFixtureBytes)
    $iosEncoded = [Jagdlatein.IosGitHubPrivateProcess]::FileBase64($iosFixtureFile)
    $iosDecoded = [Convert]::FromBase64String([Text.Encoding]::ASCII.GetString($iosEncoded))
    Assert-IosGitHubFixture -Condition ([Security.Cryptography.CryptographicOperations]::FixedTimeEquals($iosFixtureBytes, $iosDecoded)) -Message 'Synthetische Datei wurde nicht verlustfrei Base64-kodiert.'
    foreach ($iosBuffer in @($iosEncoded, $iosDecoded)) { [Array]::Clear($iosBuffer, 0, $iosBuffer.Length) }
    $iosBadPassword = ConvertTo-SecureString "synthetic-password`n" -AsPlainText -Force
    try { Assert-IosGitHubFixtureRejected -Action { [void][Jagdlatein.IosGitHubPrivateProcess]::PasswordBytes($iosBadPassword) } -Message 'P12-Passwort mit Zeilenumbruch wurde akzeptiert.' }
    finally { $iosBadPassword.Dispose() }

    # Generate and dispose an independent synthetic identity. The production
    # loader must verify this exact encrypted P12 password and require its key.
    $iosGoodP12Password = ConvertTo-SecureString 'synthetic-certificate-password' -AsPlainText -Force
    $iosWrongP12Password = ConvertTo-SecureString 'different-synthetic-password' -AsPlainText -Force
    $iosSyntheticRsa = [Security.Cryptography.RSA]::Create(2048)
    $iosSyntheticCertificate = $null
    $iosPublicCertificate = $null
    $iosSyntheticP12Bytes = $null
    $iosPublicP12Bytes = $null
    try {
        $iosCertificateRequest = [Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=SYNTHETIC TEST ONLY', $iosSyntheticRsa, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pkcs1)
        $iosSyntheticCertificate = $iosCertificateRequest.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-1), [DateTimeOffset]::UtcNow.AddDays(1))
        $iosSyntheticP12Bytes = $iosSyntheticCertificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12, $iosGoodP12Password)
        $iosSyntheticP12Path = Join-Path $iosFixtureRoot 'synthetic-certificate.p12'
        [IO.File]::WriteAllBytes($iosSyntheticP12Path, $iosSyntheticP12Bytes)
        $iosPreparedP12 = [Jagdlatein.IosGitHubPrivateProcess]::P12Base64($iosSyntheticP12Path, $iosGoodP12Password)
        $iosDecodedP12 = [Convert]::FromBase64String([Text.Encoding]::ASCII.GetString($iosPreparedP12))
        try { Assert-IosGitHubFixture -Condition ([Security.Cryptography.CryptographicOperations]::FixedTimeEquals($iosSyntheticP12Bytes, $iosDecodedP12)) -Message 'Gueltiges synthetisches P12 samt Passwort wurde nicht korrekt vorbereitet.' }
        finally { [Array]::Clear($iosPreparedP12, 0, $iosPreparedP12.Length); [Array]::Clear($iosDecodedP12, 0, $iosDecodedP12.Length) }
        Assert-IosGitHubFixtureRejected -Action { [void][Jagdlatein.IosGitHubPrivateProcess]::P12Base64($iosSyntheticP12Path, $iosWrongP12Password) } -Message 'Falsches P12-Passwort wurde akzeptiert.'
        $iosPublicCertificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new($iosSyntheticCertificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert))
        $iosPublicP12Bytes = $iosPublicCertificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12, $iosGoodP12Password)
        $iosPublicP12Path = Join-Path $iosFixtureRoot 'synthetic-without-private-key.p12'
        [IO.File]::WriteAllBytes($iosPublicP12Path, $iosPublicP12Bytes)
        Assert-IosGitHubFixtureRejected -Action { [void][Jagdlatein.IosGitHubPrivateProcess]::P12Base64($iosPublicP12Path, $iosGoodP12Password) } -Message 'P12 ohne privaten Schluessel wurde akzeptiert.'
    } finally {
        if ($iosSyntheticP12Bytes) { [Array]::Clear($iosSyntheticP12Bytes, 0, $iosSyntheticP12Bytes.Length) }
        if ($iosPublicP12Bytes) { [Array]::Clear($iosPublicP12Bytes, 0, $iosPublicP12Bytes.Length) }
        if ($iosPublicCertificate) { $iosPublicCertificate.Dispose() }
        if ($iosSyntheticCertificate) { $iosSyntheticCertificate.Dispose() }
        $iosSyntheticRsa.Dispose()
        $iosGoodP12Password.Dispose()
        $iosWrongP12Password.Dispose()
    }

    $iosUser = [pscustomobject]@{ login = 'Jagdlatein' }
    $iosRepo = [pscustomobject]@{ full_name = 'Jagdlatein/jagdlatein'; owner = @{ login = 'Jagdlatein' }; permissions = @{ admin = $true } }
    $iosEnv = [pscustomobject]@{ name = 'ios-testflight'; deployment_branch_policy = @{ protected_branches = $false; custom_branch_policies = $true }; protection_rules = @(@{ type = 'required_reviewers'; reviewers = @(@{ type = 'User'; reviewer = @{ login = 'Jagdlatein' } }) }) }
    $iosBranches = [pscustomobject]@{ total_count = 2; branch_policies = @(@{ type = 'branch'; name = 'main' }, @{ type = 'branch'; name = 'codex/ios-website-preview' }) }
    Assert-IosGitHubDestination -User $iosUser -Repository $iosRepo -Environment $iosEnv -Branches $iosBranches
    $iosRepo.permissions.admin = $false
    Assert-IosGitHubFixtureRejected -Action { Assert-IosGitHubDestination -User $iosUser -Repository $iosRepo -Environment $iosEnv -Branches $iosBranches } -Message 'Speicherziel ohne Adminrechte akzeptiert.'
    $iosRepo.permissions.admin = $true
    $iosBranches.branch_policies[1].name = 'codex/*'
    Assert-IosGitHubFixtureRejected -Action { Assert-IosGitHubDestination -User $iosUser -Repository $iosRepo -Environment $iosEnv -Branches $iosBranches } -Message 'Erweiterte Wildcard-Branchregel akzeptiert.'
    $iosBranches.branch_policies[1].name = 'codex/ios-website-preview'
    $iosEnv.protection_rules[0].reviewers[0].reviewer.login = 'another-owner'
    Assert-IosGitHubFixtureRejected -Action { Assert-IosGitHubDestination -User $iosUser -Repository $iosRepo -Environment $iosEnv -Branches $iosBranches } -Message 'Falscher Reviewer akzeptiert.'
    $iosExisting = [pscustomobject]@{ total_count = 1; secrets = @(@{ name = 'ASC_PRIVATE_KEY_BASE64' }) }
    Assert-IosGitHubFixtureRejected -Action { Assert-IosGitHubSecretUpdates -SelectedNames @('ASC_PRIVATE_KEY_BASE64') -Existing $iosExisting -UpdateAllowed $false } -Message 'Vorhandenes Secret ohne ausdruecklichen Update-Schalter akzeptiert.'
    Assert-IosGitHubSecretUpdates -SelectedNames @('ASC_PRIVATE_KEY_BASE64') -Existing $iosExisting -UpdateAllowed $true

    # Prepare a fresh temporary tools folder, then repeat with its protected
    # owner-only ACL already present. Neither operation touches the audit SACL.
    Set-IosGitHubToolsPrivacy
    $iosAclSections = [Security.AccessControl.AccessControlSections]::Access -bor [Security.AccessControl.AccessControlSections]::Owner
    $iosFixtureToolsDirectory = [IO.DirectoryInfo]::new((Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-tools'))
    $iosFirstAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosFixtureToolsDirectory, $iosAclSections)
    $iosOwnerSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $iosFirstRules = $iosFirstAcl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier])
    Assert-IosGitHubFixture -Condition ($iosFirstAcl.AreAccessRulesProtected -and $iosFirstAcl.GetOwner([Security.Principal.SecurityIdentifier]).Value -eq $iosOwnerSid.Value -and $iosFirstRules.Count -eq 1 -and $iosFirstRules[0].FileSystemRights -eq [Security.AccessControl.FileSystemRights]::FullControl -and $iosFirstRules[0].IdentityReference.Value -eq $iosOwnerSid.Value -and $iosFirstRules[0].AccessControlType -eq [Security.AccessControl.AccessControlType]::Allow) -Message 'Erste Vorbereitung hat keine geschuetzte Besitzer-ACL hergestellt.'
    $iosFirstAclBytes = $iosFirstAcl.GetSecurityDescriptorBinaryForm()
    Set-IosGitHubToolsPrivacy
    $iosRepeatedAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosFixtureToolsDirectory, $iosAclSections)
    Assert-IosGitHubFixture -Condition ([Security.Cryptography.CryptographicOperations]::FixedTimeEquals($iosFirstAclBytes, $iosRepeatedAcl.GetSecurityDescriptorBinaryForm())) -Message 'Wiederholte Vorbereitung hat die Besitzer-ACL veraendert.'

    # Exercise the actual portable ZIP layout and production extraction/hash
    # helpers using a tiny public fixture. No real CLI is read or executed.
    $iosLayoutZip = Join-Path $iosFixtureRoot 'synthetic-public-cli.zip'
    $iosLayoutBinary = [Text.Encoding]::ASCII.GetBytes('SYNTHETIC PUBLIC CLI BYTES')
    $iosLayoutLicense = [Text.Encoding]::ASCII.GetBytes('SYNTHETIC LICENSE')
    $iosFixtureZip = [IO.Compression.ZipFile]::Open($iosLayoutZip, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($iosZipFixture in @(@{ name = 'bin/gh.exe'; bytes = $iosLayoutBinary }, @{ name = 'LICENSE'; bytes = $iosLayoutLicense })) {
            $iosEntryStream = $iosFixtureZip.CreateEntry($iosZipFixture.name).Open()
            try { $iosEntryStream.Write($iosZipFixture.bytes, 0, $iosZipFixture.bytes.Length) }
            finally { $iosEntryStream.Dispose() }
        }
    } finally { $iosFixtureZip.Dispose() }
    $iosLayoutDestination = Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-tools\synthetic-layout-test'
    [void][IO.Directory]::CreateDirectory($iosLayoutDestination)
    $iosExpectedLayoutHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($iosLayoutBinary))
    Assert-IosGitHubFixture -Condition ((Get-IosGitHubZipExecutableHash -ArchivePath $iosLayoutZip) -ceq $iosExpectedLayoutHash) -Message 'ZIP-Hash verwendet nicht den direkten bin/gh.exe-Eintrag.'
    Expand-IosGitHubZipTool -ArchivePath $iosLayoutZip -DestinationDirectory $iosLayoutDestination
    $iosExtractedBinary = Join-Path $iosLayoutDestination 'bin\gh.exe'
    $iosExtractedLicense = Join-Path $iosLayoutDestination 'LICENSE'
    Assert-IosGitHubFixture -Condition ((Get-FileHash -LiteralPath $iosExtractedBinary).Hash -ceq $iosExpectedLayoutHash -and (Get-FileHash -LiteralPath $iosExtractedLicense).Hash -ceq [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($iosLayoutLicense))) -Message 'Direkte ZIP-Programm- und Lizenzdatei wurden nicht korrekt extrahiert.'
    Assert-IosGitHubFixtureRejected -Action { Expand-IosGitHubZipTool -ArchivePath $iosLayoutZip -DestinationDirectory $iosLayoutDestination } -Message 'ZIP-Extraktion hat eine vorhandene Programmdatei akzeptiert.'
    Assert-IosGitHubFixture -Condition ((Get-FileHash -LiteralPath $iosExtractedBinary).Hash -ceq $iosExpectedLayoutHash) -Message 'Abgewiesene ZIP-Extraktion hat vorhandene Bytes veraendert.'

    # Tampered existing public tool files must be refused without a download,
    # launch, repair or overwrite. Only synthetic text files are involved.
    $iosFakeTool = Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-tools\gh-2.102.0-windows-amd64\bin\gh.exe'
    $iosFakeArchive = Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-tools\gh_2.102.0_windows_amd64.zip'
    [void][IO.Directory]::CreateDirectory((Split-Path -Parent $iosFakeTool))
    [IO.File]::WriteAllText($iosFakeTool, 'SYNTHETIC PUBLIC TOOL FIXTURE')
    [IO.File]::WriteAllText($iosFakeArchive, 'SYNTHETIC PUBLIC ARCHIVE FIXTURE')
    $iosBeforeTool = (Get-FileHash -LiteralPath $iosFakeTool).Hash
    $iosBeforeArchive = (Get-FileHash -LiteralPath $iosFakeArchive).Hash
    Assert-IosGitHubFixtureRejected -Action { & $iosGitHubHelper -Step InstallTools } -Message 'Manipulierte vorhandene Werkzeugdateien akzeptiert.'
    Assert-IosGitHubFixture -Condition ((Get-FileHash -LiteralPath $iosFakeTool).Hash -ceq $iosBeforeTool -and (Get-FileHash -LiteralPath $iosFakeArchive).Hash -ceq $iosBeforeArchive) -Message 'Vorhandene Werkzeugdatei wurde trotz falschem SHA-256 veraendert.'
    Write-Host ('Bestanden: ' + $iosTestsPassed + ' lokale synthetische GitHub-Helferpruefungen. Keine Anmeldung oder Uebertragung.')
} finally {
    $env:LOCALAPPDATA = $iosOriginalLocalAppData
    $iosCleanup = [IO.Path]::GetFullPath($iosFixtureRoot)
    if ([IO.Path]::GetDirectoryName($iosCleanup) -ne $iosFixtureParent -or [IO.Path]::GetFileName($iosCleanup) -notmatch '^jagdlatein-ios-github-test-[a-f0-9]{32}$') { throw 'Test-Löschziel liegt ausserhalb des vorgesehenen Ordners.' }
    if (Test-Path -LiteralPath $iosCleanup) { Remove-Item -LiteralPath $iosCleanup -Recurse -Force }
}
