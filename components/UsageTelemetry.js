import { useEffect, useRef } from "react";
import { usagePageForPath, usageBrowserAllowed, usagePrivacyAllows, usagePreferenceClient, USAGE_PREFERENCE_EVENT, USAGE_LOCAL_PREFERENCE } from "../lib/usage-analytics";

let activeLease = 0;

// No output and no SDK. All labels are fixed; DOM content is never serialized.
export default function UsageTelemetry({ pathname = null }) {
  const current = useRef(pathname); current.current = pathname;
  useEffect(() => {
    const page = usagePageForPath(pathname);
    if (!page || !usageBrowserAllowed(window) || !usagePrivacyAllows(window)) return;
    const owner = {}, lease = ++activeLease; let live = true, timer = null, lastView = null;
    const buffer = new Map(), pending = new Map();
    const valid = () => live && lease === activeLease && current.current === pathname && usageBrowserAllowed(window) && usagePrivacyAllows(window);
    const cancel = () => { buffer.clear(); if (timer !== null) clearTimeout(timer); timer = null; for (const [request, timeout] of pending) { clearTimeout(timeout); request.abort(); } pending.clear(); };
    const flush = () => {
      if (timer !== null) clearTimeout(timer); timer = null;
      const state = usagePreferenceClient.getSnapshot();
      if (!valid() || !state.enabled || !state.accountKey || buffer.size === 0) { buffer.clear(); return; }
      const events = [...buffer.values()]; buffer.clear();
      let batchId;
      try { batchId = window.crypto.randomUUID(); } catch { return; }
      const accountKey = state.accountKey, controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      pending.set(controller, timeout);
      const stillCurrent = () => valid() && usagePreferenceClient.getSnapshot().enabled && usagePreferenceClient.getSnapshot().accountKey === accountKey;
      try {
        Promise.resolve(fetch("/api/usage-events", { method: "POST", credentials: "same-origin", cache: "no-store", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ batchId, events }), signal: controller.signal }))
          .then(response => { if (stillCurrent() && [401, 403].includes(response.status)) usagePreferenceClient.stop(); })
          .catch(() => {}) // Best effort: a failed batch is never automatically retried.
          .finally(() => { clearTimeout(timeout); pending.delete(controller); });
      } catch { clearTimeout(timeout); pending.delete(controller); }
    };
    const add = event => {
      const state = usagePreferenceClient.getSnapshot();
      if (!valid() || !state.enabled) return;
      const key = `${page}:${event}`, row = buffer.get(key);
      if (row) row.count = Math.min(20, row.count + 1);
      else if (buffer.size < 10) buffer.set(key, { page, event, count: 1 });
      if (timer === null) timer = setTimeout(flush, 8000);
    };
    const privateTarget = target => Boolean(target?.closest?.("form,input,textarea,select,[contenteditable],[data-usage-private]"));
    const click = event => {
      if (event.isTrusted === false || !valid()) return;
      const target = event.target?.nodeType === 3 ? event.target.parentElement : event.target;
      if (privateTarget(target)) return;
      const control = target?.closest?.("a,button,summary");
      if (!control || control.disabled || control.getAttribute?.("aria-disabled") === "true" || privateTarget(control)) return;
      const kind = { A: "navigation", BUTTON: "action", SUMMARY: "expand" }[control.tagName];
      if (kind) add(kind);
    };
    const play = event => { if (event.isTrusted !== false && event.target?.tagName === "VIDEO" && !privateTarget(event.target)) add("video_play"); };
    const changed = () => {
      const state = usagePreferenceClient.getSnapshot();
      if (!state.enabled || !valid()) { cancel(); lastView = null; return; }
      if (lastView !== state.accountKey) { lastView = state.accountKey; add("page_view"); }
    };
    const preferenceEvent = event => {
      if (!valid() || event.detail?.revision === usagePreferenceClient.getSnapshot().revision) return;
      cancel(); void usagePreferenceClient.load({ isCurrent: valid, owner });
    };
    const storage = event => { if (event.key === USAGE_LOCAL_PREFERENCE) { cancel(); usagePreferenceClient.stop(); if (valid()) void usagePreferenceClient.load({ isCurrent: valid, owner }); } };
    const logout = () => { cancel(); usagePreferenceClient.stop(); };
    const unsubscribe = usagePreferenceClient.subscribe(changed);
    document.addEventListener("click", click, true); document.addEventListener("play", play, true);
    window.addEventListener("pagehide", flush); window.addEventListener(USAGE_PREFERENCE_EVENT, preferenceEvent);
    window.addEventListener("storage", storage); window.addEventListener("jagdlatein-logout", logout); window.addEventListener("jagdlatein-account-deleted", logout);
    void usagePreferenceClient.load({ isCurrent: valid, owner });
    return () => {
      live = false; cancel(); unsubscribe();
      document.removeEventListener("click", click, true); document.removeEventListener("play", play, true);
      window.removeEventListener("pagehide", flush); window.removeEventListener(USAGE_PREFERENCE_EVENT, preferenceEvent);
      window.removeEventListener("storage", storage); window.removeEventListener("jagdlatein-logout", logout); window.removeEventListener("jagdlatein-account-deleted", logout);
      usagePreferenceClient.stop({ owner });
    };
  }, [pathname]);
  return null;
}
