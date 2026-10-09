import Foundation

public struct WebsiteBookmark: Codable, Equatable, Identifiable {
    public let url: URL
    public let title: String
    public let addedAt: Date
    public var id: String { url.absoluteString }

    public init(url: URL, title: String, addedAt: Date = Date()) {
        self.url = url
        self.title = title
        self.addedAt = addedAt
    }
}

public enum WebsiteNavigationDecision: Equatable {
    case allowInWebView
    case openExternally
    case blockedPayment
    case reject
}

/// The two reviewed, fixed destinations are separate. A build cannot supply an
/// arbitrary website URL or add another host to the native cookie allowlist.
public enum WebsiteEnvironment: String {
    case production = "Production"
    case sandbox = "Sandbox"

    public var homeURL: URL {
        URL(string: self == .production ? "https://www.jagdlatein.de" : "https://jagdlatein-sandbox.vercel.app")!
    }
    public var canonicalHost: String {
        self == .production ? "jagdlatein.de" : "jagdlatein-sandbox.vercel.app"
    }
    fileprivate var hosts: Set<String> {
        self == .production ? ["jagdlatein.de", "www.jagdlatein.de"] : ["jagdlatein-sandbox.vercel.app"]
    }
}

/// A navigation policy, not a filter for website scripts, images or API requests.
public enum WebsitePolicy {
    public private(set) static var environment: WebsiteEnvironment = .production
    public static var homeURL: URL { environment.homeURL }
    public static func configure(environment: WebsiteEnvironment) { self.environment = environment }
    /// Applied by WKContentRuleList before the first website request. No resource
    /// type restriction: this covers scripts, frames and raw fetch/XHR requests.
    /// Only the iOS preview uses these rules; the public website is unchanged.
    public static var contentBlockingRulesJSON: String {
        let paymentAPIHost = environment == .production ? #"(www\.)?jagdlatein\.de"# : #"jagdlatein-sandbox\.vercel\.app"#
        let otherEnvironmentHost = environment == .production ? #"jagdlatein-sandbox\.vercel\.app"# : #"(www\.)?jagdlatein\.de"#
        return #"""
    [
      {
        "trigger": {"url-filter": "^https?://([^/]*@)?([^:/]+\\.)?paypal\\.com\\.?[:/]", "url-filter-is-case-sensitive": false},
        "action": {"type": "block"}
      },
      {
        "trigger": {"url-filter": "^https?://([^/]*@)?([^:/]+\\.)?paypalobjects\\.com\\.?[:/]", "url-filter-is-case-sensitive": false},
        "action": {"type": "block"}
      },
      {
        "trigger": {"url-filter": "^https://\#(paymentAPIHost.replacingOccurrences(of: "\\", with: "\\\\"))(:443)?/api/paypal", "url-filter-is-case-sensitive": false},
        "action": {"type": "block"}
      },
      {
        "trigger": {"url-filter": "^https?://([^/]*@)?\#(otherEnvironmentHost.replacingOccurrences(of: "\\", with: "\\\\"))\\.?(:[0-9]+)?/", "url-filter-is-case-sensitive": false},
        "action": {"type": "block"}
      }
    ]
    """#
    }
    private static let privateRoots: Set<String> = [
        "api", "auth", "login", "anmelden", "logout", "abmelden", "verify", "verify-code",
        "confirm", "callback", "reset-password", "forgot-password", "passwort", "admin",
        "konto", "mein-konto", "account", "profil", "registrieren", "preise", "paytest"
    ]

    public static func isWebsiteURL(_ url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              components.scheme?.lowercased() == "https",
              let host = components.host?.lowercased(), environment.hosts.contains(host),
              components.user == nil, components.password == nil,
              components.port == nil || components.port == 443 else { return false }
        return true
    }

    public static func decision(for url: URL, isMainFrame: Bool, userInitiated: Bool) -> WebsiteNavigationDecision {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let scheme = components.scheme?.lowercased() else { return .reject }
        if isPaymentProviderHost(components.host) { return .blockedPayment }
        let otherEnvironment: WebsiteEnvironment = environment == .production ? .sandbox : .production
        if var host = components.host?.lowercased() {
            while host.hasSuffix(".") { host.removeLast() }
            if otherEnvironment.hosts.contains(host) { return .reject }
        }

        if !isMainFrame {
            // Third-party HTTPS frames stay in the web view and never open apps.
            if scheme == "about", url.absoluteString == "about:blank" { return .allowInWebView }
            guard scheme == "https", components.user == nil, components.password == nil else { return .reject }
            if isWebsiteURL(url), isPaymentPath(url) { return .blockedPayment }
            return .allowInWebView
        }
        if isWebsiteURL(url) {
            guard normalizedPath(url) != nil else { return .reject }
            return isPaymentPath(url) ? .blockedPayment : .allowInWebView
        }
        guard userInitiated else { return .reject }
        if scheme == "mailto" || scheme == "tel" {
            return url.absoluteString.count <= 2048 ? .openExternally : .reject
        }
        guard scheme == "https", components.host != nil,
              components.user == nil, components.password == nil,
              components.port == nil || components.port == 443 else { return .reject }
        return .openExternally
    }

    /// Stored/shared links never include query strings, fragments or auth routes.
    public static func bookmarkURL(for url: URL) -> URL? {
        guard isWebsiteURL(url), let path = normalizedPath(url),
              var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        let root = path.split(separator: "/").first.map { String($0).lowercased() } ?? ""
        guard !privateRoots.contains(root), !isPaymentPath(url) else { return nil }
        components.scheme = "https"
        components.host = environment.canonicalHost
        components.port = nil
        components.query = nil
        components.fragment = nil
        components.path = path
        return components.url
    }

    public static func sanitizeBookmark(url: URL, title: String?) -> WebsiteBookmark? {
        guard let safeURL = bookmarkURL(for: url) else { return nil }
        let words = (title ?? "").components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        let clean = words.joined(separator: " ").unicodeScalars.filter { !CharacterSet.controlCharacters.contains($0) }
        let bounded = String(String.UnicodeScalarView(clean)).trimmingCharacters(in: .whitespacesAndNewlines)
        return WebsiteBookmark(url: safeURL, title: bounded.isEmpty ? "Jagdlatein" : String(bounded.prefix(120)))
    }

    private static func isPaymentProviderHost(_ host: String?) -> Bool {
        guard var host = host?.lowercased() else { return false }
        while host.hasSuffix(".") { host.removeLast() }
        return host == "paypal.com" || host.hasSuffix(".paypal.com") ||
            host == "paypalobjects.com" || host.hasSuffix(".paypalobjects.com")
    }

    private static func isPaymentPath(_ url: URL) -> Bool {
        guard let path = normalizedPath(url) else { return false }
        let parts = path.lowercased().split(separator: "/").map(String.init)
        if let first = parts.first, first == "preise" || first == "paytest" { return true }
        return parts.count >= 2 && parts[0] == "api" && parts[1] == "paypal"
    }

    private static func normalizedPath(_ url: URL) -> String? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        var path = components.percentEncodedPath
        for _ in 0..<3 {
            guard let decoded = path.removingPercentEncoding else { return nil }
            if decoded == path { break }
            path = decoded
        }
        // Do not accept residual encodings that could gain another meaning if a
        // downstream router decodes the path again.
        guard !path.contains("%") else { return nil }
        guard !path.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }) else { return nil }
        path = path.replacingOccurrences(of: "\\", with: "/")
        var segments: [String] = []
        for segment in path.split(separator: "/") {
            if segment == "." { continue }
            if segment == ".." { if !segments.isEmpty { segments.removeLast() }; continue }
            segments.append(String(segment))
        }
        return "/" + segments.joined(separator: "/")
    }
}
