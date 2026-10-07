import Foundation
import XCTest
@testable import JagdlateinCore

final class AppleBillingPolicyTests: XCTestCase {
    override func setUp() { WebsitePolicy.configure(environment: .production) }
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
