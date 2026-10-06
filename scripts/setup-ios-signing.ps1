#Requires -Version 7.4
<#
.SYNOPSIS
Erstellt eine Apple-Zertifikatsanfrage und ein verschluesseltes P12 unter Windows.
.DESCRIPTION
Ohne -Step wird ausschliesslich der lokale Status geprueft. Es gibt keine
Netzwerkaufrufe, Zertifikatsinstallation oder automatische Uebertragung.
CreateCsr erzeugt einen neuen RSA-2048-Schluessel, eine SHA-256/PKCS#10-Anfrage
und eine mit AES-256/PBKDF2 verschluesselte PKCS#8-Datei. Nur die CSR zu Apple
hochladen. Schluesseldatei und P12 nicht in Git oder in einen Chat kopieren.
ExportP12 prueft Schluesselzuordnung, Zertifikatstyp, Signaturverwendung und
Gueltigkeit. Dies ersetzt keine Apple-Vertrauenskette-/Sperrpruefung auf dem Mac.
.EXAMPLE
& .\scripts\setup-ios-signing.ps1 -Step Check
.EXAMPLE
& .\scripts\setup-ios-signing.ps1 -Step CreateCsr -CommonName 'Mein Signaturschluessel' -ContactEmail 'name@example.com'
.EXAMPLE
& .\scripts\setup-ios-signing.ps1 -Step ExportP12 -RequestId 'ANFRAGE-ID' -CertificatePath 'C:\Users\Name\Downloads\distribution.cer'
.LINK
https://learn.microsoft.com/dotnet/api/system.security.cryptography.x509certificates.certificaterequest.createsigningrequestpem
.LINK
https://learn.microsoft.com/dotnet/api/system.security.cryptography.asymmetricalgorithm.exportencryptedpkcs8privatekey
.LINK
https://learn.microsoft.com/dotnet/api/system.security.cryptography.x509certificates.x509certificate.export
#>
[CmdletBinding()]
param(
    [ValidateSet('Check', 'CreateCsr', 'ExportP12')]
    [string]$Step = 'Check',
    [string]$CommonName,
    [string]$ContactEmail,
    [ValidatePattern('^[a-f0-9]{32}$')]
    [string]$RequestId,
    [string]$CertificatePath,
    [Security.SecureString]$KeyPassword,
    [Security.SecureString]$P12Password
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $IsWindows) { throw 'Dieses Hilfsskript ist fuer PowerShell 7 unter Windows vorgesehen.' }
if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) { throw 'LOCALAPPDATA wurde nicht gefunden.' }
$iosSigningRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-signing'))

