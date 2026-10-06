#Requires -Version 7.4
# Synthetic local cryptography fixtures only. No real Apple identity or account.
[CmdletBinding()]
param([switch]$PrivacyOnly)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$iosHelperPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'setup-ios-signing.ps1'
if (-not $PrivacyOnly) {
    $iosRealSigningRoot = Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-signing'
    $iosRootExisted = Test-Path -LiteralPath $iosRealSigningRoot
    & $iosHelperPath -Step Check
    if (-not $iosRootExisted -and (Test-Path -LiteralPath $iosRealSigningRoot)) { throw 'Default-Check hat einen Signierungsordner angelegt.' }
}

$iosTestRoot = Join-Path ([IO.Path]::GetTempPath()) ('jagdlatein-ios-signing-test-' + [Guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($iosTestRoot)
try {
    & {
        $iosPreviousLocalAppData = $env:LOCALAPPDATA
        try {
            $env:LOCALAPPDATA = Join-Path $iosTestRoot 'local-appdata'
            . $iosHelperPath -Step Check
            $iosPrivacyDirectory = Join-Path $env:LOCALAPPDATA 'Jagdlatein\ios-signing'
            Set-IosSigningDirectoryPrivacy -Path $iosPrivacyDirectory
            $iosPrivacySections = [Security.AccessControl.AccessControlSections]::Access -bor [Security.AccessControl.AccessControlSections]::Owner
            $iosPrivacyInfo = [IO.DirectoryInfo]::new($iosPrivacyDirectory)
            $iosFirstPrivacyAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosPrivacyInfo, $iosPrivacySections)
            $iosExpectedSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
            $iosPrivacyRules = @($iosFirstPrivacyAcl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]))
            $iosExpectedInheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
            if (-not $iosFirstPrivacyAcl.AreAccessRulesProtected -or -not $iosFirstPrivacyAcl.GetOwner([Security.Principal.SecurityIdentifier]).Equals($iosExpectedSid) -or
                $iosPrivacyRules.Count -ne 1 -or -not $iosPrivacyRules[0].IdentityReference.Equals($iosExpectedSid) -or
                $iosPrivacyRules[0].AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow -or
                $iosPrivacyRules[0].FileSystemRights -ne [Security.AccessControl.FileSystemRights]::FullControl -or
                $iosPrivacyRules[0].InheritanceFlags -ne $iosExpectedInheritance -or
                $iosPrivacyRules[0].PropagationFlags -ne [Security.AccessControl.PropagationFlags]::None -or $iosPrivacyRules[0].IsInherited) {
                throw 'Erster Datenschutzaufruf hat keine ausschliesslich privaten vererbbaren Benutzerrechte hergestellt.'
            }
            $iosFirstPrivacySddl = $iosFirstPrivacyAcl.GetSecurityDescriptorSddlForm($iosPrivacySections)
            Set-IosSigningDirectoryPrivacy -Path $iosPrivacyDirectory
            $iosRepeatedPrivacyAcl = [IO.FileSystemAclExtensions]::GetAccessControl($iosPrivacyInfo, $iosPrivacySections)
            if ($iosRepeatedPrivacyAcl.GetSecurityDescriptorSddlForm($iosPrivacySections) -ne $iosFirstPrivacySddl) {
                throw 'Wiederholter Datenschutzaufruf hat Eigentuemer oder private Benutzerrechte veraendert.'
            }
        } finally { $env:LOCALAPPDATA = $iosPreviousLocalAppData }
    }
    Write-Host 'iOS-Signierung: erster und wiederholter Verzeichnisschutz mit isoliertem LOCALAPPDATA bestanden.'
    if ($PrivacyOnly) { return }
    Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Reflection;
