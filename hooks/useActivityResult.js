import { useCallback, useEffect, useRef, useState } from "react";

function eventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function useActivityResult({ runKey = 0, completed, type, country, topic, totalQuestions, correctAnswers, timedOutAnswers = 0, points, startedAt }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const currentRound = useRef(null);
  const queue = useRef([]);
  const running = useRef(false);
  const mounted = useRef(false);

  const save = useCallback(async () => {
    if (running.current || queue.current.length === 0) return;
    running.current = true;
    if (mounted.current) setSaving(true);
    try {
      while (queue.current.length > 0) {
        const payload = queue.current[0];
        try {
          const response = await fetch("/api/activity-results", {
            method: "POST", credentials: "same-origin", keepalive: true,
            headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const failure = new Error("Ergebnis konnte nicht gespeichert werden.");
            failure.code = response.status === 401 ? "SESSION_RENEWAL_REQUIRED" : "STATISTICS_UNAVAILABLE";
            throw failure;
          }
          queue.current.shift();
          if (mounted.current) {
            setError(null);
            if (currentRound.current?.payload?.eventId === payload.eventId) setSaved(true);
          }
        } catch (failure) {
          if (mounted.current) setError({ code: failure.code || "STATISTICS_UNAVAILABLE" });
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
    // Re-send pending rounds with the same IDs; the API counts each ID once.
    const flushPending = () => {
      for (const payload of queue.current) {
        void fetch("/api/activity-results", {
          method: "POST", credentials: "same-origin", keepalive: true,
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        }).catch(() => {});
      }
    };
    window.addEventListener("pagehide", flushPending);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", flushPending);
      flushPending();
    };
  }, []);

  useEffect(() => {
    if (currentRound.current?.key !== runKey) {
      currentRound.current = { key: runKey, payload: null };
      setSaved(false);
    }
    if (!completed || totalQuestions < 1 || currentRound.current.payload) return;
    try {
      const payload = {
        eventId: eventId(), type, country, topic, totalQuestions, correctAnswers, timedOutAnswers, points,
        durationSeconds: Math.min(86400, Math.max(0, Math.floor((Date.now() - startedAt) / 1000))),
      };
      currentRound.current.payload = payload;
      queue.current.push(payload);
      void save();
    } catch {
      setError({ code: "STATISTICS_UNAVAILABLE" });
    }
  }, [runKey, completed, type, country, topic, totalQuestions, correctAnswers, timedOutAnswers, points, startedAt, revision, save]);

  const retry = useCallback(() => {
    setError(null);
    setRevision(value => value + 1);
    void save();
  }, [save]);

  return { saving, saved: completed && saved, error, retry };
}
