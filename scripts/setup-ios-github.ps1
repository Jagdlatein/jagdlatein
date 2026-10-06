#Requires -Version 7.4
<#
.SYNOPSIS
Speichert ausdruecklich gewaehlte Apple-Dateien als geschuetzte GitHub-Secrets.
.DESCRIPTION
Check ist der Standard: keine Anmeldung, kein Netzwerk, keine privaten Dateien.
InstallTools installiert ausschliesslich die SHA-256-gepruefte portable GitHub CLI
unter LOCALAPPDATA\Jagdlatein\ios-tools; PATH und globale Installation bleiben gleich.
SaveSecrets liest nur die angegebenen Dateien und speichert nur deren Secrets in
Jagdlatein/jagdlatein, Umgebung ios-testflight. Bei P12 wird das Passwort verdeckt
abgefragt und mit einem nicht dauerhaft importierten privaten Schluessel geprueft.
Werte gelangen ausschliesslich ueber stdin zur lokal verschluesselnden
GitHub CLI, niemals ueber Argumente, Dateien, Konsole oder eine gh-Anmeldedatei.
Bereits vorhandene ausgewaehlte Secrets werden ohne -AllowUpdate abgewiesen.
Vor dem Speichern werden Kontoinhaber, Adminzugriff, Reviewer und Branchregeln
geprueft. Die Administrator-Ausnahme muss separat in der GitHub-Oberflaeche
deaktiviert sein; diese Einstellung ist nicht ueber die dokumentierte REST-API
pruefbar. Der Helfer startet keinen Workflow und sendet keine App an Apple.
.EXAMPLE
& .\scripts\setup-ios-github.ps1
.EXAMPLE
& .\scripts\setup-ios-github.ps1 -Step InstallTools
.EXAMPLE
& .\scripts\setup-ios-github.ps1 -Step SaveSecrets -P8Path 'C:\Users\Name\Downloads\AuthKey_KEYID.p8'
.LINK
https://cli.github.com/manual/gh_secret_set
.LINK
https://github.com/cli/cli/releases/tag/v2.102.0
#>
[CmdletBinding()]
param(
    [ValidateSet('Check', 'InstallTools', 'SaveSecrets')]
    [string]$Step = 'Check',
    [string]$P8Path,
    [string]$P12Path,
    [string]$ProfilePath,
    [switch]$AllowUpdate
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $IsWindows) { throw 'Dieser Helfer benoetigt PowerShell 7.4 oder neuer unter Windows.' }
if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) { throw 'LOCALAPPDATA wurde nicht gefunden.' }
$iosGitHubToolsRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-tools'))
$iosGitHubToolDirectory = Join-Path $iosGitHubToolsRoot 'gh-2.102.0-windows-amd64'
$iosGitHubExecutable = Join-Path $iosGitHubToolDirectory 'bin\gh.exe'
$iosGitHubArchive = Join-Path $iosGitHubToolsRoot 'gh_2.102.0_windows_amd64.zip'
$iosGitHubZipSha256 = 'ae64e556ecc240b200f7eba60d550e4bb60d78e860e69dd88c449405b86067f4'

