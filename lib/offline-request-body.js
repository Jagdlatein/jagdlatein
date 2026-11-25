// Only the existing offline-download POST uses this reader. Its original
// 3000-UTF16-unit contract is distinct from the chat endpoint's byte limit.
export const OFFLINE_REQUEST_MAX_CHARACTERS = 3000;
// Native Request.text() removes one initial three-byte UTF-8 BOM. Every other
// UTF-16 code unit needs at most three UTF-8 bytes, including replacement text.
export const OFFLINE_REQUEST_MAX_BYTES = 3 * OFFLINE_REQUEST_MAX_CHARACTERS + 3;
export const OFFLINE_REQUEST_READ_TIMEOUT_MS = 8000;

export class OfflineRequestBodyError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const cancelled = () => new OfflineRequestBodyError("Die Anfrage wurde abgebrochen. Bitte versuche es erneut.", 408);
const expired = () => new OfflineRequestBodyError("Die Übertragung hat zu lange gedauert. Bitte versuche es erneut.", 408);
const tooLarge = () => new OfflineRequestBodyError("Zu viele Downloadangaben.", 413);

export function assertOfflineRequestActive(req) {
  if (req.signal?.aborted) throw cancelled();
}

export async function readOfflineRequestBody(req) {
  assertOfflineRequestActive(req);
  // Acquisition failure belongs to the generic transport-error path. Never
  // cancel or release a reader already owned by a different consumer.
  const reader = req.body?.getReader?.();
  if (!reader) { assertOfflineRequestActive(req); return ""; }
  let timer, abort, didCancel = false;
  const cancel = () => {
    if (didCancel) return;
    didCancel = true;
    // Broken or hanging transport cancellation must not delay our response.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  try {
    assertOfflineRequestActive(req);
    const interruption = new Promise((_, reject) => {
      timer = setTimeout(() => reject(expired()), OFFLINE_REQUEST_READ_TIMEOUT_MS);
      abort = () => reject(cancelled());
      req.signal?.addEventListener("abort", abort, { once: true });
    });
    // Listener setup itself may synchronously trigger an abort before race().
    void interruption.catch(() => {});
    if (req.signal?.aborted) abort();
    // Non-fatal UTF-8 and the default initial-BOM handling match Request.text().
    const decoder = new TextDecoder("utf-8");
    let bytes = 0, raw = "";
    for (;;) {
      assertOfflineRequestActive(req);
      const { done, value } = await Promise.race([reader.read(), interruption]);
      assertOfflineRequestActive(req);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new TypeError("Invalid offline request chunk");
      bytes += value.byteLength;
      if (bytes > OFFLINE_REQUEST_MAX_BYTES) throw tooLarge();
      raw += decoder.decode(value, { stream: true });
      if (raw.length > OFFLINE_REQUEST_MAX_CHARACTERS) throw tooLarge();
    }
    assertOfflineRequestActive(req);
    raw += decoder.decode();
    if (raw.length > OFFLINE_REQUEST_MAX_CHARACTERS) throw tooLarge();
    assertOfflineRequestActive(req);
    return raw;
  } catch (error) {
    assertOfflineRequestActive(req);
    if (error instanceof OfflineRequestBodyError) throw error;
    // Transport rejection reasons (including null/undefined or status-shaped
    // objects) are not trusted auth/pack errors and must never be reflected.
    throw new Error("Offline request transport failed");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abort) req.signal?.removeEventListener("abort", abort);
    cancel();
    try { reader.releaseLock(); } catch { /* A raced read may still settle. */ }
  }
}
