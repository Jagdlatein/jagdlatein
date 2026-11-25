// Scoped only to request-code and verify-code. This bounds transport reading;
// their existing email, challenge, reservation and session rules stay separate.
export const AUTH_REQUEST_MAX_BYTES = 4096;
export const AUTH_REQUEST_READ_TIMEOUT_MS = 8000;

export class AuthRequestBodyError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const invalid = () => new AuthRequestBodyError("Ungültige Anfrage.", 400);
const tooLarge = () => new AuthRequestBodyError("Die Anmeldedaten sind zu gross. Bitte versuche es erneut.", 413);
const cancelled = () => new AuthRequestBodyError("Die Anfrage wurde abgebrochen. Bitte versuche es erneut.", 408);
const expired = () => new AuthRequestBodyError("Die Übertragung hat zu lange gedauert. Bitte versuche es erneut.", 408);

export function assertAuthRequestActive(req) {
  if (req.signal?.aborted) throw cancelled();
}

export async function readAuthRequestBody(req) {
  assertAuthRequestActive(req);
  const declared = req.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)) || Number(declared) > AUTH_REQUEST_MAX_BYTES)) throw tooLarge();
  let reader;
  try { reader = req.body?.getReader?.(); } catch { throw invalid(); }
  if (!reader) throw invalid();
  let timer, abort, didCancel = false;
  const cancel = () => {
    if (didCancel) return;
    didCancel = true;
    // Do not wait for a stalled transport or expose a rejected cancel reason.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  try {
    assertAuthRequestActive(req);
    const interruption = new Promise((_, reject) => {
      timer = setTimeout(() => reject(expired()), AUTH_REQUEST_READ_TIMEOUT_MS);
      abort = () => reject(cancelled());
      req.signal?.addEventListener("abort", abort, { once: true });
    });
    void interruption.catch(() => {});
    if (req.signal?.aborted) abort();
    // Preserve native Request.json's non-fatal UTF-8 and initial-BOM decoding.
    const decoder = new TextDecoder("utf-8");
    let bytes = 0, raw = "";
    for (;;) {
      assertAuthRequestActive(req);
      const { done, value } = await Promise.race([reader.read(), interruption]);
      assertAuthRequestActive(req);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw invalid();
      bytes += value.byteLength;
      if (bytes > AUTH_REQUEST_MAX_BYTES) throw tooLarge();
      raw += decoder.decode(value, { stream: true });
    }
    assertAuthRequestActive(req);
    const body = JSON.parse(raw + decoder.decode());
    assertAuthRequestActive(req);
    return body;
  } catch (error) {
    assertAuthRequestActive(req);
    if (error instanceof AuthRequestBodyError) throw error;
    // The previous req.json catch returned400 for parse/transport failures.
    // Neither an arbitrary rejection reason nor its status is an auth error.
    throw invalid();
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abort) req.signal?.removeEventListener("abort", abort);
    cancel();
    try { reader.releaseLock(); } catch { /* A raced read may still settle. */ }
  }
}
