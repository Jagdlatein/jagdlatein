import Foundation

/// The restore snapshot accepts only fixed categories and allowlisted numeric
/// codes. It never retains an Error, its description, userInfo or raw domain.
public struct AppleRestoreDiagnosticFailure: Equatable {
    public enum Category: String {
        case signIn, disabled, accountChanged, unavailable, unverified, otherAccount, appValidation
        case http, network, storeKitError, storeKitUserCancelled, storeKitNetwork, storeKitSystem
        case storeKitStorefront, storeKitAppCapability, storeKitUnknown, unknown

        var text: String {
            switch self {
            case .signIn: return "Jagdlatein-Anmeldung erforderlich"
            case .disabled: return "Apple-Anbindung nicht verfügbar"
            case .accountChanged: return "Jagdlatein-Konto geändert"
            case .unavailable: return "Bestätigung nicht verfügbar"
            case .unverified: return "Kaufprüfung fehlgeschlagen"
            case .otherAccount: return "Kontozuordnung stimmt nicht überein"
            case .appValidation: return "App-Prüfung fehlgeschlagen"
            case .http: return "Serverantwort mit Fehlerstatus"
            case .network: return "Netzwerkfehler"
            case .storeKitError: return "Apple-Fehler"
            case .storeKitUserCancelled: return "Apple-Vorgang abgebrochen"
            case .storeKitNetwork: return "Apple-Netzwerkfehler"
            case .storeKitSystem: return "Apple-Systemfehler"
            case .storeKitStorefront: return "Apple-Funktion in dieser Kaufregion nicht verfügbar"
            case .storeKitAppCapability: return "Berechtigung der App fehlt"
            case .storeKitUnknown: return "Unbekannter Apple-Fehler"
            case .unknown: return "Unbekannter Fehler"
            }
        }
    }

    public enum CodeKind: String { case http = "HTTP", url = "URL", storeKit = "StoreKit" }
    public let category: Category
    public let codeKind: CodeKind?
    public let code: Int?

    public init(category: Category) {
        self.category = category
        codeKind = nil
        code = nil
    }

    private init(category: Category, codeKind: CodeKind, code: Int) {
        self.category = category
        self.codeKind = codeKind
        self.code = code
    }

    public static func http(_ status: Int) -> Self {
        let allowed: Set<Int> = [400, 401, 403, 404, 405, 408, 409, 413, 415, 422, 429, 500, 501, 502, 503, 504]
        guard allowed.contains(status) else { return Self(category: .unavailable) }
        return Self(category: .http, codeKind: .http, code: status)
    }

    public static func foundation(_ error: Error) -> Self {
        let error = error as NSError
        // Domain strings are compared only; none are stored or rendered.
        if error.domain == NSURLErrorDomain {
            let allowed: Set<Int> = [-999, -1000, -1001, -1002, -1003, -1004, -1005, -1006, -1007,
                                     -1008, -1009, -1010, -1011, -1012, -1013, -1014, -1015, -1016,
                                     -1017, -1022, -1200, -1201, -1202, -1203, -1204, -1205, -1206]
            guard allowed.contains(error.code) else { return Self(category: .unknown) }
            return Self(category: .network, codeKind: .url, code: error.code)
        }
        if error.domain == "SKErrorDomain" {
            // Published SKError.Code values; future/unrecognized codes stay unknown.
            let allowed: Set<Int> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
            guard allowed.contains(error.code) else { return Self(category: .unknown) }
            return Self(category: .storeKitError, codeKind: .storeKit, code: error.code)
        }
        return Self(category: .unknown)
    }

    /// Keep a recognized outer StoreKit category, copying only an already safe code.
    public func withCategory(_ category: Category) -> Self {
        guard let codeKind = codeKind, let code = code else { return Self(category: category) }
        guard (category == .storeKitSystem && (codeKind == .url || codeKind == .storeKit)) ||
              (category == .storeKitNetwork && codeKind == .url) else { return Self(category: category) }
        return Self(category: category, codeKind: codeKind, code: code)
    }
}

public struct AppleRestoreDiagnostic {
    public enum Stage: String, CaseIterable {
        case contextCheck, appleSync, entitlementScan, unfinishedScan, confirming, completed

        var text: String {
            switch self {
            case .contextCheck: return "Jagdlatein-Konto prüfen"
            case .appleSync: return "Mit Apple abgleichen"
            case .entitlementScan: return "Aktuelle Apple-Abos prüfen"
            case .unfinishedScan: return "Offene Apple-Käufe prüfen"
            case .confirming: return "Kauf beim Server bestätigen"
            case .completed: return "Abgeschlossen"
            }
        }
    }

    public enum Outcome: String { case running, completed, failed }

    public struct Snapshot: Equatable {
        public fileprivate(set) var stage: Stage
        public fileprivate(set) var outcome: Outcome
        public fileprivate(set) var failure: AppleRestoreDiagnosticFailure?

        public var text: String {
            let result: String
            switch outcome {
            case .running: result = "Läuft"
            case .completed: result = "Ablauf abgeschlossen"
            case .failed: result = "Fehlgeschlagen"
            }
            var lines = ["Letzte Wiederherstellung", "Phase: \(stage.text)", "Ergebnis: \(result)"]
            if let failure = failure {
                lines.append("Fehlerkategorie: \(failure.category.text)")
                if let kind = failure.codeKind, let code = failure.code {
                    lines.append("Fehlercode: \(kind.rawValue) \(code)")
                }
            }
            return lines.joined(separator: "\n")
        }
    }

    private let enabled: Bool
    public private(set) var snapshot: Snapshot?

    public init(enabled: Bool) { self.enabled = enabled }

    public mutating func begin() {
        guard enabled else { return }
        snapshot = Snapshot(stage: .contextCheck, outcome: .running, failure: nil)
    }

    public mutating func advance(to stage: Stage) {
        guard enabled, snapshot?.outcome == .running, stage != .completed else { return }
        snapshot?.stage = stage
    }

    public mutating func fail(_ failure: AppleRestoreDiagnosticFailure) {
        guard enabled, snapshot?.outcome == .running else { return }
        snapshot?.failure = failure
        snapshot?.outcome = .failed
    }

    public mutating func complete() {
        guard enabled, snapshot?.outcome == .running else { return }
        snapshot?.stage = .completed
        snapshot?.outcome = .completed
    }
}