# The in-process bridge keeps stdin in byte buffers and never adds a newline.
# Both native streams are captured. Callers expose only fixed status messages.
if (-not ('Jagdlatein.IosGitHubPrivateProcess' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace Jagdlatein {
    public sealed class IosGitHubProcessResult {
        public int ExitCode { get; set; }
        public string Output { get; set; }
    }
    public static class IosGitHubPrivateProcess {
        private static async Task WriteInput(Process process, byte[] input) {
            try {
                if (input != null) await process.StandardInput.BaseStream.WriteAsync(input, 0, input.Length);
            } finally { process.StandardInput.Close(); }
        }
        public static IosGitHubProcessResult Run(string executable, string[] arguments,
            byte[] input, string githubToken, int timeoutMilliseconds = 60000) {
            if (timeoutMilliseconds < 1 || timeoutMilliseconds > 60000)
                throw new ArgumentOutOfRangeException(nameof(timeoutMilliseconds));
            var start = new ProcessStartInfo(executable) {
                UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardInput = true, RedirectStandardOutput = true,
                RedirectStandardError = true
            };
            foreach (string argument in arguments) start.ArgumentList.Add(argument);
            foreach (string name in new string[] { "GH_TOKEN", "GITHUB_TOKEN", "GH_ENTERPRISE_TOKEN",
                "GITHUB_ENTERPRISE_TOKEN", "GH_DEBUG", "DEBUG", "GH_FORCE_TTY", "GCM_DEBUG" })
                start.Environment.Remove(name);
            var environmentNames = new System.Collections.Generic.List<string>(start.Environment.Keys);
            foreach (string name in environmentNames)
                if (name.StartsWith("GIT_TRACE", StringComparison.OrdinalIgnoreCase) ||
                    name.StartsWith("GCM_TRACE", StringComparison.OrdinalIgnoreCase))
                    start.Environment.Remove(name);
            start.Environment["GH_HOST"] = "github.com";
            start.Environment["GH_PROMPT_DISABLED"] = "1";
            start.Environment["GCM_INTERACTIVE"] = "0";
            start.Environment["GCM_PROVIDER"] = "github";
            start.Environment["GIT_TERMINAL_PROMPT"] = "0";
            if (githubToken != null) start.Environment["GH_TOKEN"] = githubToken;
            using (var process = new Process { StartInfo = start }) {
                try {
                    process.Start();
                    Task<string> output = process.StandardOutput.ReadToEndAsync();
                    Task<string> error = process.StandardError.ReadToEndAsync();
                    Task inputTask = WriteInput(process, input);
                    Task completion = Task.WhenAll(inputTask, process.WaitForExitAsync(), output, error);
                    if (!completion.Wait(timeoutMilliseconds)) {
                        process.Kill(true);
                        throw new InvalidOperationException("Vertraulicher Prozess hat das Zeitlimit erreicht.");
                    }
                    completion.GetAwaiter().GetResult();
                    // The error stream is consumed to avoid deadlocks, then discarded.
                    return new IosGitHubProcessResult { ExitCode = process.ExitCode, Output = output.Result };
                } catch {
                    try { if (!process.HasExited) process.Kill(true); } catch { }
                    throw new InvalidOperationException("Vertraulicher Prozess konnte nicht abgeschlossen werden.");
                } finally {
                    start.Environment.Remove("GH_TOKEN");
                }
            }
        }
        private static byte[] ReadFileBytes(string path) {
            byte[] file = null;
            try {
                using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read)) {
                    if (stream.Length < 1 || stream.Length > 36 * 1024)
                        throw new InvalidOperationException("Datei passt nicht in ein GitHub-Secret.");
                    file = new byte[(int)stream.Length];
                    stream.ReadExactly(file);
                }
                return file;
            } catch {
                if (file != null) Array.Clear(file, 0, file.Length);
                throw;
            }
        }
        private static byte[] EncodeBase64(byte[] file) {
            char[] encoded = null;
            try {
                encoded = new char[4 * ((file.Length + 2) / 3)];
                if (!Convert.TryToBase64Chars(file, encoded, out int count) || count > 48 * 1024)
                    throw new InvalidOperationException("Datei passt nicht in ein GitHub-Secret.");
                return Encoding.ASCII.GetBytes(encoded, 0, count);
            } finally {
                if (encoded != null) Array.Clear(encoded, 0, encoded.Length);
            }
        }
        public static byte[] FileBase64(string path) {
            byte[] file = ReadFileBytes(path);
            try { return EncodeBase64(file); }
            finally { Array.Clear(file, 0, file.Length); }
        }
        public static byte[] P12Base64(string path, SecureString password) {
            byte[] file = null;
            try {
                if (password == null) throw new ArgumentException("P12-Passwort fehlt.");
                file = ReadFileBytes(path);
                // Compatible with PowerShell 7.4/.NET 8. EphemeralKeySet prevents
                // the decrypted private key from being persisted in a key store.
#pragma warning disable SYSLIB0057
                using (var certificate = new X509Certificate2(file, password, X509KeyStorageFlags.EphemeralKeySet)) {
#pragma warning restore SYSLIB0057
                    if (!certificate.HasPrivateKey) throw new InvalidOperationException("Privater Schluessel fehlt.");
                    return EncodeBase64(file);
                }
            } catch {
                throw new InvalidOperationException("P12-Datei oder Passwort ist ungueltig, oder der private Schluessel fehlt.");
            } finally {
                if (file != null) Array.Clear(file, 0, file.Length);
            }
        }
        public static byte[] PasswordBytes(SecureString password) {
            if (password == null || password.Length < 12 || password.Length > 1024)
                throw new ArgumentException("P12-Passwort: 12 bis 1024 Zeichen erforderlich.");
            IntPtr pointer = IntPtr.Zero;
            var characters = new char[password.Length];
            try {
                pointer = Marshal.SecureStringToBSTR(password);
                Marshal.Copy(pointer, characters, 0, characters.Length);
                if (Array.IndexOf(characters, '\0') >= 0 || Array.IndexOf(characters, '\r') >= 0 ||
                    Array.IndexOf(characters, '\n') >= 0)
                    throw new ArgumentException("P12-Passwort darf keine Nullzeichen oder Zeilenumbrueche enthalten.");
                return Encoding.UTF8.GetBytes(characters);
            } finally {
                Array.Clear(characters, 0, characters.Length);
                if (pointer != IntPtr.Zero) Marshal.ZeroFreeBSTR(pointer);
            }
        }
    }
}
'@
}

