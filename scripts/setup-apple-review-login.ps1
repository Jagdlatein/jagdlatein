# Requires Windows PowerShell 5.1+ or PowerShell 7 on Windows, Node.js 22, and
# installed project dependencies (bcryptjs). This only prepares local material.
# The real account must first be verified through the normal email process;
# a database row alone is not evidence of email ownership or approval to activate.
[CmdletBinding()]
param(
    [ValidateSet('Prepare', 'Check', 'CopyCredentials')][string]$Step = 'Check',
    [ValidatePattern('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')][string]$RecordId,
    [ValidateSet('Password', 'VercelSecrets')][string]$CopyPart = 'Password',
    [string]$ProjectPath = 'C:\Projekte\jagdlatein-github',
    [string]$NodePath
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ($env:OS -ne 'Windows_NT') { throw 'Dieser Helfer benoetigt Windows mit benutzergebundener DPAPI.' }
Add-Type -AssemblyName System.Security
$taskUserSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$taskEncoding = [Text.UTF8Encoding]::new($false, $true)
$taskEntropy = $taskEncoding.GetBytes('Jagdlatein.AppleReviewLogin.v1')
$taskLocalAppData = [Environment]::GetFolderPath([Environment+SpecialFolder]::LocalApplicationData)
if (-not $taskLocalAppData -or $taskLocalAppData.StartsWith('\\')) { throw 'Lokales AppData-Verzeichnis erforderlich.' }
$taskRoot = [IO.Path]::GetFullPath((Join-Path $taskLocalAppData 'Jagdlatein\apple-review-login'))
if ([IO.DriveInfo]::new([IO.Path]::GetPathRoot($taskRoot)).DriveType -eq 'Network') { throw 'Lokaler Datentraeger erforderlich.' }
$taskProject = [IO.Path]::GetFullPath($ProjectPath)
if (-not (Test-Path -LiteralPath (Join-Path $taskProject 'package.json') -PathType Leaf)) { throw 'Projekt und installierte bcryptjs-Abhaengigkeit erforderlich.' }

function Assert-TaskPathWithoutReparse([string]$Path) {
    $taskProbe = [IO.Path]::GetFullPath($Path)
    while ($taskProbe) {
        if (Test-Path -LiteralPath $taskProbe) {
            $taskItem = Get-Item -LiteralPath $taskProbe -Force
            if (($taskItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw 'Umgeleitete Pfade oder Junctions sind fuer diesen privaten Datensatz nicht erlaubt.'
            }
        }
        $taskParent = [IO.Directory]::GetParent($taskProbe)
        $taskProbe = if ($taskParent) { $taskParent.FullName } else { $null }
    }
}
function Set-PrivateTaskAcl([string]$Path, [bool]$Directory) {
    Assert-TaskPathWithoutReparse $Path
    if ($Directory) {
        $taskAcl = [Security.AccessControl.DirectorySecurity]::new()
        $taskRule = [Security.AccessControl.FileSystemAccessRule]::new($taskUserSid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    } else {
        $taskAcl = [Security.AccessControl.FileSecurity]::new()
        $taskRule = [Security.AccessControl.FileSystemAccessRule]::new($taskUserSid, 'FullControl', 'Allow')
    }
    $taskAcl.SetOwner($taskUserSid)
    $taskAcl.SetAccessRuleProtection($true, $false)
    $taskAcl.AddAccessRule($taskRule)
    Set-Acl -LiteralPath $Path -AclObject $taskAcl
}
function Assert-PrivateTaskAcl([string]$Path) {
    Assert-TaskPathWithoutReparse $Path
    $taskAcl = Get-Acl -LiteralPath $Path
    if ($taskAcl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $taskUserSid.Value) { throw 'Datensatz gehoert nicht diesem Windows-Benutzer.' }
    if (-not $taskAcl.AreAccessRulesProtected) { throw 'Datensatz besitzt keine geschuetzten Benutzerrechte.' }
    $taskOwnAccess = $false
    foreach ($taskRule in $taskAcl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier])) {
        if ($taskRule.AccessControlType -eq 'Allow' -and $taskRule.IdentityReference.Value -ne $taskUserSid.Value) {
            throw 'Datensatz besitzt keine ausschliesslich benutzergebundenen Rechte.'
        }
        if ($taskRule.AccessControlType -eq 'Allow' -and $taskRule.IdentityReference.Value -eq $taskUserSid.Value -and
            ($taskRule.FileSystemRights -band [Security.AccessControl.FileSystemRights]::FullControl) -eq [Security.AccessControl.FileSystemRights]::FullControl) {
            $taskOwnAccess = $true
        }
    }
    if (-not $taskOwnAccess) { throw 'Explizite Benutzerrechte fehlen; eine leere oder NULL-DACL ist nicht erlaubt.' }
}
function Get-TaskNode {
    $taskExecutable = $NodePath
    if (-not $taskExecutable) {
        $taskCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
        if (-not $taskCommand) { throw 'Node.js 22 installieren oder -NodePath angeben.' }
        $taskExecutable = $taskCommand.Source
    }
    $taskExecutable = [IO.Path]::GetFullPath($taskExecutable)
    if (-not (Test-Path -LiteralPath $taskExecutable -PathType Leaf)) { throw 'Node.js 22 nicht gefunden.' }
    $taskProcess = [Diagnostics.Process]::new()
    $taskProcess.StartInfo = [Diagnostics.ProcessStartInfo]::new($taskExecutable, '--version')
    $taskProcess.StartInfo.UseShellExecute = $false
    $taskProcess.StartInfo.CreateNoWindow = $true
    $taskProcess.StartInfo.RedirectStandardOutput = $true
    $taskProcess.StartInfo.RedirectStandardError = $true
    try {
        $null = $taskProcess.Start()
        $taskVersion = $taskProcess.StandardOutput.ReadToEnd().Trim()
        $null = $taskProcess.StandardError.ReadToEnd()
        $taskProcess.WaitForExit()
        if ($taskProcess.ExitCode -ne 0 -or $taskVersion -notmatch '^v22\.\d+\.\d+$') { throw 'Node.js 22 erforderlich; -NodePath auf die passende node.exe setzen.' }
    } finally { $taskProcess.Dispose() }
    return $taskExecutable
}
function Invoke-PrivateTaskNode([object]$InputData) {
    # Only this fixed script is an argument. Credentials enter through stdin,
    # never through the command line, environment, repository or logs.
    $taskNodeScript = @'
const fs=require('fs');const path=require('path');const {createRequire}=require('module');
(async()=>{try{const x=JSON.parse(fs.readFileSync(0,'utf8'));const bcrypt=createRequire(path.join(x.project,'package.json'))('bcryptjs');
if(x.mode==='hash'){const hash=await bcrypt.hash(x.password,12);if(!await bcrypt.compare(x.password,hash))throw Error();process.stdout.write(JSON.stringify({hash}));}
else if(x.mode==='check'){process.stdout.write(JSON.stringify({valid:await bcrypt.compare(x.password,x.hash)}));}else throw Error();
}catch{process.stderr.write('Lokale Passwortpruefung fehlgeschlagen.');process.exitCode=1;}})();
'@
    $taskScript64 = [Convert]::ToBase64String($taskEncoding.GetBytes($taskNodeScript))
    $taskExecutable = Get-TaskNode
    $taskProcess = [Diagnostics.Process]::new()
    $taskProcess.StartInfo = [Diagnostics.ProcessStartInfo]::new()
    $taskProcess.StartInfo.FileName = $taskExecutable
    $taskProcess.StartInfo.Arguments = '-e "eval(Buffer.from(''' + $taskScript64 + ''',''base64'').toString(''utf8''))"'
    $taskProcess.StartInfo.UseShellExecute = $false
    $taskProcess.StartInfo.CreateNoWindow = $true
    $taskProcess.StartInfo.RedirectStandardInput = $true
    $taskProcess.StartInfo.RedirectStandardOutput = $true
    $taskProcess.StartInfo.RedirectStandardError = $true
    $taskProcess.StartInfo.WorkingDirectory = $taskProject
    $taskResult = $null
    try {
        $null = $taskProcess.Start()
        $taskProcess.StandardInput.Write(($InputData | ConvertTo-Json -Compress))
        $taskProcess.StandardInput.Close()
        $taskResult = $taskProcess.StandardOutput.ReadToEnd()
        $null = $taskProcess.StandardError.ReadToEnd()
        $taskProcess.WaitForExit()
        if ($taskProcess.ExitCode -ne 0 -or $taskResult.Length -gt 4096) { throw 'Lokale Passwortpruefung fehlgeschlagen; es wurde nichts uebertragen.' }
        try { return ($taskResult | ConvertFrom-Json) } catch { throw 'Lokale Passwortpruefung lieferte kein gueltiges Ergebnis.' }
    } finally { $taskProcess.Dispose(); $taskResult = $null; $InputData = $null }
}
function Read-PrivateTaskRecord {
    if (-not $RecordId) { throw 'Zum Pruefen/Kopieren -RecordId mit der beim Prepare ausgegebenen Datensatzkennung angeben.' }
    $taskDirectory = Join-Path $taskRoot $RecordId
    $taskFile = Join-Path $taskDirectory 'credentials.dpapi.json'
    Assert-TaskPathWithoutReparse $taskFile
    if (-not (Test-Path -LiteralPath $taskFile -PathType Leaf)) { throw 'Lokaler verschluesselter Datensatz nicht gefunden.' }
    Assert-PrivateTaskAcl $taskRoot
    Assert-PrivateTaskAcl $taskDirectory
    Assert-PrivateTaskAcl $taskFile
    $taskBytes = $null
    try {
        if ((Get-Item -LiteralPath $taskFile).Length -gt 16384) { throw 'Datensatz zu gross.' }
        $taskStored = [IO.File]::ReadAllText($taskFile, $taskEncoding) | ConvertFrom-Json
        if ($taskStored.format -ne 'Jagdlatein.AppleReviewLogin.v1' -or $taskStored.recordId -ne $RecordId) { throw 'Ungueltiger Datensatz.' }
        $taskCipher = [Convert]::FromBase64String($taskStored.protectedData)
        $taskBytes = [Security.Cryptography.ProtectedData]::Unprotect($taskCipher, $taskEntropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
        $taskRecord = $taskEncoding.GetString($taskBytes) | ConvertFrom-Json
        if ($taskRecord.password -notmatch '^[A-Za-z0-9_-]{43}$' -or $taskRecord.passwordHash -notmatch '^\$2[ab]\$12\$[./A-Za-z0-9]{53}$' -or
            $taskRecord.credentialId -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') { throw 'Ungueltige Zugangsdaten.' }
        return $taskRecord
    } catch { throw 'Datensatz kann unter diesem Windows-Benutzer nicht sicher gelesen werden.' }
    finally { if ($taskBytes) { [Array]::Clear($taskBytes, 0, $taskBytes.Length) } }
}

if ($Step -eq 'Prepare') {
    if ($RecordId) { throw 'Prepare erzeugt immer einen neuen Datensatz; keine vorhandene RecordId angeben.' }
    $taskRandom = [byte[]]::new(32)
    $taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $taskPlain = $null; $taskRecord = $null; $taskPassword = $null; $taskHash = $null
    try {
        $taskRng.GetBytes($taskRandom)
        $taskPassword = [Convert]::ToBase64String($taskRandom).TrimEnd('=').Replace('+', '-').Replace('/', '_')
        $taskHash = Invoke-PrivateTaskNode @{ mode = 'hash'; project = $taskProject; password = $taskPassword }
        if ($taskHash.hash -notmatch '^\$2[ab]\$12\$[./A-Za-z0-9]{53}$') { throw 'Lokaler Passwort-Hash ungueltig.' }
        $taskNewId = [guid]::NewGuid().ToString()
        $taskCredentialId = [guid]::NewGuid().ToString()
        $taskCreated = [DateTime]::UtcNow.ToString('o')
        $taskRecord = @{ password = $taskPassword; passwordHash = $taskHash.hash; credentialId = $taskCredentialId; createdAtUtc = $taskCreated }
        $taskPlain = $taskEncoding.GetBytes(($taskRecord | ConvertTo-Json -Compress))
        $taskProtected = [Security.Cryptography.ProtectedData]::Protect($taskPlain, $taskEntropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
        Assert-TaskPathWithoutReparse $taskRoot
        $null = [IO.Directory]::CreateDirectory($taskRoot)
        Set-PrivateTaskAcl $taskRoot $true
        $taskDirectory = Join-Path $taskRoot $taskNewId
        if (Test-Path -LiteralPath $taskDirectory) { throw 'Datensatzpfad existiert bereits; nichts ueberschrieben.' }
        $null = [IO.Directory]::CreateDirectory($taskDirectory)
        Set-PrivateTaskAcl $taskDirectory $true
        $taskFile = Join-Path $taskDirectory 'credentials.dpapi.json'
        Assert-TaskPathWithoutReparse $taskFile
        $taskStored = @{ format = 'Jagdlatein.AppleReviewLogin.v1'; recordId = $taskNewId; createdAtUtc = $taskCreated; protectedData = [Convert]::ToBase64String($taskProtected) } | ConvertTo-Json
        $taskStream = [IO.File]::Open($taskFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        try { $taskEncoded = $taskEncoding.GetBytes($taskStored); $taskStream.Write($taskEncoded, 0, $taskEncoded.Length) } finally { $taskStream.Dispose() }
        Set-PrivateTaskAcl $taskFile $false
        Write-Host "Lokal verschluesselt vorbereitet. RecordId: $taskNewId"
        Write-Host "Datei: $taskFile"
        Write-Host 'Anmeldung bleibt ausgeschaltet. Passwort-Hash und neue Credential-ID bilden ein gemeinsames Rotationspaar; die neue ID widerruft alte Reviewsitzungen.'
        Write-Host 'Vor Aktivierung das eigene unprivilegierte Konto normal per E-Mail bestaetigen und die konkrete 14-Tage-Bindung pruefen/freigeben.'
    } finally {
        $taskRng.Dispose(); [Array]::Clear($taskRandom, 0, $taskRandom.Length)
        if ($taskPlain) { [Array]::Clear($taskPlain, 0, $taskPlain.Length) }
        $taskPassword = $null; $taskRecord = $null; $taskHash = $null
    }
} else {
    $taskRecord = Read-PrivateTaskRecord
    try {
        $taskCheck = Invoke-PrivateTaskNode @{ mode = 'check'; project = $taskProject; password = $taskRecord.password; hash = $taskRecord.passwordHash }
        if ($taskCheck.valid -ne $true) { throw 'Passwort und bcrypt-Hash stimmen nicht ueberein.' }
        if ($Step -eq 'Check') { Write-Host 'Lokaler DPAPI-Datensatz, Benutzerrechte, Node 22 und bcrypt12-Passwortpaar erfolgreich geprueft. Keine Aktivierung.' }
        else {
            Assert-TaskPathWithoutReparse (Join-Path (Join-Path $taskRoot $RecordId) 'credentials.dpapi.json')
            if ($CopyPart -eq 'Password') { Set-Clipboard -Value $taskRecord.password; Write-Host 'Nur das Pruefkonto-Passwort ist kopiert. Gezielt in das vorgesehene Passwortfeld einfuegen; danach Zwischenablage leeren.' }
            else {
                $taskCopy = "APPLE_REVIEW_LOGIN_ENABLED=false`nAPPLE_REVIEW_LOGIN_PASSWORD_HASH=$($taskRecord.passwordHash)`nAPPLE_REVIEW_LOGIN_CREDENTIAL_ID=$($taskRecord.credentialId)"
                Set-Clipboard -Value $taskCopy
                Write-Host 'Lokales Konfigurationspaar kopiert; enabled bleibt false. Hash als Secret ausschliesslich im spaeter ausdruecklich freigegebenen Projekt speichern und Zwischenablage danach leeren.'
                $taskCopy = $null
            }
        }
    } finally { $taskRecord = $null; $taskCheck = $null }
}
