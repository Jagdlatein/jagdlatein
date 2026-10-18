import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { canonicalWildlifeListURL, defaultWildlifeListState, isWildlifeListURL, normalizeWildlifeListState, readWildlifeListURL, sameWildlifeListState, wildlifeListURL } from "./wildlife-list-state";

export default function useWildlifeListState() {
  const router = useRouter();
  const [state, setState] = useState(defaultWildlifeListState);
  const [urlReady, setURLReady] = useState(false);
  const current = useRef(state);
  const currentRouter = useRef(router);
  const ready = useRef(false);
  const mounted = useRef(true);
  const departing = useRef(false);
  const timer = useRef(null);
  const externalPath = useRef("/wildkunde");
  const epoch = useRef(0);
  const navigation = useRef(0);
  const writes = useRef(new Map());
  const sequence = useRef(0);
  currentRouter.current = router;

  function persist(source) {
    const latest = currentRouter.current;
    if (!mounted.current || departing.current || !ready.current || !latest.isReady || !isWildlifeListURL(latest.asPath)) return Promise.resolve(false);
    const href = wildlifeListURL(source || latest.asPath, current.current);
    const key = canonicalWildlifeListURL(href);
    if (key === canonicalWildlifeListURL(latest.asPath)) return Promise.resolve(true);
    const token = { id: ++sequence.current, epoch: epoch.current };
    writes.current.set(key, token);
    // Keep acknowledgement markers until the route effect observes them. An
    // older failed replacement must not remove a newer write to the same URL.
    if (writes.current.size > 30) writes.current.delete(writes.current.keys().next().value);
    let result;
    try { result = latest.replace(href, undefined, { shallow: true, scroll: false }); }
    catch { result = Promise.resolve(false); }
    return Promise.resolve(result).catch(() => false).then(completed => {
      if (completed === false && writes.current.get(key) === token) writes.current.delete(key);
      return completed !== false;
    });
  }

  function restore(asPath) {
    clearTimeout(timer.current);
    departing.current = false;
    ++epoch.current; ++navigation.current;
    externalPath.current = asPath;
    const next = readWildlifeListURL(asPath);
    if (!sameWildlifeListState(current.current, next)) { current.current = next; setState(next); }
    ready.current = true; setURLReady(true);
  }

  useEffect(() => {
    if (!router.isReady || !isWildlifeListURL(router.asPath)) return;
    const key = canonicalWildlifeListURL(router.asPath);
    const own = writes.current.get(key);
    if (own) {
      writes.current.delete(key);
      // Back/forward may have restored a different selection while this write
      // was in flight. Keep that selection and repair only the stale address.
      if (own.epoch !== epoch.current) persist(externalPath.current);
      else {
        externalPath.current = router.asPath;
        // The user may already have returned to the original value before an
        // older replace finished. Its late address still needs the latest draft.
        if (!sameWildlifeListState(current.current, readWildlifeListURL(router.asPath))) {
          clearTimeout(timer.current); timer.current = null; persist();
        }
      }
      return;
    }
    if (ready.current && sameWildlifeListState(readWildlifeListURL(externalPath.current), readWildlifeListURL(router.asPath))) {
      externalPath.current = router.asPath;
      return;
    }
    restore(router.asPath);
  }, [router.isReady, router.asPath]);

  useEffect(() => {
    mounted.current = true;
    const history = () => {
      const asPath = window.location.pathname + window.location.search + window.location.hash;
      if (isWildlifeListURL(asPath)) restore(asPath);
    };
    window.addEventListener("popstate", history);
    return () => {
      mounted.current = false; ready.current = false;
      clearTimeout(timer.current); ++epoch.current; ++navigation.current;
      window.removeEventListener("popstate", history);
    };
  }, []);

  function update(value) {
    if (!ready.current) return;
    const next = normalizeWildlifeListState(value);
    if (sameWildlifeListState(current.current, next)) return;
    departing.current = false;
    ++navigation.current;
    current.current = next; setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; persist(); }, 180);
  }
  function change(field, value) { update({ ...current.current, [field]: value }); }
  function reset() { update(defaultWildlifeListState()); }

  async function openPortrait(event, href) {
    if (event.defaultPrevented || event.button > 1 || !ready.current) return;
    if (event.button === 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      clearTimeout(timer.current); persist();
      return;
    }
    const latest = currentRouter.current;
    const desired = wildlifeListURL(latest.asPath, current.current);
    if (canonicalWildlifeListURL(desired) === canonicalWildlifeListURL(latest.asPath)) return;
    event.preventDefault(); clearTimeout(timer.current);
    const token = ++navigation.current, version = epoch.current;
    let deadline;
    // A slow or rejected URL write must never swallow the original link. A
    // later navigation/input/history action takes precedence over this click.
    await Promise.race([persist(), new Promise(resolve => { deadline = setTimeout(resolve, 500); })]);
    clearTimeout(deadline);
    if (!mounted.current || navigation.current !== token || epoch.current !== version || !isWildlifeListURL(currentRouter.current.asPath)) return;
    const outgoing = ++navigation.current, leavingEpoch = ++epoch.current;
    departing.current = true;
    try { await currentRouter.current.push(href); }
    catch (failure) {
      if (!failure?.cancelled && mounted.current && navigation.current === outgoing && epoch.current === leavingEpoch && isWildlifeListURL(currentRouter.current.asPath)) window.location.assign(href);
    }
  }

  return { ...state, urlReady, change, reset, openPortrait };
}