function Assert-IosGitHubToolsPath {
    param([string]$Path)
    $iosFullPath = [IO.Path]::GetFullPath($Path)
    if ($iosFullPath -ne $iosGitHubToolsRoot -and -not $iosFullPath.StartsWith($iosGitHubToolsRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Werkzeugpfad liegt ausserhalb des vorgesehenen Ordners.'
    }
    $iosPathPart = $iosFullPath
    while ($iosPathPart) {
        if (Test-Path -LiteralPath $iosPathPart) {
            $iosItem = Get-Item -LiteralPath $iosPathPart -Force
            if (($iosItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Verknuepfte Werkzeugpfade werden nicht verwendet.' }
        }
        $iosParent = Split-Path -Parent $iosPathPart
        if ($iosParent -eq $iosPathPart) { break }
        $iosPathPart = $iosParent
    }
    return $iosFullPath
}

function Test-IosGitHubOwnerOnlyAcl {
    param([Security.AccessControl.DirectorySecurity]$Acl, [Security.Principal.SecurityIdentifier]$OwnerSid)
    $iosRules = $Acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier])
    $iosInheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
    if (-not $Acl.AreAccessRulesProtected -or $Acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $OwnerSid.Value -or $iosRules.Count -ne 1) { return $false }
    $iosRule = $iosRules[0]
    return ($iosRule.IdentityReference.Value -eq $OwnerSid.Value -and
        $iosRule.AccessControlType -eq [Security.AccessControl.AccessControlType]::Allow -and
        $iosRule.FileSystemRights -eq [Security.AccessControl.FileSystemRights]::FullControl -and
        $iosRule.InheritanceFlags -eq $iosInheritance -and
        $iosRule.PropagationFlags -eq [Security.AccessControl.PropagationFlags]::None -and
        -not $iosRule.IsInherited)
}

function Set-IosGitHubToolsPrivacy {
    $iosVerifiedRoot = Assert-IosGitHubToolsPath -Path $iosGitHubToolsRoot
    if (-not (Test-Path -LiteralPath $iosVerifiedRoot)) { [void][IO.Directory]::CreateDirectory($iosVerifiedRoot) }
    $iosDirectory = [IO.DirectoryInfo]::new($iosVerifiedRoot)
    $iosUserSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    # Request owner and DACL only, without reading or writing the audit SACL.
    $iosAclSections = [Security.AccessControl.AccessControlSections]::Access -bor [Security.AccessControl.AccessControlSections]::Owner
    $iosExistingAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosDirectory, $iosAclSections)
    if (Test-IosGitHubOwnerOnlyAcl -Acl $iosExistingAcl -OwnerSid $iosUserSid) { return }
    $iosAcl = [Security.AccessControl.DirectorySecurity]::new()
    $iosAcl.SetAccessRuleProtection($true, $false)
    if ($iosExistingAcl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $iosUserSid.Value) { $iosAcl.SetOwner($iosUserSid) }
    $iosInheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
    $iosAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($iosUserSid, [Security.AccessControl.FileSystemRights]::FullControl, $iosInheritance, [Security.AccessControl.PropagationFlags]::None, [Security.AccessControl.AccessControlType]::Allow))
    [IO.FileSystemAclExtensions]::SetAccessControl($iosDirectory, $iosAcl)
    $iosVerifiedAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosDirectory, $iosAclSections)
    if (-not (Test-IosGitHubOwnerOnlyAcl -Acl $iosVerifiedAcl -OwnerSid $iosUserSid)) { throw 'Werkzeugordner hat nicht die erforderliche geschuetzte Besitzer-ACL. Installation abgebrochen.' }
}

