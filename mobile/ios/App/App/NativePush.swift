import Foundation
import UIKit
import UserNotifications
import WebKit
import FirebaseCore
import FirebaseMessaging
import JagdlateinCore

private enum NativePushError: LocalizedError {
    case configuration, account, changed, busy, permission, registration
    var errorDescription: String? {
        switch self {
        case .configuration: return "Apple-Mitteilungen werden noch vorbereitet. Die freigegebene App-Konfiguration und Push-Signierung fehlen noch."
        case .account: return "Bitte öffne die Mitteilungen in deinem angemeldeten Jagdlatein-Konto."
        case .changed: return "Die Kontoansicht hat sich geändert. Bitte öffne die Mitteilungen erneut."
        case .busy: return "Eine Mitteilungsanfrage läuft bereits. Bitte warte kurz."
        case .permission: return "Mitteilungen sind in den Apple-Einstellungen nicht erlaubt."
        case .registration: return "Apple-Mitteilungen konnten noch nicht registriert werden. Bitte später erneut versuchen."
        }
    }
}

struct NativePushEnableResult {
    let ticket: UUID
    let status: [String: Any]
}

/// No configure, registration or permission request occurs at application launch.
/// Firebase is initialised only after this explicit account-page enable action.
@MainActor
final class NativePushManager: NSObject, MessagingDelegate, UNUserNotificationCenterDelegate {
    static let shared = NativePushManager()
    private let consentKey = "jagdlatein.native-push.enabled.v1"
    private var operations = NativePushOperationState()
    private var operation: UUID? { operations.current }
    private var apnsWaiter: CheckedContinuation<Void, Error>?
    private var fidWaiter: CheckedContinuation<String, Error>?
    private var unregisterWaiter: CheckedContinuation<Void, Error>?
    private var registration: String?
    private var enabled: Bool {
        get { UserDefaults.standard.bool(forKey: consentKey) }
        set { UserDefaults.standard.set(newValue, forKey: consentKey) }
    }

    private func options() -> FirebaseOptions? {
        #if targetEnvironment(simulator) || DEBUG
        return nil
        #else
        let flag = Bundle.main.object(forInfoDictionaryKey: "JagdlateinNativePushEnabled")
        let ready = flag as? Bool == true || (flag as? String)?.uppercased() == "YES"
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let options = FirebaseOptions(contentsOfFile: path),
              NativePushPolicy.supports(bundleID: Bundle.main.bundleIdentifier, environment: WebsitePolicy.environment,
                enabled: ready, simulator: false, debug: false, configurationBundle: options.bundleID,
                configurationProject: options.projectID, configurationSender: options.gcmSenderID,
                googleAppID: options.googleAppID) else { return nil }
        return options
        #endif
    }

