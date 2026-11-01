import { useEffect, useRef, useState } from "react";
import { REVIEW_STORAGE_KEY } from "./daily-review";
import { getExamReviewProgress } from "./exam-review-progress";

export default function useExamReviewProgress(catalog) {
  const [state, setState] = useState({ catalog: null, phase: "loading", summary: null });
  const context = useRef({ catalog });
  if (context.current.catalog !== catalog) context.current = { catalog };
  const origin = context.current;
  useEffect(() => {
    let live = true;
    const browser = typeof window === "undefined" ? null : window;
    const page = typeof document === "undefined" ? null : document;
    const current = () => live && context.current === origin;
    function refresh() {
      if (!current()) return;
      let summary = null;
      try { summary = getExamReviewProgress(catalog, browser.localStorage.getItem(REVIEW_STORAGE_KEY)); } catch { /* A denied read is not a zero score. */ }
      if (current()) setState({ catalog, phase: summary ? "ready" : "unavailable", summary });
    }
    function storageChanged(event) {
      if (!current() || event.key !== null && event.key !== REVIEW_STORAGE_KEY) return;
      try { if (event.storageArea && event.storageArea !== browser.localStorage) return; } catch { refresh(); return; }
      // Read the current value, never a queued event's superseded record.
      refresh();
    }
    function visible() { if (page?.visibilityState === "visible") refresh(); }
    refresh();
    browser?.addEventListener?.("storage", storageChanged);
    browser?.addEventListener?.("focus", refresh);
    browser?.addEventListener?.("jagdlatein-account-deleted", refresh);
    page?.addEventListener?.("visibilitychange", visible);
    const timer = browser?.setInterval?.(() => { if (!page || page.visibilityState !== "hidden") refresh(); }, 60000);
    return () => {
      live = false;
      browser?.removeEventListener?.("storage", storageChanged);
      browser?.removeEventListener?.("focus", refresh);
      browser?.removeEventListener?.("jagdlatein-account-deleted", refresh);
      page?.removeEventListener?.("visibilitychange", visible);
      if (timer != null) browser?.clearInterval?.(timer);
    };
  }, [origin]);
  return state.catalog === catalog ? state : { phase: "loading", summary: null };
}
