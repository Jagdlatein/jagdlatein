import { useCallback, useEffect, useRef, useState } from "react";
import { REVIEW_STORAGE_KEY } from "../lib/daily-review";

const SAVE_DELAY = 250;

export default function useCourseProgress(courseId, {
  started,
  answeredQuestions,
  totalQuestions,
  score,
  completed,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const context = useRef(null);
  if (!context.current || context.current.courseId !== courseId) context.current = {
    courseId, ticket: {}, paused: false, mounted: false, pending: null, latest: null,
    lastSaved: "", running: false, timer: null, controller: null, detach: null,
  };
  const scope = context.current;

  const save = useCallback(async (finishOnLeave = false) => {
    if (scope.paused || scope.running || !scope.pending || !finishOnLeave && (!scope.mounted || context.current !== scope)) return;
    const ticket = scope.ticket;
    const current = () => scope.ticket === ticket && !scope.paused;
    const visible = () => current() && scope.mounted && context.current === scope;
    scope.running = true;
    if (visible()) setSaving(true);

    try {
      // Ordinary departures still finish an answer already given. A received
      // removal event cancels this context and its later continuations.
      while (scope.pending && current()) {
        const payload = scope.pending;
        const signature = JSON.stringify(payload);
        scope.pending = null;
        if (payload.courseId !== scope.courseId || signature === scope.lastSaved) continue;
        const controller = new AbortController(); scope.controller = controller;

        try {
          const response = await fetch("/api/course-progress", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: signature,
            keepalive: true,
            signal: controller.signal,
          });
          if (!current()) return;
          if (!response.ok) {
            const failure = new Error("Fortschritt konnte nicht gespeichert werden.");
            failure.code = response.status === 401
              ? "SESSION_RENEWAL_REQUIRED"
              : "PROGRESS_UNAVAILABLE";
            throw failure;
          }
          scope.lastSaved = signature;
          if (visible()) setError(null);
        } catch (failure) {
          if (!current()) return;
          if (!scope.pending) scope.pending = payload;
          if (visible()) {
            setError({ code: failure.code || "PROGRESS_UNAVAILABLE" });
          }
          break;
        } finally {
          if (scope.controller === controller) scope.controller = null;
        }
      }
    } finally {
      scope.running = false;
      if (visible()) setSaving(false);
      if (!scope.mounted) {
        scope.pending = null; scope.latest = null;
        scope.detach?.();
      }
    }
  }, [scope]);

  useEffect(() => {
    scope.mounted = true;
    setSaving(false); setError(null);
    const browser = typeof window === "undefined" ? null : window;
    scope.detach?.();
    function pause(event) {
      if (scope.paused || !scope.mounted && !scope.running && !scope.pending) return;
      if (event.type === "storage") {
        if (event.newValue !== null || event.key !== null && event.key !== REVIEW_STORAGE_KEY) return;
        try { if (event.storageArea && event.storageArea !== browser.localStorage) return; }
        catch { return; }
      }
      scope.paused = true; scope.ticket = {};
      clearTimeout(scope.timer); scope.timer = null;
      scope.pending = null; scope.latest = null;
      scope.controller?.abort(); scope.controller = null;
      if (scope.mounted && context.current === scope) { setSaving(false); setError(null); }
      if (!scope.mounted) scope.detach?.();
    }
    function detach() {
      browser?.removeEventListener?.("storage", pause);
      browser?.removeEventListener?.("jagdlatein-account-deleted", pause);
      if (scope.detach === detach) scope.detach = null;
    }
    scope.detach = detach;
    browser?.addEventListener?.("storage", pause);
    browser?.addEventListener?.("jagdlatein-account-deleted", pause);
    return () => {
      scope.mounted = false;
      clearTimeout(scope.timer);
      // A removal suppresses this flush. Already dispatched server work is not
      // claimed to be undone. Keep observing deletion while an ordinary async
      // leave-flush can still send another queued payload, then detach it.
      if (!scope.paused) void save(true);
      if (!scope.running) {
        scope.pending = null; scope.latest = null;
        scope.detach?.();
      }
    };
  }, [scope, save]);

  useEffect(() => {
    clearTimeout(scope.timer);
    if (scope.paused || !scope.mounted || context.current !== scope || !started || answeredQuestions < 1) return;

    const payload = {
      courseId,
      answeredQuestions,
      totalQuestions,
      score,
      completed,
    };
    scope.latest = payload;
    if (JSON.stringify(payload) === scope.lastSaved) return;
    scope.pending = payload;
    if (completed) {
      void save();
    } else {
      scope.timer = setTimeout(() => void save(), SAVE_DELAY);
    }

    return () => clearTimeout(scope.timer);
  }, [courseId, started, answeredQuestions, totalQuestions, score, completed, scope, save]);

  const retry = useCallback(() => {
    if (!scope.mounted || context.current !== scope || scope.paused || !scope.latest) return;
    scope.pending = scope.latest;
    setError(null);
    void save();
  }, [scope, save]);

  return { saving, error, retry };
}
