import Foundation
import XCTest
@testable import JagdlateinCore

final class AppleRestoreDiagnosticTests: XCTestCase {
    func testProductionNeverCollectsASnapshot() {
        var diagnostic = AppleRestoreDiagnostic(enabled: false)
        diagnostic.begin()
        for stage in AppleRestoreDiagnostic.Stage.allCases { diagnostic.advance(to: stage) }
        diagnostic.fail(.http(403))
        diagnostic.complete()
        XCTAssertNil(diagnostic.snapshot)
    }

    func testFailureRetainsItsPhaseAndNextAttemptClearsTheFailure() throws {
        var diagnostic = AppleRestoreDiagnostic(enabled: true)
        diagnostic.begin()
        diagnostic.advance(to: .appleSync)
        diagnostic.fail(.foundation(URLError(.timedOut)).withCategory(.storeKitNetwork))
        diagnostic.advance(to: .confirming)
        diagnostic.complete()
        let failed = try XCTUnwrap(diagnostic.snapshot)
        XCTAssertEqual(failed.stage, .appleSync)
        XCTAssertEqual(failed.outcome, .failed)
        XCTAssertEqual(failed.failure?.category, .storeKitNetwork)
        XCTAssertEqual(failed.failure?.code, -1001)

        diagnostic.begin()
        let restarted = try XCTUnwrap(diagnostic.snapshot)
        XCTAssertEqual(restarted.stage, .contextCheck)
        XCTAssertEqual(restarted.outcome, .running)
        XCTAssertNil(restarted.failure)
    }

    func testSuccessfulCompletionIsSeparateFromAnActiveSubscription() throws {
        var diagnostic = AppleRestoreDiagnostic(enabled: true)
        diagnostic.begin()
        diagnostic.advance(to: .entitlementScan)
        diagnostic.advance(to: .unfinishedScan)
        diagnostic.complete()
        let completed = try XCTUnwrap(diagnostic.snapshot)
        XCTAssertEqual(completed.stage, .completed)
        XCTAssertEqual(completed.outcome, .completed)
        XCTAssertNil(completed.failure)
        XCTAssertFalse(completed.text.contains("freigeschaltet"))
        XCTAssertFalse(completed.text.contains("Zugang aktiv"))
    }

    func testUnknownErrorsCannotPutTheirDomainDescriptionOrUserInfoOnScreen() throws {
        let privateText = "private@example.invalid /receipt?id=123 token-secret"
        let error = NSError(domain: privateText, code: 20000001, userInfo: [
            NSLocalizedDescriptionKey: privateText,
            NSUnderlyingErrorKey: NSError(domain: NSURLErrorDomain, code: -1009, userInfo: [:]),
        ])
        var diagnostic = AppleRestoreDiagnostic(enabled: true)
        diagnostic.begin()
        diagnostic.advance(to: .appleSync)
        diagnostic.fail(.foundation(error))
        let snapshot = try XCTUnwrap(diagnostic.snapshot)
        XCTAssertEqual(snapshot.failure?.category, .unknown)
        XCTAssertNil(snapshot.failure?.code)
        XCTAssertNil(snapshot.failure?.codeKind)
        XCTAssertFalse(snapshot.text.contains(privateText))
        XCTAssertFalse(snapshot.text.contains("-1009"), "Do not traverse private userInfo for an underlying error")
    }

    func testOnlyKnownDomainsAndMatchingNumericCodesAreKept() {
        let network = AppleRestoreDiagnosticFailure.foundation(
            NSError(domain: NSURLErrorDomain, code: -1009, userInfo: [NSLocalizedDescriptionKey: "private"]))
        XCTAssertEqual(network.category, .network)
        XCTAssertEqual(network.codeKind, .url)
        XCTAssertEqual(network.code, -1009)
        let storeKit = AppleRestoreDiagnosticFailure.foundation(NSError(domain: "SKErrorDomain", code: 2))
        XCTAssertEqual(storeKit.codeKind, .storeKit)
        XCTAssertEqual(storeKit.code, 2)
        XCTAssertEqual(AppleRestoreDiagnosticFailure.http(403).code, 403)

        for code in [Int.max, 20000001, -42] {
            XCTAssertNil(AppleRestoreDiagnosticFailure.http(code).code)
            XCTAssertNil(AppleRestoreDiagnosticFailure.foundation(NSError(domain: NSURLErrorDomain, code: code)).code)
            XCTAssertNil(AppleRestoreDiagnosticFailure.foundation(NSError(domain: "SKErrorDomain", code: code)).code)
        }
        XCTAssertNil(AppleRestoreDiagnosticFailure.foundation(NSError(domain: NSURLErrorDomain, code: 2)).code)
        XCTAssertNil(AppleRestoreDiagnosticFailure.foundation(NSError(domain: "SKErrorDomain", code: -1009)).code)
        XCTAssertNil(AppleRestoreDiagnosticFailure.foundation(NSError(domain: "private", code: -1009)).code)
        XCTAssertNil(AppleRestoreDiagnosticFailure.http(403).withCategory(.storeKitSystem).code)
        XCTAssertNil(network.withCategory(.storeKitUserCancelled).code)
        XCTAssertNil(storeKit.withCategory(.storeKitNetwork).code)
    }

    func testSystemErrorCopiesOnlyAnAlreadySanitizedCodeAndCapabilityMeansTheApp() throws {
        let system = AppleRestoreDiagnosticFailure.foundation(URLError(.timedOut)).withCategory(.storeKitSystem)
        XCTAssertEqual(system.category, .storeKitSystem)
        XCTAssertEqual(system.codeKind, .url)
        XCTAssertEqual(system.code, -1001)
        let unknown = AppleRestoreDiagnosticFailure.foundation(NSError(domain: "private", code: 20000001))
            .withCategory(.storeKitSystem)
        XCTAssertNil(unknown.code)
        XCTAssertNil(unknown.codeKind)

        var diagnostic = AppleRestoreDiagnostic(enabled: true)
        diagnostic.begin()
        diagnostic.fail(.init(category: .storeKitAppCapability))
        let snapshot = try XCTUnwrap(diagnostic.snapshot)
        XCTAssertTrue(snapshot.text.contains("Berechtigung der App fehlt"))
        XCTAssertFalse(snapshot.text.contains("Abo fehlt"))
        XCTAssertFalse(snapshot.text.contains("Zugang fehlt"))
    }
}
