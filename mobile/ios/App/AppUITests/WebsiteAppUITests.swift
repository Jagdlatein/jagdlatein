import XCTest
import UIKit

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
    func testPreparatoryPublicHomepageStoreScreenshot() throws {
        // Ordinary build tests keep their existing device selection. Only the
        // separate capture helper requests these exact screenshot assertions.
        let environment = ProcessInfo.processInfo.environment
        try XCTSkipUnless(environment["JL_PUBLIC_STORE_CAPTURE"] == "1",
                          "Preparatory screenshots run only through the dedicated capture helper.")
        let expectedWidth = try XCTUnwrap(Int(environment["JL_STORE_CAPTURE_WIDTH"] ?? ""))
        let expectedHeight = try XCTUnwrap(Int(environment["JL_STORE_CAPTURE_HEIGHT"] ?? ""))
        let allowedSizes = [(1206, 2622), (1320, 2868), (2064, 2752)]
        XCTAssertTrue(allowedSizes.contains { $0.0 == expectedWidth && $0.1 == expectedHeight })
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication()
        app.launch()
        let website = app.webViews["jagdlatein.website"]
        let location = app.staticTexts["jagdlatein.website.location"]
        assertHomepageLoaded(website: website, location: location)
        let heading = website.staticTexts["Jagdlatein"].firstMatch
        let learning = website.links.matching(NSPredicate(format: "label CONTAINS %@", "Lernbereich öffnen")).firstMatch
        XCTAssertTrue(waitUntil(heading, timeout: 15) { $0.exists && $0.isHittable },
                      "The actual website heading must be visible in the capture.")
        XCTAssertTrue(waitUntil(learning, timeout: 15) { $0.exists && $0.isHittable },
                      "The public learning-area tile must be loaded and visible.")
        XCTAssertTrue(website.links["Login"].firstMatch.exists,
                      "Preparatory captures must use the public signed-out homepage.")
        XCTAssertFalse(website.buttons["Logout"].exists)
        XCTAssertEqual(app.alerts.count, 0)
        XCTAssertFalse(app.buttons["Erneut versuchen"].isHittable,
                       "An error panel must not be captured as a loaded homepage.")
        XCTAssertFalse(app.navigationBars["Jagdlatein-Abo"].exists)
        XCTAssertEqual(location.value as? String, "https://jagdlatein.de/")

        // Accessibility can be ready before WebKit's pixels reach the screen:
        // the original iPhone 16 Pro capture in run 37821705006 had tappable
        // homepage elements but only native chrome in its actual framebuffer.
        // Poll real frames within the existing deadline; never reload, inject,
        // manufacture content, or attach a blank frame as a fallback.
        var renderedImage: CGImage?
        var consecutiveRenderedFrames = 0
        let renderedHomepage = NSPredicate { _, _ in
            let retry = app.buttons["Erneut versuchen"]
            guard heading.exists && heading.isHittable,
                  learning.exists && learning.isHittable,
                  website.links["Login"].firstMatch.exists,
                  !website.buttons["Logout"].exists,
                  app.alerts.count == 0,
                  !(retry.exists && retry.isHittable),
                  !app.navigationBars["Jagdlatein-Abo"].exists,
                  (location.value as? String) == "https://jagdlatein.de/",
                  let frame = XCUIScreen.main.screenshot().image.cgImage,
                  frame.width == expectedWidth, frame.height == expectedHeight,
                  self.captureInteriorIsWithinWebsite(app: app, website: website),
                  let darkFraction = self.homepageInteriorDarkPixelFraction(frame),
                  darkFraction >= 0.005 else {
                consecutiveRenderedFrames = 0
                renderedImage = nil
                return false
            }
            consecutiveRenderedFrames += 1
            renderedImage = frame
            return consecutiveRenderedFrames >= 2
        }
        let renderedExpectation = XCTNSPredicateExpectation(predicate: renderedHomepage, object: app)
        let rendered = XCTWaiter.wait(for: [renderedExpectation], timeout: remainingTimeout(20)) == .completed
        XCTAssertTrue(rendered, "Two consecutive real frames must show homepage pixels inside the WebView; native logo/toolbar are insufficient.")
        let image = try XCTUnwrap(rendered ? renderedImage : nil)
        XCTAssertEqual(image.width, expectedWidth)
        XCTAssertEqual(image.height, expectedHeight)
        // Encode this last accepted, original full-screen frame. Pixel analysis
        // above does not change it; no resize, crop, composition or substitution.
        let jpeg = try XCTUnwrap(UIImage(cgImage: image, scale: 1, orientation: .up).jpegData(compressionQuality: 1))
        let attachment = XCTAttachment(data: jpeg, uniformTypeIdentifier: "public.jpeg")
        attachment.name = "Jagdlatein.Preparatory.PublicHomepage.jpeg"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func captureInteriorIsWithinWebsite(app: XCUIApplication, website: XCUIElement) -> Bool {
        let screen = app.frame
        guard screen.width > 0, screen.height > 0 else { return false }
        // This same central region is checked independently in the exported
        // original JPEG. The actual WebView frame must contain it, so native
        // header/toolbar cannot satisfy the screenshot-readiness condition.
        let interior = CGRect(x: screen.minX + screen.width * 0.08,
                              y: screen.minY + screen.height * 0.18,
                              width: screen.width * 0.84, height: screen.height * 0.64)
        return website.frame.contains(interior)
    }

    private func homepageInteriorDarkPixelFraction(_ image: CGImage) -> Double? {
        let width = image.width, height = image.height
        guard width > 0, height > 0, width <= 2064, height <= 2868,
              let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
        var pixels = [UInt8](repeating: 0, count: width * height * 4)
        let decoded = pixels.withUnsafeMutableBytes { buffer -> Bool in
            guard let address = buffer.baseAddress,
                  let context = CGContext(data: address, width: width, height: height,
                                          bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace,
                                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue |
                                              CGBitmapInfo.byteOrder32Big.rawValue) else { return false }
            context.draw(image, in: CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
            return true
        }
        guard decoded else { return nil }
        let left = Int(Double(width) * 0.08), top = Int(Double(height) * 0.18)
        let right = left + Int(Double(width) * 0.84), bottom = top + Int(Double(height) * 0.64)
        var dark = 0, sampled = 0
        for y in stride(from: top, to: bottom, by: 4) {
            for x in stride(from: left, to: right, by: 4) {
                let offset = (y * width + x) * 4
                guard pixels[offset + 3] >= 250 else { return nil }
                let luminance = (54 * Int(pixels[offset]) + 183 * Int(pixels[offset + 1]) +
                                 19 * Int(pixels[offset + 2])) / 256
                if luminance < 100 { dark += 1 }
                sampled += 1
            }
        }
        return sampled > 0 ? Double(dark) / Double(sampled) : nil
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

        let subscriptions = app.navigationBars["Jagdlatein-Abo"]
        let subscriptionOpened = waitFor(subscriptions, timeout: 40)
        if !subscriptionOpened {
            // Public, signed-out test only. Log state booleans and a fixed
            // location classification, never page bodies, URLs or credentials.
            let retry = app.buttons["Erneut versuchen"].firstMatch
            let billing = app.toolbars.buttons["Abo und Käufe"].firstMatch
            let homepage = website.staticTexts["Jagdlatein"].firstMatch
            let locationClass = (location.value as? String) == "https://jagdlatein.de/"
                ? "public-home" : "other-or-unavailable-public-route"
            print("Public subscription guard state: location=\(locationClass); " +
                  "webViewExists=\(website.exists); homepageExists=\(homepage.exists); " +
                  "homepageHittable=\(homepage.exists && homepage.isHittable); " +
                  "subscriptionLinkExists=\(subscribe.exists); " +
                  "retryVisible=\(retry.exists && retry.isHittable); " +
                  "billingToolbarEnabled=\(billing.exists && billing.isEnabled); " +
                  "alerts=\(app.alerts.count); navigationBars=\(app.navigationBars.count)")
            attachScreenshot(app, name: "Public subscription guard failure before login")
        }
        XCTAssertTrue(subscriptionOpened,
                      "The native subscription sheet must intercept the website subscription route.")
        let restore = app.buttons["jagdlatein.apple.restore"]
        XCTAssertTrue(waitUntil(restore, timeout: 25) { $0.exists && !$0.isEnabled },
                      "An unauthenticated public session must not restore or start a purchase.")
        XCTAssertFalse(app.buttons["jagdlatein.apple.purchase"].exists,
                       "The public unauthenticated test must never offer an Apple purchase.")
        attachScreenshot(app, name: "Native subscription sheet without account or checkout")
        subscriptions.buttons["Fertig"].tap()
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
