import { firebaseWebConfig, firebaseWebVapidKey, FIREBASE_WEB_APP_NAME, WEB_PUSH_WORKER, WEB_PUSH_SCOPE } from "./firebase-web-config";

export const WEB_PUSH_STORAGE_KEY = "jagdlatein.web-push.v1";
const FID = /^[A-Za-z0-9_-]{22}$/;
const controllers = new Set();
// Also retain this page session's handles when a browser later blocks storage.
// No account identifier is kept here; server ownership remains authoritative.
const knownRegistrations = new Set();
let deviceOperationTail = Promise.resolve();
let cleanupGeneration = 0;
const cancellation = () => Object.assign(new Error("Vorgang abgebrochen."), { name: "AbortError" });
const isCancellation = error => error?.name === "AbortError";

// Dynamic imports are called only by an explicit activation or deactivation.
// Merely showing the account page never initialises Firebase or its worker.
async function loadFirebaseMessaging() {
  const [app, messaging] = await Promise.all([
    import(/* webpackIgnore: true */ "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
    import(/* webpackIgnore: true */ "https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging.js"),
  ]);
  return { ...app, ...messaging };
}

export function getWebPushSupport(browserWindow, browserNavigator) {
  if (!browserWindow || !browserNavigator) return "checking";
  // This configuration belongs to the public project. A sandbox/preview or
  // local website must not initialise the production messaging service.
  if (!["https://jagdlatein.de", "https://www.jagdlatein.de"].includes(browserWindow.location?.origin)) return "unavailable";
  const ua = browserNavigator.userAgent || "";
  const ios = /iPad|iPhone|iPod/.test(ua) || browserNavigator.platform === "MacIntel" && browserNavigator.maxTouchPoints > 1;
  let standalone = browserNavigator.standalone === true;
  try { standalone ||= browserWindow.matchMedia?.("(display-mode: standalone)").matches === true; } catch {}
  if (ios && !standalone) return "ios-home-screen";
  if (browserWindow.isSecureContext !== true || !browserNavigator.serviceWorker || !browserWindow.Notification || !browserWindow.PushManager) return "unsupported";
  return browserWindow.Notification.permission === "denied" ? "denied" : "ready";
}

export function readStoredWebPushRegistration(storage) {
  try {
    const raw = storage?.getItem(WEB_PUSH_STORAGE_KEY);
    if (typeof raw !== "string" || raw.length > 256) return null;
    const value = JSON.parse(raw);
    return value?.version === 1 && value.kind === "fid" && value.platform === "web" && typeof value.registration === "string" && FID.test(value.registration) ? value.registration : null;
  } catch { return null; }
}

function storeRegistration(storage, registration) {
  if (!storage || typeof registration !== "string" || !FID.test(registration)) return false;
  try {
    if (typeof storage.setItem !== "function" || typeof storage.getItem !== "function") return false;
    storage.setItem(WEB_PUSH_STORAGE_KEY, JSON.stringify({ version: 1, registration, kind: "fid", platform: "web" }));
    return readStoredWebPushRegistration(storage) === registration;
  }
  catch { return false; }
}
function forgetRegistration(storage) { try { storage?.removeItem(WEB_PUSH_STORAGE_KEY); return true; } catch { return false; } }
function storageOf(browserWindow) { try { return browserWindow?.localStorage; } catch { return null; } }

function reserveDeviceOperation() {
  const previous = deviceOperationTail.catch(() => {});
  let release;
  const done = new Promise(resolve => { release = resolve; });
  deviceOperationTail = previous.then(() => done);
  const pending = [];
  let released = false;
  return {
    wait: previous,
    get released() { return released; },
    track(value) { const promise = Promise.resolve(value); pending.push(promise); return promise; },
    release() {
      if (released) return;
      released = true;
      // A timeout/abandoned view may stop waiting, but an already-started
      // unregister cannot be undone. Keep the successor behind its real end.
      Promise.allSettled(pending).then(release);
    },
  };
}

function bounded(promise, signal, milliseconds = 18000) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (handler, value) => { clearTimeout(timer); signal?.removeEventListener("abort", abort); handler(value); };
    const abort = () => finish(reject, cancellation());
    if (signal?.aborted) return abort();
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish(reject, new Error("Die Einrichtung dauert zu lange. Bitte erneut versuchen.")), milliseconds);
    Promise.resolve(promise).then(value => finish(resolve, value), error => finish(reject, error));
  });
}

