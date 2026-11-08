import { useEffect, useRef, useState } from "react";
import { overviewContext, overviewPreset, validAdminOverview, validOverviewPeriod } from "../lib/admin-overview-client";
import { onVisibleReturn } from "../lib/visible-return";

const EMPTY = { from: "", to: "", environment: "live" };
export const ADMIN_OVERVIEW_TIMEOUT = 18000;

// Public GET only. The deadline includes parsing the response body; aborting a
// request is not assumed to settle either fetch or json().
export async function requestAdminOverview(filters, controller, timeout = ADMIN_OVERVIEW_TIMEOUT) {
  let timer, cancel;
  try {
    if (controller.signal.aborted) throw Object.assign(new Error("Anfrage abgebrochen."), { code: "ABORTED" });
    const cancellation = new Promise((_, reject) => {
      cancel = () => reject(Object.assign(new Error("Anfrage abgebrochen."), { code: "ABORTED" }));
      controller.signal.addEventListener("abort", cancel, { once: true });
    });
    return await Promise.race([
      cancellation,
      (async () => {
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/admin/overview?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        if (!response.ok) throw Object.assign(new Error("Die Übersicht ist nicht erreichbar."), { status: response.status });
        if (Number(response.headers?.get?.("content-length")) > 1000000) throw new Error("Die Übersicht ist zu groß.");
        const data = await response.json();
        if (!validAdminOverview(data, filters)) throw Object.assign(new Error("Die Übersicht konnte nicht gelesen werden."), { code: "INVALID_RESPONSE" });
        return data;
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error("Die Anfrage hat zu lange gedauert."), { status: 504, code: "REQUEST_TIMEOUT" }));
          controller.abort();
        }, timeout);
      }),
    ]);
  } finally { clearTimeout(timer); if (cancel) controller.signal.removeEventListener("abort", cancel); }
}

