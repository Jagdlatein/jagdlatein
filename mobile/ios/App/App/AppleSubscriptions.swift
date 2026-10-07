import Foundation
import UIKit
import WebKit
import StoreKit
import JagdlateinCore

private enum AppleSubscriptionError: LocalizedError {
    case signIn, disabled, accountChanged, unavailable, unverified, alreadyPaid, existingPurchase, otherAccount
    var errorDescription: String? {
        switch self {
        case .signIn: return "Bitte melde dich zuerst mit deinem Jagdlatein-Konto an."
        case .disabled: return "Apple-Abos werden noch vorbereitet. Dein bestehender Jagdlatein-Zugang bleibt verfügbar."
        case .accountChanged: return "Das angemeldete Konto hat sich geändert. Bitte öffne die Abo-Übersicht erneut."
        case .unavailable: return "Die Bestätigung ist gerade nicht erreichbar. Bitte versuche es erneut. Ein bereits erfolgter Kauf bleibt zur Wiederherstellung vorgemerkt."
        case .unverified: return "Dieser Kauf konnte nicht sicher geprüft werden. Es wurde kein Zugang freigeschaltet."
        case .alreadyPaid: return "Dein Konto hat bereits Zugang. Ein weiteres Abo ist dafür nicht erforderlich."
        case .existingPurchase: return "Apple meldet bereits ein vorhandenes Abo. Wähle „Käufe wiederherstellen“, um es mit deinem Jagdlatein-Konto abzugleichen."
        case .otherAccount: return "Dieser Apple-Kauf gehört zu einem anderen Jagdlatein-Konto. Bitte melde dich mit dem ursprünglichen Konto an."
        }
    }
}

private final class NoBillingRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        // Session cookies and signed purchases must never follow a redirect.
        completionHandler(nil)
    }
}

/// Two fixed first-party API calls. No JavaScript bridge, shared cookie jar,
/// persistent credentials, arbitrary paths or external recipients are involved.
@MainActor
private final class AppleAccountClient {
    private let cookieStore: WKHTTPCookieStore
    private let visiblePage: () -> URL?
    init(cookieStore: WKHTTPCookieStore, visiblePage: @escaping () -> URL?) {
        self.cookieStore = cookieStore
        self.visiblePage = visiblePage
    }

    func context() async throws -> ApplePurchaseContext {
        let data = try await request(.context)
        guard let result = try? JSONDecoder().decode(ApplePurchaseContext.self, from: data) else {
            throw AppleSubscriptionError.unavailable
        }
        guard !result.enabled || result.environment == WebsitePolicy.environment.rawValue else { throw AppleSubscriptionError.disabled }
        return result
    }

    struct Confirmation: Decodable {
        let ok: Bool
        let paid: Bool
        let paidUntil: String?
    }

    func confirm(_ signedTransaction: String) async throws -> Confirmation {
        guard signedTransaction.count <= 100_000,
              let body = try? JSONSerialization.data(withJSONObject: ["signedTransactionInfo": signedTransaction]) else {
            throw AppleSubscriptionError.unverified
        }
        let data = try await request(.transactions, body: body)
        guard let result = try? JSONDecoder().decode(Confirmation.self, from: data), result.ok else {
            throw AppleSubscriptionError.unavailable
        }
        return result
    }

