import Foundation
import UIKit
import WebKit
import StoreKit
import JagdlateinCore

private enum AppleSubscriptionError: LocalizedError {
    case signIn, disabled, accountChanged, unavailable, unverified, alreadyPaid, existingPurchase, otherAccount, unsupportedIntent
    case httpUnavailable(Int)
    var errorDescription: String? {
        switch self {
        case .signIn: return "Bitte melde dich zuerst mit deinem Jagdlatein-Konto an."
        case .disabled: return "Apple-Abos werden noch vorbereitet. Dein bestehender Jagdlatein-Zugang bleibt verfügbar."
        case .accountChanged: return "Das angemeldete Konto hat sich geändert. Bitte öffne die Abo-Übersicht erneut."
        case .unavailable, .httpUnavailable: return "Die Bestätigung ist gerade nicht erreichbar. Bitte versuche es erneut. Ein bereits erfolgter Kauf bleibt zur Wiederherstellung vorgemerkt."
        case .unverified: return "Dieser Kauf konnte nicht sicher geprüft werden. Es wurde kein Zugang freigeschaltet."
        case .alreadyPaid: return "Dein Konto hat bereits Zugang. Ein weiteres Abo ist dafür nicht erforderlich."
        case .existingPurchase: return "Apple meldet bereits ein vorhandenes Abo. Wähle „Käufe wiederherstellen“, um es mit deinem Jagdlatein-Konto abzugleichen."
        case .otherAccount: return "Dieser Apple-Kauf gehört zu einem anderen Jagdlatein-Konto. Bitte melde dich mit dem ursprünglichen Konto an."
        case .unsupportedIntent: return "Bitte verwirf die nicht unterstützte App-Store-Anfrage, bevor du das reguläre Monatsabo neu auswählst."
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
        default:
            if WebsitePolicy.environment == .sandbox,
               let code = AppleRestoreDiagnosticFailure.http(response.statusCode).code {
                throw AppleSubscriptionError.httpUnavailable(code)
            }
            throw AppleSubscriptionError.unavailable
        }
    }
}

@MainActor
final class AppleSubscriptionManager {
    private let client: AppleAccountClient
    private var updates: Task<Void, Never>?
    private var purchaseIntents: Task<Void, Never>?
    private var intentState = ApplePurchaseIntentState()
    private var intentProduct: Product?
    private var confirming: [UInt64: Task<Bool, Error>] = [:]
    private var lastReconciliation = Date.distantPast
    private var restoreDiagnostic = AppleRestoreDiagnostic(enabled: WebsitePolicy.environment == .sandbox)
    var onConfirmed: ((UUID) -> Void)?
    var onPurchaseIntent: (() -> Void)?
    var onRestoreDiagnosticChange: (() -> Void)?
    var sandboxRestoreDiagnostic: AppleRestoreDiagnostic.Snapshot? {
        WebsitePolicy.environment == .sandbox ? restoreDiagnostic.snapshot : nil
    }
    var purchaseIntentMessage: String? {
        switch intentState.notice {
        case .requiresManualConfirmation:
            return "Du hast im App Store das Jagdlatein-Monatsabo ausgewählt. Melde dich mit deinem Jagdlatein-Konto an und prüfe das Angebot. Erst dein Tippen auf „Mit Apple abonnieren“ startet die Bestätigung bei Apple."
        case .unsupportedProduct:
            return "Das im App Store ausgewählte Produkt wird hier nicht unterstützt. Es wurde kein Kauf gestartet."
        case .unsupportedOffer:
            return "Das ausgewählte Sonderangebot wird hier noch nicht unterstützt. Es wurde kein Kauf gestartet. Die normale Abo-Übersicht enthält keine Zusage für dieses Sonderangebot."
        case nil: return nil
        }
    }

    init(cookieStore: WKHTTPCookieStore, visiblePage: @escaping () -> URL?) {
        client = AppleAccountClient(cookieStore: cookieStore, visiblePage: visiblePage)
    }
    deinit { updates?.cancel(); purchaseIntents?.cancel() }

