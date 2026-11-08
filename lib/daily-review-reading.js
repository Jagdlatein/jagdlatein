// Public shape helpers only; no course catalog or answers are imported here.
export function reviewReadingParagraphs(reading) {
  if (!reading || typeof reading.title !== "string" || !reading.title.trim() ||
      typeof reading.paragraph !== "string" || !reading.paragraph.trim()) return null;
  const paragraphs = reading.paragraphs === undefined ? [reading.paragraph] : reading.paragraphs;
  if (!Array.isArray(paragraphs) || !paragraphs.length || paragraphs.length > 32 ||
      paragraphs.some(value => typeof value !== "string" || !value.trim() || value.length > 20000) ||
      paragraphs[0] !== reading.paragraph ||
      ["takeaway", "exercise"].some(key => reading[key] !== undefined &&
        (typeof reading[key] !== "string" || !reading[key].trim() || reading[key].length > 20000))) return null;
  return paragraphs;
}

export const DAILY_REVIEW_TIMEOUT = 15000;

// The deadline covers fetch AND JSON, including transports which ignore abort.
// A canceled old operation settles without leaving a timer or adopting a body.
export async function requestDailyReviewQuestions(ids, controller, timeout = DAILY_REVIEW_TIMEOUT) {
  let timer, onAbort, responseStatus = 0;
  const aborted = () => Object.assign(new Error("Die Fragenanfrage wurde abgebrochen."), { name: "AbortError" });
  if (controller.signal.aborted) throw aborted();
  try {
    const cancellation = new Promise((_, reject) => {
      onAbort = () => reject(aborted());
      controller.signal.addEventListener("abort", onAbort, { once: true });
    });
    const work = (async () => {
      const params = new URLSearchParams({ ids: ids.join(",") });
      const response = await fetch(`/api/lernen/wiederholung?${params}`, { signal: controller.signal, cache: "no-store", credentials: "same-origin" });
      responseStatus = response.status;
      const body = await response.json();
      return { response, body };
    })();
    return await Promise.race([work, cancellation, new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(Object.assign(new Error("Das Laden dauert zu lange. Bitte versuche es erneut."), { code: "REVIEW_TIMEOUT", responseStatus }));
        controller.abort();
      }, timeout);
    })]);
  } finally {
    clearTimeout(timer);
    if (onAbort) controller.signal.removeEventListener("abort", onAbort);
  }
}
