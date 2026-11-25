// Client transport only. The server owns round timing, scoring and idempotency.
export const QUIZ_REQUEST_TIMEOUT_MS = 8000;

function stopped() {
  // Never expose a transport exception or a private AbortSignal reason.
  return new Error("Die Quizrunde ist gerade nicht erreichbar.");
}

export async function withQuizRequestDeadline(parentSignal, read) {
  if (parentSignal?.aborted) throw stopped();
  const controller = new AbortController();
  let finished = false;
  let rejectStopped;
  const cancellation = new Promise((_, reject) => { rejectStopped = reject; });
  // A synchronous adapter may throw after an abort; that must not leave an
  // unobserved rejection before Promise.race has subscribed to both promises.
  cancellation.catch(() => {});
  function stop() {
    if (finished || controller.signal.aborted) return;
    controller.abort();
    rejectStopped(stopped());
  }
  function assertActive() {
    if (finished || parentSignal?.aborted || controller.signal.aborted) throw stopped();
  }
  parentSignal?.addEventListener("abort", stop, { once: true });
  const timer = setTimeout(stop, QUIZ_REQUEST_TIMEOUT_MS);
  try {
    assertActive();
    // The same deadline covers response headers and its complete JSON body.
    const result = await Promise.race([read(controller.signal, assertActive), cancellation]);
    assertActive();
    return result;
  } finally {
    finished = true;
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", stop);
  }
}
