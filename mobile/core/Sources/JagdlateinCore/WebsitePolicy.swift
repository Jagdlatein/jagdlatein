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

/// A navigation policy, not a filter for website scripts, images or API requests.
public enum WebsitePolicy {
    public static let homeURL = URL(string: "https://www.jagdlatein.de")!
    private static let websiteHosts: Set<String> = ["jagdlatein.de", "www.jagdlatein.de"]
    private static let privateRoots: Set<String> = [
        "api", "auth", "login", "anmelden", "logout", "abmelden", "verify", "verify-code",
        "confirm", "callback", "reset-password", "forgot-password", "passwort", "admin",
        "konto", "mein-konto", "account", "profil", "preise", "paytest"
    ]

    public static func isWebsiteURL(_ url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              components.scheme?.lowercased() == "https",
              let host = components.host?.lowercased(), websiteHosts.contains(host),
              components.user == nil, components.password == nil,
              components.port == nil || components.port == 443 else { return false }
        return true
    }

    public static func decision(for url: URL, isMainFrame: Bool, userInitiated: Bool) -> WebsiteNavigationDecision {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let scheme = components.scheme?.lowercased() else { return .reject }
        if isPayPalHost(components.host) { return .blockedPayment }

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
        components.host = "jagdlatein.de"
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

    private static func isPayPalHost(_ host: String?) -> Bool {
        guard var host = host?.lowercased() else { return false }
        while host.hasSuffix(".") { host.removeLast() }
        return host == "paypal.com" || host.hasSuffix(".paypal.com")
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
