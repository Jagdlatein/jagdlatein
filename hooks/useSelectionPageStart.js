import { useEffect, useRef } from "react";

const address = () => typeof window === "undefined" ? null : window.location?.href || `${window.location?.pathname || ""}${window.location?.search || ""}${window.location?.hash || ""}`;

// Selection owners call this only after their existing readiness, URL/content
// and lifetime checks. Exercise actions and explicit deep links can retain the
// old anchor focus; no global query/hash heuristic guesses their intent.
export default function useSelectionPageStart(scope, enabled = true) {
  const mounted = useRef(false);
  const active = useRef(null);
  const pending = useRef(null);
  active.current = { scope, enabled };
  function cancelSelectionFocus() {
    const job = pending.current;
    pending.current = null;
    if (!job || typeof window === "undefined") return;
    if (job.frame) window.cancelAnimationFrame?.(job.handle);
    else window.clearTimeout?.(job.handle);
  }
  useEffect(() => {
    mounted.current = true;
    const interrupt = () => cancelSelectionFocus();
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    if (typeof document !== "undefined") for (const event of events) document.addEventListener?.(event, interrupt, { passive: true });
    return () => {
      mounted.current = false;
      cancelSelectionFocus();
      if (typeof document !== "undefined") for (const event of events) document.removeEventListener?.(event, interrupt);
    };
  }, []);
  useEffect(() => {
    cancelSelectionFocus();
    return cancelSelectionFocus;
  }, [scope, enabled]);

  function focusSelection(target, { anchor = false } = {}) {
    const current = () => mounted.current && active.current.scope === scope && active.current.enabled;
    if (!current()) return false;
    cancelSelectionFocus();
    if (anchor) {
      target?.focus?.({ preventScroll: true });
      target?.scrollIntoView?.({ block: "start", behavior: "auto" });
      return true;
    }
    const header = target?.closest?.("main")?.querySelector?.("[data-learning-page-start]");
    const destination = header || target;
    destination?.focus?.({ preventScroll: true });
    if (typeof window === "undefined") return true;
    window.scrollTo?.({ left: 0, top: 0, behavior: "instant" });
    const job = { url: address(), target: destination, frame: typeof window.requestAnimationFrame === "function" };
    const finish = () => {
      if (pending.current !== job) return;
      pending.current = null;
      if (!current() || address() !== job.url || job.target?.isConnected === false) return;
      window.scrollTo?.({ left: 0, top: 0, behavior: "instant" });
    };
    pending.current = job;
    if (job.frame) job.handle = window.requestAnimationFrame(finish);
    else if (typeof window.setTimeout === "function") job.handle = window.setTimeout(finish, 0);
    else pending.current = null;
    return true;
  }
  return { focusSelection, cancelSelectionFocus };
}
