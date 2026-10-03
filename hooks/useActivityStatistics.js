import { useCallback, useEffect, useState } from "react";

async function readData(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error("Auswertungen nicht erreichbar.");
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

export default function useActivityStatistics() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { cache: "no-store", credentials: "same-origin", signal: controller.signal };
    setLoading(true);
    setError(null);
    setStatistics(null);
    async function load() {
      try {
        await readData(await fetch("/api/account", options));
        const data = await readData(await fetch("/api/activity-results", options));
        if (!data.statistics?.quiz || !data.statistics?.ansitz || !Array.isArray(data.statistics?.history) || !Array.isArray(data.statistics?.topics)) {
          throw new Error("Ungültige Auswertungen");
        }
        if (!controller.signal.aborted) setStatistics(data.statistics);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [revision]);

  return { statistics, loading, error, reload };
}