export default function useAdminOverview(testEnvironment = false) {
  const sandboxOnly = testEnvironment === true;
  const [state, setState] = useState(() => ({ draft: { ...EMPTY, environment: sandboxOnly ? "sandbox" : "live" }, today: "", preset: "30", data: null, snapshotId: 0, focusId: 0, loading: true, error: null, validation: "", initialized: false }));
  const runtime = useRef({ mounted: false, blocked: false, version: 0, sequence: 0, request: null, data: null, filters: null, sandboxOnly, draft: null, focusId: 0 });
  const prop = useRef(sandboxOnly);
  prop.current = sandboxOnly;
  const scope = runtime.current;
  const version = scope.version;
  const canAct = () => scope.mounted && !scope.blocked && prop.current === sandboxOnly && scope.sandboxOnly === sandboxOnly && scope.version === version;

  function clearRequest() {
    const current = scope.request;
    scope.request = null;
    current?.controller.abort();
  }

  function deny(status = 401) {
    clearRequest();
    scope.version += 1;
    scope.blocked = true;
    scope.data = null;
    scope.filters = null;
    scope.focusId = 0;
    if (scope.mounted) setState(previous => ({ ...previous, data: null, loading: false, focusId: 0, snapshotId: 0, error: { status }, validation: "" }));
  }

  async function start(filters, { focus = false, preset = "custom" } = {}) {
    if (!scope.mounted || scope.blocked || !validOverviewPeriod(filters) || scope.sandboxOnly && filters.environment !== "sandbox") return false;
    const today = overviewPreset(30, filters.environment)?.to;
    if (!today || filters.to > today) {
      setState(previous => ({ ...previous, today: today || "", validation: "Das Enddatum darf nicht nach dem heutigen Tag in der Schweiz liegen." }));
      return false;
    }
    clearRequest();
    scope.version += 1;
    const controller = new AbortController();
    const ticket = { id: ++scope.sequence, version: scope.version, controller, context: overviewContext(filters), focus };
    scope.request = ticket;
    scope.draft = { ...filters };
    scope.preset = preset;
    scope.data = null;
    scope.filters = null;
    scope.focusId = 0;
    setState(previous => ({ ...previous, draft: { ...filters }, today, preset, initialized: true, data: null, focusId: 0, snapshotId: 0, loading: true, error: null, validation: "" }));
    const current = () => scope.mounted && !scope.blocked && scope.request === ticket && scope.version === ticket.version && prop.current === scope.sandboxOnly;
    try {
      const data = await requestAdminOverview(filters, controller);
      if (!current() || controller.signal.aborted) return false;
      scope.data = data;
      scope.filters = { ...filters };
      scope.focusId = focus ? ticket.id : 0;
      setState(previous => ({ ...previous, data, snapshotId: ticket.id, focusId: scope.focusId, loading: false, error: null }));
      return true;
    } catch (error) {
      if (!current()) return false;
      if ([401, 403].includes(error.status)) deny(error.status);
      else setState(previous => ({ ...previous, data: null, loading: false, error: { status: error.status || 503, code: error.code || "UNAVAILABLE" } }));
      return false;
    } finally {
      if (scope.request === ticket) scope.request = null;
    }
  }

  useEffect(() => {
    scope.mounted = true;
    scope.blocked = false;
    scope.sandboxOnly = sandboxOnly;
    scope.version += 1;
    const initial = overviewPreset(30, sandboxOnly ? "sandbox" : "live");
    if (initial) start(initial, { preset: "30" });
    const revoked = () => deny(401);
    const stopVisible = onVisibleReturn(() => {
      // Recheck on an actual visible return, not a timer. An unconfirmed edit
      // must not be silently applied and a pending read must not be duplicated.
      if (scope.mounted && !scope.blocked && !scope.request && scope.data && scope.filters && overviewContext(scope.draft) === overviewContext(scope.filters)) {
        start({ ...scope.filters }, { preset: scope.preset || "custom" });
      }
    });
    if (typeof window !== "undefined") {
      window.addEventListener?.("jagdlatein-account-deleted", revoked);
      window.addEventListener?.("jagdlatein-logout", revoked);
    }
    return () => {
      scope.mounted = false;
      scope.blocked = true;
      scope.version += 1;
      scope.data = null;
      scope.filters = null;
      scope.focusId = 0;
      clearRequest();
      stopVisible();
      if (typeof window !== "undefined") {
        window.removeEventListener?.("jagdlatein-account-deleted", revoked);
        window.removeEventListener?.("jagdlatein-logout", revoked);
      }
    };
  }, [sandboxOnly]);

  const dataCurrent = state.data && scope.data === state.data && prop.current === scope.sandboxOnly && !scope.blocked && overviewContext(state.draft) === overviewContext(scope.filters);
  const visibleData = dataCurrent ? state.data : null;
  const canExport = Boolean(visibleData && !state.loading && !state.error && scope.request === null);
  const snapshotId = state.snapshotId;

  return {
    ...state, data: visibleData, canExport, denied: [401, 403].includes(state.error?.status),
    change(field, value) {
      if (!canAct() || !["from", "to", "environment"].includes(field) || typeof value !== "string" || value.length > 10 ||
          field === "environment" && (!["live", "sandbox"].includes(value) || sandboxOnly && value !== "sandbox")) return false;
      clearRequest();
      scope.version += 1;
      scope.draft = { ...scope.draft, [field]: value };
      scope.data = null; scope.filters = null; scope.focusId = 0;
      setState(previous => ({ ...previous, draft: { ...scope.draft }, preset: "custom", data: null, snapshotId: 0, focusId: 0, loading: false, error: null, validation: "" }));
      return true;
    },
    apply() {
      if (!canAct()) return false;
      if (!validOverviewPeriod(scope.draft)) {
        setState(previous => ({ ...previous, validation: "Wähle gültige Datumswerte mit höchstens 366 Tagen. Das Ende darf nicht vor dem Beginn liegen." }));
        return false;
      }
      return start({ ...scope.draft }, { focus: true });
    },
    choosePreset(days) {
      if (!canAct()) return false;
      const filters = overviewPreset(days, scope.draft?.environment || (sandboxOnly ? "sandbox" : "live"));
      return filters ? start(filters, { focus: true, preset: String(days) }) : false;
    },
    reload() {
      if (!canAct() || !validOverviewPeriod(scope.draft)) return false;
      return start({ ...scope.draft }, { preset: state.preset });
    },
    currentSnapshot() {
      if (!canAct() || !canExport || state.snapshotId !== snapshotId || scope.data !== visibleData || overviewContext(scope.draft) !== overviewContext(scope.filters)) return null;
      return { data: visibleData, filters: { ...scope.filters }, id: snapshotId };
    },
    takeFocus(id) {
      if (!canAct() || !visibleData || scope.focusId !== id || state.focusId !== id || scope.request !== null) return false;
      scope.focusId = 0;
      return true;
    },
  };
}
