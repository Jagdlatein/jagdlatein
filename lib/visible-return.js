// A browser-backed app can resume through several overlapping lifecycle events.
// Notify once per visible return, including a document restored from BFCache.
export function onVisibleReturn(callback, {
  document: doc = typeof document === "undefined" ? null : document,
  window: win = typeof window === "undefined" ? null : window,
  now = () => Date.now(),
} = {}) {
  if (!doc?.addEventListener || !win?.addEventListener) return () => {};
  let hidden = doc.visibilityState !== "visible";
  let blurred = false;
  let lastReturn = -Infinity;
  let disposed = false;
  function resumed() {
    if (disposed || doc.visibilityState !== "visible") return;
    const time = now();
    if (time >= lastReturn && time - lastReturn < 500) return;
    lastReturn = time;
    callback();
  }
  function visibilityChanged() {
    const wasHidden = hidden;
    hidden = doc.visibilityState !== "visible";
    if (wasHidden && !hidden) resumed();
  }
  function pageShown(event) { if (event.persisted === true) resumed(); }
  function focused() {
    if (!blurred) return;
    blurred = false;
    resumed();
  }
  function lostFocus() { blurred = true; }
  doc.addEventListener("visibilitychange", visibilityChanged);
  win.addEventListener("pageshow", pageShown);
  win.addEventListener("blur", lostFocus);
  win.addEventListener("focus", focused);
  return () => {
    disposed = true;
    doc.removeEventListener("visibilitychange", visibilityChanged);
    win.removeEventListener("pageshow", pageShown);
    win.removeEventListener("blur", lostFocus);
    win.removeEventListener("focus", focused);
  };
}
