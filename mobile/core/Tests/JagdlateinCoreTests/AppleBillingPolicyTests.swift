import Foundation
import XCTest
@testable import JagdlateinCore

final class AppleBillingPolicyTests: XCTestCase {
    override func setUp() { WebsitePolicy.configure(environment: .production) }

    func testKnownDachCurrencyConflictsDeferOfferDetailsInBothWebsiteEnvironments() {
        let cases: [(countryCode: String?, currency: String, shouldDefer: Bool)] = [
            ("CHE", "USD", true),
            ("CHE", "CHF", false),
            ("DEU", "USD", true),
            ("DEU", "EUR", false),
            ("AUT", "USD", true),
            ("AUT", "EUR", false),
            ("CHE", "EUR", true),
            ("DEU", "CHF", true),
            ("AUT", "CHF", true),
        ]
        for environment in [WebsiteEnvironment.production, .sandbox] {
            WebsitePolicy.configure(environment: environment)
            for item in cases {
                let details = "\(environment.rawValue): \(item.countryCode ?? "unknown") / \(item.currency)"
                XCTAssertEqual(AppleBillingPolicy.shouldDeferOfferDetails(
                    countryCode: item.countryCode, productCurrencyCode: item.currency), item.shouldDefer,
                    "The website environment must not decide whether StoreKit's currency is consistent: \(details)")
            }
        }
    }

    func testCurrencyGuardPreservesGenuineUsdAndDoesNotInventAnUnknownStorefront() {
        for environment in [WebsiteEnvironment.production, .sandbox] {
            WebsitePolicy.configure(environment: environment)
            for (countryCode, currency) in [("USA", "USD"), ("GBR", "GBP"), ("JPN", "JPY"), ("", "USD")] {
                XCTAssertFalse(AppleBillingPolicy.shouldDeferOfferDetails(
                    countryCode: countryCode, productCurrencyCode: currency))
            }
            XCTAssertFalse(AppleBillingPolicy.shouldDeferOfferDetails(countryCode: nil, productCurrencyCode: "USD"))
        }
    }

    func testKnownStorefrontAndCurrencyCodesAreCaseInsensitive() {
        for environment in [WebsiteEnvironment.production, .sandbox] {
            WebsitePolicy.configure(environment: environment)
            XCTAssertTrue(AppleBillingPolicy.shouldDeferOfferDetails(countryCode: "che", productCurrencyCode: "usd"))
            XCTAssertFalse(AppleBillingPolicy.shouldDeferOfferDetails(countryCode: "che", productCurrencyCode: "chf"))
            XCTAssertFalse(AppleBillingPolicy.shouldDeferOfferDetails(countryCode: "deu", productCurrencyCode: "eur"))
            XCTAssertFalse(AppleBillingPolicy.shouldDeferOfferDetails(countryCode: "aut", productCurrencyCode: "eur"))
        }
    }

    func testBillingRequestsUseOnlyFixedEndpointsOnTheVisibleOwnOrigin() throws {
        let page = try XCTUnwrap(URL(string: "https://www.jagdlatein.de/konto?private=secret#details"))
        XCTAssertEqual(AppleBillingPolicy.requestURL(for: .context, visiblePage: page)?.absoluteString,
                       "https://www.jagdlatein.de/api/apple/context")
        XCTAssertEqual(AppleBillingPolicy.requestURL(for: .transactions, visiblePage: page)?.absoluteString,
                       "https://www.jagdlatein.de/api/apple/transactions")
        XCTAssertEqual(AppleBillingPolicy.origin(of: page), "https://www.jagdlatein.de")
        for value in ["http://jagdlatein.de/", "https://jagdlatein.de.evil.test/", "https://evil.test@jagdlatein.de/",
                      "https://jagdlatein.de:444/", "https://jagdlatein.de/preise", "about:blank"] {
            XCTAssertNil(AppleBillingPolicy.requestURL(for: .context, visiblePage: try XCTUnwrap(URL(string: value))), value)
        }
    }

    func testDisabledOrIncompleteContextCannotStartOrConfirmAPurchase() throws {
        for json in [#"{"enabled":false}"#, #"{"enabled":true}"#,
                     #"{"enabled":true,"appAccountToken":"A0A7B598-7563-4420-81BD-C1AEF61B3D71","productIds":["other.product"],"email":"test@example.com","paid":false,"purchaseAllowed":true,"environment":"Sandbox"}"#] {
            let context = try JSONDecoder().decode(ApplePurchaseContext.self, from: Data(json.utf8))
            XCTAssertFalse(context.isConfigured)
            XCTAssertFalse(context.accepts(transactionToken: nil, productID: "de.jagdlatein.premium.monthly"))
        }
    }

    func testOnlyCurrentAccountTokenAndEnabledProductCanBeConfirmed() throws {
        let context = try JSONDecoder().decode(ApplePurchaseContext.self, from: Data(#"{"enabled":true,"appAccountToken":"A0A7B598-7563-4420-81BD-C1AEF61B3D71","productIds":["de.jagdlatein.premium.monthly"],"email":"test@example.com","paid":false,"purchaseAllowed":true,"environment":"Sandbox"}"#.utf8))
        XCTAssertTrue(context.isConfigured)
        XCTAssertTrue(context.accepts(transactionToken: context.appAccountToken, productID: "de.jagdlatein.premium.monthly"))
        XCTAssertFalse(context.accepts(transactionToken: UUID(), productID: "de.jagdlatein.premium.monthly"))
        XCTAssertFalse(context.accepts(transactionToken: nil, productID: "de.jagdlatein.premium.monthly"))
        XCTAssertFalse(context.accepts(transactionToken: context.appAccountToken, productID: "other.product"))
    }
}