async function postRegistration(fetcher, path, registration, signal, lease) {
  const request = fetcher(path, { method: "POST", cache: "no-store", credentials: "same-origin", signal,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registration, kind: "fid", platform: "web" }) });
  const response = await bounded(lease ? lease.track(request) : request, signal);
  const value = await bounded(response.json(), signal);
  if (!response.ok || value?.success !== true) throw new Error(value?.error || "Die Geräteanmeldung konnte nicht gespeichert werden. Bitte erneut versuchen.");
}

function messagingInstance(sdk, config) {
  const app = sdk.getApps().find(item => item.name === FIREBASE_WEB_APP_NAME) || sdk.initializeApp(config, FIREBASE_WEB_APP_NAME);
  return sdk.getMessaging(app);
}

async function stopThisBrowser({ sdk, messaging, browserWindow, browserNavigator, signal, guard, lease }) {
  guard();
  await bounded(lease.track(sdk.unregister(messaging)), signal); guard();
  const worker = await bounded(lease.track(browserNavigator.serviceWorker.getRegistration(new URL(WEB_PUSH_SCOPE, browserWindow.location.origin).href)), signal); guard();
  // Never unregister the separate /lernen/ offline worker or another owner.
  if (worker?.scope === new URL(WEB_PUSH_SCOPE, browserWindow.location.origin).href &&
      [worker.active, worker.waiting, worker.installing].some(item => item?.scriptURL === new URL(WEB_PUSH_WORKER, browserWindow.location.origin).href)) {
    const subscription = await bounded(lease.track(worker.pushManager.getSubscription()), signal); guard();
    if (subscription) { await bounded(lease.track(subscription.unsubscribe()), signal); guard(); }
    await bounded(lease.track(worker.unregister()), signal); guard();
  }
}