    private func request(_ endpoint: AppleBillingEndpoint, body: Data? = nil) async throws -> Data {
        guard let page = visiblePage(), let url = AppleBillingPolicy.requestURL(for: endpoint, visiblePage: page),
              let origin = AppleBillingPolicy.origin(of: page), let host = url.host?.lowercased() else {
            throw AppleSubscriptionError.unavailable
        }
        let allCookies: [HTTPCookie] = await withCheckedContinuation { continuation in
            cookieStore.getAllCookies { continuation.resume(returning: $0) }
        }
        let cookies = allCookies.filter { cookie in
            let domain = cookie.domain.lowercased()
            let domainMatches = domain.hasPrefix(".")
                ? host == String(domain.dropFirst()) || host.hasSuffix(domain)
                : host == domain
            let path = cookie.path
            let pathMatches = path == "/" || url.path == path || url.path.hasPrefix(path.hasSuffix("/") ? path : path + "/")
            return domainMatches && pathMatches && (cookie.expiresDate == nil || cookie.expiresDate! > Date())
        }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        request.httpMethod = body == nil ? "GET" : "POST"
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(origin, forHTTPHeaderField: "Origin")
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        for (field, value) in HTTPCookie.requestHeaderFields(with: cookies) { request.setValue(value, forHTTPHeaderField: field) }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCredentialStorage = nil
        configuration.urlCache = nil
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }
        let (data, rawResponse) = try await session.data(for: request, delegate: NoBillingRedirects())
        guard let currentPage = visiblePage(), AppleBillingPolicy.origin(of: currentPage) == origin,
              let response = rawResponse as? HTTPURLResponse, response.url == url, data.count <= 1_048_576 else {
            throw AppleSubscriptionError.accountChanged
        }
        switch response.statusCode {
        case 200..<300:
            guard response.value(forHTTPHeaderField: "Content-Type")?.lowercased().hasPrefix("application/json") == true else {
                throw AppleSubscriptionError.unavailable
            }
            return data
        case 401: throw AppleSubscriptionError.signIn
        case 404: throw AppleSubscriptionError.disabled
        case 409: throw AppleSubscriptionError.otherAccount
        default: throw AppleSubscriptionError.unavailable
        }
    }
}

@MainActor
final class AppleSubscriptionManager {
    private let client: AppleAccountClient
    private var updates: Task<Void, Never>?
    private var confirming: [UInt64: Task<Bool, Error>] = [:]
    private var lastReconciliation = Date.distantPast
    var onConfirmed: ((UUID) -> Void)?

    init(cookieStore: WKHTTPCookieStore, visiblePage: @escaping () -> URL?) {
        client = AppleAccountClient(cookieStore: cookieStore, visiblePage: visiblePage)
    }
    deinit { updates?.cancel() }

