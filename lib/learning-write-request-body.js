// Only course-progress POST and activity-results POST use this transport reader.
// The existing domain validators still decide object shape, identity and score.
export const LEARNING_WRITE_MAX_BYTES = 4096;
export const LEARNING_WRITE_READ_TIMEOUT_MS = 8000;

const publicBodyErrors = new WeakSet();
class LearningWriteRequestBodyError extends Error {
  constructor(code, status, message) {
    super(message); this.code = code; this.status = status;
    publicBodyErrors.add(this);
  }
}
const tooLarge = () => new LearningWriteRequestBodyError("LEARNING_REQUEST_TOO_LARGE", 413,
  "Die Lerndaten sind zu gross. Bitte versuche es erneut.");
const cancelled = () => new LearningWriteRequestBodyError("LEARNING_REQUEST_ABORTED", 408,
  "Die Anfrage wurde abgebrochen. Bitte versuche es erneut.");
const expired = () => new LearningWriteRequestBodyError("LEARNING_REQUEST_TIMEOUT", 408,
  "Die Übertragung hat zu lange gedauert. Bitte versuche es erneut.");

export function isLearningWriteRequestBodyError(error) {
  return publicBodyErrors.has(error);
}
export function assertLearningWriteRequestActive(req) {
  if (req.signal?.aborted) throw cancelled();
}

export async function readLearningWriteRequestBody(req) {
  let reader, timer, abort, didCancel = false;
  const ownErrors = new WeakSet();
  const own = error => { ownErrors.add(error); return error; };
  const cancel = () => {
    if (!reader || didCancel) return;
    didCancel = true;
    // An acquired transport can stall or reject during cleanup. Do not wait.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  try {
    assertLearningWriteRequestActive(req);
    const declared = req.headers.get("content-length");
    if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)) || Number(declared) > LEARNING_WRITE_MAX_BYTES)) throw own(tooLarge());
    reader = req.body?.getReader?.();
    if (!reader) { assertLearningWriteRequestActive(req); return null; }
    assertLearningWriteRequestActive(req);
    const interruption = new Promise((_, reject) => {
      timer = setTimeout(() => reject(own(expired())), LEARNING_WRITE_READ_TIMEOUT_MS);
      abort = () => reject(own(cancelled()));
      req.signal?.addEventListener("abort", abort, { once: true });
    });
    void interruption.catch(() => {});
    if (req.signal?.aborted) abort();
    // Match native Request.json: nonfatal UTF8 and one initial BOM removed.
    const decoder = new TextDecoder(); let bytes = 0, raw = "";
    for (;;) {
      assertLearningWriteRequestActive(req);
      const { done, value } = await Promise.race([reader.read(), interruption]);
      assertLearningWriteRequestActive(req);
      if (done) break;
      // A native byte-stream may contain a Uint8Array from another realm.
      if (!ArrayBuffer.isView(value) || Object.prototype.toString.call(value) !== "[object Uint8Array]") return null;
      bytes += value.byteLength;
      if (bytes > LEARNING_WRITE_MAX_BYTES) throw own(tooLarge());
      raw += decoder.decode(value, { stream: true });
    }
    assertLearningWriteRequestActive(req);
    let body;
    try { body = JSON.parse(raw + decoder.decode()); } catch { assertLearningWriteRequestActive(req); return null; }
    assertLearningWriteRequestActive(req);
    return body;
  } catch (error) {
    assertLearningWriteRequestActive(req);
    if (ownErrors.has(error)) throw error;
    // Both original routes mapped JSON/transport failures to body=null, then
    // let their existing validators return the original domain-specific400.
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abort) req.signal?.removeEventListener("abort", abort);
    cancel();
    if (reader) try { reader.releaseLock(); } catch { /* A raced read may settle later. */ }
  }
}