function Get-IosGitHubZipExecutableHash {
    param([string]$ArchivePath = $iosGitHubArchive)
    $iosZip = [IO.Compression.ZipFile]::OpenRead($ArchivePath)
    try {
        $iosEntries = @($iosZip.Entries | Where-Object FullName -ceq 'bin/gh.exe')
        if ($iosEntries.Count -ne 1 -or $iosEntries[0].Length -lt 1 -or $iosEntries[0].Length -gt 128MB) { throw 'GitHub-CLI-Archiv enthaelt nicht das erwartete Programm.' }
        $iosStream = $iosEntries[0].Open()
        try { return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($iosStream)) }
        finally { $iosStream.Dispose() }
    } finally { $iosZip.Dispose() }
}

function Expand-IosGitHubZipTool {
    param([string]$ArchivePath, [string]$DestinationDirectory)
    # The verified official Windows ZIP has bin/gh.exe and LICENSE at its root.
    # Extract only these exact entries to fixed paths; never extract arbitrary
    # archive names. The caller verifies the pinned archive hash first.
    $iosDestinationDirectory = Assert-IosGitHubToolsPath -Path $DestinationDirectory
    if (-not (Test-Path -LiteralPath $iosDestinationDirectory -PathType Container)) { throw 'CLI-Installationsordner fehlt.' }
    $iosBinaryPath = Assert-IosGitHubToolsPath -Path (Join-Path $iosDestinationDirectory 'bin\gh.exe')
    $iosLicensePath = Assert-IosGitHubToolsPath -Path (Join-Path $iosDestinationDirectory 'LICENSE')
    $iosZip = [IO.Compression.ZipFile]::OpenRead($ArchivePath)
    try {
        $iosEntries = @($iosZip.Entries | Where-Object FullName -ceq 'bin/gh.exe')
        if ($iosEntries.Count -ne 1 -or $iosEntries[0].Length -lt 1 -or $iosEntries[0].Length -gt 128MB) { throw 'CLI-Archiv enthaelt nicht das erwartete Programm.' }
        $iosLicense = @($iosZip.Entries | Where-Object FullName -ceq 'LICENSE')
        if ($iosLicense.Count -gt 1 -or ($iosLicense.Count -eq 1 -and $iosLicense[0].Length -gt 64KB)) { throw 'CLI-Archiv enthaelt eine ungueltige Lizenzdatei.' }
        [void][IO.Directory]::CreateDirectory((Split-Path -Parent $iosBinaryPath))
        $iosSource = $null
        $iosDestination = $null
        try {
            $iosSource = $iosEntries[0].Open()
            $iosDestination = [IO.FileStream]::new($iosBinaryPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
            $iosSource.CopyTo($iosDestination)
            $iosDestination.Flush($true)
        } finally {
            if ($iosDestination) { $iosDestination.Dispose() }
            if ($iosSource) { $iosSource.Dispose() }
        }
        if ($iosLicense.Count -eq 1) { [IO.Compression.ZipFileExtensions]::ExtractToFile($iosLicense[0], $iosLicensePath, $false) }
    } finally { $iosZip.Dispose() }
}

function Assert-IosGitHubVerifiedTool {
    [void](Assert-IosGitHubToolsPath -Path $iosGitHubExecutable)
    [void](Assert-IosGitHubToolsPath -Path $iosGitHubArchive)
    if (-not (Test-Path -LiteralPath $iosGitHubExecutable -PathType Leaf) -or -not (Test-Path -LiteralPath $iosGitHubArchive -PathType Leaf)) { throw 'Zuerst InstallTools ausfuehren; eine gepruefte portable GitHub CLI fehlt.' }
    if ((Get-FileHash -LiteralPath $iosGitHubArchive -Algorithm SHA256).Hash -ine $iosGitHubZipSha256) { throw 'Vorhandenes CLI-Archiv stimmt nicht mit dem offiziellen SHA-256 ueberein. Nichts wird ueberschrieben.' }
    $iosExpectedBinaryHash = Get-IosGitHubZipExecutableHash
    if ((Get-FileHash -LiteralPath $iosGitHubExecutable -Algorithm SHA256).Hash -cne $iosExpectedBinaryHash) { throw 'Vorhandene GitHub CLI stimmt nicht mit dem geprueften Archiv ueberein. Nichts wird ueberschrieben.' }
}

function Install-IosGitHubTools {
    [void](Assert-IosGitHubToolsPath -Path $iosGitHubToolDirectory)
    [void](Assert-IosGitHubToolsPath -Path $iosGitHubArchive)
    if (Test-Path -LiteralPath $iosGitHubToolDirectory) {
        Assert-IosGitHubVerifiedTool
        Write-Host 'Die gepruefte portable GitHub CLI 2.102.0 ist bereits vorhanden.'
        return
    }
    if ((Test-Path -LiteralPath $iosGitHubArchive) -and (Get-FileHash -LiteralPath $iosGitHubArchive -Algorithm SHA256).Hash -ine $iosGitHubZipSha256) { throw 'Vorhandenes CLI-Archiv hat einen anderen SHA-256. Nichts wird ueberschrieben.' }
    Set-IosGitHubToolsPrivacy
    $iosStage = Assert-IosGitHubToolsPath -Path (Join-Path $iosGitHubToolsRoot ('gh-install-' + [Guid]::NewGuid().ToString('N')))
    if (Test-Path -LiteralPath $iosStage) { throw 'Installationsordner existiert bereits.' }
    [void][IO.Directory]::CreateDirectory($iosStage)
    try {
        if (-not (Test-Path -LiteralPath $iosGitHubArchive)) {
            $iosDownload = Join-Path $iosStage 'download.zip'
            Invoke-WebRequest -Uri 'https://github.com/cli/cli/releases/download/v2.102.0/gh_2.102.0_windows_amd64.zip' -OutFile $iosDownload -TimeoutSec 60
            if ((Get-FileHash -LiteralPath $iosDownload -Algorithm SHA256).Hash -ine $iosGitHubZipSha256) { throw 'Heruntergeladenes CLI-Archiv hat nicht den offiziellen SHA-256.' }
            [void](Assert-IosGitHubToolsPath -Path $iosGitHubArchive)
            [IO.File]::Move($iosDownload, $iosGitHubArchive)
        }
        Expand-IosGitHubZipTool -ArchivePath $iosGitHubArchive -DestinationDirectory $iosStage
        [void](Assert-IosGitHubToolsPath -Path $iosStage)
        [void](Assert-IosGitHubToolsPath -Path $iosGitHubToolDirectory)
        [IO.Directory]::Move($iosStage, $iosGitHubToolDirectory)
        Assert-IosGitHubVerifiedTool
        Write-Host 'Portable GitHub CLI 2.102.0 mit offiziellem SHA-256 geprueft und lokal bereitgestellt.'
    } finally {
        $iosCleanup = Assert-IosGitHubToolsPath -Path $iosStage
        if ([IO.Path]::GetDirectoryName($iosCleanup) -ne $iosGitHubToolsRoot -or [IO.Path]::GetFileName($iosCleanup) -notmatch '^gh-install-[a-f0-9]{32}$') { throw 'Installations-Löschziel ist ungueltig.' }
        if (Test-Path -LiteralPath $iosCleanup) { Remove-Item -LiteralPath $iosCleanup -Recurse -Force }
    }
}

function Get-IosGitHubToken {
    $iosGit = Get-Command git -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $iosGit) { throw 'Git mit Git Credential Manager wird benoetigt.' }
    $iosCredentialInput = [Text.Encoding]::ASCII.GetBytes("protocol=https`nhost=github.com`nusername=Jagdlatein`n`n")
    $iosCredentialResult = $null
    try {
        $iosCredentialResult = [Jagdlatein.IosGitHubPrivateProcess]::Run($iosGit.Source, @('credential-manager', 'get'), $iosCredentialInput, $null)
        if ($iosCredentialResult.ExitCode -ne 0) { throw 'Vorhandene GitHub-Anmeldung ist nicht verfuegbar. Git Credential Manager zuerst selbst anmelden.' }
        $iosPasswordLines = @($iosCredentialResult.Output -split '\r?\n' | Where-Object { $_.StartsWith('password=', [StringComparison]::Ordinal) })
        if ($iosPasswordLines.Count -ne 1) { throw 'Git Credential Manager hat keinen eindeutigen GitHub-Token geliefert.' }
        $iosToken = $iosPasswordLines[0].Substring(9)
        if ([string]::IsNullOrWhiteSpace($iosToken) -or $iosToken.Length -gt 4096 -or $iosToken -match '[\x00-\x20\x7f]') { throw 'GitHub-Token hat ein ungueltiges Format.' }
        return $iosToken
    } finally {
        [Array]::Clear($iosCredentialInput, 0, $iosCredentialInput.Length)
        if ($iosCredentialResult) { $iosCredentialResult.Output = $null }
    }
}

