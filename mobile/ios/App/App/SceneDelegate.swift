import UIKit
import WebKit
import JagdlateinCore

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        let selected = Bundle.main.object(forInfoDictionaryKey: "JagdlateinWebsiteEnvironment") as? String ?? "Production"
        guard let environment = WebsiteEnvironment(rawValue: selected) else {
            let error = UIViewController()
            error.view.backgroundColor = .systemBackground
            let message = UILabel()
            message.text = "Die App-Konfiguration ist ungültig. Bitte installiere den freigegebenen Jagdlatein-Build erneut."
            message.numberOfLines = 0
            message.translatesAutoresizingMaskIntoConstraints = false
            error.view.addSubview(message)
            NSLayoutConstraint.activate([message.centerYAnchor.constraint(equalTo: error.view.centerYAnchor),
                message.leadingAnchor.constraint(equalTo: error.view.leadingAnchor, constant: 24),
                message.trailingAnchor.constraint(equalTo: error.view.trailingAnchor, constant: -24)])
            window.rootViewController = error
            self.window = window
            window.makeKeyAndVisible()
            return
        }
        WebsitePolicy.configure(environment: environment)
        window.rootViewController = WebsiteViewController()
        self.window = window
        window.makeKeyAndVisible()
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        (window?.rootViewController as? WebsiteViewController)?.refreshAppleTransactions()
    }
}