# ReadOnlySpan APIs cannot be reliably called directly from PowerShell. This
# local helper keeps plaintext passwords out of strings, logs and process args.
if (-not ('Jagdlatein.IosSigningCrypto' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace Jagdlatein {
    public static class IosSigningCrypto {
        private static char[] PasswordChars(SecureString password) {
            if (password == null || password.Length < 12 || password.Length > 1024)
                throw new ArgumentException("Passwort: 12 bis 1024 Zeichen erforderlich.");
            IntPtr pointer = IntPtr.Zero;
            var characters = new char[password.Length];
            try {
                pointer = Marshal.SecureStringToBSTR(password);
                Marshal.Copy(pointer, characters, 0, characters.Length);
                if (Array.IndexOf(characters, '\0') >= 0)
                    throw new ArgumentException("Nullzeichen sind im Passwort nicht erlaubt.");
                return characters;
            } catch {
                Array.Clear(characters, 0, characters.Length);
                throw;
            } finally {
                if (pointer != IntPtr.Zero) Marshal.ZeroFreeBSTR(pointer);
            }
        }

        public static bool PasswordsMatch(SecureString first, SecureString second) {
            char[] a = PasswordChars(first);
            char[] b = null;
            try {
                b = PasswordChars(second);
                int difference = a.Length ^ b.Length;
                for (int i = 0; i < Math.Max(a.Length, b.Length); i++)
                    difference |= (i < a.Length ? a[i] : 0) ^ (i < b.Length ? b[i] : 0);
                return difference == 0;
            } finally {
                Array.Clear(a, 0, a.Length);
                if (b != null) Array.Clear(b, 0, b.Length);
            }
        }

        public static void WriteNew(string path, byte[] bytes) {
            using (var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) {
                stream.Write(bytes, 0, bytes.Length);
                stream.Flush(true);
            }
        }

        public static string CreateCsr(string commonName, string email, SecureString password,
            string csrPath, string keyPath) {
            if (File.Exists(csrPath) || File.Exists(keyPath))
                throw new IOException("Vorhandene Dateien werden nicht ueberschrieben.");
            char[] characters = PasswordChars(password);
            byte[] encryptedKey = null;
            try {
                using (RSA key = RSA.Create(2048)) {
                    var name = new X500DistinguishedNameBuilder();
                    name.AddCommonName(commonName);
                    name.AddEmailAddress(email);
                    var request = new CertificateRequest(name.Build(), key,
                        HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
                    string csr = request.CreateSigningRequestPem();
                    encryptedKey = key.ExportEncryptedPkcs8PrivateKey(characters,
                        new PbeParameters(PbeEncryptionAlgorithm.Aes256Cbc, HashAlgorithmName.SHA256, 600000));
                    byte[] pem = Encoding.ASCII.GetBytes(PemEncoding.WriteString("ENCRYPTED PRIVATE KEY", encryptedKey) + "\n");
                    try {
                        WriteNew(keyPath, pem);
                        WriteNew(csrPath, Encoding.ASCII.GetBytes(csr + "\n"));
                    } finally { Array.Clear(pem, 0, pem.Length); }
                    return Convert.ToHexString(SHA256.HashData(key.ExportSubjectPublicKeyInfo()));
                }
            } finally {
                Array.Clear(characters, 0, characters.Length);
                if (encryptedKey != null) Array.Clear(encryptedKey, 0, encryptedKey.Length);
            }
        }

        private static void ValidateDistributionCertificate(X509Certificate2 certificate) {
            DateTime now = DateTime.UtcNow;
            if (certificate.NotBefore.ToUniversalTime() > now || certificate.NotAfter.ToUniversalTime() <= now)
                throw new InvalidOperationException("Zertifikat ist abgelaufen oder noch nicht gueltig.");
            string name = certificate.GetNameInfo(X509NameType.SimpleName, false);
            if (!name.StartsWith("Apple Distribution: ", StringComparison.Ordinal) &&
                !name.StartsWith("iPhone Distribution: ", StringComparison.Ordinal))
                throw new InvalidOperationException("Apple-Distribution-Zertifikat erwartet; kein Entwicklungszertifikat.");
            bool leaf = false, digitalSignature = false, codeSigning = false;
            foreach (X509Extension extension in certificate.Extensions) {
                if (extension.Oid.Value == "2.5.29.19") {
                    var constraint = new X509BasicConstraintsExtension(extension, extension.Critical);
                    if (constraint.CertificateAuthority)
                        throw new InvalidOperationException("Ein CA-Zertifikat kann nicht fuer die App-Signierung verwendet werden.");
                    leaf = true;
                } else if (extension.Oid.Value == "2.5.29.15") {
                    var usage = new X509KeyUsageExtension(extension, extension.Critical);
                    digitalSignature = (usage.KeyUsages & X509KeyUsageFlags.DigitalSignature) != 0;
                } else if (extension.Oid.Value == "2.5.29.37") {
                    var usage = new X509EnhancedKeyUsageExtension(extension, extension.Critical);
                    foreach (Oid oid in usage.EnhancedKeyUsages)
                        codeSigning |= oid.Value == "1.3.6.1.5.5.7.3.3";
                }
            }
            if (!leaf || !digitalSignature || !codeSigning)
                throw new InvalidOperationException("Zertifikat ist kein geeignetes Code-Signing-Endzertifikat.");
        }

        public static string ExportP12(string keyPath, string certificatePath, string outputPath,
            string expectedPublicKeyHash, SecureString keyPassword, SecureString p12Password) {
            if (File.Exists(outputPath))
                throw new IOException("Vorhandene P12-Datei wird nicht ueberschrieben.");
            char[] characters = PasswordChars(keyPassword);
            byte[] p12 = null;
            string cryptographicStage = "encryptedKeyImport";
            try {
                // Validate P12 password without creating an immutable plaintext string.
                char[] exportCharacters = PasswordChars(p12Password);
                Array.Clear(exportCharacters, 0, exportCharacters.Length);
                using (RSA key = RSA.Create()) {
                    key.ImportFromEncryptedPem(File.ReadAllText(keyPath), characters);
                    if (key.KeySize != 2048)
                        throw new InvalidOperationException("RSA-2048-Schluessel erwartet.");
                    string publicKeyHash = Convert.ToHexString(SHA256.HashData(key.ExportSubjectPublicKeyInfo()));
                    if (!String.Equals(publicKeyHash, expectedPublicKeyHash, StringComparison.Ordinal))
                        throw new InvalidOperationException("Schluessel passt nicht zur gespeicherten Anfrage.");
                    cryptographicStage = "certificateRead";
#pragma warning disable SYSLIB0057
                    using (var certificate = new X509Certificate2(File.ReadAllBytes(certificatePath))) {
#pragma warning restore SYSLIB0057
                        ValidateDistributionCertificate(certificate);
                        using (RSA publicKey = certificate.GetRSAPublicKey()) {
                            if (publicKey == null || publicKey.KeySize != 2048 ||
                                !CryptographicOperations.FixedTimeEquals(key.ExportSubjectPublicKeyInfo(), publicKey.ExportSubjectPublicKeyInfo()))
                                throw new InvalidOperationException("Zertifikat und privater Schluessel gehoeren nicht zusammen.");
                        }
                        cryptographicStage = "privateKeyCombine";
                        using (var combined = certificate.CopyWithPrivateKey(key)) {
                            cryptographicStage = "P12Export";
                            p12 = combined.Export(X509ContentType.Pkcs12, p12Password);
                            WriteNew(outputPath, p12);
                        }
                        return certificate.NotAfter.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
                    }
                }
            } catch (CryptographicException) {
                switch (cryptographicStage) {
                    case "encryptedKeyImport":
                        throw new InvalidOperationException("Verschluesselter Schluessel konnte nicht geoeffnet werden (encryptedKeyImport). Urspruengliches Schluesselpasswort pruefen.");
                    case "certificateRead":
                        throw new InvalidOperationException("Apple-CER konnte nicht verarbeitet werden (certificateRead). Heruntergeladene CER pruefen.");
                    case "privateKeyCombine":
                        throw new InvalidOperationException("Zertifikat und privater Schluessel konnten nicht verbunden werden (privateKeyCombine). Lokalen Kryptografieanbieter pruefen.");
                    default:
                        throw new InvalidOperationException("P12 konnte nicht verschluesselt exportiert werden (P12Export). Lokalen Kryptografieanbieter pruefen.");
                }
            } finally {
                Array.Clear(characters, 0, characters.Length);
                if (p12 != null) Array.Clear(p12, 0, p12.Length);
            }
        }
    }
}
'@
}

function Assert-IosSigningPath {
    param([string]$Path, [switch]$MustExist)
    $iosFullPath = [IO.Path]::GetFullPath($Path)
    if ($iosFullPath -ne $iosSigningRoot -and -not $iosFullPath.StartsWith($iosSigningRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Signierungsdatei liegt ausserhalb des vorgesehenen lokalen Ordners.'
    }
    $iosPathPart = $iosFullPath
    $iosLocalRoot = [IO.Path]::GetFullPath($env:LOCALAPPDATA).TrimEnd([IO.Path]::DirectorySeparatorChar)
    while ($iosPathPart -and ($iosPathPart -eq $iosLocalRoot -or $iosPathPart.StartsWith($iosLocalRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase))) {
        if (Test-Path -LiteralPath $iosPathPart) {
            $iosItem = Get-Item -LiteralPath $iosPathPart -Force
            if (($iosItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Verknuepfte Signierungsordner oder Dateien werden nicht verwendet.' }
        }
        $iosPathPart = Split-Path -Parent $iosPathPart
    }
    if ($MustExist -and -not (Test-Path -LiteralPath $iosFullPath -PathType Leaf)) { throw 'Die benoetigte lokale Signierungsdatei fehlt.' }
    return $iosFullPath
}

function Test-IosSigningDirectoryPrivacy {
    param([Security.AccessControl.DirectorySecurity]$Acl, [Security.Principal.SecurityIdentifier]$UserSid)
    $iosInheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
    $iosRules = @($Acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]))
    return ($Acl.AreAccessRulesProtected -and $Acl.GetOwner([Security.Principal.SecurityIdentifier]).Equals($UserSid) -and
        $iosRules.Count -eq 1 -and $iosRules[0].IdentityReference.Equals($UserSid) -and
        $iosRules[0].AccessControlType -eq [Security.AccessControl.AccessControlType]::Allow -and
        $iosRules[0].FileSystemRights -eq [Security.AccessControl.FileSystemRights]::FullControl -and
        $iosRules[0].InheritanceFlags -eq $iosInheritance -and
        $iosRules[0].PropagationFlags -eq [Security.AccessControl.PropagationFlags]::None -and -not $iosRules[0].IsInherited)
}

function Set-IosSigningDirectoryPrivacy {
    param([string]$Path)
    $iosVerifiedPath = Assert-IosSigningPath -Path $Path
    if (-not (Test-Path -LiteralPath $iosVerifiedPath -PathType Container)) { [void][IO.Directory]::CreateDirectory($iosVerifiedPath) }
    $iosUserSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $iosDirectory = [IO.DirectoryInfo]::new($iosVerifiedPath)
    $iosReadSections = [Security.AccessControl.AccessControlSections]::Access -bor [Security.AccessControl.AccessControlSections]::Owner
    $iosExistingAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosDirectory, $iosReadSections)
    if (Test-IosSigningDirectoryPrivacy -Acl $iosExistingAcl -UserSid $iosUserSid) { return }
    if (-not $iosExistingAcl.GetOwner([Security.Principal.SecurityIdentifier]).Equals($iosUserSid)) {
        throw 'Signierungsordner gehoert nicht dem aktuellen Benutzer. Keine Berechtigungen wurden geaendert.'
    }
    $iosAcl = [Security.AccessControl.DirectorySecurity]::new()
    $iosAcl.SetAccessRuleProtection($true, $false)
    $iosInheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
    $iosAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($iosUserSid, [Security.AccessControl.FileSystemRights]::FullControl, $iosInheritance, [Security.AccessControl.PropagationFlags]::None, [Security.AccessControl.AccessControlType]::Allow))
    # Persist only the changed DACL; resetting owner/SACL can require privileges
    # that a normal user does not have, even on an already private directory.
    [IO.FileSystemAclExtensions]::SetAccessControl($iosDirectory, $iosAcl)
    $iosVerifiedAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosDirectory, $iosReadSections)
    if (-not (Test-IosSigningDirectoryPrivacy -Acl $iosVerifiedAcl -UserSid $iosUserSid)) {
        throw 'Signierungsordner konnte nicht auf ausschliesslich private Benutzerrechte beschraenkt werden.'
    }
}

