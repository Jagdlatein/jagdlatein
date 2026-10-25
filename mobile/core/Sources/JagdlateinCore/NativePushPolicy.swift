import Foundation

/// Pure presentation/bridge checks. Actual account ownership remains a signed
/// first-party server decision; neither an FID nor this policy grants access.
public enum NativePushPolicy {
    public static let bundleIdentifier = "de.jagdlatein.app"
    public static let projectID = "jagdlatein-a17b1"
    public static let senderID = "1084120782155"
    public static let appleAppID = "1:1084120782155:ios:1704651867d85968da44ce"

    public static func supports(bundleID: String?, environment: WebsiteEnvironment,
                                enabled: Bool, simulator: Bool, debug: Bool,
                                configurationBundle: String?, configurationProject: String?,
                                configurationSender: String?, googleAppID: String?) -> Bool {
        guard enabled, !simulator, !debug, environment == .production,
              bundleID == bundleIdentifier, configurationBundle == bundleIdentifier,
              configurationProject == projectID, configurationSender == senderID,
              let googleAppID = googleAppID else { return false }
        return googleAppID == appleAppID
    }

    public static func isProductionPage(_ url: URL?) -> Bool {
        guard let url = url, let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              parts.scheme?.lowercased() == "https",
              ["jagdlatein.de", "www.jagdlatein.de"].contains(parts.host?.lowercased() ?? ""),
              parts.user == nil, parts.password == nil,
              parts.port == nil || parts.port == 443 else { return false }
        return true
    }

    public static func isAccountPage(_ url: URL?) -> Bool {
        guard isProductionPage(url), let url = url,
              let parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return false }
        return parts.percentEncodedPath == "/konto" || parts.percentEncodedPath == "/konto/"
    }

    public static func allowsMessage(isMainFrame: Bool, scheme: String, host: String, port: Int,
                                     visiblePage: URL?, environment: WebsiteEnvironment, accountOnly: Bool = true) -> Bool {
        guard isMainFrame, environment == .production, scheme.lowercased() == "https",
              port == 0 || port == 443, isProductionPage(visiblePage),
              !accountOnly || isAccountPage(visiblePage),
              let visibleHost = visiblePage?.host?.lowercased() else { return false }
        return host.lowercased() == visibleHost
    }

    public static func isInstallationID(_ value: String) -> Bool {
        value.utf8.count == 22 && value.range(of: "^[A-Za-z0-9_-]+$", options: .regularExpression) != nil
    }
}

/// Main-actor callers use these identities to serialize device registrations.
/// A timed-out revocation deliberately keeps its gate until its SDK completion:
/// returning a UI error must not let an older unregister revoke a fresh join.
public struct NativePushOperationState {
    public private(set) var current: UUID?
    public private(set) var latest: UUID?
    public private(set) var revoking = false
    private var completedEnable: UUID?

    public init() {}

    public mutating func beginEnable() -> UUID? {
        guard current == nil, !revoking else { return nil }
        let ticket = UUID(); current = ticket; latest = ticket; completedEnable = nil
        return ticket
    }

    public func isCurrent(_ ticket: UUID) -> Bool { current == ticket }

    @discardableResult
    public mutating func finishEnable(_ ticket: UUID, successful: Bool) -> Bool {
        guard current == ticket, !revoking else { return false }
        current = nil; completedEnable = successful ? ticket : nil
        return true
    }

    public func canRevokeCompletedEnable(_ ticket: UUID) -> Bool {
        current == nil && !revoking && latest == ticket && completedEnable == ticket
    }

    /// Explicit disable can interrupt an enable. A rollback of an old reply can
    /// only claim its own completed enable, never a newer pending/successful one.
    public mutating func beginDisable(expectedEnable: UUID? = nil) -> UUID? {
        guard !revoking else { return nil }
        if let expected = expectedEnable, !canRevokeCompletedEnable(expected) { return nil }
        let ticket = UUID(); current = ticket; latest = ticket; completedEnable = nil
        return ticket
    }

    @discardableResult
    public mutating func beginRevocation(_ ticket: UUID) -> Bool {
        guard current == ticket, !revoking else { return false }
        revoking = true; completedEnable = nil
        return true
    }

    @discardableResult
    public mutating func finishRevocation(_ ticket: UUID) -> Bool {
        guard current == ticket, revoking else { return false }
        revoking = false; current = nil; completedEnable = nil
        return true
    }
}
