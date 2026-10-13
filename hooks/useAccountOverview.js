import { useCallback, useEffect, useState } from "react";
import { onVisibleReturn } from "../lib/visible-return";

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error("Daten konnten nicht geladen werden.");
    error.code = data?.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

async function readAccountResource(url, parentSignal) {
  const controller = new AbortController();
  let rejectDeadline;
  const deadline = new Promise((_, reject) => { rejectDeadline = reject; });
  const cancel = () => {
    rejectDeadline(new Error("Anfrage abgebrochen."));
    controller.abort();
  };
  parentSignal.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => {
    const error = new Error("Daten konnten nicht rechtzeitig geladen werden.");
    error.code = "REQUEST_TIMEOUT";
    error.status = 504;
    rejectDeadline(error);
    controller.abort();
  }, 18000);
  try {
    // Bound the response body too, and release the UI even if cancellation
    // does not settle the original request immediately.
    return await Promise.race([
      fetch(url, { cache: "no-store", credentials: "same-origin", signal: controller.signal }).then(readResponse),
      deadline,
    ]);
  } finally {
    clearTimeout(timeout);
    parentSignal.removeEventListener("abort", cancel);
  }
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
    let refreshing = false;
    let returnQueued = false;
    let accountEmail = null;
    setLoading(true);
    setProgressLoading(true);
    setAccount(null);
    setProgress([]);
    setAccountError(null);
    setProgressError(null);

    function clearIdentity(error) {
      accountEmail = null;
      setAccount(null);
      setProgress([]);
      setProgressError(null);
      setAccountError(error);
      setProgressLoading(false);
    }

    async function loadResources() {
      try {
        const data = await readAccountResource("/api/account", controller.signal);
        if (controller.signal.aborted) return;
        if (!data?.account || typeof data.account.email !== "string" ||
            typeof data.account.paid !== "boolean" || typeof data.account.admin !== "boolean") {
          throw new Error("Kontodaten konnten nicht gelesen werden.");
        }
        const nextEmail = data.account.email.trim().toLowerCase();
        if (accountEmail !== nextEmail) {
          // Never display the previous identity's progress beneath a newly
          // confirmed account while the next progress response is pending.
          setProgress([]);
          setProgressError(null);
          setProgressLoading(true);
        }
        accountEmail = nextEmail;
        setAccount(data.account);
        setAccountError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error.status === 401) clearIdentity(error);
          else setAccountError(error);
          setProgressLoading(false);
        }
        return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }

      try {
        const data = await readAccountResource("/api/course-progress", controller.signal);
        if (controller.signal.aborted) return;
        if (!Array.isArray(data?.progress) || data.progress.some(entry => !entry || typeof entry !== "object" || Array.isArray(entry))) {
          throw new Error("Kursfortschritt konnte nicht gelesen werden.");
        }
        if (!controller.signal.aborted) {
          setProgress(data.progress);
          setProgressError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error.status === 401) clearIdentity(error);
          else setProgressError(error);
        }
      } finally {
        if (!controller.signal.aborted) setProgressLoading(false);
      }
    }

    async function load() {
      if (controller.signal.aborted) return;
      if (refreshing) { returnQueued = true; return; }
      refreshing = true;
      try { await loadResources(); }
      finally {
        refreshing = false;
        if (returnQueued && !controller.signal.aborted) {
          returnQueued = false;
          void load();
        }
      }
    }
    // Preserve the visible overview while refreshing after another app/browser
    // was used. Manual retry still performs the ordinary full loading state.
    const stopObserving = onVisibleReturn(() => { void load(); });
    void load();
    return () => { stopObserving(); controller.abort(); };
  }, [revision]);

  return { account, progress, accountError, progressError, loading, progressLoading, reload };
}