    func start() {
        guard updates == nil else { return }
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { return }
                do { _ = try await self.confirm(result) } catch { /* Leave unfinished for the original account to retry. */ }
            }
        }
        if #available(iOS 16.4, *) {
            purchaseIntents = Task { [weak self] in
                for await intent in PurchaseIntent.intents {
                    guard let self = self else { return }
                    var hasAdditionalOffer = false
                    if #available(iOS 18.0, *) { hasAdditionalOffer = intent.offer != nil }
                    self.intentState.receive(productID: intent.product.id, hasAdditionalOffer: hasAdditionalOffer)
                    self.intentProduct = self.intentState.productID == nil ? nil : intent.product
                    // This is a request to show information only. In particular,
                    // receiving an intent never calls purchase or AppStore.sync.
                    self.onPurchaseIntent?()
                }
            }
        }
    }

    func context() async throws -> ApplePurchaseContext { try await client.context() }

    func dismissPurchaseIntent() {
        intentState.clear()
        intentProduct = nil
    }

    struct ProductChoice {
        let product: Product
        let intentRevision: Int?
    }

    func products(for context: ApplePurchaseContext) async throws -> [ProductChoice] {
        guard context.isConfigured, let ids = context.productIds else { throw AppleSubscriptionError.disabled }
        try requireSupportedPurchaseIntent()
        try await ensureNoExistingPurchase(context)
        try requireSupportedPurchaseIntent()
        if let requested = intentProduct, ids.contains(requested.id), requested.type == .autoRenewable,
           requested.subscription != nil { return [ProductChoice(product: requested, intentRevision: intentState.revision)] }
        let products = try await Product.products(for: ids)
        try requireSupportedPurchaseIntent()
        if let requested = intentProduct, ids.contains(requested.id), requested.type == .autoRenewable,
           requested.subscription != nil { return [ProductChoice(product: requested, intentRevision: intentState.revision)] }
        return products.filter { ids.contains($0.id) && $0.type == .autoRenewable && $0.subscription != nil }
            .map { ProductChoice(product: $0, intentRevision: nil) }
    }

    private func requireSupportedPurchaseIntent() throws {
        guard intentState.notice != .unsupportedProduct && intentState.notice != .unsupportedOffer else { throw AppleSubscriptionError.unsupportedIntent }
    }

    private func finishPurchaseIntent(revision: Int) {
        if intentState.clear(ifRevision: revision) { intentProduct = nil }
    }

    func purchase(_ product: Product, context shownContext: ApplePurchaseContext, scene: UIWindowScene, intentRevision: Int? = nil) async throws -> String {
        let current = try await client.context()
        guard current.isConfigured, current.appAccountToken == shownContext.appAccountToken,
              current.productIds?.contains(product.id) == true, let token = current.appAccountToken else {
            throw AppleSubscriptionError.accountChanged
        }
        guard current.purchaseAllowed == true, current.paid != true else { throw AppleSubscriptionError.alreadyPaid }
        try await ensureNoExistingPurchase(current)
        // Entitlement enumeration suspends. Revalidate the actual web account
        // and its access immediately afterwards, before Apple's purchase UI.
        let purchaseContext = try await client.context()
        guard purchaseContext.isConfigured, purchaseContext.appAccountToken == current.appAccountToken,
              purchaseContext.appAccountToken == shownContext.appAccountToken,
              purchaseContext.productIds?.contains(product.id) == true else { throw AppleSubscriptionError.accountChanged }
        guard purchaseContext.purchaseAllowed == true, purchaseContext.paid == false else { throw AppleSubscriptionError.alreadyPaid }
        try requireSupportedPurchaseIntent()
        if let revision = intentRevision {
            guard intentState.canConfirmManually(productID: product.id, revision: revision,
                                                  shownContext: shownContext, currentContext: purchaseContext),
                  intentProduct?.id == product.id else { throw AppleSubscriptionError.accountChanged }
        } else if intentProduct != nil {
            // An intent arrived while a normal product button was displayed.
            // Require a fresh overview so its source and terms are visible.
            throw AppleSubscriptionError.accountChanged
        }
        let purchaseRevision = intentState.revision
        let result: Product.PurchaseResult
        if #available(iOS 17.0, *) {
            result = try await product.purchase(confirmIn: scene, options: [.appAccountToken(token)])
        } else {
            result = try await product.purchase(options: [.appAccountToken(token)])
        }
        switch result {
        case .success(let verification):
            let paid = try await confirm(verification, expectedToken: token)
            finishPurchaseIntent(revision: purchaseRevision)
            return paid ? "Dein Apple-Abo ist bestätigt. Deine Lerninhalte sind freigeschaltet." : "Der Kauf ist geprüft. Bitte lade die Konto-Übersicht für deinen aktuellen Zugangsstatus neu."
        case .userCancelled:
            finishPurchaseIntent(revision: purchaseRevision)
            return "Der Kauf wurde abgebrochen."
        case .pending:
            finishPurchaseIntent(revision: purchaseRevision)
            return "Apple prüft den Kauf noch. Sobald er genehmigt ist, wird die Bestätigung erneut versucht."
        @unknown default: throw AppleSubscriptionError.unavailable
        }
    }

    func restore(expectedContext: ApplePurchaseContext) async throws -> String {
        restoreDiagnostic.begin()
        publishRestoreDiagnostic()
        do {
            let current = try await client.context()
            guard current.isConfigured, current.appAccountToken == expectedContext.appAccountToken else { throw AppleSubscriptionError.accountChanged }
            advanceRestoreDiagnostic(to: .appleSync)
            // Only an explicit tap on Restore requests Apple authentication.
            try await AppStore.sync()
            var matched = false
            var otherAccount = false
            var seen = Set<UInt64>()
            advanceRestoreDiagnostic(to: .entitlementScan)
            for await result in Transaction.currentEntitlements {
                if case .unverified = result { throw AppleSubscriptionError.unverified }
                guard case .verified(let transaction) = result,
                      current.productIds?.contains(transaction.productID) == true else { continue }
                guard current.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else {
                    otherAccount = true
                    continue
                }
                seen.insert(transaction.id)
                // confirm() may await an existing task; this stage does not claim a new POST.
                advanceRestoreDiagnostic(to: .confirming)
                _ = try await confirm(result, expectedToken: current.appAccountToken)
                matched = true
                advanceRestoreDiagnostic(to: .entitlementScan)
            }
            advanceRestoreDiagnostic(to: .unfinishedScan)
            for await result in Transaction.unfinished {
                guard case .verified(let transaction) = result, !seen.contains(transaction.id),
                      current.accepts(transactionToken: transaction.appAccountToken, productID: transaction.productID) else { continue }
                advanceRestoreDiagnostic(to: .confirming)
                _ = try await confirm(result, expectedToken: current.appAccountToken)
                matched = true
                advanceRestoreDiagnostic(to: .unfinishedScan)
            }
            if !matched && otherAccount { throw AppleSubscriptionError.otherAccount }
            restoreDiagnostic.complete()
            publishRestoreDiagnostic()
            return matched ? "Deine Apple-Käufe wurden mit diesem Jagdlatein-Konto abgeglichen." : "Für dieses Jagdlatein-Konto wurde kein passendes Apple-Abo gefunden."
        } catch {
            if WebsitePolicy.environment == .sandbox {
                restoreDiagnostic.fail(restoreDiagnosticFailure(for: error))
                publishRestoreDiagnostic()
            }
            throw error
        }
    }

    private func advanceRestoreDiagnostic(to stage: AppleRestoreDiagnostic.Stage) {
        restoreDiagnostic.advance(to: stage)
        publishRestoreDiagnostic()
    }

    private func publishRestoreDiagnostic() {
        guard WebsitePolicy.environment == .sandbox, restoreDiagnostic.snapshot != nil else { return }
        onRestoreDiagnosticChange?()
    }

    private func restoreDiagnosticFailure(for error: Error) -> AppleRestoreDiagnosticFailure {
        if let error = error as? AppleSubscriptionError {
            switch error {
            case .signIn: return .init(category: .signIn)
            case .disabled: return .init(category: .disabled)
            case .accountChanged: return .init(category: .accountChanged)
            case .unavailable: return .init(category: .unavailable)
            case .unverified: return .init(category: .unverified)
            case .otherAccount: return .init(category: .otherAccount)
            case .httpUnavailable(let code): return .http(code)
            case .alreadyPaid, .existingPurchase, .unsupportedIntent: return .init(category: .appValidation)
            }
        }
        if let error = error as? StoreKitError {
            if #available(iOS 15.4, *), case .notEntitled = error {
                return .init(category: .storeKitAppCapability)
            }
            switch error {
            case .userCancelled: return .init(category: .storeKitUserCancelled)
            case .networkError(let network): return .foundation(network).withCategory(.storeKitNetwork)
            case .systemError(let underlying):
                // Inspect only this associated error, never NSError.userInfo or
                // an underlying-error chain. Keep only typed/allowlisted codes.
                if let nested = underlying as? StoreKitError, case .networkError(let network) = nested {
                    return .foundation(network).withCategory(.storeKitSystem)
                }
                return .foundation(underlying).withCategory(.storeKitSystem)
            case .notAvailableInStorefront: return .init(category: .storeKitStorefront)
            case .unknown: return .init(category: .storeKitUnknown)
            default: return .init(category: .storeKitUnknown)
            }
        }
        return .foundation(error)
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
    private let intentNotice = UILabel()
    private var context: ApplePurchaseContext?
    private var buttons: [UIButton] = []
    private var loading = false
    private var task: Task<Void, Never>?
    private var sandboxStorefrontBefore: String?
    private var sandboxStorefrontAfter: String?
    private var sandboxProductLoadState = "Nicht geladen"
    private var sandboxProductDetails: [String] = []
    private var sandboxDiagnosticsExpanded = false
    private var sandboxDiagnosticsBody: UIStackView?
    private var sandboxDiagnosticsButton: UIButton?
    private var sandboxRestoreDiagnosticLabel: UILabel?

    init(manager: AppleSubscriptionManager, onSignIn: @escaping () -> Void) {
        self.manager = manager
        self.onSignIn = onSignIn
        super.init(nibName: nil, bundle: nil)
        if WebsitePolicy.environment == .sandbox {
            manager.onRestoreDiagnosticChange = { [weak self] in self?.refreshSandboxRestoreDiagnostic() }
        }
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
        intentNotice.numberOfLines = 0
        intentNotice.font = .preferredFont(forTextStyle: .body)
        intentNotice.adjustsFontForContentSizeCategory = true
        intentNotice.accessibilityIdentifier = "jagdlatein.apple.intent"
        stack.addArrangedSubview(intentNotice)
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
        sandboxStorefrontBefore = nil
        sandboxStorefrontAfter = nil
        sandboxProductLoadState = "Nicht geladen"
        sandboxProductDetails.removeAll()
        intentNotice.text = manager.purchaseIntentMessage
        intentNotice.isHidden = manager.purchaseIntentMessage == nil
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
                    if WebsitePolicy.environment == .sandbox {
                        self.sandboxStorefrontBefore = self.sandboxStorefrontText(await Storefront.current)
                    }
                    let products: [AppleSubscriptionManager.ProductChoice]
                    do {
                        products = try await self.manager.products(for: context)
                    } catch {
                        if WebsitePolicy.environment == .sandbox {
                            let storefront = await Storefront.current
                            self.sandboxStorefrontAfter = self.sandboxStorefrontText(storefront)
                            self.sandboxProductLoadState = "Nicht geladen (Laden fehlgeschlagen)"
                        }
                        throw error
                    }
                    if WebsitePolicy.environment == .sandbox {
                        let storefront = await Storefront.current
                        self.sandboxStorefrontAfter = self.sandboxStorefrontText(storefront)
                        self.sandboxProductLoadState = "\(products.count) \(products.count == 1 ? "Produkt" : "Produkte") geladen"
                    }
                    guard !products.isEmpty else { throw AppleSubscriptionError.unavailable }
                    for choice in products { await self.addProduct(choice.product, context: context, intentRevision: choice.intentRevision) }
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
        sandboxDiagnosticsBody = nil
        sandboxDiagnosticsButton = nil
        sandboxRestoreDiagnosticLabel = nil
    }

    private func addProduct(_ product: Product, context: ApplePurchaseContext, intentRevision: Int?) async {
        guard let subscription = product.subscription else { return }
        let period = periodText(subscription.subscriptionPeriod)
        var offerText = "\(product.displayPrice) pro \(period)."
        var eligibleForIntroOffer = false
        if subscription.introductoryOffer != nil || WebsitePolicy.environment == .sandbox {
            eligibleForIntroOffer = await subscription.isEligibleForIntroOffer
        }
        if let offer = subscription.introductoryOffer, eligibleForIntroOffer {
            let duration = periodText(offer.period, repetitions: offer.periodCount)
            if offer.paymentMode == .freeTrial {
                offerText = "\(duration) kostenlos, danach \(product.displayPrice) pro \(period)."
            } else {
                offerText = "Einführungsangebot: \(offer.displayPrice) für \(duration); danach \(product.displayPrice) pro \(period)."
            }
        }
        // Website Production can also run in TestFlight. Read StoreKit's actual
        // storefront after product and eligibility loading in every app mode.
        let storefront = await Storefront.current
        if AppleBillingPolicy.shouldDeferOfferDetails(countryCode: storefront?.countryCode,
                                                     productCurrencyCode: product.priceFormatStyle.currencyCode) {
            offerText = "Den gültigen Preis und eine mögliche Probezeit zeigt Apple im nächsten Fenster."
        }
        if WebsitePolicy.environment == .sandbox {
            let offerDetails: String
            if let offer = subscription.introductoryOffer {
                let mode: String
                if offer.paymentMode == .freeTrial { mode = "Kostenlose Probezeit" }
                else if offer.paymentMode == .payAsYouGo { mode = "Zahlung je Zeitraum" }
                else if offer.paymentMode == .payUpFront { mode = "Einmalige Vorauszahlung" }
                else { mode = "Unbekannte Zahlungsart" }
                offerDetails = "\(mode), \(periodText(offer.period, repetitions: offer.periodCount)), \(offer.displayPrice)"
            } else { offerDetails = "Nicht von Apple geliefert" }
            sandboxProductDetails.append("Produkt: \(product.id)\nApple-Preis: \(product.displayPrice)\nProduktwährung: \(product.priceFormatStyle.currencyCode)\nEinführungsangebot: \(offerDetails)\nVon Apple gemeldete Einführungsberechtigung: \(eligibleForIntroOffer ? "Ja" : "Nein")")
        }
        productStack.addArrangedSubview(label(product.displayName, style: .headline))
        productStack.addArrangedSubview(label(offerText + " Das Abo verlängert sich automatisch, bis du es in deinem Apple-Konto kündigst."))
        let purchaseButton = button("Mit Apple abonnieren", filled: true) { [weak self] in self?.purchase(product, context: context, intentRevision: intentRevision) }
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
        addSandboxDiagnostics()
        if manager.purchaseIntentMessage != nil {
            productStack.addArrangedSubview(button("App-Store-Anfrage verwerfen") { [weak self] in
                guard let self = self else { return }
                self.manager.dismissPurchaseIntent()
                self.load()
            })
        }
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

    private func sandboxStorefrontText(_ storefront: Storefront?) -> String {
        guard let storefront = storefront else { return "Nicht verfügbar" }
        return "\(storefront.countryCode) (Storefront \(storefront.id))"
    }

    private func addSandboxDiagnostics() {
        guard WebsitePolicy.environment == .sandbox else { return }
        // This snapshot stays in this view only. It never changes Apple prices,
        // triggers a purchase, records a customer identity or leaves the device.
        let card = UIStackView()
        card.axis = .vertical
        card.spacing = 12
        card.isLayoutMarginsRelativeArrangement = true
        card.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 14, leading: 14, bottom: 14, trailing: 14)
        card.backgroundColor = .secondarySystemGroupedBackground
        card.layer.cornerRadius = 14
        let toggle = button(sandboxDiagnosticsExpanded ? "Apple-Testdiagnose verbergen" : "Apple-Testdiagnose anzeigen") { [weak self] in
            self?.toggleSandboxDiagnostics()
        }
        toggle.accessibilityIdentifier = "jagdlatein.apple.sandboxDiagnostics.toggle"
        toggle.configuration?.image = UIImage(systemName: sandboxDiagnosticsExpanded ? "chevron.up" : "chevron.down")
        toggle.configuration?.imagePadding = 8
        toggle.accessibilityValue = sandboxDiagnosticsExpanded ? "Geöffnet" : "Geschlossen"
        let details = UIStackView()
        details.axis = .vertical
        details.spacing = 12
        details.isHidden = !sandboxDiagnosticsExpanded
        details.accessibilityIdentifier = "jagdlatein.apple.sandboxDiagnostics.details"
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "Unbekannt"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "Unbekannt"
        let snapshot = [
            "System: \(UIDevice.current.systemName) \(UIDevice.current.systemVersion)",
            "App-Version: \(version) (\(build))",
            "Produktdaten: \(sandboxProductLoadState)",
            "Von Apple gemeldete Region vor dem Laden: \(sandboxStorefrontBefore ?? "Nicht abgefragt")",
            "Von Apple gemeldete Region nach dem Laden: \(sandboxStorefrontAfter ?? "Nicht abgefragt")",
        ].joined(separator: "\n")
        details.addArrangedSubview(label(snapshot, style: .footnote))
        let restoreDiagnostic = label(manager.sandboxRestoreDiagnostic?.text ?? "Letzte Wiederherstellung: Noch nicht gestartet", style: .footnote)
        restoreDiagnostic.accessibilityIdentifier = "jagdlatein.apple.sandboxDiagnostics.restore"
        details.addArrangedSubview(restoreDiagnostic)
        sandboxRestoreDiagnosticLabel = restoreDiagnostic
        for product in sandboxProductDetails {
            details.addArrangedSubview(label(product, style: .footnote))
        }
        details.addArrangedSubview(label("Nur in der Testumgebung: Apple-Produktdaten, lokale Geräteangaben und die letzte Wiederherstellungsphase mit einer begrenzten Fehlerkategorie. Sie werden nicht gespeichert oder gesendet. Ein abgeschlossener Ablauf sagt nicht, ob ein Abo aktuell Zugang gewährt. Die von Apple gemeldete Kaufregion kann in TestFlight abweichen. Die Diagnose startet keinen Kauf.", style: .footnote))
        card.addArrangedSubview(toggle)
        card.addArrangedSubview(details)
        sandboxDiagnosticsBody = details
        sandboxDiagnosticsButton = toggle
        productStack.addArrangedSubview(card)
        refreshSandboxRestoreDiagnostic()
    }

    private func refreshSandboxRestoreDiagnostic() {
        guard WebsitePolicy.environment == .sandbox, let snapshot = manager.sandboxRestoreDiagnostic else { return }
        sandboxRestoreDiagnosticLabel?.text = snapshot.text
        // Make a restore result visible immediately; it survives product-load
        // failures and an explicit reload through the manager's memory snapshot.
        sandboxDiagnosticsExpanded = true
        sandboxDiagnosticsBody?.isHidden = false
        sandboxDiagnosticsButton?.configuration?.title = "Apple-Testdiagnose verbergen"
        sandboxDiagnosticsButton?.configuration?.image = UIImage(systemName: "chevron.up")
        sandboxDiagnosticsButton?.accessibilityValue = "Geöffnet"
    }

    private func toggleSandboxDiagnostics() {
        guard WebsitePolicy.environment == .sandbox, let details = sandboxDiagnosticsBody,
              let toggle = sandboxDiagnosticsButton else { return }
        sandboxDiagnosticsExpanded.toggle()
        details.isHidden = !sandboxDiagnosticsExpanded
        toggle.configuration?.title = sandboxDiagnosticsExpanded ? "Apple-Testdiagnose verbergen" : "Apple-Testdiagnose anzeigen"
        toggle.configuration?.image = UIImage(systemName: sandboxDiagnosticsExpanded ? "chevron.up" : "chevron.down")
        toggle.accessibilityValue = sandboxDiagnosticsExpanded ? "Geöffnet" : "Geschlossen"
        UIAccessibility.post(notification: .layoutChanged, argument: toggle)
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

    func refreshForPurchaseIntent() {
        guard isViewLoaded else { return }
        intentNotice.text = manager.purchaseIntentMessage
        intentNotice.isHidden = manager.purchaseIntentMessage == nil
        if !loading { load() }
    }

    private func purchase(_ product: Product, context: ApplePurchaseContext, intentRevision: Int?) {
        guard !loading, let scene = view.window?.windowScene else { return }
        setLoading(true)
        task = Task { [weak self] in
            guard let self = self else { return }
            defer { self.setLoading(false) }
            do { self.status.text = try await self.manager.purchase(product, context: context, scene: scene, intentRevision: intentRevision) }
            catch { self.status.text = self.message(for: error) }
            self.intentNotice.text = self.manager.purchaseIntentMessage
            self.intentNotice.isHidden = self.manager.purchaseIntentMessage == nil
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
            self.refreshSandboxRestoreDiagnostic()
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