    private func permission(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .authorized: return "authorized"
        case .provisional, .ephemeral: return "provisional"
        case .denied: return "denied"
        case .notDetermined: return "notDetermined"
        @unknown default: return "denied"
        }
    }

    func status() async -> [String: Any] {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        let supported = options() != nil
        var result: [String: Any] = ["supported": supported, "permission": permission(settings.authorizationStatus),
                                     "enabled": supported && enabled]
        if !supported { result["reason"] = "configuration" }
        if supported && enabled, let registration = registration,
           [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) {
            result["registration"] = registration
        }
        return result
    }

    func enable(isCurrent: @escaping () -> Bool) async throws -> NativePushEnableResult {
        guard isCurrent() else { throw NativePushError.changed }
        guard let configuration = options() else { throw NativePushError.configuration }
        guard let ticket = operations.beginEnable() else { throw NativePushError.busy }
        var successful = false
        defer { operations.finishEnable(ticket, successful: successful) }
        do {
            let center = UNUserNotificationCenter.current()
            let settings = await center.notificationSettings()
            guard isCurrent(), operation == ticket else { throw NativePushError.changed }
            let allowed: Bool
            if settings.authorizationStatus == .notDetermined {
                allowed = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            } else { allowed = [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) }
            guard isCurrent(), operation == ticket else { throw NativePushError.changed }
            guard allowed else { throw NativePushError.permission }
            if let app = FirebaseApp.app() {
                guard app.options.projectID == configuration.projectID,
                      app.options.googleAppID == configuration.googleAppID else { throw NativePushError.configuration }
            } else { FirebaseApp.configure(options: configuration) }
            Messaging.messaging().isAutoInitEnabled = false
            Messaging.messaging().delegate = self
            center.delegate = self
            enabled = true
            let deadline = Task { @MainActor [weak self] in
                try? await Task.sleep(nanoseconds: 30_000_000_000)
                guard !Task.isCancelled, let self = self, self.operation == ticket else { return }
                self.failWaiters(NativePushError.registration)
            }
            defer { deadline.cancel() }
            try await withCheckedThrowingContinuation { (waiter: CheckedContinuation<Void, Error>) in
                apnsWaiter = waiter
                UIApplication.shared.registerForRemoteNotifications()
            }
            guard isCurrent(), operation == ticket else { throw NativePushError.changed }
            let fid = try await withCheckedThrowingContinuation { (waiter: CheckedContinuation<String, Error>) in
                fidWaiter = waiter
                Messaging.messaging().register { [weak self] error in
                    Task { @MainActor in
                        guard let self = self, self.operation == ticket else { return }
                        if error != nil { self.failWaiters(NativePushError.registration) }
                    }
                }
            }
            guard isCurrent(), operation == ticket, NativePushPolicy.isInstallationID(fid) else { throw NativePushError.changed }
            registration = fid
            let result = await status()
            guard isCurrent(), operation == ticket else { throw NativePushError.changed }
            successful = true
            return NativePushEnableResult(ticket: ticket, status: result)
        } catch {
            if operation == ticket {
                enabled = false; registration = nil
                UIApplication.shared.unregisterForRemoteNotifications()
                failWaiters(error)
                if FirebaseApp.app()?.options.projectID == NativePushPolicy.projectID {
                    Messaging.messaging().isAutoInitEnabled = false
                    // Keep this operation claimed until the SDK finishes. A
                    // bounded timeout returns an error but quarantines the gate.
                    try? await unregisterCurrent(ticket)
                }
            }
            throw error
        }
    }

    /// The website first removes its signed account binding. Local revocation
    /// then prevents delivery even if the external unregister request fails.
    func disable() async throws -> [String: Any] {
        try await disable(expectedEnable: nil)
    }

    func disableIfCurrentEnable(_ ticket: UUID) async throws {
        _ = try await disable(expectedEnable: ticket)
    }

    private func disable(expectedEnable: UUID?) async throws -> [String: Any] {
        let hadOperation = operation != nil
        let wasEnabled = enabled
        let configured = FirebaseApp.app()?.options.projectID == NativePushPolicy.projectID
        guard let ticket = operations.beginDisable(expectedEnable: expectedEnable) else {
            throw expectedEnable == nil ? NativePushError.busy : NativePushError.changed
        }
        defer { operations.finishEnable(ticket, successful: false) }
        enabled = false; registration = nil
        failWaiters(NativePushError.changed)
        if wasEnabled || hadOperation || configured { UIApplication.shared.unregisterForRemoteNotifications() }
        if configured {
            Messaging.messaging().isAutoInitEnabled = false
            try await unregisterCurrent(ticket)
        }
        var result = await status()
        // No FID may escape through disable on a non-account page, including
        // when a successor enable resumes while this settings read is pending.
        result.removeValue(forKey: "registration"); result["enabled"] = false
        return result
    }

    private func unregisterCurrent(_ ticket: UUID) async throws {
        guard operations.beginRevocation(ticket) else { throw NativePushError.changed }
        let deadline = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 30_000_000_000)
            guard !Task.isCancelled, let self = self, self.operation == ticket else { return }
            let waiter = self.unregisterWaiter; self.unregisterWaiter = nil
            // Do not finishRevocation here: the SDK request can still complete
            // later. Its actual callback alone may release this old operation.
            waiter?.resume(throwing: NativePushError.registration)
        }
        defer { deadline.cancel() }
        try await withCheckedThrowingContinuation { (waiter: CheckedContinuation<Void, Error>) in
            unregisterWaiter = waiter
            Messaging.messaging().unregister { [weak self] error in
                Task { @MainActor in
                    guard let self = self, self.operations.finishRevocation(ticket) else { return }
                    let waiter = self.unregisterWaiter; self.unregisterWaiter = nil
                    if error != nil { waiter?.resume(throwing: NativePushError.registration) }
                    else { waiter?.resume() }
                }
            }
        }
    }

    private func failWaiters(_ error: Error) {
        let apns = apnsWaiter; apnsWaiter = nil
        let fid = fidWaiter; fidWaiter = nil
        apns?.resume(throwing: error); fid?.resume(throwing: error)
    }

    func receivedAPNs(_ token: Data) {
        guard enabled, operation != nil, apnsWaiter != nil, options() != nil,
              FirebaseApp.app()?.options.projectID == NativePushPolicy.projectID else { return }
        Messaging.messaging().apnsToken = token
        let waiter = apnsWaiter; apnsWaiter = nil; waiter?.resume()
    }

    func failedAPNs() { if operation != nil { failWaiters(NativePushError.registration) } }

    nonisolated func messaging(_ messaging: Messaging, didReceiveRegistration installationId: String?) {
        Task { @MainActor [weak self] in
            guard let self = self, self.enabled, self.options() != nil,
                  let fid = installationId, NativePushPolicy.isInstallationID(fid) else { return }
            self.registration = fid
            let waiter = self.fidWaiter; self.fidWaiter = nil; waiter?.resume(returning: fid)
        }
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        Task { @MainActor [weak self] in
            let allowed = self?.enabled == true && self?.options() != nil
            completionHandler(allowed ? [.banner, .list, .sound] : [])
        }
    }
}