    func start() {
        guard updates == nil else { return }
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { return }
                do { _ = try await self.confirm(result) } catch { /* Leave unfinished for the original account to retry. */ }
            }
        }
    }

    func context() async throws -> ApplePurchaseContext { try await client.context() }

    func products(for context: ApplePurchaseContext) async throws -> [Product] {
        guard context.isConfigured, let ids = context.productIds else { throw AppleSubscriptionError.disabled }
        try await ensureNoExistingPurchase(context)
        let products = try await Product.products(for: ids)
        return products.filter { ids.contains($0.id) && $0.type == .autoRenewable && $0.subscription != nil }
    }

    func purchase(_ product: Product, context shownContext: ApplePurchaseContext, scene: UIWindowScene) async throws -> String {
        let current = try await client.context()
        guard current.isConfigured, current.appAccountToken == shownContext.appAccountToken,
              current.productIds?.contains(product.id) == true, let token = current.appAccountToken else {
            throw AppleSubscriptionError.accountChanged
        }
        guard current.purchaseAllowed == true, current.paid != true else { throw AppleSubscriptionError.alreadyPaid }
        try await ensureNoExistingPurchase(current)
        let result: Product.PurchaseResult
        if #available(iOS 17.0, *) {
            result = try await product.purchase(confirmIn: scene, options: [.appAccountToken(token)])
        } else {
            result = try await product.purchase(options: [.appAccountToken(token)])
        }
        switch result {
        case .success(let verification):
            let paid = try await confirm(verification, expectedToken: token)
            return paid ? "Dein Apple-Abo ist bestätigt. Deine Lerninhalte sind freigeschaltet." : "Der Kauf ist geprüft. Bitte lade die Konto-Übersicht für deinen aktuellen Zugangsstatus neu."
        case .userCancelled: return "Der Kauf wurde abgebrochen."
        case .pending: return "Apple prüft den Kauf noch. Sobald er genehmigt ist, wird die Bestätigung erneut versucht."
        @unknown default: throw AppleSubscriptionError.unavailable
        }
    }

    func restore(expectedContext: ApplePurchaseContext) async throws -> String {
        let current = try await client.context()
        guard current.isConfigured, current.appAccountToken == expectedContext.appAccountToken else { throw AppleSubscriptionError.accountChanged }
        // Only an explicit tap on Restore requests Apple authentication.
        try await AppStore.sync()
        var matched = false
        var otherAccount = false
        var seen = Set<UInt64>()
        for await result in Transaction.currentEntitlements {
            if case .unverified = result { throw AppleSubscriptionError.unverified }
            guard case .verified(let transaction) = result,
                  current.productIds?.contains(transaction.productID) == true else { continue }
            guard current.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else {
                otherAccount = true
                continue
            }
            seen.insert(transaction.id)
            _ = try await confirm(result, expectedToken: current.appAccountToken)
            matched = true
        }
        for await result in Transaction.unfinished {
            guard case .verified(let transaction) = result, !seen.contains(transaction.id),
                  current.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else { continue }
            _ = try await confirm(result, expectedToken: current.appAccountToken)
            matched = true
        }
        if !matched && otherAccount { throw AppleSubscriptionError.otherAccount }
        return matched ? "Deine Apple-Käufe wurden mit diesem Jagdlatein-Konto abgeglichen." : "Für dieses Jagdlatein-Konto wurde kein passendes Apple-Abo gefunden."
    }

    func reconcileIfNeeded() async {
        guard Date().timeIntervalSince(lastReconciliation) >= 60 else { return }
        lastReconciliation = Date()
        guard let context = try? await client.context(), context.isConfigured else { return }
        for await result in Transaction.unfinished {
            guard case .verified(let transaction) = result,
                  context.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else { continue }
            do { _ = try await confirm(result, expectedToken: context.appAccountToken) } catch { }
        }
    }

    private func ensureNoExistingPurchase(_ context: ApplePurchaseContext) async throws {
        for await result in Transaction.currentEntitlements {
            if case .unverified = result { throw AppleSubscriptionError.unverified }
            guard case .verified(let transaction) = result,
                  context.productIds?.contains(transaction.productID) == true else { continue }
            guard context.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else {
                throw AppleSubscriptionError.otherAccount
            }
            throw AppleSubscriptionError.existingPurchase
        }
    }

    private func confirm(_ result: VerificationResult<Transaction>, expectedToken: UUID? = nil) async throws -> Bool {
        guard case .verified(let transaction) = result, transaction.ownershipType == .purchased else { throw AppleSubscriptionError.unverified }
        guard expectedToken == nil || expectedToken == transaction.appAccountToken else { throw AppleSubscriptionError.otherAccount }
        if let existing = confirming[transaction.id] { return try await existing.value }
        let task = Task { try await self.confirmOnce(result, transaction: transaction, expectedToken: expectedToken) }
        confirming[transaction.id] = task
        defer { confirming.removeValue(forKey: transaction.id) }
        return try await task.value
    }

    private func confirmOnce(_ result: VerificationResult<Transaction>, transaction: Transaction, expectedToken: UUID?) async throws -> Bool {
        let context = try await client.context()
        guard context.isConfigured,
              expectedToken == nil || context.appAccountToken == expectedToken else { throw AppleSubscriptionError.accountChanged }
        guard context.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else {
            throw AppleSubscriptionError.otherAccount
        }
        let confirmation = try await client.confirm(result.jwsRepresentation)
        let afterConfirmation = try await client.context()
        guard afterConfirmation.isConfigured, afterConfirmation.appAccountToken == context.appAccountToken,
              let token = context.appAccountToken else { throw AppleSubscriptionError.accountChanged }
        // StoreKit verification alone never unlocks courses or finishes a purchase.
        // A failed or cross-account server confirmation remains retryable.
        await transaction.finish()
        onConfirmed?(token)
        return confirmation.paid
    }
}

@MainActor
final class AppleSubscriptionViewController: UIViewController {
    private let manager: AppleSubscriptionManager
    private let onSignIn: () -> Void
    private let stack = UIStackView()
    private let status = UILabel()
    private let productStack = UIStackView()
    private var context: ApplePurchaseContext?
    private var buttons: [UIButton] = []
    private var loading = false
    private var task: Task<Void, Never>?

