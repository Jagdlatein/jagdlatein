// This reader belongs only to the existing Jagdlatein chat endpoint.
export const CHAT_REQUEST_MAX_BYTES = 2048;
export const CHAT_REQUEST_READ_TIMEOUT_MS = 8000;

export class ChatRequestBodyError extends Error {
  constructor(message) { super(message); this.status = 408; }
}
const cancelled = () => new ChatRequestBodyError("Die Anfrage wurde abgebrochen. Bitte versuche es erneut.");
const expired = () => new ChatRequestBodyError("Die Übertragung hat zu lange gedauert. Bitte versuche es erneut.");

export function assertChatRequestActive(req) {
  if (req.signal?.aborted) throw cancelled();
}

export async function readChatRequestBody(req) {
  let reader;
  try { reader = req.body?.getReader?.(); } catch { return {}; }
  if (!reader) { assertChatRequestActive(req); return {}; }
  let timer, abort, didCancel = false;
  const cancel = () => {
    if (didCancel) return;
    didCancel = true;
    // A rejecting or stalled transport cancel must not hold the response open.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  try {
    assertChatRequestActive(req);
    const interruption = new Promise((_, reject) => {
      timer = setTimeout(() => reject(expired()), CHAT_REQUEST_READ_TIMEOUT_MS);
      abort = () => reject(cancelled());
      req.signal?.addEventListener("abort", abort, { once: true });
    });
    // An abort during listener setup can precede the first race subscription.
    void interruption.catch(() => {});
    // Also cover cancellation between the initial check and listener setup.
    if (req.signal?.aborted) abort();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0, json = "";
    for (;;) {
      assertChatRequestActive(req);
      const { done, value } = await Promise.race([reader.read(), interruption]);
      assertChatRequestActive(req);
      if (done) break;
      if (!(value instanceof Uint8Array)) return {};
      bytes += value.byteLength;
      if (bytes > CHAT_REQUEST_MAX_BYTES) return { tooLarge: true };
      json += decoder.decode(value, { stream: true });
    }
    assertChatRequestActive(req);
    const body = JSON.parse(json + decoder.decode());
    assertChatRequestActive(req);
    return { body };
  } catch (error) {
    if (error instanceof ChatRequestBodyError) throw error;
    return {};
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abort) req.signal?.removeEventListener("abort", abort);
    cancel();
    try { reader.releaseLock(); } catch { /* A raced read may still settle. */ }
  }
}
