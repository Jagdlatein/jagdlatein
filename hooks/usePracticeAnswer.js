import useMiniQuizAnswer from "./useMiniQuizAnswer";

export default function usePracticeAnswer(step, completed = false) {
  const guard = useMiniQuizAnswer(step, completed, 1);
  return { accept: () => guard.accept(0), schedule: guard.schedule };
}
