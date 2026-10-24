export function validReleaseId(value) {
  return typeof value === "string" && (/^dpl_[A-Za-z0-9]{8,80}$/.test(value) || /^[a-f0-9]{40}$/i.test(value));
}

// Compare only public release metadata. Never replace an open page, clear local
// data, write a cookie or interrupt an in-progress form, quiz or purchase.
export function createAppUpdateCheck({ currentRelease, onChange, fetcher = fetch, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let disposed = false, pending = null, lastCheck = null;
  let available = false;
  return {
    async check() {
      const elapsed = lastCheck === null ? Infinity : now() - lastCheck;
      if (disposed || pending || elapsed >= 0 && elapsed < 60000) return;
      lastCheck = now();
      const request = { controller: new AbortController(), timer: null };
      pending = request;
      request.timer = setTimer(() => {
        if (!disposed && pending === request && !available) onChange("unavailable");
        request.controller.abort();
      }, 8000);
      try {
        const response = await fetcher("/api/app-version", { cache: "no-store", credentials: "omit", signal: request.controller.signal });
        if (!response.ok || response.redirected) throw new Error("Release unavailable");
        const result = await response.json();
        if (!validReleaseId(result?.releaseId) || !validReleaseId(currentRelease)) throw new Error("Release unknown");
        if (disposed || pending !== request || request.controller.signal.aborted) return;
        available = result.releaseId !== currentRelease;
        onChange(available ? "update" : "current");
      } catch {
        if (!disposed && pending === request && !available) onChange("unavailable");
      } finally {
        clearTimer(request.timer);
        if (pending === request) pending = null;
      }
    },
    dispose() {
      disposed = true;
      if (pending) { clearTimer(pending.timer); pending.controller.abort(); pending = null; }
    },
  };
}