function Read-IosSigningPassword {
    param([string]$Prompt, [switch]$Confirm)
    $iosPassword = Read-Host -Prompt $Prompt -AsSecureString
    try {
        if ($Confirm) {
            $iosConfirmation = Read-Host -Prompt 'Dasselbe Passwort nochmals eingeben' -AsSecureString
            try {
                if (-not [Jagdlatein.IosSigningCrypto]::PasswordsMatch($iosPassword, $iosConfirmation)) { throw 'Passwoerter stimmen nicht ueberein.' }
            } finally { $iosConfirmation.Dispose() }
        } elseif ($iosPassword.Length -lt 12 -or $iosPassword.Length -gt 1024) {
            throw 'Passwort: 12 bis 1024 Zeichen erforderlich.'
        }
        return $iosPassword
    } catch {
        $iosPassword.Dispose()
        throw
    }
}

if ($Step -eq 'Check') {
    [void](Assert-IosSigningPath -Path $iosSigningRoot)
    $iosRequestCount = if (Test-Path -LiteralPath $iosSigningRoot -PathType Container) {
        @(Get-ChildItem -LiteralPath $iosSigningRoot -Directory -Force | Where-Object Name -match '^[a-f0-9]{32}$').Count
    } else { 0 }
    Write-Host ('Lokale Anfragen: ' + $iosRequestCount + '. Es wurden keine Schluessel erzeugt oder gelesen.')
    Write-Host ('Signierungsordner: ' + $iosSigningRoot)
    return
}