using System.Runtime.ExceptionServices;
using System.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace Jagdlatein {
    public static class IosSigningTests {
        private static Type ActualCrypto;
        // PowerShell Add-Type emits an in-memory assembly. Invoke the actual
        // loaded production helper rather than recompiling its implementation.
        private static class IosSigningCrypto {
            private static object Call(string method, params object[] args) {
                try { return ActualCrypto.GetMethod(method).Invoke(null, args); }
                catch (TargetInvocationException exception) {
                    ExceptionDispatchInfo.Capture(exception.InnerException).Throw();
                    throw;
                }
            }
            public static bool PasswordsMatch(SecureString a, SecureString b) => (bool)Call("PasswordsMatch", a, b);
            public static void WriteNew(string path, byte[] bytes) => Call("WriteNew", path, bytes);
            public static string CreateCsr(string name, string email, SecureString password, string csr, string key) =>
                (string)Call("CreateCsr", name, email, password, csr, key);
            public static string ExportP12(string key, string cert, string output, string hash, SecureString keyPassword, SecureString p12Password) =>
                (string)Call("ExportP12", key, cert, output, hash, keyPassword, p12Password);
        }
        private const string FixturePassword = "synthetic-fixture-password-only";
        private static SecureString Password(string value) {
            var password = new SecureString();
            foreach (char character in value) password.AppendChar(character);
            password.MakeReadOnly();
            return password;
        }
        private static void Require(bool condition, string message) {
            if (!condition) throw new Exception(message);
        }
        private static void Reject(Action action, string outputPath, string message) {
            bool rejected = false;
            try { action(); } catch (InvalidOperationException) { rejected = true; }
            Require(rejected, message);
            Require(!File.Exists(outputPath), "Abgewiesener Export hat eine Datei hinterlassen.");
        }
        private static string Certificate(string directory, string filename, RSA key, bool ca,
            DateTimeOffset before, DateTimeOffset after, string name = "Apple Distribution: SYNTHETIC TEST ONLY (TESTONLY00)", bool eku = true) {
            var subject = new X500DistinguishedNameBuilder();
            subject.AddCommonName(name);
            var request = new CertificateRequest(subject.Build(), key, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
            request.CertificateExtensions.Add(new X509BasicConstraintsExtension(ca, false, 0, true));
            request.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature, true));
            if (eku) request.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(
                new OidCollection { new Oid("1.3.6.1.5.5.7.3.3") }, false));
            string path = Path.Combine(directory, filename);
            using (var certificate = request.CreateSelfSigned(before, after))
                IosSigningCrypto.WriteNew(path, certificate.Export(X509ContentType.Cert));
            return path;
        }
        public static int Run(string directory, Type actualCrypto) {
            ActualCrypto = actualCrypto;
            int passed = 0;
            using (var password = Password(FixturePassword))
            using (var wrongPassword = Password("different-fixture-password"))
            using (var shortPassword = Password("short")) {
                Require(IosSigningCrypto.PasswordsMatch(password, password), "Passwortvergleich fehlgeschlagen.");
                Require(!IosSigningCrypto.PasswordsMatch(password, wrongPassword), "Abweichendes Passwort akzeptiert.");
                bool shortRejected = false;
                try { IosSigningCrypto.PasswordsMatch(shortPassword, shortPassword); } catch (ArgumentException) { shortRejected = true; }
                Require(shortRejected, "Zu kurzes Passwort akzeptiert.");
                passed++;
                string csrPath = Path.Combine(directory, "synthetic.certSigningRequest");
                string keyPath = Path.Combine(directory, "synthetic.key.pem");
                string fingerprint = IosSigningCrypto.CreateCsr("SYNTHETIC TEST ONLY", "synthetic@example.invalid", password, csrPath, keyPath);
                string keyPem = File.ReadAllText(keyPath);
                Require(keyPem.StartsWith("-----BEGIN ENCRYPTED PRIVATE KEY-----"), "Schluesseldatei ist nicht verschluesselt.");
                var csr = CertificateRequest.LoadSigningRequestPem(File.ReadAllText(csrPath), HashAlgorithmName.SHA256,
                    CertificateRequestLoadOptions.Default, RSASignaturePadding.Pkcs1);
                Require(csr.SubjectName.Name.Contains("SYNTHETIC TEST ONLY") && csr.SubjectName.Name.Contains("synthetic@example.invalid"), "CSR-Identitaet fehlt.");
                using (RSA csrKey = csr.PublicKey.GetRSAPublicKey())
                    Require(csrKey != null && csrKey.KeySize == 2048, "CSR ist nicht RSA-2048.");
                passed++;
                byte[] originalEncrypted = File.ReadAllBytes(keyPath);
                bool overwriteRejected = false;
                try { IosSigningCrypto.CreateCsr("SYNTHETIC", "synthetic@example.invalid", password, csrPath, keyPath); }
                catch (IOException) { overwriteRejected = true; }
                Require(overwriteRejected && CryptographicOperations.FixedTimeEquals(originalEncrypted, File.ReadAllBytes(keyPath)), "Vorhandener Schluessel wurde veraendert.");
                passed++;
                using (RSA key = RSA.Create())
                using (RSA otherKey = RSA.Create(2048)) {
                    key.ImportFromEncryptedPem(keyPem, FixturePassword);
                    DateTimeOffset now = DateTimeOffset.UtcNow;
                    string cert = Certificate(directory, "valid.cer", key, false, now.AddMinutes(-1), now.AddDays(1));
                    string p12Path = Path.Combine(directory, "valid.p12");
                    IosSigningCrypto.ExportP12(keyPath, cert, p12Path, fingerprint, password, password);
#pragma warning disable SYSLIB0057
                    using (var p12 = new X509Certificate2(File.ReadAllBytes(p12Path), password, X509KeyStorageFlags.EphemeralKeySet)) {
#pragma warning restore SYSLIB0057
                        Require(p12.HasPrivateKey, "P12 enthaelt keinen privaten Schluessel.");
                        using (RSA imported = p12.GetRSAPrivateKey())
                            Require(CryptographicOperations.FixedTimeEquals(key.ExportSubjectPublicKeyInfo(), imported.ExportSubjectPublicKeyInfo()), "P12-Key stimmt nicht.");
                    }
                    passed++;
                    string badOutput = Path.Combine(directory, "rejected.p12");
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, cert, badOutput, fingerprint, wrongPassword, password), badOutput, "Falsches Key-Passwort akzeptiert.");
                    passed++;
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, cert, badOutput, new string('0', 64), password, password), badOutput, "Falsche Anfragezuordnung akzeptiert.");
                    passed++;
                    string mismatch = Certificate(directory, "mismatch.cer", otherKey, false, now.AddMinutes(-1), now.AddDays(1));
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, mismatch, badOutput, fingerprint, password, password), badOutput, "Anderer Zertifikatschluessel akzeptiert.");
                    passed++;
                    string ca = Certificate(directory, "ca.cer", key, true, now.AddMinutes(-1), now.AddDays(1));
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, ca, badOutput, fingerprint, password, password), badOutput, "CA akzeptiert.");
                    passed++;
                    string expired = Certificate(directory, "expired.cer", key, false, now.AddDays(-2), now.AddDays(-1));
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, expired, badOutput, fingerprint, password, password), badOutput, "Abgelaufenes Zertifikat akzeptiert.");
                    passed++;
                    string future = Certificate(directory, "future.cer", key, false, now.AddDays(1), now.AddDays(2));
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, future, badOutput, fingerprint, password, password), badOutput, "Noch nicht gueltiges Zertifikat akzeptiert.");
                    passed++;
                    string development = Certificate(directory, "development.cer", key, false, now.AddMinutes(-1), now.AddDays(1), "Apple Development: SYNTHETIC TEST ONLY");
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, development, badOutput, fingerprint, password, password), badOutput, "Entwicklungszertifikat akzeptiert.");
                    passed++;
                    string noCodeSigning = Certificate(directory, "no-code-signing.cer", key, false, now.AddMinutes(-1), now.AddDays(1), eku: false);
                    Reject(() => IosSigningCrypto.ExportP12(keyPath, noCodeSigning, badOutput, fingerprint, password, password), badOutput, "Zertifikat ohne Code-Signing akzeptiert.");
                    passed++;
                    byte[] originalP12 = File.ReadAllBytes(p12Path);
                    bool p12OverwriteRejected = false;
                    try { IosSigningCrypto.ExportP12(keyPath, cert, p12Path, fingerprint, password, password); }
                    catch (IOException) { p12OverwriteRejected = true; }
                    Require(p12OverwriteRejected && CryptographicOperations.FixedTimeEquals(originalP12, File.ReadAllBytes(p12Path)), "Vorhandene P12 veraendert.");
                    passed++;
                }
            }
            return passed;
        }
    }
}
'@
    $iosCases = [Jagdlatein.IosSigningTests]::Run($iosTestRoot, [Jagdlatein.IosSigningCrypto])
    Write-Host ('iOS-Signierung: ' + $iosCases + ' synthetische Kryptographie-Pruefungen und unveraendernder Default-Check bestanden.')
} finally {
    $iosAbsoluteTestRoot = [IO.Path]::GetFullPath($iosTestRoot)
    $iosTempPrefix = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $iosAbsoluteTestRoot.StartsWith($iosTempPrefix, [StringComparison]::OrdinalIgnoreCase) -or (Split-Path -Leaf $iosAbsoluteTestRoot) -notmatch '^jagdlatein-ios-signing-test-[a-f0-9]{32}$') { throw 'Unerwarteter Testordner; keine Bereinigung ausgefuehrt.' }
    if (Test-Path -LiteralPath $iosAbsoluteTestRoot) { Remove-Item -LiteralPath $iosAbsoluteTestRoot -Recurse -Force }
}
