import { useCallback, useEffect, useState } from "react";

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error("Daten konnten nicht geladen werden.");
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

export default function useAccountOverview() {
  const [account, setAccount] = useState(null);
  const [progress, setProgress] = useState([]);
  const [accountError, setAccountError] = useState(null);
  const [progressError, setProgressError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { cache: "no-store", credentials: "same-origin", signal: controller.signal };
    setLoading(true);
    setProgressLoading(true);
    setAccount(null);
    setProgress([]);
    setAccountError(null);
    setProgressError(null);

    async function load() {
      try {
        const data = await readResponse(await fetch("/api/account", options));
        if (controller.signal.aborted) return;
        setAccount(data.account);
      } catch (error) {
        if (!controller.signal.aborted) {
          setAccountError(error);
          setProgressLoading(false);
        }
        return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }

      try {
        const data = await readResponse(await fetch("/api/course-progress", options));
        if (!controller.signal.aborted) setProgress(data.progress);
      } catch (error) {
        if (!controller.signal.aborted) setProgressError(error);
      } finally {
        if (!controller.signal.aborted) setProgressLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [revision]);

  return { account, progress, accountError, progressError, loading, progressLoading, reload };
}
