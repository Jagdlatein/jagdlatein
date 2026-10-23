import { requirePaidAccount } from "../../../../lib/account-access";
import { inspectRevierPhotoBytes, REVIER_PHOTO_MAX_SAVED_BYTES, REVIER_PHOTO_MAX_EDGE } from "../../../../lib/revier-photo-storage";
import { normalizePhotoRecognitionResponse } from "../../../../lib/revier-photo-recognition";
import { requestPhotoRecognition } from "../../../../lib/revier-photo-openai";
import { getPhotoRecognitionQuotaStatus, isPhotoRecognitionConfigured, photoRecognitionRequestId, reservePhotoRecognition,
  PhotoRecognitionQuotaError, PHOTO_RECOGNITION_DAILY_LIMIT } from "../../../../lib/revier-photo-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function problem(code, status, message) {
  return new PhotoRecognitionQuotaError(code, status, message);
}

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "Vary": "Cookie, Origin",
    "X-Content-Type-Options": "nosniff", ...extraHeaders,
  } });
}

function fail(error) {
  if (error instanceof PhotoRecognitionQuotaError) {
    return json({ ok: false, code: error.code, message: error.message }, error.status,
      error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {});
  }
  if (error?.status === 401 || error?.status === 403) {
    const status = error.status;
    return json({ ok: false, code: status === 401 ? "photo_session_required" : "photo_premium_required",
      message: status === 401 ? "Bitte melde dich zuerst mit deinem Jagdlatein-Konto an." : "Für die Foto-Erkennung benötigst du einen aktiven Lernzugang." }, status);
  }
  // Never return upstream bodies, credentials, stack traces or request data.
  const safeProviderErrors = {
    photo_recognition_timeout: [504, "Die Bildanalyse hat zu lange gedauert. Bitte versuche es später erneut."],
    photo_recognition_cancelled: [408, "Die Foto-Anfrage wurde abgebrochen."],
    photo_recognition_rate_limited: [503, "Die Bildanalyse ist gerade ausgelastet. Bitte versuche es später erneut."],
    photo_recognition_invalid_response: [502, "Die Bildanalyse konnte keine lesbare Antwort liefern. Bitte versuche es erneut."],
    invalid_photo: [400, "Das vorbereitete Foto konnte nicht analysiert werden. Bitte wähle es erneut aus."],
  };
  const known = Object.hasOwn(safeProviderErrors, error?.code);
  const safe = known ? safeProviderErrors[error.code] : [503, "Die Foto-Erkennung ist gerade nicht verfügbar. Bitte versuche es später erneut."];
  return json({ ok: false, code: known ? error.code : "photo_recognition_unavailable", message: safe[1] }, safe[0]);
}

function requireOrigin(req) {
  try {
    const supplied = req.headers.get("origin");
    const origin = new URL(supplied);
    const current = new URL(req.url);
    const configured = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : current;
    // The public site can serve both first-party hosts before a canonical
    // redirect. Never relax the actual request-origin comparison, and never
    // infer trust for arbitrary subdomains or a different preview deployment.
    const firstPartyHosts = ["jagdlatein.de", "www.jagdlatein.de"];
    const canonicalAlias = firstPartyHosts.includes(current.hostname) && firstPartyHosts.includes(configured.hostname) &&
      current.protocol === configured.protocol && current.port === configured.port;
    if (!supplied || supplied !== origin.origin || origin.origin !== current.origin ||
      (origin.origin !== configured.origin && !canonicalAlias) ||
      origin.username || origin.password || !["https:", ...(process.env.NODE_ENV === "production" ? [] : ["http:"])].includes(origin.protocol)) throw new Error();
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin") throw new Error();
  } catch { throw problem("invalid_photo_origin", 403, "Diese Foto-Anfrage ist nicht erlaubt."); }
}