/// First-party, persistent website session; no injected login or API secrets.
private final class WebsiteViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate, UIDocumentInteractionControllerDelegate {
    private let webView: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        return WKWebView(frame: .zero, configuration: configuration)
    }()
    private let toolbar = UIToolbar()
    private let heading = UILabel()
    private let brandLogo = UIImageView(image: UIImage(named: "BrandLogo"))
    private let brandHeader = UIStackView()
    private let progress = UIProgressView(progressViewStyle: .bar)
    private let refresh = UIRefreshControl()
    private let errorPanel = UIStackView()
    private let errorDescription = UILabel()
    private let bookmarks = BookmarkStore()
    private var observations: [NSKeyValueObservation] = []
    private var lastRequestedURL = WebsitePolicy.homeURL
    private var lastAllowedURL = WebsitePolicy.homeURL
    private var contentRulesReady = false
    private var compilingContentRules = false
    private var restoringAllowedPage = false
    private var paymentHintAfterRestore = false
    private var downloadDestinations: [ObjectIdentifier: URL] = [:]
    private var documentController: UIDocumentInteractionController?
    private lazy var backButton = toolbarButton("chevron.left", label: "Zurück", action: #selector(goBack))
    private lazy var forwardButton = toolbarButton("chevron.right", label: "Vorwärts", action: #selector(goForward))
    private lazy var reloadButton = toolbarButton("arrow.clockwise", label: "Neu laden", action: #selector(reloadPage))
    private lazy var bookmarksButton = toolbarButton("bookmark", label: "Merkliste", action: #selector(showBookmarks))
    private lazy var shareButton = toolbarButton("square.and.arrow.up", label: "Seite teilen", action: #selector(sharePage))
    private lazy var subscriptionButton = toolbarButton("person.crop.circle.badge.checkmark", label: "Abo und Käufe", action: #selector(showSubscriptions))
    private lazy var appleSubscriptions = AppleSubscriptionManager(cookieStore: webView.configuration.websiteDataStore.httpCookieStore) { [weak self] in self?.webView.url }
    private var accent: UIColor { UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 0.88, green: 0.74, blue: 0.42, alpha: 1) : UIColor(red: 0.51, green: 0.38, blue: 0.11, alpha: 1) } }
    private var background: UIColor { UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 0.12, green: 0.13, blue: 0.11, alpha: 1) : UIColor(red: 0.98, green: 0.97, blue: 0.93, alpha: 1) } }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = background
        view.tintColor = accent
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.accessibilityIdentifier = "jagdlatein.website"
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = background
        webView.scrollView.backgroundColor = background
        webView.scrollView.refreshControl = refresh
        refresh.tintColor = accent
        refresh.addTarget(self, action: #selector(reloadPage), for: .valueChanged)

        heading.text = WebsitePolicy.environment == .sandbox ? "Jagdlatein · Testumgebung" : "Jagdlatein"
        heading.accessibilityIdentifier = "jagdlatein.website.location"
        heading.font = .preferredFont(forTextStyle: .headline)
        heading.adjustsFontForContentSizeCategory = true
        heading.textColor = .label
        heading.accessibilityTraits = .header
        heading.textAlignment = .left
        heading.numberOfLines = 0
        heading.setContentCompressionResistancePriority(.required, for: .vertical)
        brandLogo.contentMode = .scaleAspectFit
        brandLogo.isAccessibilityElement = false
        brandLogo.translatesAutoresizingMaskIntoConstraints = false
        brandHeader.axis = .horizontal
        brandHeader.alignment = .center
        brandHeader.spacing = 10
        brandHeader.addArrangedSubview(brandLogo)
        brandHeader.addArrangedSubview(heading)
        toolbar.tintColor = accent
        toolbar.barTintColor = background
        toolbar.isTranslucent = false
        toolbar.items = [backButton, .flexibleSpace(), forwardButton, .flexibleSpace(), reloadButton, .flexibleSpace(), bookmarksButton, .flexibleSpace(), subscriptionButton, .flexibleSpace(), shareButton]
        progress.progressTintColor = accent
        progress.trackTintColor = .clear
        progress.isHidden = true
        for child in [brandHeader, webView, progress, toolbar] {
            child.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(child)
        }
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            brandLogo.widthAnchor.constraint(equalToConstant: 36),
            brandLogo.heightAnchor.constraint(equalToConstant: 36),
            brandHeader.topAnchor.constraint(equalTo: safe.topAnchor, constant: 10),
            brandHeader.centerXAnchor.constraint(equalTo: safe.centerXAnchor),
            brandHeader.leadingAnchor.constraint(greaterThanOrEqualTo: safe.leadingAnchor, constant: 16),
            brandHeader.trailingAnchor.constraint(lessThanOrEqualTo: safe.trailingAnchor, constant: -16),
            progress.topAnchor.constraint(equalTo: brandHeader.bottomAnchor, constant: 10),
            progress.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            progress.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            progress.heightAnchor.constraint(equalToConstant: 2),
            webView.topAnchor.constraint(equalTo: progress.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: toolbar.topAnchor),
            toolbar.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            toolbar.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 50)
        ])
        configureErrorPanel()
        observations = [
            webView.observe(\.estimatedProgress, options: [.new]) { [weak self] view, _ in self?.progress.progress = Float(view.estimatedProgress) },
            webView.observe(\.canGoBack, options: [.initial, .new]) { [weak self] _, _ in self?.updateToolbar() },
            webView.observe(\.canGoForward, options: [.initial, .new]) { [weak self] _, _ in self?.updateToolbar() },
            webView.observe(\.url, options: [.initial, .new]) { [weak self] view, _ in self?.inspectVisibleURL(view.url) }
        ]
        prepareContentRules()
        appleSubscriptions.onConfirmed = { [weak self] token in
            Task { [weak self] in await self?.refreshWebsiteAccess(for: token) }
        }
        appleSubscriptions.start()
    }

    private func toolbarButton(_ symbol: String, label: String, action: Selector) -> UIBarButtonItem {
        let item = UIBarButtonItem(image: UIImage(systemName: symbol), style: .plain, target: self, action: action)
        item.accessibilityLabel = label
        return item
    }
    private func configureErrorPanel() {
        errorPanel.axis = .vertical
        errorPanel.spacing = 18
        errorPanel.alignment = .center
        errorPanel.isLayoutMarginsRelativeArrangement = true
        errorPanel.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 30, leading: 24, bottom: 30, trailing: 24)
        errorPanel.backgroundColor = background
        errorPanel.translatesAutoresizingMaskIntoConstraints = false
        let symbol = UIImageView(image: UIImage(systemName: "wifi.exclamationmark"))
        symbol.tintColor = accent
        symbol.contentMode = .scaleAspectFit
        symbol.heightAnchor.constraint(equalToConstant: 44).isActive = true
        symbol.widthAnchor.constraint(equalToConstant: 44).isActive = true
        symbol.isAccessibilityElement = false
        errorDescription.font = .preferredFont(forTextStyle: .body)
        errorDescription.adjustsFontForContentSizeCategory = true
        errorDescription.textAlignment = .center
        errorDescription.numberOfLines = 0
        let retry = UIButton(type: .system)
        var configuration = UIButton.Configuration.filled()
        configuration.title = "Erneut versuchen"
        configuration.baseBackgroundColor = accent
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 14, leading: 24, bottom: 14, trailing: 24)
        retry.configuration = configuration
        retry.addTarget(self, action: #selector(retryPage), for: .touchUpInside)
        errorPanel.addArrangedSubview(symbol)
        errorPanel.addArrangedSubview(errorDescription)
        errorPanel.addArrangedSubview(retry)
        view.addSubview(errorPanel)
        NSLayoutConstraint.activate([
            errorPanel.centerYAnchor.constraint(equalTo: webView.centerYAnchor),
            errorPanel.leadingAnchor.constraint(equalTo: webView.leadingAnchor, constant: 16),
            errorPanel.trailingAnchor.constraint(equalTo: webView.trailingAnchor, constant: -16)
        ])
        errorPanel.isHidden = true
    }
    private func load(_ url: URL) {
        guard WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) == .allowInWebView else { return }
        lastRequestedURL = url
        guard contentRulesReady else { prepareContentRules(); return }
        errorPanel.isHidden = true
        webView.load(URLRequest(url: url))
    }
    private func prepareContentRules() {
        guard !contentRulesReady, !compilingContentRules else { return }
        guard let store = WKContentRuleListStore.default() else {
            showError("Die iOS-Vorschau konnte nicht vorbereitet werden. Bitte versuche es erneut.")
            return
        }
        compilingContentRules = true
        errorPanel.isHidden = true
        progress.isHidden = false
        updateToolbar()
        store.compileContentRuleList(forIdentifier: "jagdlatein.preview.payment-rules.\(WebsitePolicy.environment.rawValue).v2", encodedContentRuleList: WebsitePolicy.contentBlockingRulesJSON) { [weak self] ruleList, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.compilingContentRules = false
                guard error == nil, let ruleList = ruleList else {
                    // Fail closed: no page or payment request is loaded on error.
                    self.showError("Die iOS-Vorschau konnte nicht vorbereitet werden. Bitte versuche es erneut.")
                    return
                }
                self.webView.configuration.userContentController.add(ruleList)
                self.contentRulesReady = true
                self.load(self.lastRequestedURL)
            }
        }
    }
    private func inspectVisibleURL(_ url: URL?) {
        // Native accessibility exposes only public, permitted paths. It never
        // exposes a login code, query string or private account location.
        let safeURL = url.flatMap { candidate -> URL? in
            guard WebsitePolicy.decision(for: candidate, isMainFrame: true, userInitiated: false) == .allowInWebView else { return nil }
            return WebsitePolicy.bookmarkURL(for: candidate)
        }
        heading.accessibilityValue = safeURL?.absoluteString ?? "Keine öffentliche Lernseite geöffnet"
        updateToolbar()
        guard contentRulesReady, let url = url, !restoringAllowedPage else { return }
        switch WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) {
        case .allowInWebView:
            lastAllowedURL = url
            lastRequestedURL = url
        case .blockedPayment, .reject, .openExternally:
            // Next.js history changes need not invoke WKNavigationDelegate.
            // The already-installed network rules also cover fetch/XHR while
            // this view returns to the last permitted page.
            paymentHintAfterRestore = WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) == .blockedPayment
            restoringAllowedPage = true
            webView.isHidden = true
            webView.stopLoading()
            updateToolbar()
            DispatchQueue.main.async { [weak self] in
                guard let self = self, self.restoringAllowedPage else { return }
                self.load(self.lastAllowedURL)
            }
        }
    }
    private func updateToolbar() {
        backButton.isEnabled = contentRulesReady && !restoringAllowedPage && webView.canGoBack
        forwardButton.isEnabled = contentRulesReady && !restoringAllowedPage && webView.canGoForward
        reloadButton.isEnabled = !compilingContentRules && !restoringAllowedPage
        shareButton.isEnabled = contentRulesReady && !restoringAllowedPage && webView.url.flatMap { WebsitePolicy.bookmarkURL(for: $0) } != nil
        subscriptionButton.isEnabled = contentRulesReady && !restoringAllowedPage && webView.url.flatMap { AppleBillingPolicy.requestURL(for: .context, visiblePage: $0) } != nil
    }
    @objc private func goBack() { errorPanel.isHidden = true; webView.goBack() }
    @objc private func goForward() { errorPanel.isHidden = true; webView.goForward() }
    @objc private func reloadPage() {
        guard contentRulesReady else { prepareContentRules(); return }
        guard !restoringAllowedPage else { return }
        errorPanel.isHidden = true
        if let url = webView.url, WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) == .allowInWebView {
            webView.reload()
        } else { load(lastRequestedURL) }
    }
    @objc private func retryPage() { load(lastRequestedURL) }
    @objc private func showBookmarks() {
        let current = webView.url.flatMap { WebsitePolicy.sanitizeBookmark(url: $0, title: webView.title) }
        let list = BookmarkViewController(store: bookmarks, current: current) { [weak self] url in self?.load(url) }
        let navigation = UINavigationController(rootViewController: list)
        navigation.navigationBar.tintColor = accent
        navigation.modalPresentationStyle = .pageSheet
        present(navigation, animated: true)
    }
    @objc private func sharePage() {
        guard let url = webView.url, let safeURL = WebsitePolicy.bookmarkURL(for: url) else { return }
        let sheet = UIActivityViewController(activityItems: [safeURL], applicationActivities: nil)
        sheet.popoverPresentationController?.barButtonItem = shareButton
        present(sheet, animated: true)
    }
    @objc private func showSubscriptions() {
        guard presentedViewController == nil else { return }
        let sheet = AppleSubscriptionViewController(manager: appleSubscriptions) { [weak self] in
            self?.load(WebsitePolicy.homeURL.appendingPathComponent("konto"))
        }
        let navigation = UINavigationController(rootViewController: sheet)
        navigation.navigationBar.tintColor = accent
        navigation.modalPresentationStyle = .pageSheet
        present(navigation, animated: true)
    }
    func refreshAppleTransactions() {
        Task { [weak self] in await self?.appleSubscriptions.reconcileIfNeeded() }
    }
    private func refreshWebsiteAccess(for token: UUID) async {
        guard let page = webView.url, WebsitePolicy.isWebsiteURL(page),
              let context = try? await appleSubscriptions.context(), context.isConfigured,
              context.appAccountToken == token else { return }
        do {
            // One constant same-origin request lets WebKit renew its HttpOnly
            // session cookie. No token/cookie value or arbitrary native method
            // is passed to website JavaScript.
            let result = try await webView.callAsyncJavaScript(
                "const response = await fetch('/api/auth/status', {cache: 'no-store', credentials: 'same-origin'}); if (!response.ok) return false; const status = await response.json(); return status.loggedIn === true;",
                arguments: [:], in: nil, contentWorld: .page
            )
            guard result as? Bool == true, let currentPage = webView.url,
                  AppleBillingPolicy.origin(of: currentPage) == AppleBillingPolicy.origin(of: page),
                  let current = try? await appleSubscriptions.context(), current.isConfigured,
                  current.appAccountToken == token else { return }
            reloadPage()
        } catch { /* Server access stays authoritative; the next website status check can retry. */ }
    }
    private func finishLoading() { progress.isHidden = true; refresh.endRefreshing(); updateToolbar() }
    private func showError(_ message: String) {
        if restoringAllowedPage {
            restoringAllowedPage = false
            paymentHintAfterRestore = false
            lastRequestedURL = WebsitePolicy.homeURL
        }
        finishLoading()
        errorDescription.text = message
        errorPanel.isHidden = false
        UIAccessibility.post(notification: .announcement, argument: message)
    }
    private func showInformation(title: String, message: String, identifier: String? = nil) {
        guard presentedViewController == nil else { return }
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.view.accessibilityIdentifier = identifier
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    private func handleNavigation(_ action: WKNavigationAction) -> WebsiteNavigationDecision {
        guard let url = action.request.url else { return .reject }
        return WebsitePolicy.decision(for: url, isMainFrame: action.targetFrame?.isMainFrame ?? true, userInitiated: action.navigationType == .linkActivated)
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard contentRulesReady else { decisionHandler(.cancel); return }
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        switch handleNavigation(navigationAction) {
        case .allowInWebView:
            if navigationAction.targetFrame == nil {
                // Same-site target=_blank retains the authenticated web view.
                webView.load(navigationAction.request)
                decisionHandler(.cancel)
            } else {
                if navigationAction.targetFrame?.isMainFrame == true { lastRequestedURL = url }
                decisionHandler(navigationAction.shouldPerformDownload ? .download : .allow)
            }
        case .openExternally:
            decisionHandler(.cancel)
            finishLoading()
            UIApplication.shared.open(url, options: [:]) { [weak self] opened in
                if !opened {
                    DispatchQueue.main.async {
                        self?.showInformation(title: "Link nicht geöffnet", message: "Dieser Link konnte auf dem Gerät nicht geöffnet werden.")
                    }
                }
            }
        case .blockedPayment:
            decisionHandler(.cancel)
            if navigationAction.targetFrame?.isMainFrame != false {
                finishLoading()
                showPaymentInformation()
            }
        case .reject:
            decisionHandler(.cancel)
            if navigationAction.targetFrame?.isMainFrame != false { finishLoading() }
            if navigationAction.navigationType == .linkActivated {
                showInformation(title: "Link nicht geöffnet", message: "Dieser Link kann in der Vorschau nicht geöffnet werden.")
            }
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if navigationResponse.isForMainFrame, let response = navigationResponse.response as? HTTPURLResponse, response.statusCode >= 400 {
            decisionHandler(.cancel)
            showError("Die Seite ist gerade nicht verfügbar (\(response.statusCode)). Bitte versuche es erneut.")
            return
        }
        let attachment = (navigationResponse.response as? HTTPURLResponse)?.value(forHTTPHeaderField: "Content-Disposition")?.lowercased().hasPrefix("attachment") == true
        if attachment || !navigationResponse.canShowMIMEType {
            guard navigationResponse.isForMainFrame, let url = navigationResponse.response.url,
                  WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) == .allowInWebView else {
                decisionHandler(.cancel)
                if navigationResponse.isForMainFrame { finishLoading() }
                return
            }
            decisionHandler(.download)
        } else { decisionHandler(.allow) }
    }
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        errorPanel.isHidden = true
        progress.progress = 0
        progress.isHidden = false
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let visibleURL = webView.url, WebsitePolicy.decision(for: visibleURL, isMainFrame: true, userInitiated: false) == .allowInWebView else {
            restoringAllowedPage = false
            paymentHintAfterRestore = false
            lastRequestedURL = WebsitePolicy.homeURL
            webView.isHidden = true
            webView.stopLoading()
            showError("Diese Seite kann in der Vorschau nicht geöffnet werden. Bitte kehre mit „Erneut versuchen“ zur Startseite zurück.")
            return
        }
        if restoringAllowedPage {
            restoringAllowedPage = false
            // Recovery does not accept a blocked route or repeat itself.
            lastAllowedURL = visibleURL
            lastRequestedURL = visibleURL
        }
        webView.isHidden = false
        finishLoading()
        Task { [weak self] in await self?.appleSubscriptions.reconcileIfNeeded() }
        if paymentHintAfterRestore {
            paymentHintAfterRestore = false
            showPaymentInformation()
        }
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { handleFailure(error) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { handleFailure(error) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { showError("Die Seite wurde unterbrochen. Bitte lade sie erneut.") }
    private func handleFailure(_ error: Error) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        if restoringAllowedPage { restoringAllowedPage = false; lastRequestedURL = WebsitePolicy.homeURL }
        paymentHintAfterRestore = false
        showError("Jagdlatein konnte nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.")
    }
    private func showPaymentInformation() {
        showSubscriptions()
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if handleNavigation(navigationAction) == .allowInWebView { webView.load(navigationAction.request) }
        return nil
    }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard let url = frame.request.url, WebsitePolicy.isWebsiteURL(url), presentedViewController == nil else { completionHandler(); return }
        let alert = UIAlertController(title: "Jagdlatein", message: String(message.prefix(1000)), preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard let url = frame.request.url, WebsitePolicy.isWebsiteURL(url), presentedViewController == nil else { completionHandler(false); return }
        let alert = UIAlertController(title: "Jagdlatein", message: String(message.prefix(1000)), preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Abbrechen", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "Bestätigen", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) { download.delegate = self; finishLoading() }
    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) { download.delegate = self; finishLoading() }
    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        guard let url = response.url, WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) == .allowInWebView else {
            completionHandler(nil)
            showInformation(title: "Download nicht geöffnet", message: "Diese Datei kann in der Vorschau nicht geladen werden.")
            return
        }
        do {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent("JagdlateinDownloads", isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let leaf = URL(fileURLWithPath: suggestedFilename).lastPathComponent
            let cleaned = leaf.unicodeScalars.filter { CharacterSet.alphanumerics.union(CharacterSet(charactersIn: ".-_ ")).contains($0) }
            let name = String(String(String.UnicodeScalarView(cleaned)).prefix(120))
            let destination = folder.appendingPathComponent(UUID().uuidString + "-" + (name.isEmpty ? "Dokument" : name))
            downloadDestinations[ObjectIdentifier(download)] = destination
            completionHandler(destination)
        } catch {
            completionHandler(nil)
            showInformation(title: "Download fehlgeschlagen", message: "Die Datei konnte auf dem Gerät nicht gespeichert werden.")
        }
    }
    func download(_ download: WKDownload, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, decisionHandler: @escaping (WKDownload.RedirectPolicy) -> Void) {
        guard let url = request.url, WebsitePolicy.decision(for: url, isMainFrame: true, userInitiated: false) == .allowInWebView else {
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
    func downloadDidFinish(_ download: WKDownload) {
        guard let url = downloadDestinations.removeValue(forKey: ObjectIdentifier(download)), FileManager.default.fileExists(atPath: url.path) else { return }
        guard presentedViewController == nil else { return }
        let controller = UIDocumentInteractionController(url: url)
        controller.delegate = self
        documentController = controller
        if !controller.presentPreview(animated: true) {
            let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            sheet.popoverPresentationController?.barButtonItem = shareButton
            present(sheet, animated: true)
        }
    }
    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        if let url = downloadDestinations.removeValue(forKey: ObjectIdentifier(download)) { try? FileManager.default.removeItem(at: url) }
        showInformation(title: "Download fehlgeschlagen", message: "Die Datei konnte nicht vollständig geladen werden. Bitte versuche es erneut.")
    }
    func documentInteractionControllerViewControllerForPreview(_ controller: UIDocumentInteractionController) -> UIViewController { self }
}

private final class BookmarkStore {
    private let defaults = UserDefaults.standard
    private let key = WebsitePolicy.environment == .sandbox ? "jagdlatein.website.bookmarks.sandbox.v1" : "jagdlatein.website.bookmarks.v1"
    private(set) var items: [WebsiteBookmark] = []
    init() {
        guard let data = defaults.data(forKey: key), let saved = try? JSONDecoder().decode([WebsiteBookmark].self, from: data) else { return }
        var seen = Set<String>()
        items = saved.prefix(100).compactMap { item in
            guard let clean = WebsitePolicy.sanitizeBookmark(url: item.url, title: item.title), seen.insert(clean.id).inserted else { return nil }
            return WebsiteBookmark(url: clean.url, title: clean.title, addedAt: item.addedAt)
        }
    }
    func add(_ item: WebsiteBookmark) {
        guard let clean = WebsitePolicy.sanitizeBookmark(url: item.url, title: item.title) else { return }
        items.removeAll { $0.id == clean.id }
        items.insert(clean, at: 0)
        items = Array(items.prefix(100))
        save()
    }
    func remove(at index: Int) { guard items.indices.contains(index) else { return }; items.remove(at: index); save() }
    private func save() { if let data = try? JSONEncoder().encode(items) { defaults.set(data, forKey: key) } }
}

private final class BookmarkViewController: UITableViewController {
    private let store: BookmarkStore
    private let current: WebsiteBookmark?
    private let onOpen: (URL) -> Void
    init(store: BookmarkStore, current: WebsiteBookmark?, open: @escaping (URL) -> Void) {
        self.store = store
        self.current = current
        self.onOpen = open
        super.init(style: .insetGrouped)
    }
    required init?(coder: NSCoder) { fatalError("Use init(store:current:open:)") }
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Merkliste"
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Fertig", style: .done, target: self, action: #selector(close))
        let add = UIBarButtonItem(image: UIImage(systemName: "bookmark.badge.plus"), style: .plain, target: self, action: #selector(addCurrent))
        add.accessibilityLabel = "Aktuelle Seite merken"
        add.isEnabled = current != nil
        navigationItem.leftBarButtonItem = add
        updateEmptyState()
    }
    @objc private func close() { dismiss(animated: true) }
    @objc private func addCurrent() { guard let current = current else { return }; store.add(current); tableView.reloadData(); updateEmptyState() }
    private func updateEmptyState() {
        if store.items.isEmpty {
            let label = UILabel()
            label.text = "Merke Lernseiten mit dem Lesezeichen oben. Deine Merkliste wird auf diesem Gerät gespeichert."
            label.numberOfLines = 0
            label.textAlignment = .center
            label.font = .preferredFont(forTextStyle: .body)
            label.adjustsFontForContentSizeCategory = true
            label.textColor = .secondaryLabel
            tableView.backgroundView = label
        } else { tableView.backgroundView = nil }
    }
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { store.items.count }
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell(style: .subtitle, reuseIdentifier: nil)
        let item = store.items[indexPath.row]
        // Derived from the real sanitized store entry, never from test fixtures.
        cell.accessibilityIdentifier = "jagdlatein.bookmark." + item.url.absoluteString
        cell.textLabel?.text = item.title
        cell.textLabel?.font = .preferredFont(forTextStyle: .body)
        cell.textLabel?.adjustsFontForContentSizeCategory = true
        cell.textLabel?.numberOfLines = 2
        cell.detailTextLabel?.text = item.url.path.isEmpty || item.url.path == "/" ? "Startseite" : item.url.path
        cell.detailTextLabel?.adjustsFontForContentSizeCategory = true
        cell.accessoryType = .disclosureIndicator
        cell.imageView?.image = UIImage(systemName: "bookmark.fill")
        cell.imageView?.tintColor = navigationController?.navigationBar.tintColor
        return cell
    }
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let url = store.items[indexPath.row].url
        dismiss(animated: true) { [onOpen] in onOpen(url) }
    }
    override func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCell.EditingStyle, forRowAt indexPath: IndexPath) {
        guard editingStyle == .delete else { return }
        store.remove(at: indexPath.row)
        tableView.deleteRows(at: [indexPath], with: .automatic)
        updateEmptyState()
    }
}