function Get-IosGitHubJson {
    param([string]$Endpoint, [string]$Token)
    $iosApiResult = [Jagdlatein.IosGitHubPrivateProcess]::Run($iosGitHubExecutable, @('api', '--hostname', 'github.com', '--method', 'GET', $Endpoint), $null, $Token)
    if ($iosApiResult.ExitCode -ne 0) { throw 'GitHub-Metadaten konnten nicht geprueft werden. Kein weiterer Speicherschritt.' }
    try { return $iosApiResult.Output | ConvertFrom-Json -Depth 30 }
    catch { throw 'GitHub-Metadaten haben ein unerwartetes Format.' }
    finally { $iosApiResult.Output = $null }
}

function Assert-IosGitHubDestination {
    param([object]$User, [object]$Repository, [object]$Environment, [object]$Branches)
    try {
        if ($User.login -cne 'Jagdlatein' -or $Repository.full_name -cne 'Jagdlatein/jagdlatein' -or $Repository.owner.login -cne 'Jagdlatein' -or $Repository.permissions.admin -ne $true) { throw 'owner' }
        if ($Environment.name -cne 'ios-testflight' -or $Environment.deployment_branch_policy.protected_branches -ne $false -or $Environment.deployment_branch_policy.custom_branch_policies -ne $true) { throw 'environment' }
        $iosReviewerRules = @($Environment.protection_rules | Where-Object type -ceq 'required_reviewers')
        if ($iosReviewerRules.Count -ne 1) { throw 'reviewer' }
        $iosReviewers = @($iosReviewerRules[0].reviewers)
        if ($iosReviewers.Count -ne 1 -or $iosReviewers[0].type -cne 'User' -or $iosReviewers[0].reviewer.login -cne 'Jagdlatein') { throw 'reviewer' }
        $iosPolicies = @($Branches.branch_policies)
        if ($Branches.total_count -ne 2 -or $iosPolicies.Count -ne 2 -or @($iosPolicies | Where-Object type -cne 'branch').Count -ne 0) { throw 'branches' }
        $iosNames = @($iosPolicies.name | Sort-Object)
        if ($iosNames[0] -cne 'codex/ios-website-preview' -or $iosNames[1] -cne 'main') { throw 'branches' }
    } catch { throw 'Speicherziel abgewiesen: Kontoinhaber/Admin, Jagdlatein-Reviewer und exakt die zwei freigegebenen Branches muessen bestaetigt sein.' }
}