function requirePhotoRequest(req) {
  requireOrigin(req);
  if (req.headers.get("x-jagdlatein-photo-consent") !== "openai-v1") {
    throw problem("photo_consent_required", 400, "Bitte bestätige zuerst den Hinweis zur Übermittlung des Fotos an OpenAI.");
  }
  if ((req.headers.get("content-type") || "").toLowerCase().trim() !== "image/jpeg" ||
    ![null, "identity"].includes(req.headers.get("content-encoding"))) {
    throw problem("invalid_photo_type", 415, "Bitte nur ein vorbereitetes JPEG-Foto zur Erkennung senden.");
  }
  return photoRecognitionRequestId(req.headers.get("x-jagdlatein-photo-request-id"));
}

function sanitizePreparedJpeg(bytes) {
  // Also inspect segments between progressive scans. Merely searching for
  // "Exif" or stopping at the first scan would miss later metadata segments.
  let offset = 2;
  let sawScan = false;
  let iccChunk = 0;
  let iccChunkCount = null;
  const removed = [];
  while (offset < bytes.length) {
    const segmentStart = offset;
    if (bytes[offset++] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9) {
      if (!sawScan || offset !== bytes.length || (iccChunkCount !== null && iccChunk !== iccChunkCount)) return null;
      if (!removed.length) return bytes;
      const cleaned = new Uint8Array(bytes.byteLength - removed.reduce((total, [start, end]) => total + end - start, 0));
      let previous = 0, written = 0;
      for (const [start, end] of removed) { cleaned.set(bytes.subarray(previous, start), written); written += start - previous; previous = end; }
      cleaned.set(bytes.subarray(previous), written);
      return cleaned;
    }
    if (marker === undefined || marker === 0x00 || marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) return null;
    if (offset + 2 > bytes.length) return null;
    const length = bytes[offset] * 256 + bytes[offset + 1];
    if (length < 2 || length > bytes.length - offset) return null;
    if (marker === 0xe2) {
      // Fresh sRGB canvas exports can still contain ICC colour descriptions.
      // Strip exact ICC_PROFILE chunks rather than forwarding their arbitrary
      // descriptions or accepting all APP2. Validate one complete ordered set,
      // including chunks occurring between progressive JPEG scans.
      if (length <= 16 || ![73, 67, 67, 95, 80, 82, 79, 70, 73, 76, 69, 0].every((value, index) => bytes[offset + 2 + index] === value)) return null;
      const sequence = bytes[offset + 14], count = bytes[offset + 15];
      if (!count || sequence !== iccChunk + 1 || sequence > count || (iccChunkCount !== null && count !== iccChunkCount)) return null;
      iccChunk = sequence; iccChunkCount = count;
      removed.push([segmentStart, offset + length]);
    } else if (marker === 0xfe || (marker >= 0xe1 && marker <= 0xef && marker !== 0xee)) return null;
    if (marker === 0xe0 && (length !== 16 || ![74, 70, 73, 70, 0].every((value, index) => bytes[offset + 2 + index] === value) ||
      bytes[offset + 14] !== 0 || bytes[offset + 15] !== 0)) return null;
    if (marker === 0xee && (length !== 14 || ![65, 100, 111, 98, 101].every((value, index) => bytes[offset + 2 + index] === value))) return null;
    offset += length;
    if (marker !== 0xda) continue;
    sawScan = true;
    let endedScan = false;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 0xff) continue;
      const markerStart = offset - 1;
      while (bytes[offset] === 0xff) offset++;
      const next = bytes[offset++];
      if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) continue;
      offset = markerStart;
      endedScan = true;
      break;
    }
    if (!endedScan) return null;
  }
  return null;
}

