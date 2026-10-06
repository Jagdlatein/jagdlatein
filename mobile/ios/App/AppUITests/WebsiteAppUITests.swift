import XCTest

/// Uses only the public homepage in the native simulator application. It never
/// signs in, creates an account, submits a checkout or opens a PayPal destination.
final class WebsiteAppUITests: XCTestCase {
    private var deadline = Date.distantPast

    override func setUpWithError() throws {
        continueAfterFailure = false
        executionTimeAllowance = 180
        // One shared wall-clock budget covers all live-website waits and the
        // relaunch; CI additionally enforces XCTest's 180-second hard limit.
        deadline = Date().addingTimeInterval(175)
    }

    @MainActor
    func testPublicHomepagePaymentGuardAndBookmarkPersistence() throws {
        let app = XCUIApplication()
        app.launch()
        let website = app.webViews["jagdlatein.website"]
        let location = app.staticTexts["jagdlatein.website.location"]

        assertHomepageLoaded(website: website, location: location)
        attachScreenshot(app, name: "Public homepage loaded")

        // Tap the actual Next.js Link: pushState navigation must be protected
        // as well as traditional WKNavigationDelegate navigation.
        let subscribe = website.links["Jetzt freischalten"].firstMatch
        XCTAssertTrue(waitUntil(subscribe, timeout: 15) { $0.exists && $0.isHittable },
                      "The public homepage's real subscription link must be tappable.")
        subscribe.tap()

        let previewAlert = app.alerts["Abos in der iOS-Vorschau"]
        XCTAssertTrue(waitFor(previewAlert, timeout: 40),
                      "The native preview must intercept the website subscription route.")
        attachScreenshot(app, name: "Native subscription preview guard")
        previewAlert.buttons["OK"].tap()
        // Check the underlying page after dismissing the modal: accessibility
        // snapshots may omit elements beneath an alert on some iOS versions.
        assertHomepageLoaded(website: website, location: location)
        XCTAssertFalse(website.staticTexts["Preise und Zugang"].exists,
                       "Checkout content must not remain visible after the native notice.")

        openBookmarks(app)
        let bookmarkNavigation = app.navigationBars["Merkliste"]
        let addCurrent = bookmarkNavigation.buttons["Aktuelle Seite merken"]
        XCTAssertTrue(waitUntil(addCurrent, timeout: 10) { $0.exists && $0.isEnabled && $0.isHittable },
                      "A loaded public homepage must be available to bookmark.")
        addCurrent.tap()
        assertHomeBookmark(in: app,
                           message: "Saving the current page must create the homepage bookmark.")
        attachScreenshot(app, name: "Homepage bookmark saved")
        bookmarkNavigation.buttons["Fertig"].tap()

        // Termination/relaunch keeps the installation and its real UserDefaults
        // intact; no test-only persistence injection or storage reset is used.
        app.terminate()
        app.launch()
        assertHomepageLoaded(website: app.webViews["jagdlatein.website"],
                             location: app.staticTexts["jagdlatein.website.location"])
        openBookmarks(app)
        assertHomeBookmark(in: app,
                           message: "The saved homepage must survive a complete app relaunch.")
        attachScreenshot(app, name: "Homepage bookmark after relaunch")
        app.navigationBars["Merkliste"].buttons["Fertig"].tap()
    }

    @MainActor
    private func assertHomepageLoaded(website: XCUIElement, location: XCUIElement) {
        XCTAssertTrue(waitFor(website, timeout: 60), "The native WKWebView must exist.")
        // The website h1 is scoped inside WKWebView so that the native app's
        // identically named heading cannot satisfy the website-load assertion.
        XCTAssertTrue(waitFor(website.staticTexts["Jagdlatein"].firstMatch, timeout: 60),
                      "The public website's homepage heading must actually load.")
        XCTAssertTrue(waitUntil(location, timeout: 10) { ($0.value as? String) == "https://jagdlatein.de/" },
                      "The loaded page must be the canonical HTTPS homepage, not checkout or PayPal.")
    }

    @MainActor
    private func openBookmarks(_ app: XCUIApplication) {
        let button = app.toolbars.buttons["Merkliste"].firstMatch
        XCTAssertTrue(waitUntil(button, timeout: 10) { $0.exists && $0.isHittable },
                      "The native bookmarks toolbar button must remain accessible.")
        button.tap()
        XCTAssertTrue(waitFor(app.navigationBars["Merkliste"], timeout: 10),
                      "The native bookmarks sheet must open.")
    }

    @MainActor
    private func homeBookmark(in app: XCUIApplication) -> XCUIElement {
        // The identifier comes from the actual sanitized stored URL; matching
        // cell labels is unreliable when UIKit exposes subtitle labels separately.
        app.tables.cells["jagdlatein.bookmark.https://jagdlatein.de/"].firstMatch
    }

    @MainActor
    private func assertHomeBookmark(in app: XCUIApplication, message: String) {
        let present = waitFor(homeBookmark(in: app), timeout: 10)
        if !present {
            // This test has visited only the public homepage. Limit diagnostics
            // to its native bookmark table, excluding the website/access tokens.
            print("Public homepage bookmark table at failure: " +
                  String(app.tables.debugDescription.prefix(8000)))
        }
        XCTAssertTrue(present, message)
    }

    private func remainingTimeout(_ requested: TimeInterval) -> TimeInterval {
        max(0, min(requested, deadline.timeIntervalSinceNow))
    }

    @MainActor
    private func waitFor(_ element: XCUIElement, timeout: TimeInterval) -> Bool {
        element.waitForExistence(timeout: remainingTimeout(timeout))
    }

    @MainActor
    private func waitUntil(_ element: XCUIElement, timeout: TimeInterval,
                           condition: @escaping (XCUIElement) -> Bool) -> Bool {
        let predicate = NSPredicate { object, _ in
            guard let element = object as? XCUIElement else { return false }
            return condition(element)
        }
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter.wait(for: [expectation], timeout: remainingTimeout(timeout)) == .completed
    }

    @MainActor
    private func attachScreenshot(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