function Get-IosGitHubPrivateFilePath {
    param([string]$Path, [string]$Extension)
    $iosFile = Get-Item -LiteralPath $Path -Force
    if ($iosFile.PSIsContainer -or $iosFile.Extension -ine $Extension -or $iosFile.Length -lt 1 -or $iosFile.Length -gt 36KB) { throw 'Eine passende Apple-Datei zwischen 1 Byte und 36 KiB angeben.' }
    $iosPathPart = $iosFile.FullName
    while ($iosPathPart) {
        $iosItem = Get-Item -LiteralPath $iosPathPart -Force
        if (($iosItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Verknuepfte Apple-Dateien oder Ordner werden nicht gelesen.' }
        $iosParent = Split-Path -Parent $iosPathPart
        if ($iosParent -eq $iosPathPart) { break }
        $iosPathPart = $iosParent
    }
    return $iosFile.FullName
}

function Assert-IosGitHubSecretUpdates {
    param([string[]]$SelectedNames, [object]$Existing, [bool]$UpdateAllowed)
    try {
        $iosExistingSecrets = @($Existing.secrets)
        if ($Existing.total_count -ne $iosExistingSecrets.Count -or $iosExistingSecrets.Count -gt 100) { throw 'metadata' }
        $iosExistingNames = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
        foreach ($iosExistingSecret in $iosExistingSecrets) { [void]$iosExistingNames.Add([string]$iosExistingSecret.name) }
        foreach ($iosSelectedName in $SelectedNames) {
            if (-not $UpdateAllowed -and $iosExistingNames.Contains($iosSelectedName)) { throw 'existing' }
        }
    } catch { throw 'Ausgewaehlte Secret-Namen sind bereits vorhanden oder die Metadaten sind unvollstaendig. Ersetzen nur ausdruecklich mit -AllowUpdate.' }
}

function Save-IosGitHubSecret {
    param(
        [ValidateSet('ASC_PRIVATE_KEY_BASE64', 'IOS_CERTIFICATE_BASE64', 'IOS_CERTIFICATE_PASSWORD', 'IOS_PROFILE_BASE64')]
        [string]$Name,
        [byte[]]$Payload,
        [string]$Token,
        [bool]$UpdateAllowed = $false
    )
    if ($null -eq $Payload -or $Payload.Length -lt 1 -or $Payload.Length -gt 48KB) { throw 'GitHub-Secret muss zwischen 1 Byte und 48 KiB enthalten.' }
    # Recheck after a possibly long password prompt and before each mutation.
    # GitHub's documented endpoint is an upsert; it has no atomic create-only
    # option, so callers must avoid simultaneous writes to these same names.
    $iosCurrentSecrets = Get-IosGitHubJson -Endpoint 'repos/Jagdlatein/jagdlatein/environments/ios-testflight/secrets?per_page=100' -Token $Token
    Assert-IosGitHubSecretUpdates -SelectedNames @($Name) -Existing $iosCurrentSecrets -UpdateAllowed $UpdateAllowed
    $iosSaveResult = [Jagdlatein.IosGitHubPrivateProcess]::Run($iosGitHubExecutable, @('secret', 'set', $Name, '--repo', 'Jagdlatein/jagdlatein', '--env', 'ios-testflight'), $Payload, $Token)
    if ($iosSaveResult.ExitCode -ne 0) { throw ('Speichern fehlgeschlagen fuer ' + $Name + '. Bereits bestaetigte Secrets bleiben gespeichert.') }
    $iosSaveResult.Output = $null
    $iosSaved = Get-IosGitHubJson -Endpoint ('repos/Jagdlatein/jagdlatein/environments/ios-testflight/secrets/' + $Name) -Token $Token
    if ($iosSaved.name -cne $Name) { throw ('Speicherung konnte nicht anhand der Metadaten bestaetigt werden: ' + $Name) }
    Write-Host ('In ios-testflight gespeichert und per Metadaten bestaetigt: ' + $Name)
}

if ($Step -ne 'SaveSecrets' -and ($P8Path -or $P12Path -or $ProfilePath -or $AllowUpdate)) { throw 'Apple-Dateien und AllowUpdate werden ausschliesslich mit dem ausdruecklichen Schritt SaveSecrets verwendet.' }
if ($Step -eq 'Check') {
    [void](Assert-IosGitHubToolsPath -Path $iosGitHubExecutable)
    $iosToolPresent = Test-Path -LiteralPath $iosGitHubExecutable -PathType Leaf
    Write-Host ('Portable GitHub CLI vorhanden: ' + $iosToolPresent + '. Speicherziel: Jagdlatein/jagdlatein, ios-testflight.')
    Write-Host 'Keine Anmeldung, Netzwerkaufrufe, privaten Dateiinhalte oder gespeicherten Secrets gelesen.'
    return
}
if ($Step -eq 'InstallTools') { Install-IosGitHubTools; return }
if (-not ($P8Path -or $P12Path -or $ProfilePath)) { throw 'SaveSecrets benoetigt mindestens eine ausdruecklich angegebene Apple-Datei.' }

Assert-IosGitHubVerifiedTool
$iosFiles = [Collections.Generic.Dictionary[string,string]]::new([StringComparer]::Ordinal)
if ($P8Path) { $iosFiles.Add('ASC_PRIVATE_KEY_BASE64', (Get-IosGitHubPrivateFilePath -Path $P8Path -Extension '.p8')) }
if ($P12Path) { $iosFiles.Add('IOS_CERTIFICATE_BASE64', (Get-IosGitHubPrivateFilePath -Path $P12Path -Extension '.p12')) }
if ($ProfilePath) { $iosFiles.Add('IOS_PROFILE_BASE64', (Get-IosGitHubPrivateFilePath -Path $ProfilePath -Extension '.mobileprovision')) }
$iosToken = $null
$iosP12Password = $null
$iosPayloads = [Collections.Generic.Dictionary[string,byte[]]]::new([StringComparer]::Ordinal)
try {
    $iosToken = Get-IosGitHubToken
    $iosUser = Get-IosGitHubJson -Endpoint 'user' -Token $iosToken
    $iosRepository = Get-IosGitHubJson -Endpoint 'repos/Jagdlatein/jagdlatein' -Token $iosToken
    $iosEnvironment = Get-IosGitHubJson -Endpoint 'repos/Jagdlatein/jagdlatein/environments/ios-testflight' -Token $iosToken
    $iosBranches = Get-IosGitHubJson -Endpoint 'repos/Jagdlatein/jagdlatein/environments/ios-testflight/deployment-branch-policies?per_page=100' -Token $iosToken
    Assert-IosGitHubDestination -User $iosUser -Repository $iosRepository -Environment $iosEnvironment -Branches $iosBranches
    $iosSelectedNames = @($iosFiles.Keys)
    if ($P12Path) { $iosSelectedNames += 'IOS_CERTIFICATE_PASSWORD' }
    $iosExistingSecrets = Get-IosGitHubJson -Endpoint 'repos/Jagdlatein/jagdlatein/environments/ios-testflight/secrets?per_page=100' -Token $iosToken
    Assert-IosGitHubSecretUpdates -SelectedNames $iosSelectedNames -Existing $iosExistingSecrets -UpdateAllowed $AllowUpdate.IsPresent
    if ($P12Path) {
        $iosP12Password = Read-Host -Prompt 'Passwort der angegebenen P12-Datei (mindestens 12 Zeichen)' -AsSecureString
        try { $iosPayloads.Add('IOS_CERTIFICATE_BASE64', [Jagdlatein.IosGitHubPrivateProcess]::P12Base64($iosFiles['IOS_CERTIFICATE_BASE64'], $iosP12Password)) }
        catch { throw 'P12-Datei oder Passwort ist ungueltig, oder der private Schluessel fehlt. Es wurde kein Secret gespeichert.' }
        $iosPayloads.Add('IOS_CERTIFICATE_PASSWORD', [Jagdlatein.IosGitHubPrivateProcess]::PasswordBytes($iosP12Password))
    }
    # Prepare every supplied value before the first mutation. Raw private bytes
    # and the Base64 character buffers are cleared inside the bridge.
    foreach ($iosName in $iosFiles.Keys) {
        if ($iosName -ceq 'IOS_CERTIFICATE_BASE64') { continue }
        try { $iosPayloads.Add($iosName, [Jagdlatein.IosGitHubPrivateProcess]::FileBase64($iosFiles[$iosName])) }
        catch { throw 'Eine angegebene Apple-Datei konnte nicht sicher fuer GitHub vorbereitet werden.' }
    }
    foreach ($iosName in @('ASC_PRIVATE_KEY_BASE64', 'IOS_CERTIFICATE_BASE64', 'IOS_CERTIFICATE_PASSWORD', 'IOS_PROFILE_BASE64')) {
        if ($iosPayloads.ContainsKey($iosName)) { Save-IosGitHubSecret -Name $iosName -Payload $iosPayloads[$iosName] -Token $iosToken -UpdateAllowed $AllowUpdate.IsPresent }
    }
    Write-Host 'Die angegebenen Secrets sind gespeichert. Es wurde kein Workflow gestartet.'
} finally {
    foreach ($iosPayload in $iosPayloads.Values) { [Array]::Clear($iosPayload, 0, $iosPayload.Length) }
    $iosPayloads.Clear()
    if ($iosP12Password) { $iosP12Password.Dispose() }
    $iosToken = $null
}