export function createWebPushController({ browserWindow = typeof window === "undefined" ? null : window,
  browserNavigator = typeof navigator === "undefined" ? null : navigator,
  fetcher = (...args) => fetch(...args), sdkLoader = loadFirebaseMessaging,
  config = firebaseWebConfig, vapidKey = firebaseWebVapidKey,
  isCurrent = () => true, onStatus = () => {} } = {}) {
  const storage = storageOf(browserWindow);
  let alive = true, revision = 0, busy = false, aborter = null, sdk = null, messaging = null;
  let operationLease = null;
  let removeRegistered = null, removeMessages = null, registration = readStoredWebPushRegistration(storage);
  if (registration) knownRegistrations.add(registration);
  const active = ticket => alive && isCurrent() && revision === ticket;
  const status = (ticket, phase, message = "") => { if (active(ticket)) onStatus({ phase, message, hasRegistration: Boolean(registration), support: getWebPushSupport(browserWindow, browserNavigator) }); };
  function stopCallbacks() { removeRegistered?.(); removeMessages?.(); removeRegistered = null; removeMessages = null; }
  function begin() { revision++; aborter?.abort(); stopCallbacks(); aborter = new AbortController(); busy = true; return revision; }
  function guard(ticket) { if (!active(ticket) || aborter.signal.aborted) throw cancellation(); }

  const controller = {
    hasRegistration: () => Boolean(registration),
    async enable() {
      if (!alive || !isCurrent() || busy) return false;
      const support = getWebPushSupport(browserWindow, browserNavigator);
      if (support !== "ready" || !/^[A-Za-z0-9_-]{80,100}$/.test(vapidKey || "")) return false;
      const ticket = begin(); const signal = aborter.signal;
      status(ticket, "working", "Benachrichtigungen werden eingerichtet …");
      try {
        // Call in the original click stack, before any SDK import or network.
        const permission = browserWindow.Notification.permission === "granted" ? "granted" : await bounded(browserWindow.Notification.requestPermission(), signal);
        guard(ticket);
        if (permission !== "granted") { status(ticket, "denied", "Benachrichtigungen wurden nicht erlaubt."); return false; }
        operationLease = reserveDeviceOperation();
        await bounded(operationLease.wait, signal); guard(ticket);
        sdk = await bounded(sdkLoader(), signal); guard(ticket);
        if (!await bounded(sdk.isSupported(), signal)) throw new Error("Dieser Browser unterstützt die Benachrichtigungen noch nicht.");
        guard(ticket); messaging = messagingInstance(sdk, config);
        const worker = await bounded(operationLease.track(browserNavigator.serviceWorker.register(WEB_PUSH_WORKER, { scope: WEB_PUSH_SCOPE })), signal);
        guard(ticket);
        let resolveFirst, rejectFirst, queue = Promise.resolve();
        const first = new Promise((resolve, reject) => { resolveFirst = resolve; rejectFirst = reject; });
        // Attach immediately; an SDK rejection must not leave an unhandled
        // independently rejected first-registration promise behind.
        const firstResult = bounded(first, signal);
        firstResult.catch(() => {});
        removeRegistered = sdk.onRegistered(messaging, next => {
          if (!active(ticket) || typeof next !== "string" || !FID.test(next)) return;
          queue = queue.then(async () => {
            const ownLease = !operationLease || operationLease.released;
            const lease = ownLease ? reserveDeviceOperation() : operationLease;
            try {
            await bounded(lease.wait, signal);
            guard(ticket);
            const previous = registration;
            if (previous && previous !== next) {
              await postRegistration(fetcher, "/api/push/unregister", previous, signal, lease); guard(ticket);
              knownRegistrations.delete(previous);
            }
            guard(ticket);
            // Keep the candidate before the request, so explicit logout can
            // cancel an already-sent request even before its reply arrives.
            if (!storeRegistration(storage, next)) {
              await bounded(lease.track(sdk.unregister(messaging)), signal); guard(ticket);
              throw new Error("Dein Browser konnte die Geräteanmeldung nicht lokal sichern. Benachrichtigungen wurden nicht aktiviert.");
            }
            registration = next; knownRegistrations.add(next);
            await postRegistration(fetcher, "/api/push/register", next, signal, lease); guard(ticket);
            status(ticket, "active", "Benachrichtigungen sind für dieses Konto auf diesem Browser aktiviert."); resolveFirst(next);
            } finally { if (ownLease) lease.release(); }
          }).catch(error => { rejectFirst(error); if (!isCancellation(error)) status(ticket, "error", error.message); });
        });
        removeMessages = sdk.onMessage(messaging, payload => {
          if (!active(ticket)) return;
          const title = typeof payload?.notification?.title === "string" ? payload.notification.title.slice(0, 200) : "Jagdlatein";
          const body = typeof payload?.notification?.body === "string" ? payload.notification.body.slice(0, 1000) : "Neue Nachricht";
          status(ticket, "active", `${title}: ${body}`);
        });
        await bounded(Promise.all([operationLease.track(sdk.register(messaging, { vapidKey, serviceWorkerRegistration: worker })), firstResult]), signal);
        guard(ticket); return true;
      } catch (error) {
        if (active(ticket)) { stopCallbacks(); aborter.abort(); if (!isCancellation(error)) status(ticket, "error", error.message || "Benachrichtigungen konnten nicht eingerichtet werden."); }
        return false;
      } finally { operationLease?.release(); operationLease = null; if (active(ticket)) busy = false; }
    },
    async disable() {
      if (!alive || !isCurrent() || busy) return false;
      if (getWebPushSupport(browserWindow, browserNavigator) === "unavailable") return false;
      const ticket = begin(); const signal = aborter.signal;
      const lease = reserveDeviceOperation();
      let unlinked = false;
      status(ticket, "working", "Benachrichtigungen werden deaktiviert …");
      try {
        await bounded(lease.wait, signal); guard(ticket);
        registration ||= readStoredWebPushRegistration(storage);
        if (registration) { await postRegistration(fetcher, "/api/push/unregister", registration, signal, lease); unlinked = true; }
        guard(ticket);
        if (registration) {
          sdk ||= await bounded(sdkLoader(), signal); guard(ticket);
          const supported = await bounded(sdk.isSupported(), signal); guard(ticket);
          if (!supported) throw new Error("Die lokale Deaktivierung konnte nicht bestätigt werden.");
          messaging ||= messagingInstance(sdk, config);
          await stopThisBrowser({ sdk, messaging, browserWindow, browserNavigator, signal, guard: () => guard(ticket), lease }); guard(ticket);
        }
        knownRegistrations.delete(registration); registration = null; forgetRegistration(storage); status(ticket, "idle", "Benachrichtigungen sind auf diesem Browser deaktiviert."); return true;
      } catch (error) {
        if (!isCancellation(error)) status(ticket, "error", unlinked ? "Die Kontoverknüpfung ist entfernt. Die lokale Deaktivierung konnte nicht vollständig bestätigt werden. Bitte erneut versuchen." : "Die Deaktivierung konnte nicht vollständig bestätigt werden. Bitte erneut versuchen.");
        return false;
      } finally { lease.release(); if (active(ticket)) busy = false; }
    },
    dispose() { if (!alive) return; alive = false; revision++; aborter?.abort(); stopCallbacks(); controllers.delete(controller); },
  };
  controllers.add(controller);
  return controller;
}

