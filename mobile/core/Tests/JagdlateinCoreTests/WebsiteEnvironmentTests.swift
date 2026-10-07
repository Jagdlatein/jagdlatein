import Foundation
import XCTest
@testable import JagdlateinCore

final class WebsiteEnvironmentTests: XCTestCase {
    override func tearDown() { WebsitePolicy.configure(environment: .production) }

    func testSandboxCannotUseTheProductionWebsiteOrItsCookies() throws {
        WebsitePolicy.configure(environment: .sandbox)
        XCTAssertEqual(WebsitePolicy.homeURL.absoluteString, "https://jagdlatein-sandbox.vercel.app")
        let own = try XCTUnwrap(URL(string: "https://jagdlatein-sandbox.vercel.app/konto"))
        XCTAssertEqual(WebsitePolicy.decision(for: own, isMainFrame: true, userInitiated: false), .allowInWebView)
        XCTAssertEqual(AppleBillingPolicy.requestURL(for: .context, visiblePage: own)?.absoluteString,
                       "https://jagdlatein-sandbox.vercel.app/api/apple/context")
        for value in ["https://jagdlatein.de/konto", "https://www.jagdlatein.de/konto",
                      "https://jagdlatein-sandbox.vercel.app.evil.test/", "https://evil.test@jagdlatein-sandbox.vercel.app/",
                      "https://another-sandbox.vercel.app/", "http://jagdlatein-sandbox.vercel.app/"] {
            let url = try XCTUnwrap(URL(string: value))
            XCTAssertFalse(WebsitePolicy.isWebsiteURL(url), value)
            XCTAssertNil(AppleBillingPolicy.requestURL(for: .transactions, visiblePage: url), value)
        }
        XCTAssertEqual(WebsitePolicy.decision(for: URL(string: "https://jagdlatein.de/konto")!, isMainFrame: false, userInitiated: false), .reject)
        let bookmark = try XCTUnwrap(WebsitePolicy.bookmarkURL(for: URL(string: "https://jagdlatein-sandbox.vercel.app/kurse?secret=1")!))
        XCTAssertEqual(bookmark.absoluteString, "https://jagdlatein-sandbox.vercel.app/kurse")
    }

    func testSandboxPaymentProtectionCoversItsOwnAPIsAndPayPalResources() throws {
        WebsitePolicy.configure(environment: .sandbox)
        let rules = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(WebsitePolicy.contentBlockingRulesJSON.utf8)) as? [[String: Any]])
        let expressions = try rules.map { try NSRegularExpression(pattern: XCTUnwrap(($0["trigger"] as? [String: Any])?["url-filter"] as? String), options: .caseInsensitive) }
        for value in ["https://jagdlatein-sandbox.vercel.app/api/paypal/create", "https://www.sandbox.paypal.com/sdk/js",
                      "https://jagdlatein.de/api/apple/context", "https://www.jagdlatein.de/konto",
                      "https://jagdlatein.de.:443/api/apple/context", "https://user@www.jagdlatein.de:8443/konto"] {
            XCTAssertTrue(expressions.contains { $0.firstMatch(in: value, range: NSRange(value.startIndex..., in: value)) != nil })
        }
        let allowed = "https://jagdlatein-sandbox.vercel.app/api/apple/context"
        XCTAssertFalse(expressions.contains { $0.firstMatch(in: allowed, range: NSRange(allowed.startIndex..., in: allowed)) != nil })
    }

    func testProductionIsTheExplicitDefaultAndRejectsSandboxAsAFirstPartyOrigin() throws {
        WebsitePolicy.configure(environment: .production)
        XCTAssertEqual(WebsitePolicy.homeURL.absoluteString, "https://www.jagdlatein.de")
        XCTAssertNil(AppleBillingPolicy.requestURL(for: .context, visiblePage: URL(string: "https://jagdlatein-sandbox.vercel.app/")!))
        XCTAssertNil(WebsiteEnvironment(rawValue: "https://evil.test"))
        XCTAssertNil(WebsiteEnvironment(rawValue: "sandbox"))
    }
}
