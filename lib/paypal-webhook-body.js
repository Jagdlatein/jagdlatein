// Transport limits only. Signature, event selection and ledger rules stay in
// the webhook route; never fall back to an unbounded Request.text() call.
export const PAYPAL_WEBHOOK_MAX_BYTES = 1024 * 1024;
export const PAYPAL_WEBHOOK_READ_TIMEOUT_MS = 8000;

export class PayPalWebhookBodyError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const invalid = () => new PayPalWebhookBodyError("invalid body", 400);
const tooLarge = () => new PayPalWebhookBodyError("payload too large", 413);
const interrupted = () => new PayPalWebhookBodyError("request aborted", 408);
const expired = () => new PayPalWebhookBodyError("request timeout", 408);

export function assertPayPalWebhookRequestActive(request) {
  if (request.signal?.aborted) throw interrupted();
}

export async function readPayPalWebhookBody(request) {
  assertPayPalWebhookRequestActive(request);
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)) || Number(declared) > PAYPAL_WEBHOOK_MAX_BYTES)) throw tooLarge();
  let reader;
  try { reader = request.body?.getReader?.(); } catch { throw invalid(); }
  if (!reader) throw invalid();
  let timer, abort, didCancel = false;
  const cancel = () => {
    if (didCancel) return;
    didCancel = true;
    // An underlying cancellation may reject or never settle. It cannot hold
    // the bounded error response open or expose its private rejection reason.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  try {
    assertPayPalWebhookRequestActive(request);
    const interruption = new Promise((_, reject) => {
      timer = setTimeout(() => reject(expired()), PAYPAL_WEBHOOK_READ_TIMEOUT_MS);
      abort = () => reject(interrupted());
      request.signal?.addEventListener("abort", abort, { once: true });
    });
    void interruption.catch(() => {});
    if (request.signal?.aborted) abort();
    // Match native Request.text() decoding, including initial BOM handling.
    const decoder = new TextDecoder("utf-8");
    let bytes = 0, raw = "";
    for (;;) {
      assertPayPalWebhookRequestActive(request);
      const { done, value } = await Promise.race([reader.read(), interruption]);
      assertPayPalWebhookRequestActive(request);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw invalid();
      bytes += value.byteLength;
      if (bytes > PAYPAL_WEBHOOK_MAX_BYTES) throw tooLarge();
      raw += decoder.decode(value, { stream: true });
    }
    assertPayPalWebhookRequestActive(request);
    return raw + decoder.decode();
  } catch (error) {
    cancel();
    assertPayPalWebhookRequestActive(request);
    if (error instanceof PayPalWebhookBodyError) throw error;
    throw invalid();
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abort) request.signal?.removeEventListener("abort", abort);
    try { reader.releaseLock(); } catch { /* A raced read may still settle. */ }
  }
}
