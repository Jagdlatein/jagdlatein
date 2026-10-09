import Foundation
import XCTest
@testable import JagdlateinCore

final class ApplePurchaseIntentStateTests: XCTestCase {
    private let product = "de.jagdlatein.premium.monthly"
    private func context(token: String = "A0A7B598-7563-4420-81BD-C1AEF61B3D71", paid: Bool = false,
                         allowed: Bool = true, enabled: Bool = true) throws -> ApplePurchaseContext {
        let value: [String: Any] = ["enabled": enabled, "appAccountToken": token, "productIds": [product],
                                    "email": "test@example.invalid", "paid": paid, "purchaseAllowed": allowed, "environment": "Sandbox"]
        return try JSONDecoder().decode(ApplePurchaseContext.self, from: JSONSerialization.data(withJSONObject: value))
    }

    func testReceivingIntentOnlyRecordsAManualRequestWithoutGrantingPurchaseOrAccess() throws {
        var state = ApplePurchaseIntentState()
        XCTAssertEqual(state.receive(productID: product, hasAdditionalOffer: false), .requiresManualConfirmation)
        XCTAssertEqual(state.productID, product)
        let disabled = try context(enabled: false)
        XCTAssertFalse(state.canConfirmManually(productID: product, revision: state.revision, shownContext: disabled, currentContext: disabled))
    }

    func testUnknownProductsAndAdditionalOffersAreRejectedAndClearEarlierPendingProducts() {
        var state = ApplePurchaseIntentState()
        state.receive(productID: product, hasAdditionalOffer: false)
        XCTAssertEqual(state.receive(productID: "another.product", hasAdditionalOffer: false), .unsupportedProduct)
        XCTAssertNil(state.productID)
        state.receive(productID: product, hasAdditionalOffer: false)
        XCTAssertEqual(state.receive(productID: product, hasAdditionalOffer: true), .unsupportedOffer)
        XCTAssertNil(state.productID)
    }

    func testManualConfirmationRequiresTheCurrentAccountAndFreshAllowedContext() throws {
        var state = ApplePurchaseIntentState()
        state.receive(productID: product, hasAdditionalOffer: false)
        let shown = try context()
        XCTAssertTrue(state.canConfirmManually(productID: product, revision: state.revision, shownContext: shown, currentContext: shown))
        for current in [try context(token: "B0A7B598-7563-4420-81BD-C1AEF61B3D72"), try context(paid: true),
                        try context(allowed: false), try context(enabled: false)] {
            XCTAssertFalse(state.canConfirmManually(productID: product, revision: state.revision, shownContext: shown, currentContext: current))
        }
    }

    func testNewIntentOrCancellationInvalidatesAnEarlierDisplayedPurchaseButton() throws {
        var state = ApplePurchaseIntentState()
        state.receive(productID: product, hasAdditionalOffer: false)
        let displayedRevision = state.revision
        let shown = try context()
        state.receive(productID: product, hasAdditionalOffer: false)
        XCTAssertFalse(state.canConfirmManually(productID: product, revision: displayedRevision, shownContext: shown, currentContext: shown))
        state.clear()
        XCTAssertNil(state.notice)
        XCTAssertFalse(state.canConfirmManually(productID: product, revision: state.revision, shownContext: shown, currentContext: shown))
    }

    func testCompletingAnOlderPurchasePreservesANewerRejectedOfferUntilExplicitDismissal() {
        var state = ApplePurchaseIntentState()
        state.receive(productID: product, hasAdditionalOffer: false)
        let purchaseRevision = state.revision
        state.receive(productID: product, hasAdditionalOffer: true)
        let newerRevision = state.revision
        XCTAssertFalse(state.clear(ifRevision: purchaseRevision))
        XCTAssertEqual(state.revision, newerRevision)
        XCTAssertEqual(state.notice, .unsupportedOffer)
        XCTAssertNil(state.productID)
        state.clear()
        XCTAssertNil(state.notice)
    }
}
