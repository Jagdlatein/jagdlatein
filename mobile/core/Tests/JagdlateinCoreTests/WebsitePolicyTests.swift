import Foundation
import XCTest
@testable import JagdlateinCore
#if canImport(WebKit)
import WebKit
#endif

final class WebsitePolicyTests: XCTestCase {
    private func url(_ string: String) -> URL { URL(string: string)! }
    private func decision(_ string: String, user: Bool = false, main: Bool = true) -> WebsiteNavigationDecision {
        WebsitePolicy.decision(for: url(string), isMainFrame: main, userInitiated: user)
    }

    func testOnlyExactWebsiteHostsUseTheMainWebView() {
        for string in ["https://jagdlatein.de/", "https://www.jagdlatein.de/kurse", "https://jagdlatein.de:443/"] {
            XCTAssertEqual(decision(string), .allowInWebView, string)
        }
        for string in ["https://jagdlatein.de.evil.test", "https://eviljagdlatein.de", "https://jagdlatein.de@evil.test", "https://evil.test@jagdlatein.de", "https://jagdlatein.de:444", "http://jagdlatein.de", "https://jagdlatein.de."] {
            XCTAssertNotEqual(decision(string), .allowInWebView, string)
        }
    }

    func testExternalLinksRequireAUserClickAndHTTPS() {
        XCTAssertEqual(decision("https://www.wsl.ch/", user: true), .openExternally)
        XCTAssertEqual(decision("https://www.wsl.ch/"), .reject)
        XCTAssertEqual(decision("http://www.wsl.ch/", user: true), .reject)
        XCTAssertEqual(decision("https://user:password@www.wsl.ch/", user: true), .reject)
        XCTAssertEqual(decision("javascript:alert(1)", user: true), .reject)
        XCTAssertEqual(decision("file:///etc/passwd", user: true), .reject)
        XCTAssertEqual(decision("mailto:info@jagdlatein.de", user: true), .openExternally)
        XCTAssertEqual(decision("tel:+41000000000", user: true), .openExternally)
        XCTAssertEqual(decision("mailto:info@jagdlatein.de"), .reject)
    }

    func testOrdinaryHTTPSFramesDoNotOpenTheBrowser() {
        XCTAssertEqual(decision("https://embed.example.test/video", main: false), .allowInWebView)
        XCTAssertEqual(decision("about:blank", main: false), .allowInWebView)
        XCTAssertEqual(decision("http://embed.example.test", main: false), .reject)
    }

    func testPreviewBlocksPaymentRoutesIncludingEncodedVariants() {
        for path in ["/preise", "/preise/", "/preise?trial=1", "/paytest", "/api/paypal/create-subscription", "/%70reise", "/kurse/../preise", "/%2570reise"] {
            XCTAssertEqual(decision("https://jagdlatein.de" + path, user: true), .blockedPayment, path)
        }
        for string in ["https://paypal.com/checkout", "https://www.paypal.com/webapps", "https://www.sandbox.paypal.com/", "https://checkout.paypal.com/", "https://www.paypal.com./checkout", "https://www.paypalobjects.com/api/"] {
            XCTAssertEqual(decision(string, user: true), .blockedPayment, string)
            XCTAssertEqual(decision(string, main: false), .blockedPayment, string)
        }
        XCTAssertEqual(decision("https://paypal.com.evil.test/", user: true), .openExternally)
        XCTAssertEqual(decision("https://jagdlatein.de/kurse/paypal-ist-kein-kurs"), .allowInWebView)
        XCTAssertEqual(decision("https://jagdlatein.de/%25252570reise"), .reject)
        XCTAssertEqual(decision("https://jagdlatein.de/kurse/%00privat"), .reject)
    }

    func testBookmarksStripAllQueryAndFragmentDataAndCanonicalizeHost() {
        let input = url("https://www.jagdlatein.de:443/kurse/wild?code=secret&token=private#secret")
        let bookmark = WebsitePolicy.sanitizeBookmark(url: input, title: "  Wild\n lernen  ")
        XCTAssertEqual(bookmark?.url.absoluteString, "https://jagdlatein.de/kurse/wild")
        XCTAssertEqual(bookmark?.title, "Wild lernen")
    }

