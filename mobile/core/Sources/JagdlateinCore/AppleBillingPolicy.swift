import Foundation

/// Public account context only. The website session cookie is never exposed to
/// website JavaScript or stored in this value.
public struct ApplePurchaseContext: Decodable {
    public let enabled: Bool
    public let appAccountToken: UUID?
    public let productIds: [String]?
    public let email: String?
    public let paid: Bool?
    public let accessType: String?
    public let accessProvider: String?
    public let purchaseAllowed: Bool?
    public let environment: String?

    public var isConfigured: Bool {
        guard enabled, appAccountToken != nil,
              let email = email, !email.isEmpty, email.count <= 320,
              let products = productIds, !products.isEmpty, products.count <= 8,
              products.allSatisfy(AppleBillingPolicy.isProductID),
              paid != nil, purchaseAllowed != nil,
              environment == "Sandbox" || environment == "Production" else { return false }
        return true
    }

    public func accepts(transactionToken: UUID?, productID: String) -> Bool {
        isConfigured && transactionToken != nil && transactionToken == appAccountToken &&
            productIds?.contains(productID) == true
    }
}

public enum AppleBillingEndpoint: String {
    case context = "/api/apple/context"
    case transactions = "/api/apple/transactions"
}

public enum AppleBillingPolicy {
    public static func isProductID(_ value: String) -> Bool {
        value == "de.jagdlatein.premium.monthly"
    }

    /// Inconsistent TestFlight metadata must not become an advertised price.
    /// Apple's confirmation supplies the terms; this never invents a trial or price.
    public static func shouldDeferOfferDetails(environment: WebsiteEnvironment, countryCode: String?, productCurrencyCode: String) -> Bool {
        guard environment == .sandbox, let countryCode = countryCode else { return false }
        let expectedCurrency: String
        switch countryCode.uppercased() {
        case "CHE": expectedCurrency = "CHF"
        case "DEU", "AUT": expectedCurrency = "EUR"
        default: return false
        }
        return productCurrencyCode.uppercased() != expectedCurrency
    }

    /// These two fixed endpoints may use the current first-party website cookie.
    /// An external URL, redirect, query or arbitrary API path cannot be supplied.
    public static func requestURL(for endpoint: AppleBillingEndpoint, visiblePage: URL) -> URL? {
        guard WebsitePolicy.decision(for: visiblePage, isMainFrame: true, userInitiated: false) == .allowInWebView,
              WebsitePolicy.isWebsiteURL(visiblePage),
              var parts = URLComponents(url: visiblePage, resolvingAgainstBaseURL: false) else { return nil }
        parts.path = endpoint.rawValue
        parts.query = nil
        parts.fragment = nil
        return parts.url
    }

    public static func origin(of url: URL) -> String? {
        guard WebsitePolicy.isWebsiteURL(url),
              var parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        parts.path = ""
        parts.query = nil
        parts.fragment = nil
        return parts.url?.absoluteString
    }
}
