import Foundation
import XCTest
@testable import JagdlateinCore

final class NativePushPolicyTests: XCTestCase {
    private func url(_ value: String) -> URL { URL(string: value)! }
    private func supports(bundle: String = "de.jagdlatein.app", environment: WebsiteEnvironment = .production,
                          enabled: Bool = true, simulator: Bool = false, debug: Bool = false,
                          configurationBundle: String = "de.jagdlatein.app", project: String = "jagdlatein-a17b1",
                          sender: String = "1084120782155", appID: String = "1:1084120782155:ios:1704651867d85968da44ce") -> Bool {
        NativePushPolicy.supports(bundleID: bundle, environment: environment, enabled: enabled, simulator: simulator,
          debug: debug, configurationBundle: configurationBundle, configurationProject: project,
          configurationSender: sender, googleAppID: appID)
    }

    func testOnlyExplicitProductionConfigurationCanEnablePush() {
        XCTAssertTrue(supports())
        XCTAssertFalse(supports(enabled: false))
        XCTAssertFalse(supports(simulator: true))
        XCTAssertFalse(supports(debug: true))
        XCTAssertFalse(supports(environment: .sandbox))
        XCTAssertFalse(supports(bundle: "de.jagdlatein.preview"))
        XCTAssertFalse(supports(configurationBundle: "de.jagdlatein.preview"))
        XCTAssertFalse(supports(project: "other-project"))
        XCTAssertFalse(supports(sender: "999999999"))
        XCTAssertFalse(supports(appID: "1:1084120782155:android:0123456789abcdef"))
        XCTAssertFalse(supports(appID: "1:999999999:ios:0123456789abcdef"))
        XCTAssertFalse(NativePushPolicy.supports(bundleID: nil, environment: .production, enabled: true,
          simulator: false, debug: false, configurationBundle: nil, configurationProject: nil,
          configurationSender: nil, googleAppID: nil))
    }

    func testStatusAndEnableStayOnTheExactProductionAccountPage() {
        for page in ["https://jagdlatein.de/konto", "https://www.jagdlatein.de/konto/?settings=notifications", "https://jagdlatein.de:443/konto#mitteilungen"] {
            XCTAssertTrue(NativePushPolicy.isAccountPage(url(page)), page)
        }
        for page in ["https://jagdlatein.de/", "https://jagdlatein.de/konto-other", "https://jagdlatein.de/%6bonto",
                     "https://jagdlatein-sandbox.vercel.app/konto", "https://jagdlatein.de.evil.test/konto",
                     "https://jagdlatein.de./konto", "http://jagdlatein.de/konto", "https://user:secret@jagdlatein.de/konto", "https://jagdlatein.de:444/konto"] {
            XCTAssertFalse(NativePushPolicy.isAccountPage(url(page)), page)
        }
    }

    func testReplyRequiresTheCurrentOriginMainFrameAndProductionBuild() {
        let page = url("https://jagdlatein.de/konto")
        XCTAssertTrue(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: "jagdlatein.de", port: 443, visiblePage: page, environment: .production))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: false, scheme: "https", host: "jagdlatein.de", port: 443, visiblePage: page, environment: .production))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "http", host: "jagdlatein.de", port: 443, visiblePage: page, environment: .production))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: "www.jagdlatein.de", port: 443, visiblePage: page, environment: .production))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: "jagdlatein.de", port: 444, visiblePage: page, environment: .production))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: "jagdlatein.de", port: 443, visiblePage: page, environment: .sandbox))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: "jagdlatein.de", port: 443, visiblePage: nil, environment: .production))
    }

    func testDisableRemainsPossibleAfterLogoutOutsideAccountWithoutWideningOrigins() {
        for page in ["https://jagdlatein.de/", "https://www.jagdlatein.de/login", "https://jagdlatein.de/lernen"] {
            let pageURL = url(page)
            XCTAssertTrue(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: pageURL.host!, port: 0, visiblePage: pageURL, environment: .production, accountOnly: false))
            XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: pageURL.host!, port: 0, visiblePage: pageURL, environment: .production))
        }
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: false, scheme: "https", host: "jagdlatein.de", port: 0, visiblePage: url("https://jagdlatein.de/"), environment: .production, accountOnly: false))
        XCTAssertFalse(NativePushPolicy.allowsMessage(isMainFrame: true, scheme: "https", host: "evil.test", port: 0, visiblePage: url("https://evil.test/"), environment: .production, accountOnly: false))
    }

    func testOnlyBoundedInstallationIDsAreReturnedNeverAPNsOrLegacyFCMTokens() {
        XCTAssertTrue(NativePushPolicy.isInstallationID("c1234567890123456789012"))
        for value in ["", String(repeating: "a", count: 64), "legacy:registration-token", "c1234567890123456789012\n", String(repeating: "x", count: 23)] {
            XCTAssertFalse(NativePushPolicy.isInstallationID(value), value)
        }
    }
}