/// WebKit's reply-capable message handler delivers a Promise to the calling
/// frame only. Identifiers are never injected into another page, DOM or log.
@MainActor
final class NativePushBridge: NSObject, WKScriptMessageHandlerWithReply, WKHTTPCookieStoreObserver {
    weak var webView: WKWebView?
    private var generation: UInt64 = 0
    private var observations: [NSKeyValueObservation] = []

    func attach(to view: WKWebView) {
        webView = view
        view.configuration.websiteDataStore.httpCookieStore.add(self)
        observations = [view.observe(\.url, options: [.new]) { [weak self] _, _ in
                            Task { @MainActor in self?.generation &+= 1 }
                        },
                        view.observe(\.isLoading, options: [.new]) { [weak self] _, change in
                            if change.newValue == true { Task { @MainActor in self?.generation &+= 1 } }
                        }]
    }

    nonisolated func cookiesDidChange(in cookieStore: WKHTTPCookieStore) {
        Task { @MainActor [weak self] in self?.generation &+= 1 }
    }

    private func allowed(_ message: WKScriptMessage, action: String) -> Bool {
        let origin = message.frameInfo.securityOrigin
        return message.webView === webView && NativePushPolicy.allowsMessage(isMainFrame: message.frameInfo.isMainFrame,
          scheme: origin.protocol, host: origin.host, port: origin.port, visiblePage: webView?.url,
          environment: WebsitePolicy.environment, accountOnly: action != "disable")
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], body.count == 1,
              let action = body["action"] as? String, ["status", "enable", "disable"].contains(action),
              allowed(message, action: action),
              let view = webView else { replyHandler(nil, NativePushError.account.localizedDescription); return }
        let ticket = generation
        Task { @MainActor [weak self] in
            guard let self = self else { replyHandler(nil, NativePushError.changed.localizedDescription); return }
            let cookies: [HTTPCookie] = await withCheckedContinuation { continuation in
                view.configuration.websiteDataStore.httpCookieStore.getAllCookies { continuation.resume(returning: $0) }
            }
            let host = view.url?.host?.lowercased() ?? ""
            let hasSession = cookies.contains { cookie in
                let domain = cookie.domain.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "."))
                return cookie.name == "jl_account_session" && cookie.isSecure && cookie.isHTTPOnly &&
                  (domain == host || host.hasSuffix("." + domain)) &&
                  (cookie.expiresDate == nil || cookie.expiresDate! > Date())
            }
            let current = { [weak self] in self?.generation == ticket && self?.allowed(message, action: action) == true }
            guard current(), hasSession || action == "disable" else { replyHandler(nil, NativePushError.account.localizedDescription); return }
            do {
                let result: [String: Any]
                var enabledTicket: UUID?
                switch action {
                case "enable":
                    let enabled = try await NativePushManager.shared.enable(isCurrent: current)
                    result = enabled.status; enabledTicket = enabled.ticket
                case "disable": result = try await NativePushManager.shared.disable()
                default: result = await NativePushManager.shared.status()
                }
                guard current() else {
                    if let enabledTicket = enabledTicket { try? await NativePushManager.shared.disableIfCurrentEnable(enabledTicket) }
                    replyHandler(nil, NativePushError.changed.localizedDescription); return
                }
                replyHandler(result, nil)
            } catch { replyHandler(nil, (error as? NativePushError ?? .registration).localizedDescription) }
        }
    }

    static let script = #"""
    (() => {
      if (window.top !== window || !["https://jagdlatein.de", "https://www.jagdlatein.de"].includes(window.location.origin)) return;
      const handler = window.webkit?.messageHandlers?.jagdlateinNativePush;
      if (!handler || typeof handler.postMessage !== "function") return;
      const call = action => handler.postMessage({ action });
      Object.defineProperty(window, "jagdlateinNativePush", {
        value: Object.freeze({ status: () => call("status"), enable: () => call("enable"), disable: () => call("disable") }),
        writable: false, configurable: false, enumerable: false
      });
    })();
    """#
}
