import { useEffect, useRef } from "react";

// Lock before React renders, and keep callbacks tied to their original question.
export default function useMiniQuizAnswer(questionIndex, completed, answerCount) {
  const active = useRef({ questionIndex, completed, locked: false });
  const mounted = useRef(true);
  const timer = useRef(null);

  if (active.current.questionIndex !== questionIndex) {
    active.current = { questionIndex, completed, locked: false };
  } else {
    active.current.completed = completed;
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  const renderedQuestion = active.current;

  function accept(answerIndex) {
    const current = active.current;
    if (!mounted.current || current !== renderedQuestion || current.questionIndex !== questionIndex || current.completed || current.locked) return false;
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= answerCount) return false;
    current.locked = true;
    return true;
  }

  function schedule(callback, delay) {
    if (!mounted.current || active.current !== renderedQuestion || active.current.questionIndex !== questionIndex || !active.current.locked) return;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (mounted.current && active.current === renderedQuestion && active.current.questionIndex === questionIndex) callback();
    }, delay);
  }

  return { accept, schedule };
}
