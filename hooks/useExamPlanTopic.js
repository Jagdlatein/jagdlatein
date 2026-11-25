import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { closePageMenu, openPageMenu } from "../components/PageMenu";
import useSelectionPageStart from "./useSelectionPageStart";
import { examPlanRouteIsReady, getExamGoalOptions, readExamGoalFocus } from "../lib/exam-goal-focus";

// Reading focus only. Never change the account target, answers or review history.
export default function useExamPlanTopic(categories, blueprint) {
  const router = useRouter();
  const ready = examPlanRouteIsReady(router);
  const requested = router.query.kategorie;
  const topic = ready ? requested === undefined ? "alle" : typeof requested === "string" && categories.some(item => item.slug === requested) ? requested : null : null;
  const requestedState = router.query.stand;
  const states = ["alle", "offen", "ueben", "erklaert"];
  const stand = ready ? requestedState === undefined ? "alle" : typeof requestedState === "string" && states.includes(requestedState) ? requestedState : null : null;
  const goalOptions = getExamGoalOptions(blueprint, categories, topic);
  const requestedGoal = router.query.lernziel;
  const goal = ready && topic ? readExamGoalFocus(requestedGoal, goalOptions) : null;
  const [error, setError] = useState("");
  const [selectionRevision, setSelectionRevision] = useState(0);
  const mounted = useRef(false), initialized = useRef(false), request = useRef(0), pending = useRef(null), heading = useRef(null);
  const raw = () => JSON.stringify([router.isReady === true, router.asPath, router.query, typeof window === "undefined" || !window.location ? null : window.location.href || `${window.location.pathname}${window.location.search}${window.location.hash}`]);
  const key = raw();
  const view = useRef({ key });
  if (view.current.key !== key) view.current = { key };
  const origin = view.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const current = () => {
    if (!mounted.current || !ready || view.current !== origin) return false;
    const liveKey = raw();
    if (liveKey !== key) { view.current = { key: liveKey }; return false; }
    return true;
  };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; pending.current = null; };
  }, []);
  useEffect(() => {
    if (pending.current && pending.current.origin !== origin) { pending.current = null; request.current++; }
    if (!ready) return;
    setError("");
    if (!topic || !stand || !goal) {
      const timer = setTimeout(() => { if (current()) openPageMenu(!topic ? "exam-plan-topic" : !stand ? "exam-plan-state" : "exam-plan-goal"); }, 0);
      return () => clearTimeout(timer);
    }
    const focus = initialized.current || requested !== undefined || requestedState !== undefined || requestedGoal !== undefined || (router.asPath || "").split("#")[1] === "exam-plan-learning";
    initialized.current = true;
    if (focus) { closePageMenu(); focusSelection(heading.current); }
  }, [origin, ready]);

  async function choose(field, value) {
    if (!current() || !(field === "stand" ? states.includes(value) : field === "goal" ? value === "alle" || goalOptions.some(item => item.id === value) : value === "alle" || categories.some(item => item.slug === value))) return;
    cancelSelectionFocus();
    setError("");
    if (value === (field === "stand" ? stand : field === "goal" ? goal : topic) && pending.current === null) { setSelectionRevision(revision => revision + 1); closePageMenu(); focusSelection(heading.current); return; }
    const ticket = ++request.current;
    pending.current = { ticket, origin };
    const query = { ...router.query };
    const name = field === "stand" ? "stand" : field === "goal" ? "lernziel" : "kategorie";
    if (field === "topic") delete query.lernziel;
    if (value === "alle") delete query[name];
    else query[name] = value;
    let waitForCommit = false;
    try {
      const accepted = await router.push({ pathname: "/lernen/pruefungsplan", query, hash: "exam-plan-learning" }, undefined, { shallow: true, scroll: false });
      if (accepted !== false) waitForCommit = true;
      if (accepted === false && current() && ticket === request.current) {
        setError(field === "stand" ? "Der Lernstand wurde nicht übernommen. Bitte wähle ihn erneut." : field === "goal" ? "Die Aufgabe wurde nicht übernommen. Bitte wähle sie erneut." : "Das Lerngebiet wurde nicht übernommen. Bitte wähle es erneut.");
        openPageMenu(field === "stand" ? "exam-plan-state" : field === "goal" ? "exam-plan-goal" : "exam-plan-topic");
      }
    } catch (failure) {
      if (failure?.cancelled || !current() || ticket !== request.current) return;
      setError(field === "stand" ? "Der Lernstand konnte nicht geöffnet werden. Bitte wähle ihn erneut." : field === "goal" ? "Die Aufgabe konnte nicht geöffnet werden. Bitte wähle sie erneut." : "Das Lerngebiet konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu(field === "stand" ? "exam-plan-state" : field === "goal" ? "exam-plan-goal" : "exam-plan-topic");
    // Resolving a push does not prove that its URL/content committed. Keep the
    // intent until the actual next view, so choosing the still-visible task can
    // supersede that pending push instead of merely refocusing the old text.
    } finally { if (!waitForCommit && pending.current?.ticket === ticket && current()) pending.current = null; }
  }
  function open() { if (current()) openPageMenu("exam-plan-topic"); }
  const select = value => choose("topic", value);
  const selectStand = value => choose("stand", value);
  const selectGoal = value => choose("goal", value);
  return { ready, topic, stand, goal, goalOptions, heading, select, selectStand, selectGoal, open, error, origin, selectionRevision, isCurrent: current };
}