// Call BEFORE removing the account cookie on logout. After successful server
// account deletion, use {localOnly:true}: server-owned rows are already removed.
export async function cleanupWebPushForAccountChange({ localOnly = false, isCurrent = () => true,
  browserWindow = typeof window === "undefined" ? null : window,
  browserNavigator = typeof navigator === "undefined" ? null : navigator,
  fetcher = (...args) => fetch(...args), sdkLoader = loadFirebaseMessaging } = {}) {
  if (!isCurrent()) return false;
  const generation = ++cleanupGeneration;
  const active = () => isCurrent() && cleanupGeneration === generation;
  const guard = () => { if (!active()) throw cancellation(); };
  for (const controller of [...controllers]) controller.dispose();
  const storage = storageOf(browserWindow), registration = readStoredWebPushRegistration(storage);
  const registrations = new Set([...knownRegistrations, ...(registration ? [registration] : [])]);
  if (!registrations.size || !browserWindow || !browserNavigator) return true;
  if (!["https://jagdlatein.de", "https://www.jagdlatein.de"].includes(browserWindow.location?.origin)) return true;
  const aborter = new AbortController();
  const lease = reserveDeviceOperation();
  try {
    await bounded(lease.wait, aborter.signal); guard();
    if (!localOnly) for (const current of registrations) { guard(); await postRegistration(fetcher, "/api/push/unregister", current, aborter.signal, lease); guard(); }
    const sdk = await bounded(sdkLoader(), aborter.signal); guard();
    const supported = await bounded(sdk.isSupported(), aborter.signal); guard();
    if (!supported) throw new Error("Die lokale Deaktivierung konnte nicht bestätigt werden.");
    await stopThisBrowser({ sdk, messaging: messagingInstance(sdk, firebaseWebConfig), browserWindow, browserNavigator, signal: aborter.signal, guard, lease });
    guard(); knownRegistrations.clear(); forgetRegistration(storage); return true;
  } catch { return false; }
  finally { aborter.abort(); lease.release(); }
}
