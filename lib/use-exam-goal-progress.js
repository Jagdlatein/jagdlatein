import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getAccountExamSnapshot } from "./account-exam-profile-client";
import { examGoalProfileKey, examGoalProgressStore as store } from "./exam-goal-progress";

const neutral = { phase: "loading", entries: {}, persistence: "unknown", revision: -1, error: "" };
export default function useExamGoalProgress({ catalog, profile, ready, persistence, accountKey, enabled = true }) {
  const router = useRouter();
  const profileKey = examGoalProfileKey(profile);
  const raw = () => JSON.stringify([router.isReady === true, router.asPath, router.query]);
  const rawKey = raw();
  const [snapshot, setSnapshot] = useState(neutral);
  const mounted = useRef(false);
  const view = useRef(null);
  const confirmedAccount = persistence === "account" ? getAccountExamSnapshot() : null;
  const identity = [catalog, profileKey, ready, persistence, accountKey, rawKey, confirmedAccount, enabled];
  if (!view.current || identity.some((value, index) => value !== view.current.identity[index])) view.current = { identity };
  const origin = view.current;
  const revision = snapshot.revision;
  function current() {
    if (!enabled || !mounted.current || view.current !== origin || !ready || router.isReady !== true || !profileKey || raw() !== rawKey || !store.isCatalog(catalog) || !store.accountMatches(accountKey) || store.getSnapshot().revision !== revision) return false;
    if (persistence === "account") {
      const confirmed = getAccountExamSnapshot();
      if (confirmed !== confirmedAccount || !confirmed.ready || confirmed.saving || confirmed.accountKey !== accountKey || examGoalProfileKey(confirmed.profile) !== profileKey) return false;
    }
    return true;
  }
  useEffect(() => {
    if (!enabled || !ready || !profileKey || router.isReady !== true) return;
    mounted.current = true;
    store.configure(catalog);
    const notify = () => { if (mounted.current) setSnapshot(store.getSnapshot()); };
    const unsubscribe = store.subscribe(notify);
    if (persistence === "account") store.bindAccount(accountKey);
    notify();
    const clear = () => store.clear();
    if (typeof window !== "undefined") {
      window.addEventListener?.("jagdlatein-account-deleted", clear);
    }
    return () => {
      mounted.current = false; unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener?.("jagdlatein-account-deleted", clear);
      }
    };
  }, [catalog, persistence, accountKey, enabled, ready, Boolean(profileKey), router.isReady]);

  const accountReady = !confirmedAccount || confirmedAccount.ready && !confirmedAccount.saving && confirmedAccount.accountKey === accountKey && examGoalProfileKey(confirmedAccount.profile) === profileKey;
  const available = enabled && ready && accountReady && router.isReady === true && Boolean(profileKey) && snapshot.phase === "ready" && store.accountMatches(accountKey) && store.isCatalog(catalog);
  const goals = catalog.profiles.get(profileKey);
  const entries = available ? snapshot.entries[profileKey] || {} : {};
  const counts = { total: goals?.size || 0, offen: 0, ueben: 0, erklaert: 0 };
  if (available) for (const id of goals.keys()) counts[entries[id] || "offen"]++;
  return {
    ready: available, persistence: snapshot.persistence, error: snapshot.error, profileKey, counts,
    state(goal) { return available && goals?.get(goal.id) === goal ? entries[goal.id] || "offen" : ""; },
    set(goal, state) { return current() && goals?.get(goal?.id) === goal ? store.set(profileKey, goal.id, state) : false; },
    reset() { return current() ? store.reset(profileKey) : false; },
  };
}