if ($Step -eq 'CreateCsr') {
    if ([string]::IsNullOrWhiteSpace($CommonName) -or $CommonName.Length -gt 64 -or $CommonName -match '[\x00-\x1f\x7f]') { throw 'CommonName muss einen ausdruecklich angegebenen Namen mit 1 bis 64 Zeichen enthalten.' }
    if ([string]::IsNullOrWhiteSpace($ContactEmail) -or $ContactEmail -match '[\x00-\x20\x7f]') { throw 'Eine gueltige oeffentliche Kontakt-E-Mail ist erforderlich.' }
    try { $iosMail = [Net.Mail.MailAddress]::new($ContactEmail) } catch { throw 'Kontakt-E-Mail ist ungueltig.' }
    if ($iosMail.Address -ne $ContactEmail) { throw 'Nur die E-Mail-Adresse angeben, ohne Anzeigename.' }
    if ($RequestId -or $CertificatePath -or $P12Password) { throw 'CreateCsr verwendet nur CommonName, ContactEmail und optional KeyPassword.' }
    $iosOwnKeyPassword = $null -eq $KeyPassword
    if ($iosOwnKeyPassword) { $KeyPassword = Read-IosSigningPassword -Prompt 'Neues Passwort fuer den privaten Schluessel (mindestens 12 Zeichen)' -Confirm }
    try {
        [void][Jagdlatein.IosSigningCrypto]::PasswordsMatch($KeyPassword, $KeyPassword)
        Set-IosSigningDirectoryPrivacy -Path $iosSigningRoot
        $iosNewRequestId = [Guid]::NewGuid().ToString('N')
        $iosRequestDirectory = Assert-IosSigningPath -Path (Join-Path $iosSigningRoot $iosNewRequestId)
        if (Test-Path -LiteralPath $iosRequestDirectory) { throw 'Anfrageordner existiert bereits. Nichts wurde ueberschrieben.' }
        Set-IosSigningDirectoryPrivacy -Path $iosRequestDirectory
        $iosCsrPath = Assert-IosSigningPath -Path (Join-Path $iosRequestDirectory 'distribution.certSigningRequest')
        $iosKeyPath = Assert-IosSigningPath -Path (Join-Path $iosRequestDirectory 'distribution.key.pem')
        $iosPublicKeyHash = [Jagdlatein.IosSigningCrypto]::CreateCsr($CommonName.Trim(), $ContactEmail, $KeyPassword, $iosCsrPath, $iosKeyPath)
        $iosMetadata = @{ schemaVersion = 1; requestId = $iosNewRequestId; createdAtUtc = [DateTime]::UtcNow.ToString('o'); algorithm = 'RSA-2048/SHA-256'; publicKeySha256 = $iosPublicKeyHash } | ConvertTo-Json
        [Jagdlatein.IosSigningCrypto]::WriteNew((Join-Path $iosRequestDirectory 'request.json'), [Text.Encoding]::UTF8.GetBytes($iosMetadata))
        Write-Host ('Anfrage-ID: ' + $iosNewRequestId)
        Write-Host ('Nur diese Datei bei Apple hochladen: ' + $iosCsrPath)
        Write-Host 'Der private Schluessel bleibt verschluesselt lokal. Passwort sicher aufbewahren.'
    } finally { if ($iosOwnKeyPassword) { $KeyPassword.Dispose() } }
    return
}