    init(manager: AppleSubscriptionManager, onSignIn: @escaping () -> Void) {
        self.manager = manager
        self.onSignIn = onSignIn
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    deinit { task?.cancel() }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Jagdlatein-Abo"
        view.backgroundColor = .systemGroupedBackground
        navigationItem.rightBarButtonItem = UIBarButtonItem(systemItem: .done, primaryAction: UIAction { [weak self] _ in self?.dismiss(animated: true) })
        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scroll)
        stack.axis = .vertical
        stack.spacing = 18
        stack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(stack)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor), scroll.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor), scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 24),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -24),
            stack.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -24),
            stack.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -48)
        ])
        stack.addArrangedSubview(label("Wissen für deine Jagdpraxis", style: .title2))
        stack.addArrangedSubview(label("Lernkurse, Übungen und Tierstimmen in deinem Jagdlatein-Konto. Ein bestehender Zugang funktioniert auch auf iPhone und iPad."))
        status.numberOfLines = 0
        status.font = .preferredFont(forTextStyle: .body)
        status.adjustsFontForContentSizeCategory = true
        status.accessibilityIdentifier = "jagdlatein.apple.status"
        stack.addArrangedSubview(status)
        productStack.axis = .vertical
        productStack.spacing = 14
        stack.addArrangedSubview(productStack)
        load()
    }

    private func label(_ text: String, style: UIFont.TextStyle = .body) -> UILabel {
        let label = UILabel()
        label.text = text
        label.numberOfLines = 0
        label.font = .preferredFont(forTextStyle: style)
        label.adjustsFontForContentSizeCategory = true
        return label
    }

    private func button(_ title: String, filled: Bool = false, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        var configuration = filled ? UIButton.Configuration.filled() : UIButton.Configuration.bordered()
        configuration.title = title
        configuration.titleLineBreakMode = .byWordWrapping
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 14, leading: 16, bottom: 14, trailing: 16)
        button.configuration = configuration
        button.titleLabel?.adjustsFontForContentSizeCategory = true
        button.addAction(UIAction { _ in action() }, for: .touchUpInside)
        buttons.append(button)
        return button
    }

    private func load() {
        guard !loading else { return }
        setLoading(true)
        status.text = "Konto und Apple-Angebot werden geladen …"
        task = Task { [weak self] in
            guard let self = self else { return }
            defer { self.setLoading(false) }
            do {
                let context = try await self.manager.context()
                self.context = context
                self.clearProducts()
                guard context.isConfigured else {
                    self.status.text = AppleSubscriptionError.disabled.localizedDescription
                    self.addCommonActions()
                    return
                }
                self.status.text = "Angemeldet als \(context.email ?? "")\n" + (context.paid == true ? "Dein Konto hat bereits Zugang. Du brauchst kein weiteres Abo." : "Wähle dein Apple-Abo. Apple zeigt die verbindlichen Bedingungen vor der Bestätigung.")
                if context.purchaseAllowed == true && context.paid != true {
                    let products = try await self.manager.products(for: context)
                    guard !products.isEmpty else { throw AppleSubscriptionError.unavailable }
                    for product in products { await self.addProduct(product, context: context) }
                }
                self.addCommonActions()
            } catch {
                self.clearProducts()
                self.status.text = self.message(for: error)
                self.addCommonActions()
            }
        }
    }

    private func clearProducts() {
        for child in productStack.arrangedSubviews { productStack.removeArrangedSubview(child); child.removeFromSuperview() }
        buttons.removeAll()
    }

    private func addProduct(_ product: Product, context: ApplePurchaseContext) async {
        guard let subscription = product.subscription else { return }
        let period = periodText(subscription.subscriptionPeriod)
        var offerText = "\(product.displayPrice) pro \(period)."
        if let offer = subscription.introductoryOffer, await subscription.isEligibleForIntroOffer {
            let duration = periodText(offer.period, repetitions: offer.periodCount)
            if offer.paymentMode == .freeTrial {
                offerText = "\(duration) kostenlos, danach \(product.displayPrice) pro \(period)."
            } else {
                offerText = "Einführungsangebot: \(offer.displayPrice) für \(duration); danach \(product.displayPrice) pro \(period)."
            }
        }
        productStack.addArrangedSubview(label(product.displayName, style: .headline))
        productStack.addArrangedSubview(label(offerText + " Das Abo verlängert sich automatisch, bis du es in deinem Apple-Konto kündigst."))
        let purchaseButton = button("Mit Apple abonnieren", filled: true) { [weak self] in self?.purchase(product, context: context) }
        purchaseButton.accessibilityIdentifier = "jagdlatein.apple.purchase"
        productStack.addArrangedSubview(purchaseButton)
    }

    private func periodText(_ period: Product.SubscriptionPeriod, repetitions: Int = 1) -> String {
        let count = period.value * repetitions
        let unit: String
        switch period.unit {
        case .day: unit = count == 1 ? "Tag" : "Tage"
        case .week: unit = count == 1 ? "Woche" : "Wochen"
        case .month: unit = count == 1 ? "Monat" : "Monate"
        case .year: unit = count == 1 ? "Jahr" : "Jahre"
        @unknown default: return "den von Apple angezeigten Zeitraum"
        }
        return count == 1 ? unit : "\(count) \(unit)"
    }

    private func addCommonActions() {
        let restore = button("Käufe wiederherstellen") { [weak self] in self?.restore() }
        restore.accessibilityIdentifier = "jagdlatein.apple.restore"
        restore.isEnabled = context?.isConfigured == true && !loading
        productStack.addArrangedSubview(restore)
        if !ProcessInfo.processInfo.isiOSAppOnMac {
            productStack.addArrangedSubview(button("Apple-Abos verwalten") { [weak self] in self?.manage() })
        }
        productStack.addArrangedSubview(button("Zum Jagdlatein-Konto") { [weak self] in
            guard let self = self else { return }
            self.dismiss(animated: true, completion: self.onSignIn)
        })
        productStack.addArrangedSubview(button("Erneut laden") { [weak self] in self?.load() })
        productStack.addArrangedSubview(label("Abrechnung und Kündigung eines Apple-Abos verwaltest du bei Apple. Die Löschung deines Jagdlatein-Kontos beendet ein Apple-Abo nicht automatisch.", style: .footnote))
        productStack.addArrangedSubview(button("Datenschutz") { UIApplication.shared.open(WebsitePolicy.homeURL.appendingPathComponent("datenschutz")) })
        productStack.addArrangedSubview(button("Apple-Nutzungsbedingungen") { UIApplication.shared.open(URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!) })
    }

    private func setLoading(_ value: Bool) {
        loading = value
        for button in buttons { button.isEnabled = !value }
        if !value, context?.isConfigured != true {
            buttons.first(where: { $0.accessibilityIdentifier == "jagdlatein.apple.restore" })?.isEnabled = false
        }
        navigationItem.rightBarButtonItem?.isEnabled = !value
        isModalInPresentation = value
    }

    private func purchase(_ product: Product, context: ApplePurchaseContext) {
        guard !loading, let scene = view.window?.windowScene else { return }
        setLoading(true)
        task = Task { [weak self] in
            guard let self = self else { return }
            defer { self.setLoading(false) }
            do { self.status.text = try await self.manager.purchase(product, context: context, scene: scene) }
            catch { self.status.text = self.message(for: error) }
            // Refresh explicitly before offering another purchase, including
            // after cancellation, pending approval or a failed server request.
            self.buttons.first(where: { $0.accessibilityIdentifier == "jagdlatein.apple.purchase" })?.isHidden = true
            UIAccessibility.post(notification: .announcement, argument: self.status.text)
        }
    }

    private func restore() {
        guard !loading, let context = context, context.isConfigured else { return }
        setLoading(true)
        task = Task { [weak self] in
            guard let self = self else { return }
            defer { self.setLoading(false) }
            do { self.status.text = try await self.manager.restore(expectedContext: context) }
            catch { self.status.text = self.message(for: error) }
            UIAccessibility.post(notification: .announcement, argument: self.status.text)
        }
    }

    private func manage() {
        guard !loading, let scene = view.window?.windowScene, !ProcessInfo.processInfo.isiOSAppOnMac else { return }
        setLoading(true)
        task = Task { [weak self] in
            guard let self = self else { return }
            defer { self.setLoading(false) }
            do { try await AppStore.showManageSubscriptions(in: scene) }
            catch { self.status.text = "Die Apple-Aboverwaltung konnte nicht geöffnet werden. Du findest sie auch in den Geräteeinstellungen unter deinem Apple-Konto > Abonnements." }
        }
    }

    private func message(for error: Error) -> String {
        (error as? AppleSubscriptionError)?.localizedDescription ?? AppleSubscriptionError.unavailable.localizedDescription
    }
}