async function readPhoto(req) {
  const suppliedLength = req.headers.get("content-length");
  const expectedLength = suppliedLength === null ? null : /^\d{1,10}$/.test(suppliedLength) ? Number(suppliedLength) : -1;
  if (expectedLength !== null && (expectedLength < 1 || expectedLength > REVIER_PHOTO_MAX_SAVED_BYTES)) {
    throw problem("photo_too_large", 413, "Das vorbereitete Foto darf höchstens 3 MB groß sein.");
  }
  if (!req.body || req.signal?.aborted) throw problem("invalid_photo", 400, "Bitte wähle das Foto erneut aus.");
  const reader = req.body.getReader();
  let timer;
  let abort;
  let total = 0;
  const chunks = [];
  const interruption = new Promise((_, reject) => {
    timer = setTimeout(() => reject(problem("photo_read_timeout", 408, "Das Foto konnte nicht rechtzeitig übertragen werden. Bitte versuche es erneut.")), 10000);
    abort = () => reject(problem("photo_request_aborted", 408, "Die Foto-Anfrage wurde abgebrochen."));
    req.signal?.addEventListener("abort", abort, { once: true });
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), interruption]);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw problem("invalid_photo", 400, "Das vorbereitete Foto ist ungültig.");
      total += value.byteLength;
      if (total > REVIER_PHOTO_MAX_SAVED_BYTES) throw problem("photo_too_large", 413, "Das vorbereitete Foto darf höchstens 3 MB groß sein.");
      chunks.push(value);
    }
    if (!total || (expectedLength !== null && expectedLength !== total)) throw problem("invalid_photo", 400, "Das Foto wurde nicht vollständig übertragen. Bitte versuche es erneut.");
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let inspected;
    try { inspected = inspectRevierPhotoBytes(bytes); } catch { throw problem("invalid_photo", 400, "Das vorbereitete Foto konnte nicht geöffnet werden."); }
    const sanitized = inspected.mimeType === "image/jpeg" ? sanitizePreparedJpeg(bytes) : null;
    if (inspected.mimeType !== "image/jpeg" || inspected.hasMetadata || !sanitized ||
      inspected.width > REVIER_PHOTO_MAX_EDGE || inspected.height > REVIER_PHOTO_MAX_EDGE) {
      throw problem("photo_preparation_required", 400, "Bitte das Foto erneut auswählen, damit Jagdlatein es verkleinert und die ursprünglichen Standort-Metadaten entfernt.");
    }
    return sanitized;
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener("abort", abort);
    // Do not await a hostile or stalled stream's cancellation.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* Already closed. */ }
    try { reader.releaseLock(); } catch { /* An interrupted read may still be pending. */ }
  }
}

export async function GET(req) {
  try {
    await requirePaidAccount(req);
    if (!isPhotoRecognitionConfigured()) return json({ configured: false, available: false, dailyLimit: PHOTO_RECOGNITION_DAILY_LIMIT });
    const status = await getPhotoRecognitionQuotaStatus();
    return json({ configured: true, ...status });
  } catch (error) { return fail(error); }
}

export async function POST(req) {
  try {
    const requestId = requirePhotoRequest(req);
    const account = await requirePaidAccount(req);
    if (!isPhotoRecognitionConfigured()) throw problem("photo_recognition_unavailable", 503, "Die Foto-Erkennung wird noch eingerichtet. Bitte versuche es später erneut.");
    const imageBytes = await readPhoto(req);
    if (req.signal?.aborted) throw problem("photo_request_aborted", 408, "Die Foto-Anfrage wurde abgebrochen.");
    // Failed provider calls still consume their reservation. Retrying cannot
    // bypass the distributed hard request limits or duplicate a provider call.
    await reservePhotoRecognition(account, requestId);
    if (req.signal?.aborted) throw problem("photo_request_aborted", 408, "Die Foto-Anfrage wurde abgebrochen.");
    const raw = await requestPhotoRecognition({ imageBytes, signal: req.signal });
    const result = normalizePhotoRecognitionResponse(raw);
    if (result.reason === "invalid-response" || result.reason === "inconsistent-category") {
      throw Object.assign(new Error("Invalid structured result"), { code: "photo_recognition_invalid_response" });
    }
    return json({ ok: true, result });
  } catch (error) { return fail(error); }
}