if (-not $RequestId -or [string]::IsNullOrWhiteSpace($CertificatePath)) { throw 'ExportP12 benoetigt RequestId und den Pfad zur heruntergeladenen Apple-CER.' }
if ($CommonName -or $ContactEmail) { throw 'ExportP12 verwendet die vorhandene Anfrage; keine neuen Identitaetsangaben.' }
$iosRequestDirectory = Assert-IosSigningPath -Path (Join-Path $iosSigningRoot $RequestId)
$iosMetadataPath = Assert-IosSigningPath -Path (Join-Path $iosRequestDirectory 'request.json') -MustExist
$iosKeyPath = Assert-IosSigningPath -Path (Join-Path $iosRequestDirectory 'distribution.key.pem') -MustExist
$iosP12Path = Assert-IosSigningPath -Path (Join-Path $iosRequestDirectory 'distribution.p12')
if (Test-Path -LiteralPath $iosP12Path) { throw 'Die P12-Datei existiert bereits. Nichts wird ueberschrieben.' }
$iosCertificate = Get-Item -LiteralPath $CertificatePath -Force
if ($iosCertificate.PSIsContainer -or $iosCertificate.Extension -ne '.cer' -or $iosCertificate.Length -gt 65536 -or ($iosCertificate.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Eine unverknuepfte Apple-CER-Datei bis 64 KiB erwartet.' }
$iosMetadata = Get-Content -LiteralPath $iosMetadataPath -Raw | ConvertFrom-Json
if ($iosMetadata.schemaVersion -ne 1 -or $iosMetadata.requestId -ne $RequestId -or $iosMetadata.publicKeySha256 -notmatch '^[A-F0-9]{64}$') { throw 'Anfrageinformationen sind ungueltig.' }
$iosOwnKeyPassword = $null -eq $KeyPassword
$iosOwnP12Password = $null -eq $P12Password
try {
    if ($iosOwnKeyPassword) { $KeyPassword = Read-IosSigningPassword -Prompt 'Passwort der vorhandenen privaten Schluesseldatei' }
    if ($iosOwnP12Password) { $P12Password = Read-IosSigningPassword -Prompt 'Neues Passwort fuer die P12-Datei (mindestens 12 Zeichen)' -Confirm }
    Set-IosSigningDirectoryPrivacy -Path $iosRequestDirectory
    $iosExpires = [Jagdlatein.IosSigningCrypto]::ExportP12($iosKeyPath, $iosCertificate.FullName, $iosP12Path, $iosMetadata.publicKeySha256, $KeyPassword, $P12Password)
    Write-Host ('Verschluesselte P12 vorbereitet: ' + $iosP12Path)
    Write-Host ('Zertifikat gueltig bis (UTC): ' + $iosExpires)
    Write-Host 'Noch nichts installiert oder uebertragen. Der Mac-Build prueft Signierungsidentitaet, Profil und App-Signatur. Keine gesonderte Sperrpruefung eingerichtet.'
} finally {
    if ($iosOwnKeyPassword -and $KeyPassword) { $KeyPassword.Dispose() }
    if ($iosOwnP12Password -and $P12Password) { $P12Password.Dispose() }
}
