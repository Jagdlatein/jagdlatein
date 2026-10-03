import { useCallback, useEffect, useRef, useState } from "react";

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
  const pending = useRef(null);
  const latest = useRef(null);
  const lastSaved = useRef("");
  const running = useRef(false);
  const mounted = useRef(false);
  const timer = useRef(null);

  const save = useCallback(async () => {
    if (running.current || !pending.current) return;
    running.current = true;
    if (mounted.current) setSaving(true);

    try {
      // Send the newest state after each response so older requests cannot overtake it.
      while (pending.current) {
        const payload = pending.current;
        const signature = JSON.stringify(payload);
        pending.current = null;
        if (signature === lastSaved.current) continue;

        try {
          const response = await fetch("/api/course-progress", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: signature,
            keepalive: true,
          });
          if (!response.ok) {
            const failure = new Error("Fortschritt konnte nicht gespeichert werden.");
            failure.code = response.status === 401
              ? "SESSION_RENEWAL_REQUIRED"
              : "PROGRESS_UNAVAILABLE";
            throw failure;
          }
          lastSaved.current = signature;
          if (mounted.current) setError(null);
        } catch (failure) {
          if (!pending.current) pending.current = payload;
          if (mounted.current) {
            setError({ code: failure.code || "PROGRESS_UNAVAILABLE" });
          }
          break;
        }
      }
    } finally {
      running.current = false;
      if (mounted.current) setSaving(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      // Finish an answer already given when the learner opens another page.
      void save();
    };
  }, [save]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!started || answeredQuestions < 1) return;

    const payload = {
      courseId,
      answeredQuestions,
      totalQuestions,
      score,
      completed,
    };
    latest.current = payload;
    if (JSON.stringify(payload) === lastSaved.current) return;
    pending.current = payload;
    if (completed) {
      void save();
    } else {
      timer.current = setTimeout(() => void save(), SAVE_DELAY);
    }

    return () => clearTimeout(timer.current);
  }, [courseId, started, answeredQuestions, totalQuestions, score, completed, save]);

  const retry = useCallback(() => {
    if (!latest.current) return;
    pending.current = latest.current;
    setError(null);
    void save();
  }, [save]);

  return { saving, error, retry };
}
