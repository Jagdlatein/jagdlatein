import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { closePageMenu, openPageMenu } from "../components/PageMenu";
import useSelectionPageStart from "./useSelectionPageStart";

// Reading focus only. Never change the account target, answers or review history.
export default function useExamPlanTopic(categories) {
  const router = useRouter();
  const ready = router.isReady === true;
  const requested = router.query.kategorie;
  const topic = ready ? requested === undefined ? "alle" : typeof requested === "string" && categories.some(item => item.slug === requested) ? requested : null : null;
  const [error, setError] = useState("");
  const mounted = useRef(false), initialized = useRef(false), request = useRef(0), pending = useRef(null), heading = useRef(null);
  const key = JSON.stringify([ready, router.asPath, router.query]);
  const view = useRef({ key });
  if (view.current.key !== key) view.current = { key };
  const origin = view.current;
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const current = () => mounted.current && ready && view.current === origin && JSON.stringify([router.isReady === true, router.asPath, router.query]) === key;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; pending.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setError("");
    if (!topic) {
      const timer = setTimeout(() => { if (current()) openPageMenu("exam-plan-topic"); }, 0);
      return () => clearTimeout(timer);
    }
    const focus = initialized.current || requested !== undefined || (router.asPath || "").split("#")[1] === "exam-plan-learning";
    initialized.current = true;
    if (focus) { closePageMenu(); focusSelection(heading.current); }
  }, [origin, ready]);

  async function select(value) {
    if (!current() || !(value === "alle" || categories.some(item => item.slug === value))) return;
    cancelSelectionFocus();
    setError("");
    if (value === topic && pending.current === null) { closePageMenu(); focusSelection(heading.current); return; }
    const ticket = ++request.current;
    pending.current = ticket;
    const query = { ...router.query };
    if (value === "alle") delete query.kategorie;
    else query.kategorie = value;
    try {
      const accepted = await router.push({ pathname: "/lernen/pruefungsplan", query, hash: "exam-plan-learning" }, undefined, { shallow: true, scroll: false });
      if (accepted === false && current() && ticket === request.current) {
        setError("Das Lerngebiet wurde nicht übernommen. Bitte wähle es erneut.");
        openPageMenu("exam-plan-topic");
      }
    } catch (failure) {
      if (failure?.cancelled || !current() || ticket !== request.current) return;
      setError("Das Lerngebiet konnte nicht geöffnet werden. Bitte wähle es erneut.");
      openPageMenu("exam-plan-topic");
    } finally { if (pending.current === ticket) pending.current = null; }
  }
  function open() { if (current()) openPageMenu("exam-plan-topic"); }
  return { ready, topic, heading, select, open, error };
}
