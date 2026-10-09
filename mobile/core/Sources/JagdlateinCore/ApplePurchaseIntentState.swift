import Foundation

/// Receiving an external purchase intent records a request, never permission to
/// buy. The actual Apple purchase remains behind the existing manual UI action.
public struct ApplePurchaseIntentState {
    public enum Notice: Equatable {
        case requiresManualConfirmation
        case unsupportedProduct
        case unsupportedOffer
    }
    public private(set) var productID: String?
    public private(set) var revision = 0
    public private(set) var notice: Notice?

    public init() {}

    @discardableResult
    public mutating func receive(productID: String, hasAdditionalOffer: Bool) -> Notice {
        revision &+= 1
        self.productID = nil
        let result: Notice
        if !AppleBillingPolicy.isProductID(productID) {
            result = .unsupportedProduct
        } else if hasAdditionalOffer {
            result = .unsupportedOffer
        } else {
            self.productID = productID
            result = .requiresManualConfirmation
        }
        notice = result
        return result
    }

    public func canConfirmManually(productID: String, revision: Int,
                                   shownContext: ApplePurchaseContext, currentContext: ApplePurchaseContext) -> Bool {
        self.productID == productID && self.revision == revision &&
            shownContext.isConfigured && currentContext.isConfigured &&
            shownContext.appAccountToken == currentContext.appAccountToken &&
            shownContext.environment == currentContext.environment &&
            shownContext.productIds?.contains(productID) == true &&
            shownContext.purchaseAllowed == true && shownContext.paid == false &&
            currentContext.productIds?.contains(productID) == true &&
            currentContext.purchaseAllowed == true && currentContext.paid == false
    }

    public mutating func clear() {
        revision &+= 1
        productID = nil
        notice = nil
    }

    @discardableResult
    public mutating func clear(ifRevision revision: Int) -> Bool {
        guard self.revision == revision else { return false }
        clear()
        return true
    }
}