    func testPrivateAndAPIRoutesCannotBeBookmarkedOrShared() {
        for path in ["/api", "/api/auth/verify", "/auth/callback", "/login", "/verify-code", "/mein-konto", "/profil", "/admin", "/preise", "/paytest", "/%61pi/auth"] {
            XCTAssertNil(WebsitePolicy.bookmarkURL(for: url("https://jagdlatein.de" + path)), path)
        }
        XCTAssertNil(WebsitePolicy.bookmarkURL(for: url("https://another.test/kurse")))
        XCTAssertNil(WebsitePolicy.bookmarkURL(for: url("http://jagdlatein.de/kurse")))
    }

    func testBookmarkTitlesHaveSafeBoundedTextAndRoundTrip() throws {
        let bookmark = try XCTUnwrap(WebsitePolicy.sanitizeBookmark(url: url("https://jagdlatein.de/"), title: String(repeating: "a", count: 200) + "\u{0000}"))
        XCTAssertEqual(bookmark.title.count, 120)
        XCTAssertFalse(bookmark.title.contains("\u{0000}"))
        XCTAssertEqual(try JSONDecoder().decode(WebsiteBookmark.self, from: JSONEncoder().encode(bookmark)), bookmark)
        XCTAssertEqual(WebsitePolicy.sanitizeBookmark(url: url("https://jagdlatein.de/"), title: " \n ")?.title, "Jagdlatein")
    }

    func testContentRulesBlockPaymentNetworkRequestsWithoutBlockingAccountOrLearningRequests() throws {
        let data = try XCTUnwrap(WebsitePolicy.contentBlockingRulesJSON.data(using: .utf8))
        let rules = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [[String: Any]])
        XCTAssertEqual(rules.count, 3)
        let expressions = try rules.map { rule -> NSRegularExpression in
            let trigger = try XCTUnwrap(rule["trigger"] as? [String: Any])
            let action = try XCTUnwrap(rule["action"] as? [String: Any])
            XCTAssertEqual(action["type"] as? String, "block")
            XCTAssertNil(trigger["resource-type"], "fetch/XHR must be covered as well as scripts and frames")
            XCTAssertEqual(trigger["url-filter-is-case-sensitive"] as? Bool, false)
            return try NSRegularExpression(pattern: XCTUnwrap(trigger["url-filter"] as? String), options: .caseInsensitive)
        }
        func blocked(_ string: String) -> Bool {
            expressions.contains { $0.firstMatch(in: string, range: NSRange(string.startIndex..., in: string)) != nil }
        }
        for string in [
            "https://www.paypal.com/sdk/js?client-id=example",
            "https://api-m.paypal.com/v1/billing/subscriptions", "https://api-m.sandbox.paypal.com/v1/oauth2/token",
            "https://paypal.com/checkout", "https://www.paypal.com./checkout", "https://user:password@paypal.com/checkout",
            "https://www.paypalobjects.com/webstatic/image.png", "https://paypalobjects.com/script.js",
            "https://jagdlatein.de/api/paypal/create", "https://www.jagdlatein.de:443/api/paypal/confirm?subscription=example"
        ] { XCTAssertTrue(blocked(string), string) }
        for string in [
            "https://jagdlatein.de/api/auth/verify", "https://jagdlatein.de/api/learning/progress",
            "https://jagdlatein.de/kurse", "https://jagdlatein.de/_next/static/chunk.js",
            "https://jagdlatein.de/tiere/gams.jpg", "https://images.unsplash.com/photo-example",
            "https://paypal.com.evil.test/sdk/js", "https://www.paypalobjects.com.evil.test/script.js",
            "https://jagdlatein.de.evil.test/api/paypal/create"
        ] { XCTAssertFalse(blocked(string), string) }
    }

    #if canImport(WebKit)
    @MainActor
    func testContentRulesCompileInTheActualWebKitEngine() async throws {
        let store = try XCTUnwrap(WKContentRuleListStore.default())
        let compiled = try await store.compileContentRuleList(
            forIdentifier: "jagdlatein.preview.payment-rules.tests.v1",
            encodedContentRuleList: WebsitePolicy.contentBlockingRulesJSON
        )
        XCTAssertNotNil(compiled)
    }
    #endif
}
